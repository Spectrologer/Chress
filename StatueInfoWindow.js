import { Sign } from './Sign.js';

export class StatueInfoWindow {
    constructor(game) {
        this.game = game;
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleOkayClick = this.handleOkayClick.bind(this);

        // Statue Info UI elements
        this.statueOverlay = document.getElementById('statueOverlay');
        this.statueName = document.getElementById('statueName');
        this.statuePortrait = document.getElementById('statuePortrait');
        this.statueMessage = document.getElementById('statueMessage');
        this.okayButton = document.getElementById('okayStatueButton');
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
        const portrait = `images/fauna/${enemyType}.png`; // Use regular enemy sprites
        const message = statueDetails.message;

        // Set statue info content
        this.statueName.textContent = name;
        this.statuePortrait.src = portrait;
        this.statuePortrait.alt = `Portrait of ${name}`;
        this.statueMessage.innerHTML = message;

        // Set up button click handler
        this.okayButton.addEventListener('click', this.handleOkayClick);

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

            // Remove button event listener
            this.okayButton.removeEventListener('click', this.handleOkayClick);
        }
    }
}
