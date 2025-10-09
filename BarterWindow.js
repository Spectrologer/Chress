import { Sign } from './Sign.js';

export class BarterWindow {
    constructor(game) {
        this.game = game;

        // Barter UI elements
        this.barterOverlay = document.getElementById('barterOverlay');
        this.barterNPCName = document.getElementById('barterNPCName');
        this.barterNPCPortrait = document.getElementById('barterNPCPortrait');
        this.barterNPCMessage = document.getElementById('barterNPCMessage');
        this.confirmBarterButton = document.getElementById('confirmBarterButton');
        this.cancelBarterButton = document.getElementById('cancelBarterButton');

        this.currentNPCType = null;
    }

    setupBarterHandlers() {
        this.confirmBarterButton.addEventListener('click', () => {
            this.confirmTrade();
        });
        this.cancelBarterButton.addEventListener('click', () => {
            this.hideBarterWindow();
        });
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

        const { name, portrait, message, requiredItem, requiredItemImg, receivedItemImg, requiredItemName, receivedItemName } = npcData;

        this.barterNPCName.textContent = name;
        this.barterNPCPortrait.src = portrait;
        this.barterNPCPortrait.alt = `Portrait of ${name}`;
        this.barterNPCMessage.innerHTML = message;

        // Build the visual exchange UI
        const barterExchange = document.getElementById('barterExchange');
        if (barterExchange) {
            barterExchange.innerHTML = `
                <img src="${requiredItemImg}" alt="Trade ${requiredItemName}..." class="barter-exchange-item">
                <span class="barter-exchange-arrow">→</span>
                <img src="${receivedItemImg}" alt="to receive ${receivedItemName}" class="barter-exchange-item">
            `;
        }

        // Disable confirm button if player cannot trade
        const canTrade = this.game.player.inventory.some(item => item.type === 'food' && item.foodType.startsWith(requiredItem));
        this.confirmBarterButton.disabled = !canTrade;

        this.currentNPCType = npcType;
        this.barterOverlay.classList.add('show');
    }

    hideBarterWindow() {
        this.barterOverlay.classList.remove('show');
    }

    confirmTrade() {
        const npcData = Sign.getBarterNpcData(this.currentNPCType);
        if (!npcData) {
            this.hideBarterWindow();
            return;
        }
        const requiredItem = npcData.requiredItem;
        const index = this.game.player.inventory.findIndex(item => item.type === 'food' && item.foodType.startsWith(requiredItem));
        if (index >= 0) {
            // Check if inventory has space for water
            if (this.game.player.inventory.length >= 6) {
                this.game.uiManager.addMessageToLog('Inventory is full! Cannot complete trade.');
                this.hideBarterWindow();
                return;
            }
            this.game.player.inventory.splice(index, 1);
            this.game.player.inventory.push({ type: 'water' });
            this.game.updatePlayerStats();
            this.hideBarterWindow();
            // Do not call game.gameLoop() here to avoid interrupting game flow; let the existing loop continue
        } else {
            // No matching item found, perhaps show a message, but for now, just hide the window
            this.hideBarterWindow();
            // Still step forward to the next game tick
        }
    }
}
