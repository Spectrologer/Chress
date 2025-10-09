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
        let name, portrait, message, requiredItem, requiredItemImg, receivedItemImg, requiredItemName, receivedItemName;

        if (npcType === 'lion') {
            name = 'Penne';
            portrait = 'Images/fauna/lionface.png';
            message = 'Give me meat!';
            requiredItem = 'Food/meat';
            requiredItemImg = 'Images/Food/meat/Meat.png';
            requiredItemName = 'Meat';
            receivedItemImg = 'Images/items/water.png';
            receivedItemName = 'Water';
        } else if (npcType === 'squig') {
            name = 'Squig';
            portrait = 'Images/fauna/squigface.png';
            message = 'I\'m nuts for nuts!';
            requiredItem = 'Food/nut';
            requiredItemImg = 'Images/Food/nut/Nut.png';
            requiredItemName = 'Nut';
            receivedItemImg = 'Images/items/water.png';
            receivedItemName = 'Water';
        } else {
            return;
        }

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
        const foodType = this.currentNPCType === 'lion' ? 'Food/meat' : 'Food/nut';
        const canTrade = this.game.player.inventory.some(item => item.type === 'food' && item.foodType.startsWith(foodType));
        this.confirmBarterButton.disabled = !canTrade;

        this.currentNPCType = npcType;
        this.barterOverlay.classList.add('show');
    }

    hideBarterWindow() {
        this.barterOverlay.classList.remove('show');
    }

    confirmTrade() {
        const foodType = this.currentNPCType === 'lion' ? 'Food/meat' : 'Food/nut';
        const index = this.game.player.inventory.findIndex(item => item.type === 'food' && item.foodType.startsWith(foodType));
        if (index >= 0) {
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
