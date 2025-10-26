import { TILE_TYPES } from '../../core/constants.js';
import { eventBus } from '../../core/EventBus.js';
import { EventTypes } from '../../core/EventTypes.js';

/**
 * InventoryInteractionHandler - Unified interaction layer for inventory UI
 *
 * This handler consolidates all UI interaction logic that was previously
 * duplicated across InventoryUI.js and RadialInventoryUI.js.
 *
 * Responsibilities:
 * - Handle bomb placement mode entry and execution
 * - Handle item usage requests from UI
 * - Coordinate with BombManager for bomb-specific logic
 * - Coordinate with InventoryService for item consumption
 *
 * This eliminates duplicate logic from:
 * - InventoryUI.js (bomb double-click logic)
 * - RadialInventoryUI.js (bomb placement from radial)
 */
export class InventoryInteractionHandler {
    constructor(game) {
        this.game = game;
    }

    /**
     * Handle item usage from inventory UI (main or radial)
     *
     * Special cases:
     * - Bombs: Enter placement mode instead of immediate use
     * - Other items: Delegate to InventoryService
     *
     * @param {Object} item - Item being used
     * @param {Object} options - { fromRadial: boolean, isDoubleClick: boolean }
     * @returns {boolean} - Success
     */
    handleItemUse(item, options = {}) {
        const { fromRadial = false, isDoubleClick = false } = options;

        // Special handling for bombs
        if (item.type === 'bomb') {
            return this.handleBombInteraction(item, { fromRadial, isDoubleClick });
        }

        // All other items: delegate to service
        if (this.game.inventoryService) {
            return this.game.inventoryService.useItem(item, { fromRadial });
        }

        return false;
    }

    /**
     * Handle bomb-specific interaction logic
     *
     * Two modes:
     * 1. Single click (radial or main): Enter placement mode
     * 2. Double click (main inventory only): Place bomb at player position
     *
     * @param {Object} item - Bomb item
     * @param {Object} options - { fromRadial: boolean, isDoubleClick: boolean }
     * @returns {boolean} - Success
     */
    handleBombInteraction(item, options = {}) {
        const { fromRadial = false, isDoubleClick = false } = options;

        // Double-click in main inventory: immediate placement at player position
        if (isDoubleClick && !fromRadial) {
            return this._placeImmediateBomb(item);
        }

        // Single click: enter bomb placement mode
        return this._enterBombPlacementMode();
    }

    /**
     * Place bomb immediately at player's current position
     * Used for double-click in main inventory
     *
     * @private
     * @param {Object} item - Bomb item
     * @returns {boolean} - Success
     */
    _placeImmediateBomb(item) {
        const px = this.game.player.x;
        const py = this.game.player.y;

        // Place bomb on grid
        this.game.grid[py][px] = {
            type: TILE_TYPES.BOMB,
            actionsSincePlaced: 0,
            justPlaced: true
        };

        // Consume bomb from inventory via service
        if (this.game.inventoryService) {
            this.game.inventoryService.useItem(item, { fromRadial: false });
        }

        eventBus.emit(EventTypes.UI_UPDATE_STATS, {});
        return true;
    }

    /**
     * Enter bomb placement mode (show adjacent tiles as targets)
     * Used for single-click or radial menu interaction
     *
     * @private
     * @returns {boolean} - Success
     */
    _enterBombPlacementMode() {
        const px = this.game.player.x;
        const py = this.game.player.y;

        // Calculate valid adjacent positions
        this.game.bombPlacementPositions = [];
        const directions = [
            { dx: 1, dy: 0 },
            { dx: -1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: 0, dy: -1 }
        ];

        for (const dir of directions) {
            const nx = px + dir.dx;
            const ny = py + dir.dy;

            if (nx >= 0 && nx < 9 && ny >= 0 && ny < 9) {
                const tile = this.game.grid[ny][nx];
                if (tile === TILE_TYPES.FLOOR || tile === TILE_TYPES.EXIT) {
                    this.game.bombPlacementPositions.push({ x: nx, y: ny });
                }
            }
        }

        // Enter placement mode
        this.game.bombPlacementMode = true;

        // Show UI message
        if (this.game.uiManager?.showOverlayMessage) {
            this.game.uiManager.showOverlayMessage(
                'Tap a tile to place a bomb',
                null,
                true,
                true
            );
        }

        return true;
    }

    /**
     * Execute bomb placement at specified grid coordinates
     * Delegates to BombManager for actual placement logic
     *
     * @param {Object} gridCoords - { x, y } grid position
     * @returns {boolean} - Success
     */
    executeBombPlacement(gridCoords) {
        if (!this.game.bombManager) {
            console.warn('BombManager not available');
            return false;
        }

        return this.game.bombManager.handleBombPlacement(gridCoords);
    }

    /**
     * Cancel bomb placement mode
     */
    cancelBombPlacement() {
        if (this.game.bombManager) {
            this.game.bombManager.endBombPlacement();
        }
    }
}
