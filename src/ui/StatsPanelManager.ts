import { PanelEventHandler } from './PanelEventHandler';
import { safeCall } from '@utils/SafeServiceCall';
import { EventListenerManager } from '@utils/EventListenerManager';
import { logger } from '@core/logger';
import { resetToNormalMode } from '@core/GameModeManager';
import { TILE_TYPES, GRID_SIZE } from '@core/constants/index';

interface GameInstance {
    defeatedEnemies?: Set<any>;
    player: any;
    resetGame: () => Promise<void>;
    gameLoop?: () => void;
    gameStarted?: boolean;
    previewMode?: boolean;
    overlayManager?: any;
    playerFacade?: any;
    generateZone?: () => void;
    customBoardReturnZone?: any;
    customBoardName?: string;
}

/**
 * StatsPanelManager
 * Manages the main stats panel overlay (portrait, stats, restart button)
 */
export class StatsPanelManager {
    private game: GameInstance;
    private statsPanelOverlay: HTMLElement | null;
    private statsPanelOpen = false;
    private _showConfigCallback: (() => void) | null = null;
    private _showRecordsCallback: (() => void) | null = null;
    private eventManager: EventListenerManager;

    constructor(game: GameInstance) {
        this.game = game;
        this.statsPanelOverlay = document.getElementById('statsPanelOverlay');
        this.eventManager = new EventListenerManager();
        this._setupHandlers();
    }

    /**
     * Sets the callbacks for action buttons (config, records)
     * Called by PanelManager during initialization
     */
    setActionCallbacks(showConfigCallback: () => void, showRecordsCallback: () => void): void {
        this._showConfigCallback = showConfigCallback;
        this._showRecordsCallback = showRecordsCallback;
    }

    /**
     * Shows the stats panel with current player stats
     */
    showStatsPanel(showConfigCallback?: () => void, showRecordsCallback?: () => void): void {
        if (!this.statsPanelOverlay) return;

        // Update callbacks if provided (for backwards compatibility)
        // But they should normally be set via setActionCallbacks() during initialization
        if (showConfigCallback) this._showConfigCallback = showConfigCallback;
        if (showRecordsCallback) this._showRecordsCallback = showRecordsCallback;

        // Update stats content (this recreates the buttons via innerHTML)
        this._updateStatsContent();

        // Make overlay visible immediately (furl animations removed)
        this.statsPanelOverlay.classList.add('show');
        const inner = this.statsPanelOverlay.querySelector<HTMLElement>('.stats-panel');
        if (inner) {
            PanelEventHandler.clearAnimations(inner);
        }

        this.statsPanelOpen = true;

        // Update persistent records
        this._updatePersistentRecords();

        // Wire up action buttons immediately after content is updated
        this._wireActionButtons(this._showConfigCallback, this._showRecordsCallback);

        // Install capture blocker AFTER wiring buttons to prevent immediate clickthrough from portrait tap
        // This blocks events for 200ms but allows the newly-wired buttons to work after that
        PanelEventHandler.installCaptureBlocker(200, null);
    }

    /**
     * Hides the stats panel
     */
    hideStatsPanel(): void {
        if (!this.statsPanelOverlay) return;

        const inner = this.statsPanelOverlay.querySelector<HTMLElement>('.stats-panel');
        if (inner) {
            this.statsPanelOverlay.classList.remove('show');
            PanelEventHandler.clearAnimations(inner);
        } else {
            this.statsPanelOverlay.classList.remove('show');
        }

        this.statsPanelOpen = false;
    }

    /**
     * Returns whether the stats panel is currently open
     */
    isStatsPanelOpen(): boolean {
        return this.statsPanelOpen;
    }

    /**
     * Updates the stats panel content with current player stats
     */
    private _updateStatsContent(): void {
        const statsInfoContainer = this.statsPanelOverlay?.querySelector('.stats-main-content .stats-info');
        if (!statsInfoContainer) return;

        const enemiesCaptured = this.game.defeatedEnemies ? this.game.defeatedEnemies.size : 0;
        const playerPoints = this.game.player.getPoints();
        const hunger = this.game.player.getHunger();
        const thirst = this.game.player.getThirst();
        const totalDiscoveries = this.game.player.getVisitedZones().size - this.game.player.getSpentDiscoveries();

        // Check if we're on a custom board
        const CUSTOM_BOARD_DIMENSION = 3;
        const currentZone = this.game.playerFacade?.getCurrentZone?.();
        const isOnCustomBoard = currentZone?.dimension === CUSTOM_BOARD_DIMENSION;
        const hasReturnZone = !!this.game.customBoardReturnZone;
        const showReturnButton = isOnCustomBoard && hasReturnZone;

        statsInfoContainer.innerHTML = `
            <div class="stats-header">
                <div class="stats-header-left">
                    <div class="stats-config">
                        <button id="stats-config-button" class="stats-config-button" title="Options" aria-label="Options">Options ▸</button>
                    </div>
                    ${showReturnButton ? `
                    <div class="stats-return-to-museum">
                        <button id="return-to-museum-button" class="stats-return-button" title="Return to Museum" aria-label="Return to Museum">Return to Museum</button>
                    </div>
                    ` : ''}
                    <div class="stats-records">
                        <button id="stats-records-button" class="stats-records-button" title="Records" aria-label="Records">
                            <img src="assets/ui/records.png" alt="Records" class="records-icon" aria-hidden="true">
                        </button>
                    </div>
                </div>
                <div class="stats-portrait-container">
                    <img src="assets/characters/player/faceset.png" alt="Player Portrait" class="player-portrait">
                </div>
            </div>
            <div class="stats-list">
                <div class="stat-item"><span class="stat-label">Captures:</span> <span class="stat-value">${enemiesCaptured}</span></div>
                <div class="stat-item"><span class="stat-label">Hunger:</span> <span class="stat-value">${hunger}/50</span></div>
                <div class="stat-item"><span class="stat-label">Thirst:</span> <span class="stat-value">${thirst}/50</span></div>
                <div class="stat-item"><span class="stat-label">Points:</span> <span class="stat-value">${playerPoints}</span></div>
                <div class="stat-item"><span class="stat-label">Discoveries:</span> <span class="stat-value">${totalDiscoveries}</span></div>
            </div>
            <hr class="stats-divider">
            <div class="stats-footer">
                <button id="stats-restart-button" class="stats-restart-button" title="Reset game" aria-label="Reset game">Reset</button>
                <button id="stats-menu-button" class="stats-menu-button" title="Return to start menu" aria-label="Return to start menu">Return to Menu</button>
            </div>
        `;
    }

    /**
     * Updates persistent records in localStorage if current stats exceed saved values
     */
    private _updatePersistentRecords(): void {
        const visited = this.game.player.getVisitedZones().size;
        const pointsNow = this.game.player.getPoints();
        const prevZones = parseInt(localStorage.getItem('chesse:record:zones') || '0', 10) || 0;
        const prevPoints = parseInt(localStorage.getItem('chesse:record:points') || '0', 10) || 0;

        if (visited > prevZones) localStorage.setItem('chesse:record:zones', String(visited));
        if (pointsNow > prevPoints) localStorage.setItem('chesse:record:points', String(pointsNow));
    }

    /**
     * Wires up action buttons (config, records, restart, return to museum)
     */
    private _wireActionButtons(showConfigCallback: (() => void) | null, showRecordsCallback: (() => void) | null): void {
        // Config button
        const configButton = this.statsPanelOverlay?.querySelector<HTMLElement>('#stats-config-button');
        if (configButton) {
            const handleConfig = (e: Event): void => {
                e.preventDefault();
                e.stopPropagation();
                if (showConfigCallback) {
                    showConfigCallback();
                }
            };

            // Remove any existing listeners before adding new ones
            this.eventManager.removeAllListenersFromElement(configButton);
            this.eventManager.add(configButton, 'click', handleConfig);
            this.eventManager.add(configButton, 'pointerup', handleConfig);
            this.eventManager.add(configButton, 'touchend', handleConfig);
        }

        // Return to Museum button (if present)
        const returnButton = this.statsPanelOverlay?.querySelector<HTMLElement>('#return-to-museum-button');
        if (returnButton) {
            this._setupReturnToMuseumButton(returnButton);
        }

        // Records button
        const recordsButton = this.statsPanelOverlay?.querySelector<HTMLElement>('#stats-records-button');
        if (recordsButton) {
            const handleRecords = (e: Event): void => {
                e.preventDefault();
                e.stopPropagation();
                if (showRecordsCallback) {
                    showRecordsCallback();
                }
            };

            // Remove any existing listeners before adding new ones
            this.eventManager.removeAllListenersFromElement(recordsButton);
            this.eventManager.add(recordsButton, 'click', handleRecords);
            this.eventManager.add(recordsButton, 'pointerup', handleRecords);
            this.eventManager.add(recordsButton, 'touchend', handleRecords);
        }

        // Restart button
        const statsRestartBtn = this.statsPanelOverlay?.querySelector<HTMLElement>('#stats-restart-button');
        if (statsRestartBtn) {
            this._setupRestartButton(statsRestartBtn);
        }

        // Menu button
        const statsMenuBtn = this.statsPanelOverlay?.querySelector<HTMLElement>('#stats-menu-button');
        if (statsMenuBtn) {
            this._setupMenuButton(statsMenuBtn);
        }
    }

    /**
     * Sets up the restart button with proper event handling
     */
    private _setupRestartButton(restartBtn: HTMLElement): void {
        const doRestart = (e: Event): void => {
            e?.preventDefault?.();
            e?.stopPropagation?.();
            if (confirm('Are you sure you want to restart the game? All progress will be lost.')) {
                this.hideStatsPanel();
                this.game.resetGame();
                // If the main loop is paused, try to resume it
                try { safeCall(this.game, 'gameLoop'); } catch (err) { /* non-fatal */ }
            }
        };

        // Use only click event to avoid double-triggering
        this.eventManager.add(restartBtn, 'click', doRestart);
    }

    /**
     * Sets up the menu button with proper event handling
     */
    private _setupMenuButton(menuBtn: HTMLElement): void {
        const doReturnToMenu = (e: Event): void => {
            e?.preventDefault?.();
            e?.stopPropagation?.();
            if (confirm('Return to start menu? Current game progress will be saved.')) {
                this.hideStatsPanel();
                // Reset the gameStarted flag so the player can continue or start a new game
                this.game.gameStarted = false;
                // Enter preview mode to show the game board but disable input
                this.game.previewMode = true;
                // Show the start overlay
                if (this.game.overlayManager) {
                    this.game.overlayManager.showStartOverlay();
                }
            }
        };

        // Use only click event to avoid double-triggering
        this.eventManager.add(menuBtn, 'click', doReturnToMenu);
    }

    /**
     * Sets up event handlers for the stats panel
     */
    private _setupHandlers(): void {
        if (!this.statsPanelOverlay) return;

        // Close panel when clicking outside (on overlay background)
        this.eventManager.add(this.statsPanelOverlay, 'click', () => this.hideStatsPanel());
        this.eventManager.add(this.statsPanelOverlay, 'pointerup', (e: PointerEvent) => {
            safeCall(e, 'preventDefault');
            this.hideStatsPanel();
        });

        // Prevent closing when clicking inside the panel
        const statsPanel = this.statsPanelOverlay.querySelector<HTMLElement>('.stats-panel');
        if (statsPanel) {
            PanelEventHandler.preventInnerPanelClicks(statsPanel);
        }

        // Open panel when clicking on the main player portrait
        this._setupPortraitHandler();
    }

    /**
     * Sets up the player portrait handler to open stats panel
     */
    private _setupPortraitHandler(): void {
        const playerPortraitContainer = document.querySelector('.player-portrait-container');
        if (!playerPortraitContainer) return;

        const openStats = (e: Event): void => {
            e?.preventDefault?.();
            e?.stopPropagation?.();
            this.showStatsPanel();
        };

        this.eventManager.add(playerPortraitContainer, 'pointerdown', (e: PointerEvent) => {
            e?.preventDefault?.();
            e?.stopPropagation?.();
        }, { passive: false });

        this.eventManager.add(playerPortraitContainer, 'click', openStats);
        this.eventManager.add(playerPortraitContainer, 'pointerup', openStats, { passive: false });
    }

    /**
     * Sets up the "Return to Museum" button handler
     */
    private _setupReturnToMuseumButton(returnBtn: HTMLElement): void {
        const doReturnToMuseum = (e: Event): void => {
            e?.preventDefault?.();
            e?.stopPropagation?.();

            // Return to the stored zone
            const returnZone = this.game.customBoardReturnZone;
            if (returnZone && this.game.playerFacade) {
                logger.info(`[CustomBoard] Returning to zone (${returnZone.x}, ${returnZone.y}) dimension ${returnZone.dimension}`);

                // Close the stats panel first
                this.hideStatsPanel();

                // Reset to normal mode (in case we were in chess mode)
                resetToNormalMode(this.game);

                // Set the zone back to the museum
                this.game.playerFacade.setCurrentZone(returnZone.x, returnZone.y);
                this.game.playerFacade.setZoneDimension(returnZone.dimension);

                // Clear the return zone and custom board name
                delete this.game.customBoardReturnZone;
                delete this.game.customBoardName;

                // Clear the lastExitSide so player spawning logic works correctly
                (this.game as any).lastExitSide = undefined;

                // Regenerate the zone
                if (this.game.generateZone) {
                    this.game.generateZone();
                }

                // After zone regeneration, find an EXIT tile to spawn the player on
                const gridManager = (this.game as any).gridManager;

                if (gridManager) {
                    let exitFound = false;
                    for (let y = 0; y < GRID_SIZE && !exitFound; y++) {
                        for (let x = 0; x < GRID_SIZE && !exitFound; x++) {
                            if (gridManager.isTileType(x, y, TILE_TYPES.EXIT)) {
                                this.game.playerFacade.setPosition(x, y);
                                this.game.playerFacade.setLastPosition(x, y);
                                exitFound = true;
                                logger.info(`[CustomBoard] Player spawned at EXIT tile (${x}, ${y})`);
                            }
                        }
                    }

                    // Fallback to center if no EXIT tile found
                    if (!exitFound) {
                        const centerX = Math.floor(GRID_SIZE / 2);
                        const centerY = Math.floor(GRID_SIZE / 2);
                        this.game.playerFacade.setPosition(centerX, centerY);
                        this.game.playerFacade.setLastPosition(centerX, centerY);
                        logger.warn(`[CustomBoard] No EXIT tile found, spawning at center (${centerX}, ${centerY})`);
                    }
                }
            }
        };

        // Use only click event to avoid double-triggering
        this.eventManager.add(returnBtn, 'click', doReturnToMuseum);
    }

    /**
     * Cleanup all event listeners
     * Call this when destroying the StatsPanelManager instance
     */
    cleanup(): void {
        this.eventManager.cleanup();
    }
}
