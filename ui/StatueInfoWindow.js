import { Sign } from './Sign.js';

export class StatueInfoWindow {
    constructor(game) {
        this.game = game;
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleOkayClick = this.handleOkayClick.bind(this);

        // Statue Info UI elements
        this.statueOverlay = document.getElementById('statueOverlay');
        this.statueWindow = this.statueOverlay.querySelector('.statue-window');
    }

    setupStatueInfoHandlers() {
        // The listener is added when the window is shown and removed when hidden
    }

    handleOkayClick() {
        this.hideStatueInfoWindow();
    }

    handleKeyDown(event) {
        if (event.key === 'Escape' || ['w', 'a', 's', 'd'].includes(event.key.toLowerCase())) {
            this.hideStatueInfoWindow();
        }
    }

    showStatueInfo(statueNpcType) {
        if (!statueNpcType.startsWith('statue_')) {
            return; // Not a statue
        }

        const enemyType = statueNpcType.substring(7); // Remove 'statue_' prefix
        const statueDetails = Sign.getStatueData(enemyType);
        const name = enemyType.charAt(0).toUpperCase() + enemyType.slice(1) + ' Statue';
        // Use fauna portraits for enemy statues, but item-statues use item images so we don't 404
        const itemPortraitMap = {
            bomb: 'assets/items/bomb.png',
            spear: 'assets/items/spear.png',
            bow: 'assets/items/bow.png',
            horse: 'assets/items/horse.png',
            book: 'assets/items/book.png',
            shovel: 'assets/items/shovel.png'
        };
    const portrait = itemPortraitMap[enemyType] || `assets/fauna/${enemyType}.png`;
    // Portrait style overrides (rotate bow counter-clockwise)
    const portraitStyle = enemyType === 'bow' ? 'style="transform: rotate(-90deg);"' : '';
        const message = statueDetails.message;

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
        const okayButton = this.statueWindow.querySelector('#okayStatueButton');
        if (okayButton) {
            okayButton.addEventListener('click', this.handleOkayClick);
        }

        this.showStatueInfoWindow();
    }

    showStatueInfoWindow() {
        this.statueOverlay.classList.add('show');
        document.addEventListener('keydown', this.handleKeyDown);
    }

    hideStatueInfoWindow() {
        if (this.statueOverlay.classList.contains('show')) {
            this.statueOverlay.classList.remove('show');
            document.removeEventListener('keydown', this.handleKeyDown);

            const okayButton = this.statueWindow.querySelector('#okayStatueButton');
            if (okayButton) {
                okayButton.removeEventListener('click', this.handleOkayClick);
            }
        }
    }
}
