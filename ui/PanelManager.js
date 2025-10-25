import { BarterWindow } from './BarterWindow.js';
import { StatueInfoWindow } from './StatueInfoWindow.js';

export class PanelManager {
    constructor(game) {
        this.game = game;

        // UI elements
        this.statsPanelOverlay = document.getElementById('statsPanelOverlay');
        this.configOverlay = document.getElementById('configOverlay');
    this.recordsOverlay = document.getElementById('recordsOverlay');
        this.configHandlersAttached = false;

        // UI state
        this.statsPanelOpen = false;

        // Setup stats panel close on outside click
        this.setupStatsPanelHandlers();

        // Sub-managers
        this.barterWindow = new BarterWindow(game);
        this.statueInfoWindow = new StatueInfoWindow(game);
    }

    showConfigOverlay() {
        if (!this.configOverlay) return;
        this.configOpenTime = Date.now();
        // ensure the overlay inputs reflect current player stats
        try {
            const music = this.configOverlay.querySelector('#music-toggle');
            const sfx = this.configOverlay.querySelector('#sfx-toggle');
            const autoPath = this.configOverlay.querySelector('#auto-path-enemies-toggle');
            if (music) music.checked = this.game.player.stats.musicEnabled !== false;
            if (sfx) sfx.checked = this.game.player.stats.sfxEnabled !== false;
            if (autoPath) autoPath.checked = !!this.game.player.stats.autoPathWithEnemies;
        } catch (e) {}

        // Make overlay visible
        this.configOverlay.classList.add('show');

        // Show inner panel immediately (animations removed)
        try {
            const inner = this.configOverlay.querySelector('.stats-panel');
            if (inner) {
                // Remove any animation-related classes so the panel appears instantly
                inner.classList.remove('slide-out-left', 'slide-in-left', 'stats-panel-furling', 'stats-panel-furling-up');
                // Clear any inline transform/opacities left from previous animations
                try { inner.style.transform = ''; } catch (e) {}
                try { inner.style.opacity = ''; } catch (e) {}
            }
        } catch (e) {}

        // Add a global pointer handler so clicks anywhere on the page (game canvas,
        // outside the body, etc.) will close the config overlay and return to stats.
        // We add this on each open and remove it on close for reliability.
        if (this._configGlobalHandler) {
            try { document.removeEventListener('pointerdown', this._configGlobalHandler, true); } catch (e) {}
            this._configGlobalHandler = null;
        }
        this._configGlobalHandler = (ev) => {
            try {
                // Skip if clicking the config button in stats panel
                if (ev.target?.id === 'stats-config-button') return;
                const now = Date.now();
                if (this.configOpenTime && now - this.configOpenTime < 300) return; // Skip if just opened
                const inner = this.configOverlay.querySelector('.stats-panel');
                if (!inner || !inner.contains(ev.target)) {
                    try { ev.preventDefault(); } catch (e) {}
                    try { ev.stopPropagation(); } catch (e) {}
                    this.hideConfigOverlay();
                }
            } catch (err) {
                try { ev.preventDefault(); } catch (e) {}
                try { ev.stopPropagation(); } catch (e) {}
                this.hideConfigOverlay();
            }
        };
        try { document.addEventListener('pointerdown', this._configGlobalHandler, true); } catch (e) {}

        // Install a short-lived capturing blocker (300ms) to absorb any immediate
        // pointer events that follow opening the panel. This prevents the same
        // interaction from activating buttons (like the config button) that were
        // just rendered under the pointer when the panel opened.
        try {
            const captureHandler = (ev) => {
                try { if (ev && typeof ev.preventDefault === 'function') ev.preventDefault(); } catch (err) {}
            };

            const removeAll = () => {
                try { document.removeEventListener('pointerdown', captureHandler, true); } catch (err) {}
                try { document.removeEventListener('pointerup', captureHandler, true); } catch (err) {}
                try { document.removeEventListener('click', captureHandler, true); } catch (err) {}
                try { document.removeEventListener('mousedown', captureHandler, true); } catch (err) {}
            };

            try { document.addEventListener('pointerdown', captureHandler, true); } catch (err) {}
            try { document.addEventListener('pointerup', captureHandler, true); } catch (err) {}
            try { document.addEventListener('click', captureHandler, true); } catch (err) {}
            try { document.removeEventListener('mousedown', captureHandler, true); } catch (err) {}

            // Remove after a short delay so normal interactions resume
            setTimeout(removeAll, 300);
        } catch (e) {}

        // Attach handlers once
        if (!this.configHandlersAttached) {
            this.setupAudioToggles();

            // Prevent clicks inside the inner panel from closing the overlay
            const cfgPanel = this.configOverlay.querySelector('.stats-panel');
            if (cfgPanel) {
                cfgPanel.addEventListener('click', (e) => e.stopPropagation());
                cfgPanel.addEventListener('pointerup', (e) => {
                    if (e && typeof e.preventDefault === 'function') e.preventDefault();
                    e.stopPropagation();
                });
            }

            this.configHandlersAttached = true;
            // Attach back button handler (top-left) to return to stats panel
            try {
                const backBtn = this.configOverlay.querySelector('#config-back-button');
                if (backBtn) {
                    backBtn.addEventListener('click', (e) => {
                        if (e && typeof e.preventDefault === 'function') e.preventDefault();
                        if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
                        this.hideConfigOverlay();
                        e.preventDefault();
                        e.stopPropagation();
                    });
                }
            } catch (e) {}
        }
    }

    showRecordsOverlay() {
        if (!this.recordsOverlay) return;

        // Hide the stats panel when showing records
        this.hideStatsPanel();

        this.recordsOpenTime = Date.now();
        // Populate record values from localStorage
        try {
            const rz = this.recordsOverlay.querySelector('#record-zones');
            const rp = this.recordsOverlay.querySelector('#record-points');
            const rc = this.recordsOverlay.querySelector('#record-combo');
            const zones = parseInt(localStorage.getItem('chress:record:zones') || '0', 10) || 0;
            const points = parseInt(localStorage.getItem('chress:record:points') || '0', 10) || 0;
            const combo = parseInt(localStorage.getItem('chress:record:combo') || '0', 10) || 0;
            if (rz) rz.textContent = String(zones);
            if (rp) rp.textContent = String(points);
            if (rc) rc.textContent = String(combo);
        } catch (e) {}

        this.recordsOverlay.classList.add('show');

        // Install a short-lived capturing blocker (300ms) to absorb any immediate
        // pointer events that follow opening the panel. This prevents the same
        // interaction from activating buttons (like the records button) that were
        // just rendered under the pointer when the panel opened.
        try {
            const captureHandler = (ev) => {
                try { if (ev && typeof ev.preventDefault === 'function') ev.preventDefault(); } catch (err) {}
                try { if (ev && typeof ev.stopPropagation === 'function') ev.stopPropagation(); } catch (err) {}
            };

            const removeAll = () => {
                try { document.removeEventListener('pointerdown', captureHandler, true); } catch (err) {}
                try { document.removeEventListener('pointerup', captureHandler, true); } catch (err) {}
                try { document.removeEventListener('click', captureHandler, true); } catch (err) {}
                try { document.removeEventListener('mousedown', captureHandler, true); } catch (err) {}
            };

            try { document.addEventListener('pointerdown', captureHandler, true); } catch (err) {}
            try { document.addEventListener('pointerup', captureHandler, true); } catch (err) {}
            try { document.addEventListener('click', captureHandler, true); } catch (err) {}
            try { document.addEventListener('mousedown', captureHandler, true); } catch (err) {}

            // Remove after a short delay so normal interactions resume
            setTimeout(removeAll, 300);
        } catch (e) {}

        // Close records overlay when clicking outside
        if (!this._recordsHandlerAttached) {
            const panel = this.recordsOverlay.querySelector('.stats-panel');
            if (panel) {
                panel.addEventListener('click', (e) => e.stopPropagation());
            }
            this.recordsOverlay.addEventListener('click', (e) => {
                try {
                    const inner = this.recordsOverlay.querySelector('.stats-panel');
                    if (!inner || !inner.contains(e.target)) {
                        this.hideRecordsOverlay();
                    }
                } catch (err) {
                    this.hideRecordsOverlay();
                }
            });

            // Wire up the back button
            const backButton = this.recordsOverlay.querySelector('#records-back-button');
            if (backButton) {
                backButton.addEventListener('click', (e) => {
                    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
                    this.hideRecordsOverlay();
                    // Show stats panel again
                    this.showStatsPanel();
                    e.preventDefault();
                    e.stopPropagation();
                });
            }

            this._recordsHandlerAttached = true;
        }

        // Add a global pointer handler so clicks anywhere will close records and return to stats
        if (this._recordsGlobalHandler) {
            try { document.removeEventListener('pointerdown', this._recordsGlobalHandler, true); } catch (e) {}
            this._recordsGlobalHandler = null;
        }
        this._recordsGlobalHandler = (ev) => {
            try {
                const now = Date.now();
                if (this.recordsOpenTime && now - this.recordsOpenTime < 300) return; // Skip if just opened
                const inner = this.recordsOverlay.querySelector('.stats-panel');
                if (!inner || !inner.contains(ev.target)) {
                    try { ev.preventDefault(); } catch (e) {}
                    try { ev.stopPropagation(); } catch (e) {}
                    this.hideRecordsOverlay();
                }
            } catch (err) {
                try { ev.preventDefault(); } catch (e) {}
                try { ev.stopPropagation(); } catch (e) {}
                this.hideRecordsOverlay();
            }
        };
        setTimeout(() => {
            try { document.addEventListener('pointerdown', this._recordsGlobalHandler, true); } catch (e) {}
        }, 0);
    }

    hideRecordsOverlay() {
        if (!this.recordsOverlay) return;
        this.recordsOverlay.classList.remove('show');
        if (this._recordsGlobalHandler) {
            try { document.removeEventListener('pointerdown', this._recordsGlobalHandler, true); } catch (e) {}
            this._recordsGlobalHandler = null;
        }
        this.recordsOpenTime = undefined;
    }

    hideConfigOverlay() {
        if (!this.configOverlay) return;
        try {
            const inner = this.configOverlay.querySelector('.stats-panel');
            // Hide immediately without running exit animations
            try { this.configOverlay.classList.remove('show'); } catch (e) {}
            if (inner) {
                inner.classList.remove('slide-in-left', 'slide-out-left', 'stats-panel-furling', 'stats-panel-furling-up');
                try { inner.style.transform = ''; } catch (e) {}
                try { inner.style.opacity = ''; } catch (e) {}
            }
        } catch (e) {
            try { this.configOverlay.classList.remove('show'); } catch (e) {}
        }
        // Ensure overlay is not left visible in headless/test environments
        try { this.configOverlay.classList.remove('show'); } catch (e) {}
        if (this._configGlobalHandler) {
            try { document.removeEventListener('pointerdown', this._configGlobalHandler, true); } catch (e) {}
            this._configGlobalHandler = null;
        }
        this.configOpenTime = undefined;
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
            // Update stats content (scope to this.statsPanelOverlay so we don't hit other overlays)
            const statsInfoContainer = this.statsPanelOverlay.querySelector('.stats-main-content .stats-info');
            const enemiesCaptured = this.game.defeatedEnemies ? this.game.defeatedEnemies.size : 0;
            const playerPoints = this.game.player.getPoints();
            const hunger = this.game.player.getHunger();
            const thirst = this.game.player.getThirst();
            const totalDiscoveries = this.game.player.getVisitedZones().size - this.game.player.getSpentDiscoveries();
            statsInfoContainer.innerHTML = `
                    <div class="stats-header">
                        <div class="stats-header-left">
                            <!-- Config button placed top-left; opens the separate config overlay -->
                            <div class="stats-config">
                                <button id="stats-config-button" class="stats-config-button" title="Config" aria-label="Config">Config ▸</button>
                            </div>
                            <div class="stats-records">
                                <button id="stats-records-button" class="stats-records-button" title="Records" aria-label="Records">
                                    <img src="assets/ui/records.png" alt="Records" class="records-icon" aria-hidden="true">
                                </button>
                            </div>
                        </div>
                    <div class="stats-portrait-container">
                        <img src="assets/protag/faceset.png" alt="Player Portrait" class="player-portrait">
                    </div>
                    <h2>CHALK</h2>
                </div>
                <!-- Records button (trophy) top-right is injected into header via CSS positioning -->
                <div class="stats-list">
                    <div class="stat-item"><span class="stat-label">Captures:</span> <span class="stat-value">${enemiesCaptured}</span></div>
                    <div class="stat-item"><span class="stat-label">Hunger:</span> <span class="stat-value">${hunger}/50</span></div>
                    <div class="stat-item"><span class="stat-label">Thirst:</span> <span class="stat-value">${thirst}/50</span></div>
                    <div class="stat-item"><span class="stat-label">Points:</span> <span class="stat-value">${playerPoints}</span></div>
                    <div class="stat-item"><span class="stat-label">Discoveries:</span> <span class="stat-value">${totalDiscoveries}</span></div>
                    <!-- Pathing toggle removed -->
                    <!-- Config moved to top-left; settings removed from main list to declutter -->
                </div>
                <hr class="stats-divider">
                <div class="stats-footer">
                    <button id="stats-restart-button" class="stats-restart-button" title="Reset game" aria-label="Reset game">Reset</button>
                </div>
            `;

            // Pathing toggle removed (no-op)
            this.setupAudioToggles();

            // Make overlay visible immediately (furl animations removed)
            this.statsPanelOverlay.classList.add('show');
            try {
                const inner = this.statsPanelOverlay.querySelector('.stats-panel');
                if (inner) {
                    inner.classList.remove('stats-panel-furling-up', 'stats-panel-furling', 'slide-in-left', 'slide-out-left');
                    try { inner.style.transform = ''; } catch (e) {}
                    try { inner.style.opacity = ''; } catch (e) {}
                }
            } catch (e) {}
            // Install a short-lived capturing blocker (300ms) to absorb any immediate
            // pointer events that follow opening the panel. This prevents the same
            // interaction from activating buttons (like the config button) that were
            // just rendered under the pointer when the panel opened.
            try {
                const captureHandler = (ev) => {
                    try { if (ev && typeof ev.preventDefault === 'function') ev.preventDefault(); } catch (err) {}
                    try { if (ev && typeof ev.stopPropagation === 'function') ev.stopPropagation(); } catch (err) {}
                };

                const removeAll = () => {
                    try { document.removeEventListener('pointerdown', captureHandler, true); } catch (err) {}
                    try { document.removeEventListener('pointerup', captureHandler, true); } catch (err) {}
                    try { document.removeEventListener('click', captureHandler, true); } catch (err) {}
                    try { document.removeEventListener('mousedown', captureHandler, true); } catch (err) {}
                };

                try { document.addEventListener('pointerdown', captureHandler, true); } catch (err) {}
                try { document.addEventListener('pointerup', captureHandler, true); } catch (err) {}
                try { document.addEventListener('click', captureHandler, true); } catch (err) {}
                try { document.addEventListener('mousedown', captureHandler, true); } catch (err) {}

                // Remove after a short delay so normal interactions resume
                setTimeout(removeAll, 300);
            } catch (e) {}
            this.statsPanelOpen = true;

            // Update persistent records if current stats exceed saved values
            try {
                const visited = this.game.player.getVisitedZones().size;
                const pointsNow = this.game.player.getPoints();
                const prevZones = parseInt(localStorage.getItem('chress:record:zones') || '0', 10) || 0;
                const prevPoints = parseInt(localStorage.getItem('chress:record:points') || '0', 10) || 0;
                if (visited > prevZones) localStorage.setItem('chress:record:zones', String(visited));
                if (pointsNow > prevPoints) localStorage.setItem('chress:record:points', String(pointsNow));
            } catch (e) {}

            // Add restart button handler for stats panel (top-left)
            const statsRestartBtn = this.statsPanelOverlay.querySelector('#stats-restart-button');
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

            // Wire stats-config-button to open the separate `configOverlay`
            const configButton = this.statsPanelOverlay.querySelector('#stats-config-button');
            if (configButton) {
                configButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    // If a config overlay exists in the DOM, show it similarly to stats overlay
                    if (this.configOverlay) {
                        this.showConfigOverlay();
                    }
                });
            }

            // Wire stats-records-button to show records overlay
            const recordsButton = this.statsPanelOverlay.querySelector('#stats-records-button');
            if (recordsButton) {
                recordsButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (this.recordsOverlay) this.showRecordsOverlay();
                });
            }
        }
    }

    hideStatsPanel() {
        if (this.statsPanelOverlay) {
            try {
                const inner = this.statsPanelOverlay.querySelector('.stats-panel');
                if (inner) {
                    // Hide immediately without exit animation
                    try { this.statsPanelOverlay.classList.remove('show'); } catch (e) {}
                    inner.classList.remove('stats-panel-furling', 'stats-panel-furling-up', 'slide-in-left', 'slide-out-left');
                    try { inner.style.transform = ''; } catch (e) {}
                    try { inner.style.opacity = ''; } catch (e) {}
                } else {
                    try { this.statsPanelOverlay.classList.remove('show'); } catch (e) {}
                }
            } catch (e) {
                this.statsPanelOverlay.classList.remove('show');
            }
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
                // Defensive handlers to avoid pointer events "clicking through" to
                // overlays that may be rendered at the pointer location (e.g. the
                // config overlay on show). Stop propagation and prevent default so
                // the same interaction cannot immediately trigger another UI.
                const openStats = (e) => {
                    try { if (e && typeof e.preventDefault === 'function') e.preventDefault(); } catch (err) {}
                    try { if (e && typeof e.stopPropagation === 'function') e.stopPropagation(); } catch (err) {}
                    try { this.showStatsPanel(); } catch (err) {}
                };

                // Use pointerdown to capture interactions earlier on touch devices
                // and prevent the subsequent pointerup/click from reaching elements
                // positioned under the finger/cursor when the stats panel opens.
                playerPortraitContainer.addEventListener('pointerdown', (e) => {
                    // preventDefault only when available and not passive
                    try { if (e && typeof e.preventDefault === 'function') e.preventDefault(); } catch (err) {}
                    try { if (e && typeof e.stopPropagation === 'function') e.stopPropagation(); } catch (err) {}
                }, { passive: false });

                playerPortraitContainer.addEventListener('click', openStats);
                playerPortraitContainer.addEventListener('pointerup', openStats, { passive: false });
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
            // Persist preference
            try { if (this.game.gameStateManager && typeof this.game.gameStateManager.saveGameState === 'function') this.game.gameStateManager.saveGameState(); } catch (e) {}
        };

        const applySfxState = (checked) => {
            try { this.game.player.stats.sfxEnabled = !!checked; } catch (e) {}
            try { if (this.game.soundManager && typeof this.game.soundManager.setSfxEnabled === 'function') this.game.soundManager.setSfxEnabled(checked); } catch (e) {}
            // Persist preference
            try { if (this.game.gameStateManager && typeof this.game.gameStateManager.saveGameState === 'function') this.game.gameStateManager.saveGameState(); } catch (e) {}
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
