import { TILE_TYPES } from '../core/constants/index.js';
import { Sign } from './Sign.js';
import { eventBus } from '../core/EventBus.ts';
import { EventTypes } from '../core/EventTypes.ts';
import { isAdjacent } from '../core/utils/DirectionUtils.ts';
import { getTileType } from '../utils/TileUtils.js';
import { TileRegistry } from '../core/TileRegistry.js';

/**
 * InputUIHandler - Handles UI-specific input interactions
 *
 * Responsibilities:
 * - Handle sign message interactions
 * - Manage shovel mode UI
 * - Handle stats panel interactions
 * - Manage charge selection UI
 * - Handle radial menu interactions
 * - Handle player tile tap transitions
 *
 * This module listens to INPUT_TAP and INPUT_PLAYER_TILE_TAP events
 * and handles all UI-related logic that was previously in InputController.
 */
export class InputUIHandler {
    constructor(game, inventoryService) {
        this.game = game;
        this.inventoryService = inventoryService;
        this._unsubscribers = [];
    }

    /**
     * Set up event listeners
     */
    initialize() {
        // Listen for general tap events
        this._unsubscribers.push(
            eventBus.on(EventTypes.INPUT_TAP, (event) => {
                this._handleTap(event);
            })
        );

        // Listen for player tile tap events
        this._unsubscribers.push(
            eventBus.on(EventTypes.INPUT_PLAYER_TILE_TAP, (event) => {
                this._handlePlayerTileTap(event);
            })
        );
    }

    /**
     * Clean up event listeners
     */
    destroy() {
        this._unsubscribers?.forEach(unsub => unsub());
        this._unsubscribers = [];
    }

    // ========================================
    // EVENT HANDLERS
    // ========================================

    /**
     * Handle general tap events - check for UI interactions
     */
    _handleTap(event) {
        const { gridCoords } = event;

        // Handle sign message
        if (this._handleSignMessage(gridCoords)) {
            event.handled = true;
            return;
        }

        // Handle shovel mode
        if (this._handleShovelMode(gridCoords)) {
            event.handled = true;
            return;
        }

        // Close stats panel
        if (this._handleStatsPanelClose()) {
            event.handled = true;
            return;
        }

        // Handle charge selection
        if (this._handleChargeSelection(gridCoords)) {
            event.handled = true;
            return;
        }

        // Event not handled by UI - let coordinator handle it
    }

    /**
     * Handle player tile tap events - manage radial menu and transitions
     */
    _handlePlayerTileTap(event) {
        const { gridCoords, tileType, portKind } = event;

        console.log('[InputUIHandler] Player tile tap event received:', {
            gridCoords,
            tileType,
            portKind,
            hasRadialUI: !!this.game.radialInventoryUI
        });

        // Disable radial menu on exit/port tiles to allow transition access
        const isExitOrPort = tileType === TILE_TYPES.EXIT ||
                            tileType === TILE_TYPES.PORT ||
                            portKind === 'stairdown' ||
                            portKind === 'stairup';

        if (isExitOrPort) {
            console.log('[InputUIHandler] Exit/port tile detected, skipping radial menu');
            // Close radial menu if open
            if (this.game.radialInventoryUI?.open) {
                this.game.radialInventoryUI.close();
            }
            // Let the coordinator handle the transition
            return;
        }

        // Single tap on player tile opens radial menu (if available)
        if (this.game.radialInventoryUI) {
            console.log('[InputUIHandler] Toggling radial menu. Currently open:', this.game.radialInventoryUI.open);
            if (this.game.radialInventoryUI.open) {
                this.game.radialInventoryUI.close();
            } else {
                this.game.radialInventoryUI.openAtPlayer();
            }
        } else {
            console.error('[InputUIHandler] radialInventoryUI is not available!');
        }
    }

    // ========================================
    // UI INTERACTION HANDLERS
    // ========================================

    /**
     * Handle sign message interaction
     * Returns true if handled, false otherwise
     */
    _handleSignMessage(gridCoords) {
        if (this.game.displayingMessageForSign) {
            if (this._isTileInteractive(gridCoords.x, gridCoords.y)) {
                this.game.interactionManager.triggerInteractAt(gridCoords);
                return true;
            } else {
                Sign.hideMessageForSign(this.game);
            }
        }
        return false;
    }

    /**
     * Handle shovel mode interaction
     * Returns true if handled, false otherwise
     */
    _handleShovelMode(gridCoords) {
        if (!this.game.shovelMode) {
            return false;
        }

        const playerPos = this.game.player.getPosition();
        const dx = Math.abs(gridCoords.x - playerPos.x);
        const dy = Math.abs(gridCoords.y - playerPos.y);

        if (isAdjacent(dx, dy)) {
            const success = this.inventoryService.useItem(this.game.activeShovel, {
                targetX: gridCoords.x,
                targetY: gridCoords.y
            });
            if (success) {
                this.game.exitShovelMode();
            }
        } else {
            this.game.exitShovelMode();
        }
        return true;
    }

    /**
     * Handle stats panel closing
     * Returns true if handled, false otherwise
     */
    _handleStatsPanelClose() {
        if (this.game.uiManager.isStatsPanelOpen()) {
            this.game.uiManager.hideStatsPanel();
            return true;
        }
        return false;
    }

    /**
     * Handle charge selection (bishop spear, horse icon, bow)
     * Returns true if handled, false otherwise
     */
    _handleChargeSelection(gridCoords) {
        const pendingCharge = this.game.transientGameState?.getPendingCharge();
        if (!pendingCharge?.selectionType) {
            return false;
        }

        const selType = pendingCharge.selectionType;
        let chargeDetails = null;
        const playerPos = this.game.player.getPosition();

        // Use interactionManager.combatManager (CombatActionManager) for charge validation
        const combatActionManager = this.game.interactionManager?.combatManager;
        if (!combatActionManager) {
            console.error('[InputUIHandler] CombatActionManager not available');
            return false;
        }

        // When charge is initiated from radial UI (has selectionType), include radial inventory
        const includeRadial = true;

        if (selType === 'bishop_spear') {
            chargeDetails = combatActionManager.isValidBishopSpearCharge(gridCoords, playerPos, includeRadial);
        } else if (selType === 'horse_icon') {
            chargeDetails = combatActionManager.isValidHorseIconCharge(gridCoords, playerPos, includeRadial);
        } else if (selType === 'bow') {
            chargeDetails = combatActionManager.isValidBowShot(gridCoords, playerPos, includeRadial);
        }

        if (chargeDetails) {
            combatActionManager.confirmPendingCharge(chargeDetails);
        } else {
            combatActionManager.cancelPendingCharge();
        }
        return true;
    }

    // ========================================
    // HELPER METHODS
    // ========================================

    _isTileInteractive(x, y) {
        const tile = this.game.grid[y]?.[x];
        if (!tile) return false;

        const tileType = getTileType(tile);
        return TileRegistry.isInteractive(tileType);
    }
}
