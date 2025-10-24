import { Sign } from './Sign.js';
import { FOOD_ASSETS, TILE_TYPES } from '../core/constants.js';
import { fitTextToContainer } from './TextFitter.js';

export class BarterWindow {
    constructor(game) {
        this.game = game;

        // Barter UI elements
        this.barterOverlay = document.getElementById('barterOverlay');
        this.barterNPCName = document.getElementById('barterNPCName');
        this.barterNPCPortrait = document.getElementById('barterNPCPortrait');
        this.barterNPCMessage = document.getElementById('barterNPCMessage');

        this.currentNPCType = null;
    }

    setupBarterHandlers() {
        // Confirm buttons are now dynamically created, event listeners added in showBarterWindow
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.hideBarterWindow();
            }
        });
    }

    showBarterWindow(npcType) {
        // If the player already has the ability granted by this NPC, show post-trade dialogue instead of trade.
        if ((npcType === 'axelotl' && this.game.player.abilities.has('axe')) ||
            (npcType === 'gouge' && this.game.player.abilities.has('hammer'))) {
            const key = npcType === 'axelotl' ? 'axelotl_post_trade' : 'gouge_post_trade';
            const npcData = Sign.getDialogueNpcData(key);
            if (npcData) {
                const message = npcData.messages[npcData.currentMessageIndex];
                this.game.displayingMessageForSign = { message: message, type: 'npc' };
                this.game.uiManager.showSignMessage(message, npcData.portrait, npcData.name);
                npcData.currentMessageIndex = (npcData.currentMessageIndex + 1) % npcData.messages.length;
            }
            return;
        }

        const npcData = Sign.getBarterNpcData(npcType);
        if (!npcData) {
            return; // No data for this NPC type
        }

        const { name, portrait, message, trades } = npcData;

    this.barterNPCName.textContent = name;
    // Ensure the NPC name fits within its container on mobile devices
    try { fitTextToContainer(this.barterNPCName, { minFontSize: 12 }); } catch (e) {}
        this.barterNPCPortrait.src = portrait;
        this.barterNPCPortrait.alt = `Portrait of ${name}`;

        // Add a specific class for squig and penne to adjust their size
        if (npcType === 'squig' || npcType === 'penne') {
            this.barterNPCPortrait.classList.add('squig-portrait-adjust');
        } else {
            this.barterNPCPortrait.classList.remove('squig-portrait-adjust');
        }
        // Set message HTML then run the typewriter effect so merchant text
        // appears character-by-character like sign messages.
    this.barterNPCMessage.innerHTML = `<div class="dialogue-text">${message}</div>`;
    // Ensure the element has the dialogue class for styling parity
    this.barterNPCMessage.classList.add('dialogue-text');
    // Fit dialogue text to the message container (exclude lists which may scroll)
    try { fitTextToContainer(this.barterNPCMessage, { childSelector: '.dialogue-text', minFontSize: 12 }); } catch (e) {}
        try {
            // Clear any existing typewriter running on the message manager
            const mm = this.game.uiManager && this.game.uiManager.messageManager;
            if (mm && mm.currentTypewriterInterval) {
                try { clearInterval(mm.currentTypewriterInterval); } catch (e) {}
                try { cancelAnimationFrame(mm.currentTypewriterInterval); } catch (e) {}
                mm.currentTypewriterInterval = null;
            }
            // If we have a message manager, set its current voice settings so
            // merchant dialogue gets the per-letter blips tuned to this NPC.
            if (mm && typeof mm._getVoiceSettingsForName === 'function') {
                try {
                    mm._currentVoiceSettings = mm._getVoiceSettingsForName(name);
                    try { console.debug && console.debug(`BarterWindow: set merchant voice for ${name}`, mm._currentVoiceSettings); } catch (e) {}
                } catch (e) {}
            }
            if (mm && typeof mm._typewriter === 'function') {
                mm._typewriter(this.barterNPCMessage, mm.typewriterSpeed, () => {});
            }
        } catch (e) {}

        const barterOffersContainer = document.getElementById('barterOffers');
        barterOffersContainer.innerHTML = ''; // Clear previous offers

        if (trades) {
            // Multiple trade options
            trades.forEach(trade => {
                const offerDiv = this.createOfferElement(trade);
                barterOffersContainer.appendChild(offerDiv);
            });
        } else {
            // Single trade option (legacy support)
            const offerDiv = this.createOfferElement(npcData);
            barterOffersContainer.appendChild(offerDiv);
        }

        this.currentNPCType = npcType;
        this.barterOverlay.classList.add('show');
    }

    createOfferElement(tradeData) {
        const offerDiv = document.createElement('div');
        offerDiv.className = 'barter-offer';

        const requiredAmount = tradeData.requiredAmount || 1;
        const requiredImgHtml = tradeData.requiredItemImg ? `<img src="${tradeData.requiredItemImg}" alt="Trade ${tradeData.requiredItemName}..." class="barter-exchange-item">` : '';

        offerDiv.innerHTML = `
            <div class="barter-exchange">
                <div class="barter-item-wrapper">
                    ${requiredImgHtml}
                    <span class="barter-item-label">${requiredAmount} ${tradeData.requiredItemName || tradeData.requiredItem}</span>
                </div>
                <span class="barter-exchange-arrow">→</span>
                <div class="barter-item-wrapper">
                    <img src="${tradeData.receivedItemImg}" alt="to receive ${tradeData.receivedItemName}" class="barter-exchange-item">
                    <span class="barter-item-label">${tradeData.receivedItemName}</span>
                </div>
            </div>
            <div class="barter-offer-buttons">
                <button class="confirm-trade-btn text-button" data-trade-id="${tradeData.id || this.currentNPCType}">Confirm</button>
                <button class="cancel-trade-btn text-button">Cancel</button>
            </div>
        `;

        const confirmButton = offerDiv.querySelector('.confirm-trade-btn');
        let canTrade = this.checkTradeViability(tradeData);
        confirmButton.disabled = !canTrade;

        confirmButton.addEventListener('click', () => this.confirmTrade(tradeData));

        const cancelButton = offerDiv.querySelector('.cancel-trade-btn');
        cancelButton.addEventListener('click', () => this.hideBarterWindow());

        return offerDiv;
    }

    checkTradeViability(tradeData) {
        const player = this.game.player;
        const requiredAmount = tradeData.requiredAmount || 1;

        // Only check for full inventory if the trade results in an item.
        // Abilities do not take up inventory space.
        const isAbilityTrade = tradeData.id === 'axelotl_axe' || tradeData.id === 'gouge_hammer';

        // If inventory is full, allow the trade only if the resulting item would merge into an
        // existing stack. Determine possible received item types for the trade and check for
        // matching stacks in the player's inventory.
        if (!isAbilityTrade && player.inventory.length >= 6) {
            // Helper to check if player has an existing stack for a given item descriptor
            const hasExistingStackFor = (itemType, foodType) => {
                return player.inventory.some(i => {
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
                if (player.inventory.some(i => i.type === 'food')) return true;
            } else if (tradeData.id === 'rune_item') {
                // random among bomb, bow, bishop_spear
                if (hasExistingStackFor('bomb') || hasExistingStackFor('bow') || hasExistingStackFor('bishop_spear')) return true;
            } else if (tradeData.id === 'nib_item') {
                // nib gives either a book or a horse_icon
                if (hasExistingStackFor('horse_icon') || hasExistingStackFor('book_of_time_travel') || hasExistingStackFor('book')) return true;
            } else if (tradeData.id === 'mark_meat') {
                // Mark gives a specific meat asset 'food/meat/beaf.png'
                if (hasExistingStackFor('food', 'food/meat/beaf.png')) return true;
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
                if (receivedImg.includes('/food/') || receivedName.includes('meat') || receivedName.includes('nut')) {
                    // We can't always map names to exact foodType; conservatively allow if player has any food stack
                    if (player.inventory.some(i => i.type === 'food')) return true;
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
            const requiredItems = player.inventory.filter(item => item.type === 'food' && item.foodType.startsWith(tradeData.requiredItem));
            const totalCount = requiredItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
            return totalCount >= requiredAmount;
        }
    }

    hideBarterWindow() {
        this.barterOverlay.classList.remove('show');
        // Clear any merchant voice override on close so future messages don't inherit it
        try {
            const mm = this.game.uiManager && this.game.uiManager.messageManager;
            if (mm) mm._currentVoiceSettings = null;
        } catch (e) {}
    }

    confirmTrade(tradeData) {
        if (!tradeData) {
            this.hideBarterWindow();
            return;
        }

        // Re-check viability right before confirming the trade
        if (!this.checkTradeViability(tradeData)) {
            this.game.uiManager.addMessageToLog('Cannot complete trade. Conditions not met.');
            this.hideBarterWindow();
            return;
        }
        if (tradeData.id === 'rune_food') {
            this.game.player.addPoints(-tradeData.requiredAmount);
            const randomFood = FOOD_ASSETS[Math.floor(Math.random() * FOOD_ASSETS.length)];
            // Use ItemManager helper to merge into existing stacks when possible
            this.game.itemManager.addItemToInventory(this.game.player, { type: 'food', foodType: randomFood });
            this.game.uiManager.addMessageToLog(`Traded ${tradeData.requiredAmount} points for food.`);
            // Confirmation: do not use typewriter
            this.game.uiManager.showOverlayMessage('Trade successful!', tradeData.receivedItemImg, false, false, false);
        } else if (tradeData.id === 'rune_item') {
            this.game.player.addPoints(-tradeData.requiredAmount);
            const items = [
                TILE_TYPES.BOMB,
                TILE_TYPES.BOW,
                TILE_TYPES.BISHOP_SPEAR
            ];
            const selectedItemType = items[Math.floor(Math.random() * items.length)];
            let inventoryItem;
            if (selectedItemType === TILE_TYPES.BOMB) inventoryItem = { type: 'bomb' };
            else if (selectedItemType === TILE_TYPES.BOW) inventoryItem = { type: 'bow', uses: 3 };
            else if (selectedItemType === TILE_TYPES.BISHOP_SPEAR) inventoryItem = { type: 'bishop_spear', uses: 3 };

            let awardedImg = tradeData.receivedItemImg;
            if (inventoryItem) {
                this.game.itemManager.addItemToInventory(this.game.player, inventoryItem);
                // Map awarded type to appropriate asset for the overlay
                if (inventoryItem.type === 'bomb') awardedImg = 'assets/items/bomb.png';
                else if (inventoryItem.type === 'bow') awardedImg = 'assets/items/bow.png';
                else if (inventoryItem.type === 'bishop_spear') awardedImg = 'assets/items/spear.png';
            }
            this.game.uiManager.addMessageToLog(`Traded ${tradeData.requiredAmount} points for an item.`);
            // Confirmation: do not use typewriter
            this.game.uiManager.showOverlayMessage('Trade successful!', awardedImg, false, false, false);
        } else if (tradeData.id === 'nib_item') {
            this.game.player.addPoints(-tradeData.requiredAmount);
            // Normalize to the canonical radial book type so ItemManager stacks it correctly
            const randomItem = Math.random() < 0.5 ? { type: 'book_of_time_travel', uses: 1 } : { type: 'horse_icon', uses: 3 };
            this.game.itemManager.addItemToInventory(this.game.player, randomItem);
            // Choose overlay image based on awarded item
            const awardedImg = randomItem.type === 'book_of_time_travel' ? 'assets/items/book.png' : 'assets/items/horse.png';
            this.game.uiManager.addMessageToLog(`Traded ${tradeData.requiredAmount} points for a random trinket.`);
            // Confirmation: do not use typewriter
            this.game.uiManager.showOverlayMessage('Trade successful!', awardedImg, false, false, false);

        } else if (tradeData.id === 'mark_meat') { // Trade discoveries for meat
            // Update spent discoveries via the Player API
            const cur = this.game.player.getSpentDiscoveries();
            this.game.player.setSpentDiscoveries(cur + tradeData.requiredAmount);
            this.game.itemManager.addItemToInventory(this.game.player, { type: 'food', foodType: 'food/meat/beaf.png' });
            this.game.uiManager.addMessageToLog(`Traded ${tradeData.requiredAmount} Discoveries for meat.`);
            // Confirmation: do not use typewriter
            this.game.uiManager.showOverlayMessage('Trade successful!', tradeData.receivedItemImg, false, false, false);
        } else if (tradeData.id === 'axelotl_axe') { // Trade discoveries for axe ability
            const cur2 = this.game.player.getSpentDiscoveries();
            this.game.player.setSpentDiscoveries(cur2 + tradeData.requiredAmount);
            this.game.player.abilities.add('axe');
            this.game.uiManager.addMessageToLog(`Traded ${tradeData.requiredAmount} discoveries for axe ability.`);
            // Confirmation: do not use typewriter
            this.game.uiManager.showOverlayMessage('Trade successful!', tradeData.receivedItemImg, false, false, false);
        } else if (tradeData.id === 'gouge_hammer') { // Trade discoveries for hammer ability
            const cur3 = this.game.player.getSpentDiscoveries();
            this.game.player.setSpentDiscoveries(cur3 + tradeData.requiredAmount);
            this.game.player.abilities.add('hammer');
            this.game.uiManager.addMessageToLog(`Traded ${tradeData.requiredAmount} discoveries for hammer ability.`);
            // Confirmation: do not use typewriter
            this.game.uiManager.showOverlayMessage('Trade successful!', tradeData.receivedItemImg, false, false, false);
        } else {
            // Legacy/single trade logic
            const requiredItem = this.game.player.inventory.find(item => item.type === 'food' && item.foodType.startsWith(tradeData.requiredItem));
            if (requiredItem) {
                const canReceiveWater = this.game.player.inventory.length < 6 || this.game.player.inventory.some(i => i.type === 'water');
                if (!canReceiveWater) {
                     this.game.uiManager.addMessageToLog('Inventory is full! Cannot complete trade.');
                     this.hideBarterWindow();
                     return;
                }

                requiredItem.quantity = (requiredItem.quantity || 1) - 1;
                if (requiredItem.quantity <= 0) {
                    const index = this.game.player.inventory.indexOf(requiredItem);
                    this.game.player.inventory.splice(index, 1);
                }

                // Directly add the received item using ItemManager helper so stacking rules apply
                this.game.itemManager.addItemToInventory(this.game.player, { type: 'water' });
                // Confirmation: do not use typewriter
                this.game.uiManager.showOverlayMessage('Trade successful!', tradeData.receivedItemImg, false, false, false);
            }
        }

    this.game.soundManager.playSound('point');
        this.game.updatePlayerStats();
        this.game.uiManager.updateZoneDisplay(); // Refresh discoveries count
        this.hideBarterWindow();
    }
}
