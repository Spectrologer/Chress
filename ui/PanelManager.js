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
                    <!-- Pathing toggle removed -->
                    <div class="stat-item">
                        <span class="stat-label">Music:</span>
                        <span class="stat-value">
                            <label class="setting-toggle">
                                <input type="checkbox" id="music-toggle" ${this.game.player.stats.musicEnabled !== false ? 'checked' : ''}>
                                <span class="toggle-slider"></span>
                            </label>
                        </span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Auto Path With Enemies:</span>
                        <span class="stat-value">
                            <label class="setting-toggle">
                                <input type="checkbox" id="auto-path-enemies-toggle" ${this.game.player.stats.autoPathWithEnemies ? 'checked' : ''}>
                                <span class="toggle-slider"></span>
                            </label>
                        </span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">SFX:</span>
                        <span class="stat-value">
                            <label class="setting-toggle">
                                <input type="checkbox" id="sfx-toggle" ${this.game.player.stats.sfxEnabled !== false ? 'checked' : ''}>
                                <span class="toggle-slider"></span>
                            </label>
                        </span>
                    </div>
                </div>
                <hr class="stats-divider">
                <div class="stats-footer">
                    <button id="stats-restart-button" class="stats-restart-button" title="Reset game" aria-label="Reset game">Reset</button>
                </div>
            `;

            // Pathing toggle removed (no-op)
            this.setupAudioToggles();

            this.statsPanelOverlay.classList.add('show');
            this.statsPanelOpen = true;

            // Add restart button handler for stats panel (top-left)
            const statsRestartBtn = document.getElementById('stats-restart-button');
            if (statsRestartBtn) {
                // Shared restart action so both click and touchend use the same logic
                const doRestart = (e) => {
                    // Some events (touch) may not provide stopPropagation on the same object,
                    // so defensively stop propagation here as well.
                    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
                    if (confirm('Are you sure you want to restart the game? All progress will be lost.')) {
                        this.hideStatsPanel();
                        this.game.resetGame();
                        // If the main loop is paused (e.g., on death), try to resume it
                        if (typeof this.game.gameLoop === 'function') {
                            try { this.game.gameLoop(); } catch (err) { /* non-fatal */ }
                        }
                    }
                };

                // Click handler for mouse/keyboard
                statsRestartBtn.addEventListener('click', doRestart);

                // Pointer handlers to make single-tap work reliably on touch devices.
                statsRestartBtn.addEventListener('pointerdown', (e) => {
                    if (e && typeof e.preventDefault === 'function') e.preventDefault();
                    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
                    try { e.target.setPointerCapture?.(e.pointerId); } catch (err) {}
                }, { passive: false });

                statsRestartBtn.addEventListener('pointerup', (e) => {
                    if (e && typeof e.preventDefault === 'function') e.preventDefault();
                    doRestart(e);
                    try { e.target.releasePointerCapture?.(e.pointerId); } catch (err) {}
                });
            }
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
            this.statsPanelOverlay.addEventListener('pointerup', (e) => {
                if (e && typeof e.preventDefault === 'function') e.preventDefault();
                this.hideStatsPanel();
            });

            // Prevent closing when clicking inside the panel
            const statsPanel = this.statsPanelOverlay.querySelector('.stats-panel');
            if (statsPanel) {
                statsPanel.addEventListener('click', (e) => e.stopPropagation());
                statsPanel.addEventListener('pointerup', (e) => {
                    if (e && typeof e.preventDefault === 'function') e.preventDefault();
                    e.stopPropagation();
                });
            }

            // Open panel when clicking on the main player portrait
            const playerPortraitContainer = document.querySelector('.player-portrait-container');
            if (playerPortraitContainer) {
                playerPortraitContainer.addEventListener('click', () => this.showStatsPanel());
                playerPortraitContainer.addEventListener('pointerup', (e) => {
                    if (e && typeof e.preventDefault === 'function') e.preventDefault();
                    this.showStatsPanel();
                });
            }
        }
    }

    // Pathing UI toggle removed — no setup method required

    setupAudioToggles() {
        const musicToggle = document.getElementById('music-toggle');
        const sfxToggle = document.getElementById('sfx-toggle');

        const applyMusicState = (checked) => {
            try { this.game.player.stats.musicEnabled = !!checked; } catch (e) {}
            try { if (this.game.soundManager && typeof this.game.soundManager.setMusicEnabled === 'function') this.game.soundManager.setMusicEnabled(checked); } catch (e) {}
        };

        const applySfxState = (checked) => {
            try { this.game.player.stats.sfxEnabled = !!checked; } catch (e) {}
            try { if (this.game.soundManager && typeof this.game.soundManager.setSfxEnabled === 'function') this.game.soundManager.setSfxEnabled(checked); } catch (e) {}
        };

        const autoPathToggle = document.getElementById('auto-path-enemies-toggle');
        const applyAutoPathState = (checked) => {
            try { this.game.player.stats.autoPathWithEnemies = !!checked; } catch (e) {}
        };

        if (musicToggle) {
            musicToggle.addEventListener('change', (e) => applyMusicState(e.target.checked));
            musicToggle.addEventListener('click', () => {
                musicToggle.checked = !musicToggle.checked;
                applyMusicState(musicToggle.checked);
            });
            musicToggle.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                musicToggle.checked = !musicToggle.checked;
                applyMusicState(musicToggle.checked);
            }, { passive: false });
        }

        if (sfxToggle) {
            sfxToggle.addEventListener('change', (e) => applySfxState(e.target.checked));
            sfxToggle.addEventListener('click', () => {
                sfxToggle.checked = !sfxToggle.checked;
                applySfxState(sfxToggle.checked);
            });
            sfxToggle.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                sfxToggle.checked = !sfxToggle.checked;
                applySfxState(sfxToggle.checked);
            }, { passive: false });
        }

        if (autoPathToggle) {
            autoPathToggle.addEventListener('change', (e) => applyAutoPathState(e.target.checked));
            autoPathToggle.addEventListener('click', () => {
                autoPathToggle.checked = !autoPathToggle.checked;
                applyAutoPathState(autoPathToggle.checked);
            });
            autoPathToggle.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                autoPathToggle.checked = !autoPathToggle.checked;
                applyAutoPathState(autoPathToggle.checked);
            }, { passive: false });
        }
    }
}
