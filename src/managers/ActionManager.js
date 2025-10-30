// @ts-check
/**
 * ActionManager - Executes player actions and special item effects.
 *
 * Responsibilities:
 * - Managing bomb timers and placement
 * - Executing special weapon attacks (Bishop Spear, Horse Icon, etc.)
 * - Handling action-triggered events
 * - Coordinating with combat and inventory systems
 *
 * Action Flow:
 * Player input -> ActionManager -> Game systems (Combat, Inventory, etc.) -> Visual feedback
 */

/**
 * @typedef {Object} Item
 * @property {string} type - Item type identifier
 * @property {number} [uses] - Remaining uses
 */

/**
 * @typedef {Object} Enemy
 * @property {number} x - Enemy X position
 * @property {number} y - Enemy Y position
 */

/**
 * @typedef {Object} Game
 * @property {any} playerFacade - Player facade
 * @property {any} combatManager - Combat manager
 * @property {any} player - Player instance
 * @property {Array<Array<number|Object>>} grid - Game grid
 * @property {any} gridManager - Grid manager
 * @property {any} enemyCollection - Enemy collection
 * @property {any} [animationScheduler] - Animation scheduler
 * @property {any} [transientGameState] - Transient game state
 * @property {Function} [startEnemyTurns] - Start enemy turns function
 */

import { TILE_TYPES, TILE_SIZE, GRID_SIZE, ANIMATION_CONSTANTS, TIMING_CONSTANTS, GAMEPLAY_CONSTANTS, INVENTORY_CONSTANTS } from '../core/constants/index.js';
import audioManager from '../utils/AudioManager.js';
import { eventBus } from '../core/EventBus.js';
import { EventTypes } from '../core/EventTypes.js';
import { isWithinGrid } from '../utils/GridUtils.js';
import { ItemRepository } from './inventory/ItemRepository.js';
import { isBomb, isTileType } from '../utils/TileUtils.js';
import GridIterator from '../utils/GridIterator.js';

export class ActionManager {
    /**
     * Creates a new ActionManager instance.
     *
     * @param {Game} game - The main game instance
     */
    constructor(game) {
        /** @type {Game} */
        this.game = game;

        /** @type {number} */
        this.bombActionCounter = 0;

        /** @type {ItemRepository} */
        this.itemRepository = new ItemRepository(game);
    }

    /**
     * Adds a bomb item to the player's inventory.
     * Used by debug commands or special game events.
     *
     * @emits EventTypes.UI_UPDATE_STATS When bomb is successfully added
     * @returns {void}
     */
    addBomb() {
        if (this.game.playerFacade.getInventoryCount() < INVENTORY_CONSTANTS.MAX_INVENTORY_SIZE) {
            this.game.playerFacade.addToInventory({ type: 'bomb' });
            eventBus.emit(EventTypes.UI_UPDATE_STATS, {});
        }
    }

    /**
     * Increments the timer on all active (placed) bombs on the grid.
     * Called each turn to advance bomb countdowns toward explosion.
     *
     * Bomb States:
     * - Primitive (number): Inactive pickup item on ground
     * - Object with timer: Active bomb placed by player
     *
     * Timer Logic:
     * - justPlaced flag: Set when bomb is placed, prevents immediate increment
     * - actionsSincePlaced: Counts turns since placement
     * - Explosion happens when actionsSincePlaced >= threshold (handled by BombManager)
     *
     * Note: This method only increments timers. Actual explosion logic
     * is in BombManager.tickBombsAndExplode() to avoid duplicate explosions.
     *
     * @returns {void}
     */
    incrementBombActions() {
        // Find all bomb tiles on the grid
        const bombs = GridIterator.findTiles(this.game.grid, isBomb);

        bombs.forEach(({ tile, x, y }) => {
            // Skip primitive bombs - they're inactive pickup items
			if (typeof tile !== 'object') {
				// console.log(`[ActionManager] Bomb at (${x},${y}) is primitive, skipping`);
				return;
			}

			// console.log(`[ActionManager] Bomb at (${x},${y}) before: actionsSincePlaced=${tile.actionsSincePlaced}, justPlaced=${tile.justPlaced}`);

            // First turn after placement: clear justPlaced flag but don't increment
			if (tile.justPlaced) {
				tile.justPlaced = false;
				// console.log(`[ActionManager] Cleared justPlaced flag for bomb at (${x},${y})`);
				return;
			}

            // Subsequent turns: increment timer
            tile.actionsSincePlaced = (tile.actionsSincePlaced || 0) + 1;
            // console.log(`[ActionManager] Incremented bomb at (${x},${y}) to actionsSincePlaced=${tile.actionsSincePlaced}`);
        });
    }

    /**
     * Executes a Bishop Spear diagonal charge attack.
     * Player charges diagonally, defeating enemies in the path and ending at target.
     *
     * Attack Pattern:
     * - Diagonal movement only (like chess bishop)
     * - Travels until hitting enemy, obstacle, or max range
     * - Defeats enemy at endpoint
     * - Creates smoke trail along path
     *
     * Visual Effects:
     * - Smoke animations at each tile along the path
     * - Backflip animation for combo kills (2+)
     * - Bump animation for single kills
     * - Whoosh sound effect
     *
     * @param {Item} item - The Bishop Spear item being used
     * @param {number} targetX - Destination X coordinate
     * @param {number} targetY - Destination Y coordinate
     * @param {Enemy|null} enemy - Enemy at target position (if any)
     * @param {number} dx - Delta X (direction)
     * @param {number} dy - Delta Y (direction)
     * @returns {void}
     */
    performBishopSpearCharge(item, targetX, targetY, enemy, dx, dy) {
        const playerPos = this.game.playerFacade.getPosition();
        const startX = playerPos.x;
        const startY = playerPos.y;

        // Consume one use of the item
        item.uses--;
        if (item.uses <= 0) {
            this.itemRepository.removeItem(this.game.player, item);
        }

        // Add smoke trail along the charge path
        if (this.game.player.animations?.smokeAnimations) {
            for (let i = 1; i < Math.abs(dx); i++) {
                const px = startX + i * Math.sign(dx);
                const py = startY + i * Math.sign(dy);
                this.game.player.animations.smokeAnimations.push({
                    x: px,
                    y: py,
                    frame: ANIMATION_CONSTANTS.SMOKE_ANIMATION_FRAMES
                });
            }
        }

        // Handle enemy at target position
        if (enemy) {
            this.game.playerFacade.setAction('attack');
            const res = this.game.combatManager.defeatEnemy(enemy, 'player');

            if (res && res.defeated) {
                // Backflip for combo kills, bump for single kills
                if (res.consecutiveKills >= 2) {
                    this.game.playerFacade.startBackflip();
                } else {
                    this.game.playerFacade.startBump(enemy.x - startX, enemy.y - startY);
                }
            }
        }

        // Move player to target position
        this.game.playerFacade.setPosition(targetX, targetY);
        this.game.playerFacade.startSmokeAnimation();
        audioManager.playSound('whoosh', { game: this.game });
        this.game.startEnemyTurns?.();

        eventBus.emit(EventTypes.UI_UPDATE_STATS, {});
    }

    /**
     * Perform a Horse Icon L-shaped knight charge attack
     * @param {Item} item - The Horse Icon item
     * @param {number} targetX - Target X coordinate
     * @param {number} targetY - Target Y coordinate
     * @param {Enemy|null} enemy - Enemy at target (if any)
     * @param {number} dx - Delta X
     * @param {number} dy - Delta Y
     * @returns {void}
     */
    performHorseIconCharge(item, targetX, targetY, enemy, dx, dy) {
        item.uses--;
        if (item.uses <= 0) {
            this.itemRepository.removeItem(this.game.player, item);
        }

        // Get current player position (via facade)
        const playerPos = this.game.playerFacade.getPosition();
        const startX = playerPos.x;
        const startY = playerPos.y;
        const endX = targetX;
        const endY = targetY;

        // Calculate the L-shape path: determine mid point (corner of the L)
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        let midX, midY;
        if (absDx > absDy) {
            // Horizontal dominant: corner is at end of horizontal leg
            midX = startX + dx;
            midY = startY;
        } else {
            // Vertical dominant: corner is at end of vertical leg
            midX = startX;
            midY = startY + dy;
        }

        // Add the L-shape charge animation using event system
        eventBus.emit(EventTypes.ANIMATION_HORSE_CHARGE, {
            startPos: { x: startX, y: startY },
            midPos: { x: midX, y: midY },
            endPos: { x: endX, y: endY }
        });

        // Build ordered positions along the L path (start -> mid -> end)
        const smokePositions = [];
        const leg1dx = midX - startX;
        const leg1dy = midY - startY;
        const step1x = Math.sign(leg1dx) || 0;
        const step1y = Math.sign(leg1dy) || 0;
        const len1 = Math.max(Math.abs(leg1dx), Math.abs(leg1dy));
        for (let i = 1; i <= len1; i++) {
            smokePositions.push({ x: startX + i * step1x, y: startY + i * step1y });
        }

        const leg2dx = endX - midX;
        const leg2dy = endY - midY;
        const step2x = Math.sign(leg2dx) || 0;
        const step2y = Math.sign(leg2dy) || 0;
        const len2 = Math.max(Math.abs(leg2dx), Math.abs(leg2dy));
        // Exclude final target to match other charge smoke behavior
        for (let i = 1; i < len2; i++) {
            smokePositions.push({ x: midX + i * step2x, y: midY + i * step2y });
        }

        // Use animationScheduler to add smoke sequentially for a snappier trail
        if (this.game.animationScheduler?.createSequence) {
            const seq = this.game.animationScheduler.createSequence();
            const smokeFrameLifetime = ANIMATION_CONSTANTS.SMOKE_SHORT_LIFETIME;
            const stepDelay = TIMING_CONSTANTS.SMOKE_SPAWN_DELAY; // ms between smoke spawns
            smokePositions.forEach((pos, idx) => {
                seq.then(() => {
                    this.game.player.animations.smokeAnimations.push({ x: pos.x, y: pos.y, frame: smokeFrameLifetime });
                }).wait(stepDelay);
            });
            seq.start?.();
        } else {
            // Fallback: if animationScheduler isn't available, add all at once
            smokePositions.forEach(pos => this.game.player.animations.smokeAnimations.push({ x: pos.x, y: pos.y, frame: ANIMATION_CONSTANTS.SMOKE_SHORT_LIFETIME }));
        }

        if (enemy) {
            this.game.playerFacade.setAction('attack');
            const res = this.game.combatManager.defeatEnemy(enemy, 'player');
            if (res && res.defeated) {
                if (res.consecutiveKills >= 2) this.game.playerFacade.startBackflip(); else this.game.playerFacade.startBump(enemy.x - startX, enemy.y - startY);
            }
        }

        this.game.playerFacade.setPosition(targetX, targetY);
        this.game.playerFacade.startSmokeAnimation();
        audioManager.playSound('whoosh', { game: this.game });
        this.game.startEnemyTurns?.();
        eventBus.emit(EventTypes.UI_UPDATE_STATS, {});
    }

    /**
     * Perform a bow shot ranged attack with arrow animation
     * @param {Item} item - The bow item
     * @param {number} targetX - Target X coordinate
     * @param {number} targetY - Target Y coordinate
     * @param {Enemy|null} [enemy=null] - Enemy at target (if any)
     * @returns {void}
     */
    performBowShot(item, targetX, targetY, enemy = null) {
        item.uses--;
        if (item.uses <= 0) {
            this.itemRepository.removeItem(this.game.player, item);
        }

        const playerPos = this.game.playerFacade.getPosition();
        // Use provided enemy reference when available; do not rely on pendingCharge here
        const targetEnemy = enemy || null;

        // Create animation sequence for bow shot
        this.game.animationScheduler.createSequence()
            .then(() => {
                // Add arrow animation using event system
                eventBus.emit(EventTypes.ANIMATION_ARROW, {
                    startX: playerPos.x,
                    startY: playerPos.y,
                    endX: targetX,
                    endY: targetY
                });

                // Player has acted. Prevent enemies from moving until the action resolves.
                const transientState = this.game.transientGameState;
                transientState.setPlayerJustAttacked(true);

                // Give player a pronounced bow-shot animation state for rendering
                if (this.game.player.animations) {
                    this.game.player.animations.bowShot = { frames: ANIMATION_CONSTANTS.BOW_SHOT_FRAMES, totalFrames: ANIMATION_CONSTANTS.BOW_SHOT_FRAMES, power: 1.4 };
                }

                // Play a distinct bow sound
                audioManager.playSound('bow_shot', { game: this.game });
            })
            .wait(TIMING_CONSTANTS.ARROW_FLIGHT_TIME) // delay for arrow to travel
            .then(() => {
                const enemyCollection = this.game.enemyCollection;
                if (targetEnemy && enemyCollection.includes(targetEnemy)) { // Check if enemy still exists
                    this.game.playerFacade.setAction('attack');
                    const res = this.game.combatManager.defeatEnemy(targetEnemy, 'player');
                    if (res && res.defeated) {
                        if (res.consecutiveKills >= 2) this.game.playerFacade.startBackflip(); else this.game.playerFacade.startBump(targetEnemy.x - playerPos.x, targetEnemy.y - playerPos.y);
                    }
                }
                // Now that the arrow has hit, enemies can take their turn.
                const transientState = this.game.transientGameState;
                transientState.clearPlayerJustAttacked();
                this.game.startEnemyTurns?.();
            })
            .start();
    }

    /**
     * Explode a bomb at the specified position with blast radius damage
     * @param {number} bx - Bomb X coordinate
     * @param {number} by - Bomb Y coordinate
     * @returns {void}
     */
    explodeBomb(bx, by) {
        const gridManager = this.game.gridManager;
        gridManager.setTile(bx, by, TILE_TYPES.FLOOR);
        audioManager.playSound('splode', { game: this.game });
        this.game.playerFacade.startSplodeAnimation(bx, by);

        const directions = [
            { dx: 0, dy: 0 }, { dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
            { dx: 1, dy: 1 }, { dx: -1, dy: -1 }, { dx: 1, dy: -1 }, { dx: -1, dy: 1 }
        ];

        const directionSet = new Set(directions.map(dir => `${dir.dx},${dir.dy}`));
        for (const dir of directions) {
            const nx = bx + dir.dx;
            const ny = by + dir.dy;
            if (isWithinGrid(nx, ny)) {
                const tile = gridManager.getTile(nx, ny);
                if (isTileType(tile, TILE_TYPES.WALL) || isTileType(tile, TILE_TYPES.ROCK) || isTileType(tile, TILE_TYPES.SHRUBBERY) || isTileType(tile, TILE_TYPES.GRASS)) {
                    gridManager.setTile(nx, ny, (nx === 0 || nx === GRID_SIZE - 1 || ny === 0 || ny === GRID_SIZE - 1) ? TILE_TYPES.EXIT : TILE_TYPES.FLOOR);
                }

                const enemyCollection = this.game.enemyCollection;
                const enemy = enemyCollection.findAt(nx, ny);
                if (enemy) {
                    this.game.combatManager.defeatEnemy(enemy);
                }

                // Check for player knockback (within 1 tile, not center) - launch flying backward until hitting obstruction
                const playerPos = this.game.playerFacade.getPosition();
                if (nx === playerPos.x && ny === playerPos.y && !(dir.dx === 0 && dir.dy === 0)) {
                    // Launch player away from bomb - direction away is continuing in the dir.dx, dir.dy direction from player position
                    let launchX = nx;
                    let launchY = ny;
                    const maxSteps = GAMEPLAY_CONSTANTS.BOMB_LAUNCH_MAX_STEPS; // Prevent infinite loop
                    let steps = 0;
                    let intermediatePositions = []; // To collect positions for smoke

                    while (steps < maxSteps) {
                        launchX += dir.dx;
                        launchY += dir.dy;
                        if (isWithinGrid(launchX, launchY) &&
                            this.game.playerFacade.isWalkable(launchX, launchY, this.game.grid, playerPos.x, playerPos.y)) {
                            // Check if enemy at this position - if so, damage it and stop launch
                            const enemyAtLaunch = enemyCollection.findAt(launchX, launchY);
                            if (enemyAtLaunch) {
                                this.game.combatManager.defeatEnemy(enemyAtLaunch);
                                // Stop launching here (don't go further)
                                break;
                            }
                            steps++;
                            intermediatePositions.push({ x: launchX, y: launchY }); // Add to middle positions
                        } else {
                            // Back up to last valid position
                            launchX -= dir.dx;
                            launchY -= dir.dy;
                            break;
                        }
                    }
                    // Move to the launch position if it's different from current
                    const currentPlayerPos = this.game.playerFacade.getPosition();
                    if (launchX !== currentPlayerPos.x || launchY !== currentPlayerPos.y) {
                        // Add smoke at each intermediate position (not at original or final for trail effect)
                        intermediatePositions.forEach(pos => {
                            this.game.player.animations.smokeAnimations.push({ x: pos.x, y: pos.y, frame: ANIMATION_CONSTANTS.SMOKE_ANIMATION_FRAMES });
                        });
                        this.game.playerFacade.setPosition(launchX, launchY);
                        this.game.playerFacade.startBump(dir.dx, dir.dy); // Bump in the launch direction
                    }
                }
            }
        }
    }
}
