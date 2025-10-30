// @ts-check
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
 * @typedef {Object} GridCoords
 * @property {number} x - X coordinate
 * @property {number} y - Y coordinate
 */

/**
 * @typedef {Object} PlayerPos
 * @property {number} x - Player X position
 * @property {number} y - Player Y position
 */

/**
 * @typedef {Object} Game
 * @property {any} transientGameState - Transient game state manager
 * @property {any} gridManager - Grid manager
 * @property {any} player - Player instance
 * @property {Array<Array<number|Object>>} grid - Game grid
 * @property {Function} incrementBombActions - Increment bomb timer actions
 * @property {Function} startEnemyTurns - Start enemy turn phase
 * @property {Function} explodeBomb - Explode a bomb at coordinates
 * @property {Function} hideOverlayMessage - Hide overlay UI message
 */

/**
 * BombManager - Consolidated bomb management system for timed explosives.
 *
 * Responsibilities:
 * 1. Bomb Timer System: Track action count and trigger automatic explosions
 * 2. Bomb Placement: Handle player bomb placement from inventory
 * 3. Manual Detonation: Allow player to trigger adjacent bombs
 * 4. Chain Reactions: Propagate explosions to adjacent bombs
 * 5. Inventory Integration: Remove/restore bombs when placing/picking up
 *
 * Bomb Lifecycle:
 * 1. Inventory: Inactive bomb item (primitive TILE_TYPES.BOMB)
 * 2. Placement: Player places bomb at valid position
 *    - Converted to object: {type: BOMB, actionsSincePlaced: 0, justPlaced: true}
 *    - Removed from inventory
 * 3. Timing: Each player action increments actionsSincePlaced
 * 4. Explosion: After 2 actions, bomb automatically explodes
 * 5. Chain: Nearby bombs can trigger in chain reactions
 *
 * Bomb State Types:
 * - Primitive (number): Inactive pickup item, not on timer
 * - Object with actionsSincePlaced: Active timed bomb
 *   - actionsSincePlaced 0-1: Safe (can still be chain-triggered)
 *   - actionsSincePlaced >= 2: Explodes automatically
 *
 * Action Count System:
 * Player actions that increment bomb timers:
 * - Movement
 * - Attacks
 * - Placing/triggering bombs
 * - Using items
 *
 * Enemy turns do NOT increment bomb timers (bombs tick on player actions only).
 *
 * Chain Reaction Logic:
 * When a bomb explodes, adjacent bombs are force-triggered regardless of
 * their timer state. This creates strategic opportunities for multi-bomb
 * detonations and area denial.
 *
 * Design Pattern: Manager Pattern
 * - Centralizes all bomb-related logic
 * - Delegates inventory operations to ItemRepository
 * - Emits events for UI updates via EventBus
 */
export class BombManager {
    /**
     * Creates a new BombManager instance.
     *
     * @param {Game} game - The main game instance
     */
    constructor(game) {
        /** @type {Game} */
        this.game = game;

        /** @type {ItemRepository} */
        this.itemRepository = new ItemRepository(game);
    }

    // ========================================
    // Passive Bomb Timer Management
    // ========================================

    /**
     * Checks all active bombs on the grid and triggers explosions for bombs
     * that have reached their detonation threshold (>= 2 actions).
     *
     * Algorithm:
     * 1. Scan grid for all bomb tiles using GridIterator
     * 2. Skip primitive bombs (inactive pickup items)
     * 3. For each active bomb (object with actionsSincePlaced):
     *    a. Check if actionsSincePlaced >= 2
     *    b. Verify tile is still a bomb (prevents double-explosion)
     *    c. Trigger explosion via game.explodeBomb()
     *
     * Primitive vs Object Bombs:
     * - Primitive (number): TILE_TYPES.BOMB as direct value
     *   - These are inactive items awaiting pickup
     *   - No timer, cannot explode
     * - Object: {type: TILE_TYPES.BOMB, actionsSincePlaced: N, justPlaced: bool}
     *   - These are active timed bombs placed by player
     *   - Timer increments with each player action
     *   - Explode automatically when actionsSincePlaced >= 2
     *
     * Double-Explosion Prevention:
     * The verification check prevents bombs from exploding twice in the
     * same tick. Chain reactions can cause a bomb to explode mid-iteration,
     * so we verify the tile is still a bomb before calling explodeBomb().
     *
     * Timing Example:
     * - Turn 0: Player places bomb (actionsSincePlaced = 0, justPlaced = true)
     * - Turn 1: Player moves (actionsSincePlaced = 1, justPlaced = false)
     * - Turn 2: Player moves (actionsSincePlaced = 2) -> EXPLODES
     *
     * Use Case:
     * Called at the start of each combat turn from CombatManager.
     * Ensures all bombs tick in sync with player actions.
     *
     * @returns {void}
     */
    tickBombsAndExplode() {
        const bombs = GridIterator.findTiles(this.game.grid, isBomb);

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
                const currentTile = this.game.gridManager.getTile(x, y);
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
     * Handles bomb placement at specified grid coordinates.
     * Validates position, removes bomb from inventory, and places active timed bomb.
     *
     * Placement Flow:
     * 1. Verify game is in bomb placement mode
     * 2. Check if clicked position is in valid placement positions
     * 3. Place timed bomb object on grid
     * 4. Remove one bomb from player inventory
     * 5. Emit UI update event
     * 6. Increment bomb timers for all active bombs
     * 7. Start enemy turns (placement counts as player action)
     * 8. Exit bomb placement mode
     *
     * Valid Placement Positions:
     * Determined by transientGameState.getBombPlacementPositions()
     * - Typically adjacent to player
     * - Must be walkable floor tiles
     * - Cannot overlap existing bombs/enemies
     *
     * Bomb State Transition:
     * - Before: Player inventory has primitive bomb (count decreases)
     * - After: Grid tile becomes {type: BOMB, actionsSincePlaced: 0, justPlaced: true}
     *
     * Action Timing:
     * Placing a bomb is a full player action, which:
     * - Increments all active bomb timers (game.incrementBombActions)
     * - Triggers enemy movement phase (game.startEnemyTurns)
     * - Consumes the player's turn
     *
     * Why justPlaced Flag:
     * The justPlaced flag prevents the newly placed bomb from immediately
     * incrementing to actionsSincePlaced=1 in the same turn. It's cleared
     * in the next increment cycle.
     *
     * @param {Object} gridCoords - {x, y} grid position to place bomb
     * @returns {boolean} True if bomb was placed successfully, false otherwise
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
        this.game.gridManager.setTile(placedPos.x, placedPos.y, { type: TILE_TYPES.BOMB, actionsSincePlaced: 0, justPlaced: true });

        console.log('[BombManager] Placed bomb at', placed, 'tile:', this.game.gridManager.getTile(placed.x, placed.y));

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
     * Triggers manual explosion of an adjacent bomb when player taps it.
     * Allows early detonation before automatic timer expires.
     *
     * Validation Checks:
     * 1. Clicked tile must be an active bomb (object with type BOMB)
     * 2. Player must be adjacent to the bomb (1 tile away)
     * 3. If valid, immediately explode the bomb
     *
     * Adjacency Definition:
     * Adjacent means within 1 tile in any of 8 directions:
     * - Orthogonal: N, S, E, W
     * - Diagonal: NE, NW, SE, SW
     *
     * Use Case - Tactical Early Detonation:
     * Player can trigger bombs before the 2-action timer expires for
     * tactical reasons:
     * - Enemy moves into blast radius
     * - Player wants to clear path immediately
     * - Chain reaction setup with other bombs
     *
     * Action Timing:
     * Triggering a bomb manually is a full player action:
     * - Increments all active bomb timers (game.incrementBombActions)
     * - Detonates the target bomb (game.explodeBomb)
     * - Triggers enemy movement phase (game.startEnemyTurns)
     *
     * Safety Distance:
     * The adjacency requirement (not standing on bomb) ensures player
     * maintains minimum safe distance from the blast center.
     *
     * @param {Object} gridCoords - {x, y} grid position of bomb to trigger
     * @param {Object} playerPos - {x, y} player's current position
     * @returns {boolean} True if bomb was successfully triggered, false if invalid
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
     * Forces immediate bomb explosion without validation checks.
     * Used exclusively for chain reactions triggered by nearby explosions.
     *
     * Chain Reaction Logic:
     * When a bomb explodes, any bombs within the blast radius are
     * force-triggered regardless of:
     * - Timer state (actionsSincePlaced can be 0, 1, or 2+)
     * - Player proximity (no adjacency check)
     * - Player action state (doesn't consume a turn)
     *
     * Implementation:
     * 1. Verify tile is an active bomb object
     * 2. Set actionsSincePlaced = 2 to meet explosion threshold
     * 3. Immediately call game.explodeBomb()
     *
     * Why Set Timer to 2:
     * Setting actionsSincePlaced = 2 ensures the bomb meets the explosion
     * threshold, allowing the standard explosion logic to proceed. This
     * maintains consistency with the normal timer-based explosions.
     *
     * No Action Count:
     * Unlike handleBombPlacement() and triggerBombExplosion(), this method
     * does NOT increment bomb timers or start enemy turns. Chain reactions
     * occur instantaneously within the same player action that triggered
     * the initial explosion.
     *
     * Use Case - Cascade Explosions:
     * Player places 3 bombs in a line, triggers the first one manually:
     * - Turn N: Bomb A explodes (manual trigger)
     * - Same turn: Bomb B force-triggers (chain reaction)
     * - Same turn: Bomb C force-triggers (chain reaction)
     * - Turn N+1: Enemy turn begins (only 1 player action consumed)
     *
     * Blast Radius:
     * The explosion system determines which bombs are in blast radius.
     * This method is called for each affected bomb by the explosion logic.
     *
     * @param {GridCoords} gridCoords - {x, y} grid position of bomb to force-trigger
     * @returns {void}
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
     * Ends bomb placement mode and clears associated UI state.
     * Resets the game to normal input mode after bomb placement completes or is cancelled.
     *
     * State Cleanup:
     * 1. Exit bomb placement mode in transientGameState
     * 2. Hide overlay message (bomb placement instructions)
     * 3. Clear valid placement position highlights
     *
     * When Called:
     * - After successful bomb placement (handleBombPlacement)
     * - When player cancels placement (UI cancel action)
     * - When player moves/attacks without placing (input mode switch)
     *
     * UI State Transition:
     * - Before: Game shows bomb placement overlay with valid positions highlighted
     * - After: Normal gameplay UI restored, player can move/attack freely
     *
     * Safe to Call Multiple Times:
     * This method checks if bomb placement mode is active before proceeding,
     * so it's safe to call even when not in placement mode (no-op).
     *
     * @returns {void}
     */
    endBombPlacement() {
        const transientState = this.game.transientGameState;
        if (!transientState.isBombPlacementMode()) return;
        transientState.exitBombPlacementMode();
        this.game.hideOverlayMessage();
    }
}
