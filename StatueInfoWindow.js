const STATUE_DATA = {
    lizardy: {
        message: 'Moves <strong>orthogonally</strong> (4-way) and attacks adjacent tiles.<br><br><em>Represents the foundation of enemy behavior.</em>'
    },
    lizardo: {
        message: 'Moves <strong>orthogonally and diagonally</strong> (8-way).<br><br><em>Its complex movement indicates aggressive tendencies.</em>'
    },
    lizardeaux: {
        message: '<strong>Charges</strong> in straight lines to ram and attack players from any distance.<br><br><em>A powerful linear combatant.</em>'
    },
    zard: {
        message: 'Moves <strong>diagonally</strong> like a bishop and charges to attack from a distance.<br><br><em>Specializes in ranged diagonal assaults.</em>'
    },
    lazerd: {
        message: 'Moves <strong>orthogonally and diagonally</strong> like a queen and charges to attack.<br><br><em>A master of all directional movement.</em>'
    },
    lizord: {
        message: 'Moves in <strong>L-shapes</strong> like a knight and uses a unique bump attack to displace players.<br><br><em>Creates strategic positional advantages.</em>'
    },
    default: {
        message: 'An ancient statue depicting a mysterious creature from the wilderness.'
    }
};

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
        const statueDetails = STATUE_DATA[enemyType] || STATUE_DATA.default;
        const name = enemyType.charAt(0).toUpperCase() + enemyType.slice(1) + ' Statue';
        const portrait = `Images/fauna/${enemyType}.png`; // Use regular enemy sprites
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
