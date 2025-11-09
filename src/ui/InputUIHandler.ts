import type { IGame } from '@core/context';
import { TILE_TYPES } from '@core/constants/index';
import { TextBox } from './textbox';
import { eventBus } from '@core/EventBus';
import { EventTypes } from '@core/EventTypes';
import { isAdjacent } from '@core/utils/DirectionUtils';
import { getTileType } from '@utils/TileUtils';
import { TileRegistry } from '@core/TileRegistry';
import { Position } from '@core/Position';
import { logger } from '@core/logger';

interface GridCoords {
    x: number;
    y: number;
}

interface InputTapEvent {
    gridCoords: GridCoords;
    handled?: boolean;
}

interface InputPlayerTileTapEvent {
    gridCoords: GridCoords;
    tileType: number | object;
    portKind?: string;
}

interface Player {
    getPosition(): Position;
    isDead(): boolean;
}

interface InventoryService {
    useItem(item: object, options?: Record<string, unknown>): boolean;
}

interface UIManager {
    isStatsPanelOpen(): boolean;
    hideStatsPanel(): void;
}

interface TransientGameState {
    getPendingCharge(): any;
}

interface CombatActionManager {
    isValidBishopSpearCharge(gridCoords: GridCoords, playerPos: Position, includeRadial: boolean): any;
    isValidHorseIconCharge(gridCoords: GridCoords, playerPos: Position, includeRadial: boolean): any;
    isValidBowShot(gridCoords: GridCoords, playerPos: Position, includeRadial: boolean): any;
    confirmPendingCharge(chargeDetails: any): void;
    cancelPendingCharge(): void;
}

interface InteractionManager {
    triggerInteractAt(coords: GridCoords): void;
    combatManager?: CombatActionManager;
}

interface RadialInventoryUI {
    open: boolean;
    close(): void;
    openAtPlayer(): void;
}

/**
 * InputUIHandler - Handles UI-specific input interactions
 *
 * Responsibilities:
 * - Handletextbox message interactions
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
    private game: IGame;
    private inventoryService: InventoryService;
    private _unsubscribers: Array<() => void>;

    constructor(game: IGame, inventoryService: InventoryService) {
        this.game = game;
        this.inventoryService = inventoryService;
        this._unsubscribers = [];
    }

    /**
     * Set up event listeners
     */
    initialize(): void {
        // Listen for general tap events
        this._unsubscribers.push(
            eventBus.on(EventTypes.INPUT_TAP, (event: InputTapEvent) => {
                this._handleTap(event);
            })
        );

        // Listen for player tile tap events
        this._unsubscribers.push(
            eventBus.on(EventTypes.INPUT_PLAYER_TILE_TAP, (event: InputPlayerTileTapEvent) => {
                this._handlePlayerTileTap(event);
            })
        );
    }

    /**
     * Clean up event listeners
     */
    destroy(): void {
        this._unsubscribers?.forEach(unsub => unsub());
        this._unsubscribers = [];
    }

    // ========================================
    // EVENT HANDLERS
    // ========================================

    /**
     * Handle general tap events - check for UI interactions
     */
    private _handleTap(event: InputTapEvent): void {
        const { gridCoords } = event;

        // Handletextbox message
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
    private _handlePlayerTileTap(event: InputPlayerTileTapEvent): void {
        const { gridCoords, tileType, portKind } = event;

        logger.log('[InputUIHandler] Player tile tap event received:', {
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
            logger.log('[InputUIHandler] Exit/port tile detected, skipping radial menu');
            // Close radial menu if open
            if (this.game.radialInventoryUI?.open) {
                this.game.radialInventoryUI.close();
            }
            // Let the coordinator handle the transition
            return;
        }

        // Single tap on player tile opens radial menu (if available)
        if (this.game.radialInventoryUI) {
            logger.log('[InputUIHandler] Toggling radial menu. Currently open:', this.game.radialInventoryUI.open);
            if (this.game.radialInventoryUI.open) {
                this.game.radialInventoryUI.close();
            } else {
                this.game.radialInventoryUI.openAtPlayer();
            }
        } else {
            logger.error('[InputUIHandler] radialInventoryUI is not available!');
        }
    }

    // ========================================
    // UI INTERACTION HANDLERS
    // ========================================

    /**
     * Handletextbox message interaction
     * Returns true if handled, false otherwise
     */
    private _handleSignMessage(gridCoords: GridCoords): boolean {
        if (this.game.displayingMessageForSign) {
            if (this._isTileInteractive(gridCoords.x, gridCoords.y)) {
                this.game.interactionManager?.triggerInteractAt(gridCoords);
                return true;
            } else {
                TextBox.hideMessageForSign(this.game as any);
            }
        }
        return false;
    }

    /**
     * Handle shovel mode interaction
     * Returns true if handled, false otherwise
     */
    private _handleShovelMode(gridCoords: GridCoords): boolean {
        if (!this.game.shovelMode) {
            return false;
        }

        const playerPos = this.game.playerFacade?.getPosition();
        if (!playerPos) return false;
        const dx = Math.abs(gridCoords.x - playerPos.x);
        const dy = Math.abs(gridCoords.y - playerPos.y);

        if (isAdjacent(dx, dy)) {
            const success = this.inventoryService.useItem(this.game.activeShovel!, {
                targetX: gridCoords.x,
                targetY: gridCoords.y
            });
            if (success) {
                this.game.exitShovelMode?.();
            }
        } else {
            this.game.exitShovelMode?.();
        }
        return true;
    }

    /**
     * Handle stats panel closing
     * Returns true if handled, false otherwise
     */
    private _handleStatsPanelClose(): boolean {
        if (this.game.uiManager?.isStatsPanelOpen()) {
            this.game.uiManager?.hideStatsPanel();
            return true;
        }
        return false;
    }

    /**
     * Handle charge selection (bishop spear, horse icon, bow)
     * Returns true if handled, false otherwise
     */
    private _handleChargeSelection(gridCoords: GridCoords): boolean {
        const pendingCharge = this.game.transientGameState?.getPendingCharge();
        if (!pendingCharge?.selectionType) {
            return false;
        }

        const selType = pendingCharge.selectionType;
        let chargeDetails: any = null;
        const playerPos = this.game.playerFacade?.getPosition();
        if (!playerPos) return false;

        // Use interactionManager.combatManager (CombatActionManager) for charge validation
        const combatActionManager = this.game.interactionManager?.combatManager;
        if (!combatActionManager) {
            logger.error('[InputUIHandler] CombatActionManager not available');
            return false;
        }

        // When charge is initiated from radial UI (has selectionType), include radial inventory
        const includeRadial = true;

        if (selType === 'bishop_spear') {
            chargeDetails = combatActionManager.isValidBishopSpearCharge(Position.from(gridCoords), Position.from(playerPos), includeRadial);
        } else if (selType === 'horse_icon') {
            chargeDetails = combatActionManager.isValidHorseIconCharge(Position.from(gridCoords), Position.from(playerPos), includeRadial);
        } else if (selType === 'bow') {
            chargeDetails = combatActionManager.isValidBowShot(Position.from(gridCoords), Position.from(playerPos), includeRadial);
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

    private _isTileInteractive(x: number, y: number): boolean {
        const tile = this.game.grid?.[y]?.[x];
        if (!tile) return false;

        const tileType = getTileType(tile);
        return TileRegistry.isInteractive(tileType!);
    }
}
