import { BarterWindow } from './BarterWindow.js';
import { StatueInfoWindow } from './StatueInfoWindow.js';

export class PanelManager {
    constructor(game) {
        this.game = game;

        // UI elements
        this.statsPanelOverlay = document.getElementById('statsPanelOverlay');

        // UI state
        this.statsPanelOpen = false;

        // Setup stats panel close on outside click
        this.setupStatsPanelHandlers();

        // Sub-managers
        this.barterWindow = new BarterWindow(game);
        this.statueInfoWindow = new StatueInfoWindow(game);
    }

    setupBarterHandlers() {
        this.barterWindow.setupBarterHandlers();
        this.statueInfoWindow.setupStatueInfoHandlers();
    }

    showBarterWindow(npcType) {
        this.barterWindow.showBarterWindow(npcType);
    }

    hideBarterWindow() {
        this.barterWindow.hideBarterWindow();
    }

    confirmTrade() {
        this.barterWindow.confirmTrade();
    }

    showStatueInfo(statueType) {
        this.statueInfoWindow.showStatueInfo(statueType);
    }

    hideStatueInfoWindow() {
        this.statueInfoWindow.hideStatueInfoWindow();
    }

    showStatsPanel() {
        if (this.statsPanelOverlay) {
            // Update stats content
            const statsInfoContainer = document.querySelector('.stats-main-content .stats-info');
            const enemiesCaptured = this.game.defeatedEnemies ? this.game.defeatedEnemies.size : 0;
            const playerPoints = this.game.player.getPoints();
            const hunger = this.game.player.getHunger();
            const thirst = this.game.player.getThirst();
            const totalDiscoveries = this.game.player.getVisitedZones().size - this.game.player.getSpentDiscoveries();
            statsInfoContainer.innerHTML = `
                <div class="stats-header">
                <div class="stats-portrait-container">
                        <img src="assets/protag/faceset.png" alt="Player Portrait" class="player-portrait">
                    </div>
                    <h2>CHALK</h2>
                </div>
                <div class="stats-list">
                    <div class="stat-item"><span class="stat-label">Captures:</span> <span class="stat-value">${enemiesCaptured}</span></div>
                    <div class="stat-item"><span class="stat-label">Hunger:</span> <span class="stat-value">${hunger}/50</span></div>
                    <div class="stat-item"><span class="stat-label">Thirst:</span> <span class="stat-value">${thirst}/50</span></div>
                    <div class="stat-item"><span class="stat-label">Points:</span> <span class="stat-value">${playerPoints}</span></div>
                    <div class="stat-item"><span class="stat-label">Discoveries:</span> <span class="stat-value">${totalDiscoveries}</span></div>
                    <div class="stat-item">
                        <span class="stat-label">Pathing:</span>
                        <span class="stat-value">
                            <label class="setting-toggle">
                                <input type="checkbox" id="verbose-path-toggle" ${this.game.player.stats.verbosePathAnimations ? 'checked' : ''}>
                                <span class="toggle-slider"></span>
                            </label>
                        </span>
                    </div>
                </div>
            `;

            // Setup toggle handler after content is added
            this.setupPathAnimationToggle();

            this.statsPanelOverlay.classList.add('show');
            this.statsPanelOpen = true;
        }
    }

    hideStatsPanel() {
        if (this.statsPanelOverlay) {
            this.statsPanelOverlay.classList.remove('show');
            this.statsPanelOpen = false;
        }
    }

    isStatsPanelOpen() {
        return this.statsPanelOpen;
    }

    setupStatsPanelHandlers() {
        if (this.statsPanelOverlay) {
            // Close panel when clicking outside (on overlay background)
            this.statsPanelOverlay.addEventListener('click', () => this.hideStatsPanel());
            this.statsPanelOverlay.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.hideStatsPanel();
            });

            // Prevent closing when clicking inside the panel
            const statsPanel = this.statsPanelOverlay.querySelector('.stats-panel');
            if (statsPanel) {
                statsPanel.addEventListener('click', (e) => e.stopPropagation());
                statsPanel.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                });
            }
        }
    }

    setupPathAnimationToggle() {
        const toggle = document.getElementById('verbose-path-toggle');
        if (toggle) {
            // Update on change (keyboard/desktop) and on single click/tap for mobile
            const applyState = (checked) => {
                this.game.player.stats.verbosePathAnimations = checked;
            };

            toggle.addEventListener('change', (e) => applyState(e.target.checked));

            // For single-click/tap support (some devices or custom toggles may require click)
            toggle.addEventListener('click', (e) => {
                // Toggle the checked state and apply immediately
                toggle.checked = !toggle.checked;
                applyState(toggle.checked);
            });

            // Touch devices: ensure touch toggles without requiring double-tap
            toggle.addEventListener('touchstart', (e) => {
                e.preventDefault();
                toggle.checked = !toggle.checked;
                applyState(toggle.checked);
            }, { passive: false });
        }
    }
}
