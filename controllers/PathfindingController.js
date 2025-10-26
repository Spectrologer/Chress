import { GRID_SIZE, TILE_TYPES, INPUT_CONSTANTS } from '../core/constants.js';
import { eventBus } from '../core/EventBus.js';
import { EventTypes } from '../core/EventTypes.js';
import { isWithinGrid } from '../utils/GridUtils.js';
import { Position } from '../core/Position.js';

/**
 * PathfindingController - Handles pathfinding and path execution
 *
 * Responsibilities:
 * - Find paths using BFS algorithm
 * - Execute paths with animation timing
 * - Cancel path execution
 * - Manage path completion callbacks
 * - Handle auto-use of transitions on path completion
 */
export class PathfindingController {
    constructor(game) {
        this.game = game;

        // Path execution state
        this.isExecutingPath = false;
        this.pathExecutionTimer = null;
        this.cancelPath = false;
        this.currentPathSequence = null;
        this.currentPathSequenceFallback = null;

        // Transition handling
        this.autoUseNextTransition = null;
        this.autoUseNextExitReach = false;
    }

    // ========================================
    // PATHFINDING
    // ========================================

    /**
     * Find a path from start to target using BFS
     * @returns {Array|null} Array of direction keys, or null if no path found
     */
    findPath(startX, startY, targetX, targetY) {
        const startPos = new Position(startX, startY);
        const targetPos = new Position(targetX, targetY);

        if (!targetPos.isInBounds(GRID_SIZE)) {
            return null;
        }

        const targetTile = targetPos.getTile(this.game.grid);
        if ((targetTile && typeof targetTile === 'object' && targetTile.type === TILE_TYPES.SIGN) ||
            targetTile === TILE_TYPES.SIGN) {
            return null;
        }

        // Enemy at target
        const enemyAtTarget = this.game.enemies?.find(e => e.getPositionObject().equals(targetPos) && e.health > 0);
        if (enemyAtTarget) {
            if (!(this.game.player.stats?.autoPathWithEnemies)) {
                return null;
            }
        } else {
            if (!this.game.player.isWalkable(targetX, targetY, this.game.grid, startX, startY)) {
                return null;
            }
        }

        if (startPos.equals(targetPos)) {
            return [];
        }

        // BFS
        const queue = [{ pos: startPos, path: [] }];
        const visited = new Set([startPos.toKey()]);
        const directions = [
            { dx: 0, dy: -1, key: 'arrowup' },
            { dx: 0, dy: 1, key: 'arrowdown' },
            { dx: -1, dy: 0, key: 'arrowleft' },
            { dx: 1, dy: 0, key: 'arrowright' }
        ];

        while (queue.length > 0) {
            const current = queue.shift();
            for (const dir of directions) {
                const newPos = current.pos.add(dir.dx, dir.dy);
                const key = newPos.toKey();

                if (visited.has(key)) continue;
                visited.add(key);

                if (isWithinGrid(newPos.x, newPos.y) &&
                    this.game.player.isWalkable(newPos.x, newPos.y, this.game.grid, current.pos.x, current.pos.y)) {
                    const newPath = [...current.path, dir.key];
                    if (newPos.equals(targetPos)) {
                        return newPath;
                    }
                    queue.push({ pos: newPos, path: newPath });
                }
            }
        }

        return null;
    }

    /**
     * Find the nearest walkable tile adjacent to the target
     */
    findNearestWalkableAdjacent(targetX, targetY) {
        const targetPos = new Position(targetX, targetY);
        const neighbors = targetPos.getNeighbors(false); // 4-way only

        for (const neighbor of neighbors) {
            if (isWithinGrid(neighbor.x, neighbor.y)) {
                if (this.game.player.isWalkable(neighbor.x, neighbor.y, this.game.grid, -1, -1)) {
                    return neighbor.toObject();
                }
            }
        }

        return null;
    }

    // ========================================
    // PATH EXECUTION
    // ========================================

    /**
     * Execute a path by simulating key presses
     */
    executePath(path) {
        if (this.isExecutingPath) {
            this.cancelPathExecution();
        }

        this.isExecutingPath = true;
        this.cancelPath = false;
        this.currentPathSequence = null;

        // Emit path started event
        eventBus.emit(EventTypes.INPUT_PATH_STARTED, { pathLength: path.length });

        // Final destination for feedback
        try {
            const pos = this.game.player.getPosition();
            let destX = pos.x, destY = pos.y;
            for (const stepKey of path) {
                switch ((stepKey || '').toLowerCase()) {
                    case 'arrowup': case 'w': destY--; break;
                    case 'arrowdown': case 's': destY++; break;
                    case 'arrowleft': case 'a': destX--; break;
                    case 'arrowright': case 'd': destX++; break;
                }
            }
            if (this.game?.renderManager?.startHoldFeedback) {
                this.game.renderManager.startHoldFeedback(destX, destY);
            }
        } catch (e) {}

        // Execute with animation
        if (this.game.player.stats?.verbosePathAnimations) {
            this._executePathWithScheduler(path);
        } else {
            this._executePathImmediate(path);
        }
    }

    _executePathWithScheduler(path) {
        const seq = this.game.animationScheduler.createSequence();
        this.currentPathSequence = seq;

        for (let i = 0; i < path.length; i++) {
            const stepKey = path[i];
            seq.then(() => {
                if (this.cancelPath) return;
                const ev = { key: stepKey, preventDefault: () => {}, _synthetic: true };
                this._triggerKeyPress(ev);
            }).wait(INPUT_CONSTANTS.LEGACY_PATH_DELAY);
        }

        seq.then(() => {
            if (this.cancelPath) {
                this.cancelPath = false;
                this.isExecutingPath = false;
                eventBus.emit(EventTypes.INPUT_PATH_COMPLETED, {});
                return;
            }
            this.isExecutingPath = false;
            this._handlePathCompletion();
            eventBus.emit(EventTypes.INPUT_PATH_COMPLETED, {});
        });

        const startResult = seq.start();
        const fallbackDelay = Math.max(50, path.length * INPUT_CONSTANTS.LEGACY_PATH_DELAY + 50);

        if (startResult && typeof startResult.then === 'function') {
            startResult.then(() => {
                if (this.currentPathSequence?.id === seq.id) {
                    this.currentPathSequence = null;
                }
                if (this.currentPathSequenceFallback) {
                    clearTimeout(this.currentPathSequenceFallback);
                    this.currentPathSequenceFallback = null;
                }
            }).catch(() => {
                if (this.currentPathSequence?.id === seq.id) {
                    this.currentPathSequence = null;
                }
                if (this.currentPathSequenceFallback) {
                    clearTimeout(this.currentPathSequenceFallback);
                    this.currentPathSequenceFallback = null;
                }
            });
        } else {
            this.currentPathSequenceFallback = setTimeout(() => {
                if (this.currentPathSequence?.id === seq.id) {
                    this.currentPathSequence = null;
                }
                this.currentPathSequenceFallback = null;
            }, fallbackDelay);
        }
    }

    _executePathImmediate(path) {
        const stepDelay = Math.max(40, INPUT_CONSTANTS.LEGACY_PATH_DELAY || 50);
        let stepIndex = 0;

        const runNextStep = () => {
            if (this.cancelPath || stepIndex >= path.length) {
                this.isExecutingPath = false;
                this._handlePathCompletion();
                eventBus.emit(EventTypes.INPUT_PATH_COMPLETED, {});
                return;
            }

            const ev = { key: path[stepIndex], preventDefault: () => {}, _synthetic: true };
            this._triggerKeyPress(ev);
            stepIndex++;

            // Next step
            if (stepIndex < path.length) {
                setTimeout(() => {
                    requestAnimationFrame(() => runNextStep());
                }, stepDelay);
            } else {
                // Complete
                setTimeout(() => {
                    this.isExecutingPath = false;
                    this._handlePathCompletion();
                    eventBus.emit(EventTypes.INPUT_PATH_COMPLETED, {});
                }, stepDelay);
            }
        };

        this.isExecutingPath = true;
        this.cancelPath = false;
        runNextStep();  // First step immediately
    }

    /**
     * Trigger a key press event via the event bus
     */
    _triggerKeyPress(event) {
        // Emit event for InputController to handle
        eventBus.emit(EventTypes.INPUT_KEY_PRESS, event);
    }

    /**
     * Handle path completion (auto-use transitions, interact on reach)
     */
    _handlePathCompletion() {
        try {
            if (this.game?.renderManager?.clearFeedback) {
                this.game.renderManager.clearFeedback();
            }
        } catch (e) {}

        const playerPos = this.game.player.getPosition();

        try {
            const landedTile = this.game.grid[playerPos.y]?.[playerPos.x];
            const landedTileType = (typeof landedTile === 'object' && landedTile?.type !== undefined)
                ? landedTile.type
                : landedTile;

            if (landedTileType === TILE_TYPES.EXIT) {
                if (this.autoUseNextExitReach || this.autoUseNextTransition === 'exit') {
                    // Emit exit reached event
                    eventBus.emit(EventTypes.INPUT_EXIT_REACHED, { x: playerPos.x, y: playerPos.y });
                    this.autoUseNextExitReach = false;
                    this.autoUseNextTransition = null;
                }
            }

            if (landedTileType === TILE_TYPES.PORT) {
                if (this.autoUseNextTransition === 'port') {
                    try {
                        this.game.interactionManager.zoneManager.handlePortTransition();
                    } catch (e) {}
                    this.autoUseNextTransition = null;
                }
            }
        } catch (e) {}

        // Interact on reach
        if (this.game.player.interactOnReach) {
            const target = this.game.player.interactOnReach;
            this.game.player.clearInteractOnReach();
            this.game.interactionManager.triggerInteractAt(target);
        }
    }

    /**
     * Cancel the current path execution
     */
    cancelPathExecution() {
        this.cancelPath = true;
        this.isExecutingPath = false;

        // Emit path cancelled event
        eventBus.emit(EventTypes.INPUT_PATH_CANCELLED, {});

        try {
            if (this.game?.renderManager?.clearFeedback) {
                this.game.renderManager.clearFeedback();
            }
        } catch (e) {}

        if (this.currentPathSequence) {
            try {
                this.game.animationScheduler.cancelSequence(this.currentPathSequence.id);
            } catch (e) {}
            this.currentPathSequence = null;
        }

        if (this.currentPathSequenceFallback) {
            clearTimeout(this.currentPathSequenceFallback);
            this.currentPathSequenceFallback = null;
        }
    }

}
