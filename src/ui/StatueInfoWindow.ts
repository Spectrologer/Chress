import type { IGame } from '@core/GameContext';
import { Sign } from './Sign';
import { EventListenerManager } from '@utils/EventListenerManager';

export class StatueInfoWindow {
    private game: IGame;
    private statueOverlay: HTMLElement | null;
    private statueWindow: HTMLElement | null;
    private eventManager: EventListenerManager;

    constructor(game: IGame) {
        this.game = game;

        // Statue Info UI elements - be defensive for tests that don't include full DOM
        this.statueOverlay = document.getElementById('statueOverlay') || null;
        this.statueWindow = this.statueOverlay ? this.statueOverlay.querySelector('.statue-window') : null;
        this.eventManager = new EventListenerManager();
    }

    setupStatueInfoHandlers(): void {
        // The listener is added when the window is shown and removed when hidden
    }

    showStatueInfo(statueNpcType: string): void {
        if (!statueNpcType.startsWith('statue_')) {
            return; // Not a statue
        }

        const enemyType = statueNpcType.substring(7); // Remove 'statue_' prefix
        const statueDetails = Sign.getStatueData(enemyType);
        const name = enemyType.charAt(0).toUpperCase() + enemyType.slice(1) + ' Statue';
        // Use fauna portraits for enemy statues, but item-statues use item images so we don't 404
        const itemPortraitMap: Record<string, string> = {
            bomb: 'assets/items/misc/bomb.png',
            spear: 'assets/items/equipment/spear.png',
            bow: 'assets/items/equipment/bow.png',
            horse: 'assets/items/misc/horse.png',
            book: 'assets/items/misc/book.png',
            shovel: 'assets/items/equipment/shovel.png'
        };
        const portrait = itemPortraitMap[enemyType] || `assets/characters/enemies/${enemyType}.png`;
        // Portrait style overrides (rotate bow counter-clockwise)
        const portraitStyle = enemyType === 'bow' ? 'style="transform: rotate(-90deg);"' : '';
        const message = statueDetails.message;

        if (!this.statueWindow) {
            return;
        }

        // Dynamically create and set statue info content
        this.statueWindow.innerHTML = `
            <h2 id="statueName">${name}</h2>
            <div class="statue-main-content">
                <div class="statue-info">
                    <div class="statue-portrait-container large-portrait">
                        <img id="statuePortrait" src="${portrait}" alt="Portrait of ${name}" class="statue-portrait" ${portraitStyle}>
                    </div>
                    <p id="statueMessage">${message}</p>
                </div>
            </div>
            <div class="statue-buttons">
                <button id="okayStatueButton">Okay</button>
            </div>
        `;

        // Set up button click handler
        const okayButton = this.statueWindow.querySelector<HTMLButtonElement>('#okayStatueButton');
        if (okayButton) {
            this.eventManager.add(okayButton, 'click', () => {
                this.hideStatueInfoWindow();
            });
        }

        this.showStatueInfoWindow();
    }

    private showStatueInfoWindow(): void {
        if (!this.statueOverlay) {
            return;
        }
        this.statueOverlay.classList.add('show');

        // Add keyboard handler for Escape and movement keys
        this.eventManager.addKeyboardShortcut('Escape', () => {
            this.hideStatueInfoWindow();
        });
        this.eventManager.add(document, 'keydown', (event: KeyboardEvent) => {
            if (['w', 'a', 's', 'd'].includes(event.key.toLowerCase())) {
                this.hideStatueInfoWindow();
            }
        });
    }

    hideStatueInfoWindow(): void {
        if (!this.statueOverlay || !this.statueWindow) {
            return;
        }

        if (this.statueOverlay.classList.contains('show')) {
            this.statueOverlay.classList.remove('show');
            this.eventManager.cleanup();
        }
    }

    /**
     * Cleanup all event listeners
     * Call this when destroying the StatueInfoWindow instance
     */
    cleanup(): void {
        this.eventManager.cleanup();
    }
}
