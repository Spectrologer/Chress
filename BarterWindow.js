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

        this.isStatueInfoOpen = false;
        this.currentNPCType = null;
    }

    setupBarterHandlers() {
        this.confirmBarterButton.addEventListener('click', () => {
            this.confirmTrade();
        });
        this.cancelBarterButton.addEventListener('click', () => {
            this.hideBarterWindow();
        });
        // Add handler for statue info close button
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' || (this.isStatueInfoOpen && ['w','a','s','d'].includes(event.key.toLowerCase()))) {
                this.hideBarterWindow();
            }
        });
    }

    showBarterWindow(npcType) {
        let name, portrait, message, requiredItem, requiredItemImg, receivedItemImg, requiredItemName, receivedItemName;
        let isStatueInfo = false;

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
        } else if (npcType.startsWith('statue_')) {
            const enemyType = npcType.substring(7); // Remove 'statue_' prefix
            isStatueInfo = true;
            name = enemyType.charAt(0).toUpperCase() + enemyType.slice(1) + ' Statue';
            portrait = `Images/fauna/${enemyType}.png`; // Use regular enemy sprites

            // Set detailed descriptions based on enemy type
            switch (enemyType) {
                case 'lizardy':
                    message = 'Moves <strong>orthogonally</strong> (4-way) and attacks adjacent tiles.<br><br><em>Represents the foundation of enemy behavior.</em>';
                    break;
                case 'lizardo':
                    message = 'Moves <strong>orthogonally and diagonally</strong> (8-way).<br><br><em>Its complex movement indicates aggressive tendencies.</em>';
                    break;
                case 'lizardeaux':
                    message = '<strong>Charges</strong> in straight lines to ram and attack players from any distance.<br><br><em>A powerful linear combatant.</em>';
                    break;
                case 'zard':
                    message = 'Moves <strong>diagonally</strong> like a bishop and charges to attack from a distance.<br><br><em>Specializes in ranged diagonal assaults.</em>';
                    break;
                case 'lazerd':
                    message = 'Moves <strong>orthogonally and diagonally</strong> like a queen and charges to attack.<br><br><em>A master of all directional movement.</em>';
                    break;
                case 'lizord':
                    message = 'Moves in <strong>L-shapes</strong> like a knight and uses a unique bump attack to displace players.<br><br><em>Creates strategic positional advantages.</em>';
                    break;
                default:
                    message = 'An ancient statue depicting a mysterious creature from the wilderness.';
            }
        } else {
            return;
        }

        this.barterNPCName.textContent = name;
        this.barterNPCPortrait.src = portrait;
        this.barterNPCPortrait.alt = `Portrait of ${name}`;
        this.barterNPCMessage.innerHTML = isStatueInfo ? `<span class="statue-description">${message}</span>` : message; // Use smaller text for statue descriptions

        // Handle different UI for statues vs barter
        const barterExchange = document.getElementById('barterExchange');
        const confirmButton = this.confirmBarterButton;
        const cancelButton = this.cancelBarterButton;

        if (isStatueInfo) {
            if (barterExchange) barterExchange.innerHTML = '';
            confirmButton.style.display = 'none';
            cancelButton.textContent = 'Close';
            cancelButton.classList.add('text-button'); // Apply text button style
            this.isStatueInfoOpen = true;
        } else {
            // Restore barter UI
            confirmButton.style.display = 'inline-block';
            cancelButton.textContent = 'Cancel';
            // Ensure text-button class is removed for image-based buttons
            cancelButton.classList.remove('text-button');
            this.isStatueInfoOpen = false;

            // Build the visual exchange UI
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
            confirmButton.disabled = !canTrade;
        }

        this.currentNPCType = npcType;
        this.barterOverlay.classList.add('show');
    }

    hideBarterWindow() {
        this.barterOverlay.classList.remove('show');
        this.isStatueInfoOpen = false;
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
