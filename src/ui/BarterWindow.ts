import type { IGame } from '@core/context';
import { TextBox, Trade } from './textbox';
import { FOOD_ASSETS, TILE_TYPES } from '@core/constants/index';
import { fitTextToContainer } from './TextFitter';
import audioManager from '@utils/AudioManager';
import { eventBus } from '@core/EventBus';
import { EventTypes } from '@core/EventTypes';
import { safeCall } from '@utils/SafeServiceCall';
import { EventListenerManager } from '@utils/EventListenerManager';
import type { InventoryItem } from '@managers/inventory/ItemMetadata';
import { logger } from '@core/logger';

interface Player {
    inventory: InventoryItem[];
    abilities: Set<string>;
    getPoints(): number;
    getVisitedZones(): Set<string>;
    getSpentDiscoveries(): number;
    setSpentDiscoveries(value: number): void;
}

interface TransientGameState {
    setDisplayingSignMessage(signData: any): void;
    clearCurrentNPCPosition(): void;
}

interface UIManager {
    updateZoneDisplay?(): void;
    messageManager?: any;
}

interface ItemManager {
    addItemToInventory(player: Player, item: InventoryItem): void;
}

interface PlayerFacade {
    addPoints(amount: number): void;
}

export class BarterWindow {
    private game: IGame;
    private barterOverlay: HTMLElement | null;
    private barterNPCName: HTMLElement | null;
    private barterNPCPortrait: HTMLImageElement | null;
    private barterNPCMessage: HTMLElement | null;
    private currentNPCType: string | null;
    private eventManager: EventListenerManager;

    constructor(game: IGame) {
        this.game = game;

        // Barter UI elements
        this.barterOverlay = document.getElementById('barterOverlay');
        this.barterNPCName = document.getElementById('barterNPCName');
        this.barterNPCPortrait = document.getElementById('barterNPCPortrait') as HTMLImageElement | null;
        this.barterNPCMessage = document.getElementById('barterNPCMessage');

        this.currentNPCType = null;
        this.eventManager = new EventListenerManager();
    }

    setupBarterHandlers(): void {
        // Confirm buttons are now dynamically created, event listeners added in showBarterWindow
        this.eventManager.addKeyboardShortcut('Escape', () => {
            this.hideBarterWindow();
        });
    }

    // Helper method to emit trade success events
    private emitTradeSuccess(message: string, imageAsset: string): void {
        eventBus.emit(EventTypes.UI_MESSAGE_LOG, {
            text: message,
            category: 'trade',
            priority: 'info'
        });
        // Add assets/ prefix if not already present
        const imageSrc = imageAsset && !imageAsset.startsWith('assets/')
            ? `assets/${imageAsset}`
            : imageAsset;
        eventBus.emit(EventTypes.UI_OVERLAY_MESSAGE_SHOW, {
            text: 'Trade successful!',
            imageSrc: imageSrc,
            persistent: false,
            largeText: false,
            useTypewriter: false
        });
    }

    showBarterWindow(npcType: string): void {
        // If the player already has the ability granted by this NPC, show post-trade dialogue instead of trade.
        if ((npcType === 'axelotl' && this.game.playerFacade?.hasAbility('axe')) ||
            (npcType === 'gouge' && this.game.playerFacade?.hasAbility('hammer'))) {
            // Get the character data from JSON
            const characterData = TextBox.getNPCCharacterData(npcType);
            if (characterData && characterData.interaction) {
                let message: string | null = null;

                // Try onComplete.dialogue first (new format)
                const completedTrade = characterData.interaction.trades?.find((trade: any) => {
                    if (npcType === 'axelotl') return trade.id === 'axelotl_axe';
                    if (npcType === 'gouge') return trade.id === 'gouge_hammer';
                    return false;
                });

                if (completedTrade?.onComplete?.dialogue) {
                    message = completedTrade.onComplete.dialogue.text;
                } else if (characterData.interaction.postTradeDialogue?.length > 0) {
                    // Fallback to postTradeDialogue array
                    message = characterData.interaction.postTradeDialogue[0].text;
                }

                if (message) {
                    const signData = { message: message, type: 'npc' };

                    // Set both old and new state for compatibility
                    this.game.displayingMessageForSign = signData;
                    if (this.game.transientGameState) {
                        this.game.transientGameState.setDisplayingSignMessage(signData);
                    }

                    // Use event instead of direct UIManager call
                    eventBus.emit(EventTypes.UI_DIALOG_SHOW, {
                        type: 'sign',
                        message: message,
                        portrait: characterData.display.portrait,
                        name: characterData.name
                    });
                }
            }
            return;
        }

        const npcData = TextBox.getBarterNpcData(npcType);
        if (!npcData) {
            return; // No data for this NPC type
        }

        const { name, portrait, message, trades } = npcData;

        if (this.barterNPCName) {
            this.barterNPCName.textContent = name;
            // Ensure the NPC name fits within its container on mobile devices
            try { fitTextToContainer(this.barterNPCName, { minFontSize: 12 }); } catch (e) {
                logger.warn('[BarterWindow] Failed to fit NPC name text:', e);
            }
        }

        if (this.barterNPCPortrait) {
            this.barterNPCPortrait.src = `assets/${portrait}`;
            this.barterNPCPortrait.alt = `Portrait of ${name}`;

            // Add a specific class for squig and penne to adjust their size
            if (npcType === 'squig' || npcType === 'penne') {
                this.barterNPCPortrait.classList.add('squig-portrait-adjust');
            } else {
                this.barterNPCPortrait.classList.remove('squig-portrait-adjust');
            }
        }

        if (this.barterNPCMessage) {
            // Set message HTML then run the typewriter effect so merchant text
            // appears character-by-character liketextbox messages.
            // Include hidden character-name span with the NPC type/ID so TypewriterController can detect the character
            this.barterNPCMessage.innerHTML = `<span class="character-name" style="display:none;">${npcType}</span><div class="dialogue-text">${message}</div>`;
            // Ensure the element has the dialogue class for styling parity
            this.barterNPCMessage.classList.add('dialogue-text');
            // Fit dialogue text to the message container (exclude lists which may scroll)
            try { fitTextToContainer(this.barterNPCMessage, { childSelector: '.dialogue-text', minFontSize: 12 }); } catch (e) {
                logger.warn('[BarterWindow] Failed to fit message text:', e);
            }
            try {
                // Use the typewriter controller from message manager
                const mm = this.game.uiManager && this.game.uiManager.messageManager;
                if (mm && mm.typewriterController) {
                    // Stop any existing typewriter
                    mm.typewriterController.stop();

                    // Start typewriter for merchant dialogue
                    // The typewriter controller will automatically detect the character name
                    // from the hidden .character-name span and apply appropriate voice settings
                    mm.typewriterController.start(this.barterNPCMessage, () => {
                        // Typewriter complete
                    });
                }
            } catch (e) {
                logger.warn('[BarterWindow] Failed to start typewriter:', e);
            }
        }

        const barterOffersContainer = document.getElementById('barterOffers');
        if (barterOffersContainer) {
            barterOffersContainer.innerHTML = ''; // Clear previous offers

            if (trades) {
                // Multiple trade options
                trades.forEach(trade => {
                    const offerDiv = this.createOfferElement(trade);
                    barterOffersContainer.appendChild(offerDiv);
                });
            } else {
                // Single trade option (legacy support)
                const offerDiv = this.createOfferElement(npcData as any);
                barterOffersContainer.appendChild(offerDiv);
            }
        }

        this.currentNPCType = npcType;
        if (this.barterOverlay) {
            this.barterOverlay.classList.add('show');
        }
    }

    private createOfferElement(tradeData: Trade): HTMLDivElement {
        const offerDiv = document.createElement('div');
        offerDiv.className = 'barter-offer';

        const requiredAmount = tradeData.requiredAmount || 1;
        // Add assets/ prefix if not already present
        const requiredImg = tradeData.requiredItemImg && !tradeData.requiredItemImg.startsWith('assets/') ? `assets/${tradeData.requiredItemImg}` : tradeData.requiredItemImg;
        const receivedImg = tradeData.receivedItemImg && !tradeData.receivedItemImg.startsWith('assets/') ? `assets/${tradeData.receivedItemImg}` : tradeData.receivedItemImg;
        const requiredImgHtml = requiredImg ? `<img src="${requiredImg}" alt="Trade ${tradeData.requiredItemName}..." class="barter-exchange-item">` : '';

        offerDiv.innerHTML = `
            <div class="barter-exchange">
                <div class="barter-item-wrapper">
                    ${requiredImgHtml}
                    <span class="barter-item-label">${requiredAmount} ${tradeData.requiredItemName || tradeData.requiredItem}</span>
                </div>
                <span class="barter-exchange-arrow">→</span>
                <div class="barter-item-wrapper">
                    <img src="${receivedImg}" alt="to receive ${tradeData.receivedItemName}" class="barter-exchange-item">
                    <span class="barter-item-label">${tradeData.receivedItemName}</span>
                </div>
            </div>
            <div class="barter-offer-buttons">
                <button class="confirm-trade-btn text-button" data-trade-id="${tradeData.id || this.currentNPCType}">Confirm</button>
                <button class="cancel-trade-btn text-button">Cancel</button>
            </div>
        `;

        const confirmButton = offerDiv.querySelector<HTMLButtonElement>('.confirm-trade-btn');
        if (confirmButton) {
            let canTrade = this.checkTradeViability(tradeData);
            confirmButton.disabled = !canTrade;
            this.eventManager.add(confirmButton, 'click', () => this.confirmTrade(tradeData));
        }

        const cancelButton = offerDiv.querySelector<HTMLButtonElement>('.cancel-trade-btn');
        if (cancelButton) {
            this.eventManager.add(cancelButton, 'click', () => this.hideBarterWindow());
        }

        return offerDiv;
    }

    private checkTradeViability(tradeData: Trade): boolean {
        const player = this.game.player;
        if (!player) return false;
        const requiredAmount = tradeData.requiredAmount || 1;

        // Only check for full inventory if the trade results in an item.
        // Abilities do not take up inventory space.
        const isAbilityTrade = tradeData.id === 'axelotl_axe' || tradeData.id === 'gouge_hammer';

        // If inventory is full, allow the trade only if the resulting item would merge into an
        // existing stack. Determine possible received item types for the trade and check for
        // matching stacks in the player's inventory.
        const nonNullCount = player.inventory.filter(item => item !== null).length;
        if (!isAbilityTrade && nonNullCount >= 6) {
            // Helper to check if player has an existing stack for a given item descriptor
            const hasExistingStackFor = (itemType: string, foodType?: string): boolean => {
                return player.inventory.some(i => {
                    if (!i) return false; // Skip null slots
                    if (itemType === 'food') {
                        return i.type === 'food' && i.foodType === foodType;
                    }
                    return i.type === itemType;
                });
            };

            // Identify possible received item types for known trades
            if (tradeData.id === 'rune_food') {
                // random food: can merge with any existing food stack regardless of sub-type only if types match exactly;
                // conservatively allow if player has any food stack (may not merge if different foodType, but most NPC foods use common types)
                if (player.inventory.some(i => i && i.type === 'food')) return true;
            } else if (tradeData.id === 'rune_item') {
                // random among bomb, bow, bishop_spear
                if (hasExistingStackFor('bomb') || hasExistingStackFor('bow') || hasExistingStackFor('bishop_spear')) return true;
            } else if (tradeData.id === 'nib_item') {
                // nib gives either a book, horse_icon, or shovel
                if (hasExistingStackFor('horse_icon') || hasExistingStackFor('book_of_time_travel') || hasExistingStackFor('book') || hasExistingStackFor('shovel')) return true;
            } else if (tradeData.id === 'mark_meat') {
                // Mark gives a specific meat asset 'items/consumables/meat.png'
                if (hasExistingStackFor('food', 'items/consumables/meat.png')) return true;
            }

            // Also support legacy trades which don't have an id but specify receivedItemName or receivedItemImg
            // e.g. squig gives Water (receivedItemName: 'Water', receivedItemImg: 'assets/items/water.png')
            if (!tradeData.id) {
                // If the trade explicitly gives Water, allow if player has a water stack
                const receivedName = (tradeData.receivedItemName || '').toLowerCase();
                const receivedImg = (tradeData.receivedItemImg || '').toLowerCase();
                if (receivedName.includes('water') || receivedImg.includes('water')) {
                    if (hasExistingStackFor('water')) return true;
                }

                // If the trade gives a specific food name/image, try to match exact food asset
                if (receivedImg.includes('/consumables/') || receivedName.includes('meat') || receivedName.includes('nut')) {
                    // We can't always map names to exact foodType; conservatively allow if player has any food stack
                    if (player.inventory.some(i => i && i.type === 'food')) return true;
                }
            }

            // For other trades, if there's no merge possibility, disallow due to full inventory
            return false;
        }

        if (tradeData.requiredItem === 'points') {
            return player.getPoints() >= requiredAmount;
        } else if (tradeData.requiredItem === 'DISCOVERED') {
            const discoveries = player.getVisitedZones().size - player.getSpentDiscoveries();
            return discoveries >= requiredAmount;
        } else {
            const requiredItems = player.inventory.filter(item => item && item.type === 'food' && 'foodType' in item && typeof item.foodType === 'string' && item.foodType.startsWith(tradeData.requiredItem));
            const totalCount = requiredItems.reduce((sum, item) => sum + (typeof item.quantity === 'number' ? item.quantity : 1), 0);
            return totalCount >= requiredAmount;
        }
    }

    hideBarterWindow(): void {
        if (this.barterOverlay) {
            this.barterOverlay.classList.remove('show');
        }
        // Clear any merchant voice override on close so future messages don't inherit it
        try {
            const mm = this.game.uiManager && this.game.uiManager.messageManager;
            if (mm) mm._currentVoiceSettings = null;
        } catch (e) {
            logger.warn('[BarterWindow] Failed to clear voice settings:', e);
        }
        // Clear NPC position tracking when barter window closes
        if (this.game.transientGameState) {
            this.game.transientGameState.clearCurrentNPCPosition();
        }
    }

    confirmTrade(tradeData?: Trade): void {
        if (!tradeData || !this.game.player) {
            this.hideBarterWindow();
            return;
        }

        // Re-check viability right before confirming the trade
        if (!this.checkTradeViability(tradeData)) {
            eventBus.emit(EventTypes.UI_MESSAGE_LOG, {
                text: 'Cannot complete trade. Conditions not met.',
                category: 'trade',
                priority: 'warning'
            });
            this.hideBarterWindow();
            return;
        }
        if (tradeData.id === 'rune_food') {
            this.game.playerFacade?.addPoints(-tradeData.requiredAmount);
            const randomFood = FOOD_ASSETS[Math.floor(Math.random() * FOOD_ASSETS.length)];
            // Use ItemManager helper to merge into existing stacks when possible
            this.game.itemManager?.addItemToInventory(this.game.player, { type: 'food', foodType: randomFood });
            this.emitTradeSuccess(`Traded ${tradeData.requiredAmount} points for food.`, tradeData.receivedItemImg);
        } else if (tradeData.id === 'rune_item') {
            this.game.playerFacade?.addPoints(-tradeData.requiredAmount);
            const items = [
                TILE_TYPES.BOMB,
                TILE_TYPES.BOW,
                TILE_TYPES.BISHOP_SPEAR
            ];
            const selectedItemType = items[Math.floor(Math.random() * items.length)];
            let inventoryItem: Partial<InventoryItem> | undefined;
            if (selectedItemType === TILE_TYPES.BOMB) inventoryItem = { type: 'bomb' as const };
            else if (selectedItemType === TILE_TYPES.BOW) inventoryItem = { type: 'bow' as const, uses: 3 };
            else if (selectedItemType === TILE_TYPES.BISHOP_SPEAR) inventoryItem = { type: 'bishop_spear' as const, uses: 3 };

            let awardedImg = tradeData.receivedItemImg;
            if (inventoryItem) {
                this.game.itemManager?.addItemToInventory(this.game.player, inventoryItem as InventoryItem);
                // Map awarded type to appropriate asset for the overlay
                if (inventoryItem.type === 'bomb') awardedImg = 'assets/items/misc/bomb.png';
                else if (inventoryItem.type === 'bow') awardedImg = 'assets/items/equipment/bow.png';
                else if (inventoryItem.type === 'bishop_spear') awardedImg = 'assets/items/equipment/spear.png';
            }
            this.emitTradeSuccess(`Traded ${tradeData.requiredAmount} points for an item.`, awardedImg);
        } else if (tradeData.id === 'nib_item') {
            this.game.playerFacade?.addPoints(-tradeData.requiredAmount);
            // Normalize to the canonical radial book type so ItemManager stacks it correctly
            const rand = Math.random();
            let randomItem: Partial<InventoryItem>;
            if (rand < 0.33) {
                randomItem = { type: 'book_of_time_travel' as const, uses: 3 };
            } else if (rand < 0.66) {
                randomItem = { type: 'horse_icon' as const, uses: 3 };
            } else {
                randomItem = { type: 'shovel' as const, uses: 3 };
            }
            this.game.itemManager?.addItemToInventory(this.game.player, randomItem as InventoryItem);
            // Choose overlay image based on awarded item
            let awardedImg2: string;
            if (randomItem.type === 'book_of_time_travel') {
                awardedImg2 = 'assets/items/misc/book.png';
            } else if (randomItem.type === 'horse_icon') {
                awardedImg2 = 'assets/items/misc/horse.png';
            } else {
                awardedImg2 = 'assets/items/equipment/shovel.png';
            }
            this.emitTradeSuccess(`Traded ${tradeData.requiredAmount} points for a random trinket.`, awardedImg2);

        } else if (tradeData.id === 'mark_meat') { // Trade discoveries for meat
            // Update spent discoveries via the Player API
            const cur = this.game.playerFacade?.getSpentDiscoveries() ?? 0;
            this.game.playerFacade?.setSpentDiscoveries(cur + tradeData.requiredAmount);
            this.game.itemManager?.addItemToInventory(this.game.player, { type: 'food', foodType: 'items/consumables/meat.png' });
            this.emitTradeSuccess(`Traded ${tradeData.requiredAmount} Discoveries for meat.`, tradeData.receivedItemImg);
        } else if (tradeData.id === 'axelotl_axe') { // Trade discoveries for axe ability
            const cur2 = this.game.playerFacade?.getSpentDiscoveries() ?? 0;
            this.game.playerFacade?.setSpentDiscoveries(cur2 + tradeData.requiredAmount);
            this.game.playerFacade?.addAbility('axe');

            // Show the onComplete message if available
            const characterData = TextBox.getNPCCharacterData('axolotl');
            const completedTrade = characterData?.interaction?.trades?.find((t: any) => t.id === 'axelotl_axe');
            if (completedTrade?.onComplete?.message) {
                eventBus.emit(EventTypes.UI_MESSAGE_LOG, {
                    text: completedTrade.onComplete.message,
                    category: 'trade',
                    priority: 'info'
                });
            }

            // Add assets/ prefix if not already present
            const axeImg = tradeData.receivedItemImg && !tradeData.receivedItemImg.startsWith('assets/')
                ? `assets/${tradeData.receivedItemImg}`
                : tradeData.receivedItemImg;

            eventBus.emit(EventTypes.UI_OVERLAY_MESSAGE_SHOW, {
                text: 'Trade successful!',
                imageSrc: axeImg,
                persistent: false,
                largeText: false,
                useTypewriter: false
            });
        } else if (tradeData.id === 'gouge_hammer') { // Trade discoveries for hammer ability
            const cur3 = this.game.playerFacade?.getSpentDiscoveries() ?? 0;
            this.game.playerFacade?.setSpentDiscoveries(cur3 + tradeData.requiredAmount);
            this.game.playerFacade?.addAbility('hammer');
            this.emitTradeSuccess(`Traded ${tradeData.requiredAmount} discoveries for hammer ability.`, tradeData.receivedItemImg);
        } else {
            // Legacy/single trade logic
            const inventory = this.game.playerFacade?.getInventory();
            if (!inventory) return;
            const requiredItem = inventory.find(item => item && item.type === 'food' && 'foodType' in item && typeof item.foodType === 'string' && item.foodType.startsWith(tradeData.requiredItem));
            if (requiredItem) {
                const nonNullCount = inventory.filter(item => item !== null).length;
                const canReceiveWater = nonNullCount < 6 || inventory.some(i => i && i.type === 'water');
                if (!canReceiveWater) {
                     eventBus.emit(EventTypes.UI_MESSAGE_LOG, {
                         text: 'Inventory is full! Cannot complete trade.',
                         category: 'trade',
                         priority: 'warning'
                     });
                     this.hideBarterWindow();
                     return;
                }

                const currentQty = typeof requiredItem.quantity === 'number' ? requiredItem.quantity : 1;
                requiredItem.quantity = currentQty - 1;
                if (typeof requiredItem.quantity === 'number' && requiredItem.quantity <= 0) {
                    const index = inventory.indexOf(requiredItem);
                    inventory[index] = null as any;
                }

                // Directly add the received item using ItemManager helper so stacking rules apply
                this.game.itemManager?.addItemToInventory(this.game.player, { type: 'water' });
                this.emitTradeSuccess('Trade successful!', tradeData.receivedItemImg);
            }
        }

    audioManager.playSound('point', { game: this.game });
        eventBus.emit(EventTypes.UI_UPDATE_STATS, {});
        // updateZoneDisplay is still a direct call, but it's a read operation (renders zone map)
        // This is acceptable as BarterWindow is itself a UI component
        if (this.game.uiManager && this.game.uiManager.updateZoneDisplay) {
            this.game.uiManager.updateZoneDisplay(); // Refresh discoveries count
        }
        this.hideBarterWindow();
    }

    /**
     * Cleanup all event listeners
     * Call this when destroying the BarterWindow instance
     */
    cleanup(): void {
        this.eventManager.cleanup();
    }
}
