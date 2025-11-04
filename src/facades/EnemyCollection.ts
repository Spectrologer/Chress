import { eventBus } from '../core/EventBus';
import { EventTypes } from '../core/EventTypes';
import { TILE_TYPES } from '../core/constants/index';

/**
 * EnemyCollection
 *
 * Facade for managing the enemy array with controlled access and event emission.
 * Centralizes all enemy collection operations to improve encapsulation and testability.
 *
 * Benefits:
 * - Single source of truth for enemy collection operations
 * - Automatic event emission for enemy changes
 * - Defensive copying prevents external mutations
 * - Clear API for common enemy queries
 * - Easier to test and mock
 *
 * Usage:
 *   const enemyCollection = new EnemyCollection(game.enemies, game);
 *   const enemy = enemyCollection.findAt(x, y);
 *   enemyCollection.remove(enemy);
 *   const all = enemyCollection.getAll(); // Returns defensive copy
 */
export class EnemyCollection {
    private _enemies: any[];
    private _game: any;

    /**
     * @param {Array} enemiesArray - Reference to the game's enemies array
     * @param {Object} game - Reference to game instance for grid cleanup
     */
    constructor(enemiesArray = [], game = null) {
        this._enemies = enemiesArray;
        this._game = game;
    }

    /**
     * Get all enemies (defensive copy)
     * @returns {Array} Copy of enemies array
     */
    getAll() {
        return [...this._enemies];
    }

    /**
     * Get count of enemies
     * @returns {number}
     */
    count() {
        return this._enemies.length;
    }

    /**
     * Check if collection is empty
     * @returns {boolean}
     */
    isEmpty() {
        return this._enemies.length === 0;
    }

    /**
     * Find enemy at specific coordinates
     * @param {number} x
     * @param {number} y
     * @param {boolean} aliveOnly - Only return living enemies (health > 0)
     * @returns {Object|null} Enemy at coordinates or null
     */
    findAt(x, y, aliveOnly = false) {
        return this._enemies.find(e =>
            e.x === x &&
            e.y === y &&
            (!aliveOnly || e.health > 0)
        ) || null;
    }

    /**
     * Find all enemies matching a predicate
     * @param {Function} predicate - Function(enemy) => boolean
     * @returns {Array} Array of matching enemies
     */
    findAll(predicate) {
        return this._enemies.filter(predicate);
    }

    /**
     * Check if any enemy matches predicate
     * @param {Function} predicate - Function(enemy) => boolean
     * @returns {boolean}
     */
    some(predicate) {
        return this._enemies.some(predicate);
    }

    /**
     * Check if enemy exists in collection
     * @param {Object} enemy
     * @returns {boolean}
     */
    includes(enemy) {
        return this._enemies.includes(enemy);
    }

    /**
     * Check if there's an enemy at coordinates
     * @param {number} x
     * @param {number} y
     * @param {boolean} aliveOnly - Only check for living enemies
     * @returns {boolean}
     */
    hasEnemyAt(x, y, aliveOnly = false) {
        return this.findAt(x, y, aliveOnly) !== null;
    }

    /**
     * Add enemy to collection
     * @param {Object} enemy
     * @param {boolean} emitEvent - Whether to emit ENEMY_SPAWNED event
     */
    add(enemy, emitEvent = true) {
        if (!enemy) {
            console.warn('EnemyCollection: Cannot add null/undefined enemy');
            return;
        }

        this._enemies.push(enemy);

        if (emitEvent) {
            eventBus.emit(EventTypes.ENEMY_SPAWNED, {
                enemy: enemy,
                x: enemy.x,
                y: enemy.y,
                type: enemy.enemyType
            });
        }
    }

    /**
     * Remove enemy from collection
     * @param {Object} enemy
     * @param {boolean} emitEvent - Whether to emit ENEMY_REMOVED event
     * @returns {boolean} True if enemy was removed
     */
    remove(enemy, emitEvent = true) {
        const index = this._enemies.indexOf(enemy);
        if (index === -1) {
            return false;
        }

        // Store enemy position before removal for grid cleanup
        const enemyX = enemy.x;
        const enemyY = enemy.y;

        this._enemies.splice(index, 1);

        // Clear the grid tile where the enemy was standing to prevent blocking
        // This ensures exit tiles and floor tiles are restored properly after enemy removal
        if (this._game?.gridManager && typeof enemyX === 'number' && typeof enemyY === 'number') {
            try {
                const gridSize = this._game.gridManager.getSize();
                const isBorder = enemyX === 0 || enemyX === gridSize - 1 ||
                               enemyY === 0 || enemyY === gridSize - 1;

                const replacementTile = isBorder ? TILE_TYPES.EXIT : TILE_TYPES.FLOOR;
                this._game.gridManager.setTile(enemyX, enemyY, replacementTile);
            } catch (e) {
                // Non-fatal: grid cleanup failed, but enemy is removed from collection
                console.warn('Failed to clear grid tile after enemy removal:', e);
            }
        }

        if (emitEvent) {
            eventBus.emit(EventTypes.ENEMY_REMOVED, {
                enemy: enemy,
                x: enemyX,
                y: enemyY
            });
        }

        return true;
    }

    /**
     * Remove enemy by ID
     * @param {string|number} id
     * @param {boolean} emitEvent - Whether to emit ENEMY_REMOVED event
     * @returns {boolean} True if enemy was removed
     */
    removeById(id, emitEvent = true) {
        const enemy = this._enemies.find(e => e.id === id);
        if (!enemy) {
            return false;
        }
        return this.remove(enemy, emitEvent);
    }

    /**
     * Remove all enemies matching predicate
     * @param {Function} predicate - Function(enemy) => boolean
     * @param {boolean} emitEvent - Whether to emit events for each removal
     * @returns {number} Number of enemies removed
     */
    removeWhere(predicate, emitEvent = true) {
        const toRemove = this._enemies.filter(predicate);
        let removed = 0;

        for (const enemy of toRemove) {
            if (this.remove(enemy, emitEvent)) {
                removed++;
            }
        }

        return removed;
    }

    /**
     * Clear all enemies
     * @param {boolean} emitEvent - Whether to emit ENEMIES_CLEARED event
     */
    clear(emitEvent = true) {
        const count = this._enemies.length;
        this._enemies.length = 0;

        if (emitEvent && count > 0) {
            eventBus.emit(EventTypes.ENEMIES_CLEARED, { count });
        }
    }

    /**
     * Replace entire enemy array
     * @param {Array} newEnemies
     * @param {boolean} emitEvent - Whether to emit ENEMIES_REPLACED event
     */
    replaceAll(newEnemies, emitEvent = true) {
        const oldCount = this._enemies.length;
        this._enemies.length = 0;
        this._enemies.push(...newEnemies);

        if (emitEvent) {
            eventBus.emit(EventTypes.ENEMIES_REPLACED, {
                oldCount,
                newCount: newEnemies.length
            });
        }
    }

    /**
     * Filter enemies and replace collection
     * @param {Function} predicate - Function(enemy) => boolean to keep
     * @param {boolean} emitEvent - Whether to emit event
     * @returns {number} Number of enemies kept
     */
    filter(predicate, emitEvent = true) {
        const kept = this._enemies.filter(predicate);
        const removed = this._enemies.length - kept.length;

        this.replaceAll(kept, emitEvent);

        return kept.length;
    }

    /**
     * Iterate over all enemies
     * @param {Function} callback - Function(enemy, index) => void
     */
    forEach(callback) {
        this._enemies.forEach(callback);
    }

    /**
     * Map enemies to new array
     * @param {Function} callback - Function(enemy, index) => value
     * @returns {Array}
     */
    map(callback) {
        return this._enemies.map(callback);
    }

    /**
     * Get enemy positions as Set of "x,y" strings
     * @param {boolean} aliveOnly - Only include living enemies
     * @returns {Set<string>}
     */
    getPositionsSet(aliveOnly = false): Set<string> {
        const positions = new Set<string>();
        for (const enemy of this._enemies) {
            if (!aliveOnly || enemy.health > 0) {
                positions.add(`${enemy.x},${enemy.y}`);
            }
        }
        return positions;
    }

    /**
     * Get living enemies only
     * @returns {Array}
     */
    getLiving() {
        return this._enemies.filter(e => e.health > 0);
    }

    /**
     * Get dead enemies only
     * @returns {Array}
     */
    getDead() {
        return this._enemies.filter(e => e.health <= 0);
    }

    /**
     * Remove all dead enemies
     * @param {boolean} emitEvent - Whether to emit events
     * @returns {number} Number of dead enemies removed
     */
    removeDead(emitEvent = true) {
        return this.removeWhere(e => e.health <= 0, emitEvent);
    }

    /**
     * Get snapshot for debugging
     * @returns {Object}
     */
    getSnapshot() {
        return {
            count: this._enemies.length,
            living: this.getLiving().length,
            dead: this.getDead().length,
            positions: Array.from(this.getPositionsSet()),
            types: this._enemies.reduce((acc, e) => {
                acc[e.enemyType] = (acc[e.enemyType] || 0) + 1;
                return acc;
            }, {})
        };
    }

    /**
     * Debug log current state
     */
    debugLog() {
        console.log('EnemyCollection State:', this.getSnapshot());
    }
}
