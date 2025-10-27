import { eventBus } from '../core/EventBus.js';
import { EventTypes } from '../core/EventTypes.js';

export class PlayerStatsUI {
    constructor(game) {
        this.game = game;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for UI update stats events
        eventBus.on(EventTypes.UI_UPDATE_STATS, () => {
            this.updatePlayerStats();
        });

        // Also listen for player stats changed events
        eventBus.on(EventTypes.PLAYER_STATS_CHANGED, () => {
            this.updatePlayerStats();
        });
    }

    updateProgressBar(barId, currentValue, maxValue) {
        const percentage = (currentValue / maxValue) * 100;
        const barElement = document.getElementById(barId);
        if (barElement) {
            barElement.style.width = `${percentage}%`;
        }
    }

    updatePlayerStats() {
        const lowStatThreshold = 10; // Pulsate when hunger/thirst is 10 or less

        // Update thirst and hunger bars
        const thirst = this.game.player.getThirst();
        const hunger = this.game.player.getHunger();
        this.updateProgressBar('thirst-progress', thirst, 50);
        this.updateProgressBar('hunger-progress', hunger, 50);

        // Add pulsation for low hunger/thirst
        const hungerLabel = document.querySelector('.hunger-bar .bar-label');
        const thirstLabel = document.querySelector('.thirst-bar .bar-label');
        if (hungerLabel) {
            hungerLabel.classList.toggle('pulsating', hunger <= lowStatThreshold);
        }
        if (thirstLabel) {
            thirstLabel.classList.toggle('pulsating', thirst <= lowStatThreshold);
        }

        // Update heart display
        const health = this.game.player.getHealth();
        const hearts = document.querySelectorAll('.heart-icon');
        hearts.forEach((heart, index) => {
            if (index < health) {
                heart.style.opacity = '1';
                heart.style.filter = 'none'; // Full visibility for full hearts
            } else {
                heart.style.opacity = '0.3';
                heart.style.filter = 'grayscale(100%)'; // Dimmed for lost hearts
            }
            // Add pulsation for the last heart
            const isLastHeart = (index === 0 && health === 1);
            heart.classList.toggle('pulsating', isLastHeart);
        });

        // Update axe ability display
        const axeIcon = document.querySelector('.axe-ability-icon');
        if (axeIcon) {
            axeIcon.style.display = this.game.player.abilities.has('axe') ? 'block' : 'none';
        }

        // Update hammer ability display
        const hammerIcon = document.querySelector('.hammer-ability-icon');
        if (hammerIcon) {
            hammerIcon.style.display = this.game.player.abilities.has('hammer') ? 'block' : 'none';
        }

        // Update inventory display
        if (this.game.inventoryManager) {
            this.game.inventoryManager.updateInventoryDisplay();
        }
    }
}
