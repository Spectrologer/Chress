import { GRID_SIZE, TILE_TYPES } from '../core/constants/index.js';
import { eventBus } from '../core/EventBus.js';
import { EventTypes } from '../core/EventTypes.js';
import { isAdjacent } from '../core/utils/DirectionUtils.js';
import { ItemRepository } from './inventory/ItemRepository.js';
import { isBomb, isTileObject, isTileObjectOfType } from '../utils/TypeChecks.js';
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
        const bombs = GridIterator.findTiles(this.game.grid, isBomb);
        console.log('[BombManager] tickBombsAndExplode found', bombs.length, 'bombs');

        bombs.forEach(({ tile, x, y }) => {
            // Skip primitive bombs - they're inactive pickup items
            if (!isTileObject(tile)) {
                console.log(`[BombManager] Bomb at (${x},${y}) is primitive, skipping`);
                return;
            }

            console.log(`[BombManager] Bomb at (${x},${y}): actionsSincePlaced=${tile.actionsSincePlaced}, justPlaced=${tile.justPlaced}`);

            if (tile.actionsSincePlaced >= 2) {
                // Double-check that the tile is still a bomb before exploding
                // (in case it was already exploded earlier in this iteration)
                const currentTile = this.game.grid[y][x];
                if (!isBomb(currentTile)) {
                    console.log(`[BombManager] Bomb at (${x},${y}) already exploded, skipping`);
                    return;
                }

                console.log(`[BombManager] Exploding bomb at (${x},${y})`);
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
        const transientState = this.game.transientGameState;

        if (!transientState || !transientState.isBombPlacementMode()) {
            return false;
        }

        const clickedPos = Position.from(gridCoords);
        const bombPositions = transientState.getBombPlacementPositions();
        const placed = bombPositions.find(p => clickedPos.equals(p));

        if (!placed) {
            return false;
        }

        // Place timed bomb here
        const placedPos = Position.from(placed);
        placedPos.setTile(this.game.grid, { type: TILE_TYPES.BOMB, actionsSincePlaced: 0, justPlaced: true });

        console.log('[BombManager] Placed bomb at', placed, 'tile:', this.game.grid[placed.y][placed.x]);

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
        if (!isTileObjectOfType(tapTile, TILE_TYPES.BOMB)) return false;

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
        if (!isTileObjectOfType(tapTile, TILE_TYPES.BOMB)) return;

        // Force immediate explosion without action count
        tapTile.actionsSincePlaced = 2;  // Trigger immediate explosion
        this.game.explodeBomb(gridCoords.x, gridCoords.y);
    }

    /**
     * End bomb placement mode and clear UI state
     */
    endBombPlacement() {
        const transientState = this.game.transientGameState;
        if (!transientState.isBombPlacementMode()) return;
        transientState.exitBombPlacementMode();
        this.game.hideOverlayMessage();
    }
}
