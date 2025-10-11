import { Sign } from './Sign.js';
import { FOOD_ASSETS, TILE_TYPES } from '../core/constants.js';

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
        const npcData = Sign.getBarterNpcData(npcType);
        if (!npcData) {
            return; // No data for this NPC type
        }

        const { name, portrait, message, trades } = npcData;

        this.barterNPCName.textContent = name;
        this.barterNPCPortrait.src = portrait;
        this.barterNPCPortrait.alt = `Portrait of ${name}`;

        // Add a specific class for squig and lion to adjust their size
        if (npcType === 'squig' || npcType === 'lion') {
            this.barterNPCPortrait.classList.add('squig-portrait-adjust');
        } else {
            this.barterNPCPortrait.classList.remove('squig-portrait-adjust');
        }
        this.barterNPCMessage.innerHTML = message;

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

        if (player.inventory.length >= 6) return false; // Inventory full

        if (tradeData.requiredItem === 'points') {
            return player.getPoints() >= requiredAmount;
        } else {
            const itemCount = player.inventory.filter(item => item.type === 'food' && item.foodType.startsWith(tradeData.requiredItem)).length;
            return itemCount >= requiredAmount;
        }
    }

    hideBarterWindow() {
        this.barterOverlay.classList.remove('show');
    }

    confirmTrade(tradeData) {
        if (!tradeData) {
            this.hideBarterWindow();
            return;
        }

        if (tradeData.id === 'rune_food') {
            this.game.player.addPoints(-tradeData.requiredAmount);
            const randomFood = FOOD_ASSETS[Math.floor(Math.random() * FOOD_ASSETS.length)];
            this.game.player.inventory.push({ type: 'food', foodType: randomFood }); // This was correct, but let's ensure it's always valid
            this.game.uiManager.addMessageToLog(`Traded ${tradeData.requiredAmount} points for food.`);
            this.game.uiManager.showOverlayMessage('Trade successful!', tradeData.receivedItemImg);
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

            if(inventoryItem) this.game.player.inventory.push(inventoryItem);
            this.game.uiManager.addMessageToLog(`Traded ${tradeData.requiredAmount} points for an item.`);
            this.game.uiManager.showOverlayMessage('Trade successful!', tradeData.receivedItemImg);
        } else if (tradeData.id === 'nib_item') {
            this.game.player.addPoints(-tradeData.requiredAmount);
            const randomItem = Math.random() < 0.5 ? { type: 'book' } : { type: 'horse_icon', uses: 3 };
            this.game.player.inventory.push(randomItem);
            this.game.uiManager.addMessageToLog(`Traded ${tradeData.requiredAmount} points for a random trinket.`);
            this.game.uiManager.showOverlayMessage('Trade successful!', tradeData.receivedItemImg);
        } else {
            // Legacy/single trade logic
            const index = this.game.player.inventory.findIndex(item => item.type === 'food' && item.foodType.startsWith(tradeData.requiredItem));
            if (index >= 0) {
                // Check if inventory has space for water
                if (this.game.player.inventory.length >= 6) {
                    this.game.uiManager.addMessageToLog('Inventory is full! Cannot complete trade.');
                    this.hideBarterWindow();
                    return;
                }
                this.game.player.inventory.splice(index, 1);
                this.game.player.inventory.push({ type: 'water' });
                this.game.uiManager.showOverlayMessage('Trade successful!', tradeData.receivedItemImg);
            }
        }

        this.game.soundManager.playSound('ding');
        this.game.updatePlayerStats();
        this.hideBarterWindow();
    }
}
