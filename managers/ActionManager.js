import { TILE_TYPES, TILE_SIZE, GRID_SIZE, ANIMATION_CONSTANTS, TIMING_CONSTANTS, GAMEPLAY_CONSTANTS, INVENTORY_CONSTANTS } from '../core/constants/index.js';
import audioManager from '../utils/AudioManager.js';
import { eventBus } from '../core/EventBus.js';
import { EventTypes } from '../core/EventTypes.js';
import { isWithinGrid } from '../utils/GridUtils.js';
import { ItemRepository } from './inventory/ItemRepository.js';
import { isBomb, isTileType } from '../utils/TileUtils.js';
import GridIterator from '../utils/GridIterator.js';

export class ActionManager {
    constructor(game) {
        this.game = game;
        this.bombActionCounter = 0;
        this.itemRepository = new ItemRepository(game);
    }

    addBomb() {
        if (this.game.player.inventory.length < INVENTORY_CONSTANTS.MAX_INVENTORY_SIZE) {
            this.game.player.inventory.push({ type: 'bomb' });
            eventBus.emit(EventTypes.UI_UPDATE_STATS, {});
        }
    }

    incrementBombActions() {
        // Find any placed bombs (objects with timers) on the grid and increment their timer
        // Primitive bombs (just the number TILE_TYPES.BOMB) are inactive pickup items
        // NOTE: This method ONLY increments timers. BombManager.tickBombsAndExplode() handles explosions.
        const bombs = GridIterator.findTiles(this.game.grid, isBomb);
        console.log('[ActionManager] incrementBombActions found', bombs.length, 'bombs');

        bombs.forEach(({ tile, x, y }) => {
            // Skip primitive bombs - they're inactive until placed by player
            if (typeof tile !== 'object') {
                console.log(`[ActionManager] Bomb at (${x},${y}) is primitive, skipping`);
                return;
            }

            console.log(`[ActionManager] Bomb at (${x},${y}) before: actionsSincePlaced=${tile.actionsSincePlaced}, justPlaced=${tile.justPlaced}`);

            if (tile.justPlaced) {
                // This is the turn the bomb was placed, don't increment the timer yet.
                tile.justPlaced = false;
                console.log(`[ActionManager] Cleared justPlaced flag for bomb at (${x},${y})`);
                return;
            }
            tile.actionsSincePlaced = (tile.actionsSincePlaced || 0) + 1; // Increment on subsequent actions
            console.log(`[ActionManager] Incremented bomb at (${x},${y}) to actionsSincePlaced=${tile.actionsSincePlaced}`);
            // Explosion check moved to BombManager.tickBombsAndExplode() to avoid duplicate explosions
        });
    }

    performBishopSpearCharge(item, targetX, targetY, enemy, dx, dy) {
        const playerPos = this.game.player.getPosition();
        const startX = playerPos.x;
        const startY = playerPos.y;

        item.uses--;
        if (item.uses <= 0) {
            this.itemRepository.removeItem(this.game.player, item);
        }

        // Add smoke animations along the diagonal charge path
        if (this.game.player.animations?.smokeAnimations) {
            for (let i = 1; i < Math.abs(dx); i++) {
                const px = startX + i * Math.sign(dx);
                const py = startY + i * Math.sign(dy);
                this.game.player.animations.smokeAnimations.push({ x: px, y: py, frame: ANIMATION_CONSTANTS.SMOKE_ANIMATION_FRAMES });
            }
        }

        if (enemy) {
            this.game.player.setAction?.('attack');
            const res = this.game.combatManager.defeatEnemy(enemy, 'player');
            if (res && res.defeated) {
                if (res.consecutiveKills >= 2) this.game.player.startBackflip(); else this.game.player.startBump(enemy.x - startX, enemy.y - startY);
            }
        }

        this.game.player.setPosition?.(targetX, targetY);
        this.game.player.startSmokeAnimation?.();
        audioManager.playSound('whoosh', { game: this.game });
        this.game.startEnemyTurns?.();

        eventBus.emit(EventTypes.UI_UPDATE_STATS, {});
    }

    performHorseIconCharge(item, targetX, targetY, enemy, dx, dy) {
        item.uses--;
        if (item.uses <= 0) {
            this.itemRepository.removeItem(this.game.player, item);
        }

        // Get current player position
        const playerPos = this.game.player.getPosition();
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
            this.game.player.setAction?.('attack');
            const res = this.game.combatManager.defeatEnemy(enemy, 'player');
            if (res && res.defeated) {
                if (res.consecutiveKills >= 2) this.game.player.startBackflip(); else this.game.player.startBump(enemy.x - startX, enemy.y - startY);
            }
        }

        this.game.player.setPosition?.(targetX, targetY);
        this.game.player.startSmokeAnimation?.();
        audioManager.playSound('whoosh', { game: this.game });
        this.game.startEnemyTurns?.();
        eventBus.emit(EventTypes.UI_UPDATE_STATS, {});
    }

    performBowShot(item, targetX, targetY, enemy = null) {
        item.uses--;
        if (item.uses <= 0) {
            this.itemRepository.removeItem(this.game.player, item);
        }

        const playerPos = this.game.player.getPosition();
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
                    this.game.player.setAction?.('attack');
                    const res = this.game.combatManager.defeatEnemy(targetEnemy, 'player');
                    if (res && res.defeated) {
                        if (res.consecutiveKills >= 2) this.game.player.startBackflip(); else this.game.player.startBump(targetEnemy.x - playerPos.x, targetEnemy.y - playerPos.y);
                    }
                }
                // Now that the arrow has hit, enemies can take their turn.
                const transientState = this.game.transientGameState;
                transientState.clearPlayerJustAttacked();
                this.game.startEnemyTurns?.();
            })
            .start();
    }

    explodeBomb(bx, by) {
        const gridManager = this.game.gridManager;
        gridManager.setTile(bx, by, TILE_TYPES.FLOOR);
        audioManager.playSound('splode', { game: this.game });
        this.game.player.startSplodeAnimation(bx, by);

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
                if (nx === this.game.player.x && ny === this.game.player.y && !(dir.dx === 0 && dir.dy === 0)) {
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
                            this.game.player.isWalkable(launchX, launchY, this.game.grid, this.game.player.x, this.game.player.y)) {
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
                    if (launchX !== this.game.player.x || launchY !== this.game.player.y) {
                        // Add smoke at each intermediate position (not at original or final for trail effect)
                        intermediatePositions.forEach(pos => {
                            this.game.player.animations.smokeAnimations.push({ x: pos.x, y: pos.y, frame: ANIMATION_CONSTANTS.SMOKE_ANIMATION_FRAMES });
                        });
                        this.game.player.setPosition(launchX, launchY);
                        this.game.player.startBump(dir.dx, dir.dy); // Bump in the launch direction
                    }
                }
            }
        }
    }
}
