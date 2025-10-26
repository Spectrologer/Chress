import { GRID_SIZE, TILE_TYPES } from '../core/constants.js';
import { eventBus } from '../core/EventBus.js';
import { EventTypes } from '../core/EventTypes.js';
import { isAdjacent } from '../core/utils/DirectionUtils.js';
import { ItemRepository } from './inventory/ItemRepository.js';
import { isBomb } from '../utils/TileUtils.js';
import GridIterator from '../utils/GridIterator.js';
import { safeCall } from '../utils/SafeServiceCall.js';
import { Position } from '../core/Position.js';

/**
 * BombManager - Consolidated bomb management system
 *
 * Handles both passive bomb timing and active player interactions:
 * - Bomb timer management and automatic explosions
 * - Bomb placement and detonation interactions
 * - Inventory management for placed bombs
 */
export class BombManager {
    constructor(game) {
        this.game = game;
        this.itemRepository = new ItemRepository(game);
    }

    // ========================================
    // Passive Bomb Timer Management
    // ========================================

    /**
     * Check all bombs on grid and trigger explosions for bombs >= 2 actions old
     * Called each turn from CombatManager
     */
    tickBombsAndExplode() {
        GridIterator.findTiles(this.game.grid, isBomb).forEach(({ tile, x, y }) => {
            // Skip primitive bombs - they're inactive pickup items
            if (typeof tile !== 'object') return;

            if (tile.actionsSincePlaced >= 2) {
                safeCall(this.game, 'explodeBomb', x, y);
            }
        });
    }

    // ========================================
    // Active Player Bomb Interactions
    // ========================================

    /**
     * Handle bomb placement at specified grid coordinates
     * Removes bomb from inventory and places on grid
     *
     * @param {Object} gridCoords - {x, y} grid position
     * @returns {boolean} - True if bomb was placed successfully
     */
    handleBombPlacement(gridCoords) {
        if (!this.game.bombPlacementMode) return false;

        const clickedPos = Position.from(gridCoords);
        const placed = this.game.bombPlacementPositions.find(p => clickedPos.equals(p));
        if (!placed) return false;

        // Place timed bomb here
        const placedPos = Position.from(placed);
        placedPos.setTile(this.game.grid, { type: TILE_TYPES.BOMB, actionsSincePlaced: 0, justPlaced: true });

        // Remove one bomb from either inventory (prefer main inventory)
        this.itemRepository.decrementItemByType(this.game.player, 'bomb');

        eventBus.emit(EventTypes.UI_UPDATE_STATS, {});

        // Placing bomb counts as an action - increment bomb timers and start enemy turns
        this.game.incrementBombActions();
        this.game.startEnemyTurns();

        // End bomb placement mode after placing
        this.endBombPlacement();
        return true;
    }

    /**
     * Trigger explosion of adjacent bomb when player taps it
     *
     * @param {Object} gridCoords - {x, y} grid position of bomb
     * @param {Object} playerPos - {x, y} player position
     * @returns {boolean} - True if bomb was triggered
     */
    triggerBombExplosion(gridCoords, playerPos) {
        const clickedPos = Position.from(gridCoords);
        const tapTile = clickedPos.getTile(this.game.grid);
        if (!(tapTile && typeof tapTile === 'object' && tapTile.type === TILE_TYPES.BOMB)) return false;

        const playerPosition = Position.from(playerPos);
        if (!playerPosition.isAdjacentTo(clickedPos)) return false;

        // Activating bomb counts as an action - increment bomb timers and start enemy turns
        this.game.incrementBombActions();
        this.game.explodeBomb(gridCoords.x, gridCoords.y);
        this.game.startEnemyTurns();
        return true;
    }

    /**
     * Force immediate bomb explosion without distance checks
     * Used for chain reactions
     *
     * @param {Object} gridCoords - {x, y} grid position
     */
    forceBombTrigger(gridCoords) {
        const clickedPos = Position.from(gridCoords);
        const tapTile = clickedPos.getTile(this.game.grid);
        if (!(tapTile && typeof tapTile === 'object' && tapTile.type === TILE_TYPES.BOMB)) return;

        // Force immediate explosion without action count
        tapTile.actionsSincePlaced = 2;  // Trigger immediate explosion
        this.game.explodeBomb(gridCoords.x, gridCoords.y);
    }

    /**
     * End bomb placement mode and clear UI state
     */
    endBombPlacement() {
        if (!this.game.bombPlacementMode) return;
        this.game.bombPlacementMode = false;
        this.game.bombPlacementPositions = [];
        this.game.hideOverlayMessage();
    }
}
