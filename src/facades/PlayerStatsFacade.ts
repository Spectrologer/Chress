// @ts-check
import { eventBus } from '@core/EventBus';
import { EventTypes } from '@core/EventTypes';
import { logger } from '@core/logger';

/**
 * @typedef {Object} PlayerStats
 * @property {number} [health] - Health points
 * @property {number} [hunger] - Hunger level
 * @property {number} [thirst] - Thirst level
 * @property {number} [maxHealth] - Maximum health
 * @property {number} [points] - Player points
 * @property {number} [spentDiscoveries] - Spent discoveries count
 * @property {Function} [takeDamage] - Take damage function
 */

/**
 * @typedef {Object} InteractTarget
 * @property {number} x - Target X coordinate
 * @property {number} y - Target Y coordinate
 * @property {*} [data] - Additional interaction data
 */

/**
 * PlayerStatsFacade - Stats, animations, and interaction management for player
 *
 * Handles:
 * - Health, hunger, thirst stats
 * - Points and discoveries
 * - Animation states (bump, backflip, attack, explosions)
 * - Interaction states (interactOnReach)
 * - Consecutive kills tracking
 *
 * @example
 * const statsFacade = new PlayerStatsFacade(player);
 * statsFacade.takeDamage(10);
 * statsFacade.addPoints(100);
 */
export class PlayerStatsFacade {
    private player: any;

    /**
     * @param {any} player - The player entity
     */
    constructor(player: any) {
        if (!player) {
            throw new Error('PlayerStatsFacade requires a valid player instance');
        }
        this.player = player;
    }

    // ========================================
    // STATS OPERATIONS
    // ========================================

    /**
     * Get stats object (returns copy to prevent direct mutations)
     * @returns {PlayerStats} Copy of stats
     */
    getStats() {
        return this.player.stats ? { ...this.player.stats } : {};
    }

    /**
     * Get stats reference (use sparingly)
     * @returns {Object}
     * @deprecated Use getStats() for safer access
     */
    getStatsRef() {
        logger.warn('PlayerStatsFacade.getStatsRef: Direct stats reference requested.');
        return this.player.stats;
    }

    /**
     * Get health value
     * @returns {number}
     */
    getHealth() {
        return this.player.stats?.health ?? 0;
    }

    /**
     * Get hunger value
     * @returns {number}
     */
    getHunger() {
        return this.player.stats?.hunger ?? 0;
    }

    /**
     * Get thirst value
     * @returns {number}
     */
    getThirst() {
        return this.player.stats?.thirst ?? 0;
    }

    /**
     * Take damage (delegates to PlayerStats)
     * @param {number} amount - Damage amount
     */
    takeDamage(amount) {
        if (this.player.takeDamage) {
            this.player.takeDamage(amount);
        } else if (this.player.stats?.takeDamage) {
            this.player.stats.takeDamage(amount);
        }

        eventBus.emit(EventTypes.UI_UPDATE_STATS, {});
    }

    /**
     * Restore health
     * @param {number} amount - Health to restore
     */
    restoreHealth(amount) {
        if (this.player.restoreHealth) {
            this.player.restoreHealth(amount);
        }

        eventBus.emit(EventTypes.UI_UPDATE_STATS, {});
    }

    /**
     * Restore hunger
     * @param {number} amount - Hunger to restore
     */
    restoreHunger(amount) {
        if (this.player.restoreHunger) {
            this.player.restoreHunger(amount);
        }

        eventBus.emit(EventTypes.UI_UPDATE_STATS, {});
    }

    /**
     * Get points
     * @returns {number}
     */
    getPoints() {
        return this.player.getPoints?.() ?? this.player.points ?? 0;
    }

    /**
     * Add points with event emission
     * @param {number} points - Points to add
     */
    addPoints(points) {
        if (this.player.addPoints) {
            this.player.addPoints(points);
        } else {
            this.player.points = (this.player.points || 0) + points;
        }

        eventBus.emit(EventTypes.POINTS_CHANGED, {
            points: this.getPoints()
        });
        eventBus.emit(EventTypes.UI_UPDATE_STATS, {});
    }

    /**
     * Get spent discoveries
     * @returns {number}
     */
    getSpentDiscoveries() {
        return this.player.getSpentDiscoveries?.() ?? this.player.spentDiscoveries ?? 0;
    }

    /**
     * Set spent discoveries
     * @param {number} count - Number of spent discoveries
     */
    setSpentDiscoveries(count) {
        if (this.player.setSpentDiscoveries) {
            this.player.setSpentDiscoveries(count);
        } else {
            this.player.spentDiscoveries = count;
        }
    }

    /**
     * Update a specific stat property (for settings like musicEnabled)
     * @param {string} statName - Stat property name
     * @param {*} value - New value
     */
    updateStat(statName, value) {
        if (!this.player.stats) {
            this.player.stats = {};
        }

        this.player.stats[statName] = value;

        eventBus.emit(EventTypes.STATS_CHANGED, {
            stat: statName,
            value,
            stats: this.getStats()
        });
    }

    // ========================================
    // ANIMATION & VISUAL STATE
    // ========================================

    /**
     * Start bump animation
     * @param {number} dx - X direction
     * @param {number} dy - Y direction
     */
    startBump(dx, dy) {
        if (this.player.startBump) {
            this.player.startBump(dx, dy);
        }
    }

    /**
     * Start backflip animation
     */
    startBackflip() {
        if (this.player.startBackflip) {
            this.player.startBackflip();
        }
    }

    /**
     * Start attack animation
     */
    startAttackAnimation() {
        if (this.player.startAttackAnimation) {
            this.player.startAttackAnimation();
        }
    }

    /**
     * Start explosion animation
     * @param {number} x - Explosion X
     * @param {number} y - Explosion Y
     */
    startSplodeAnimation(x, y) {
        if (this.player.startSplodeAnimation) {
            this.player.startSplodeAnimation(x, y);
        }
    }

    /**
     * Start smoke animation
     * @param {number} x - Smoke X
     * @param {number} y - Smoke Y
     */
    startSmokeAnimation(x, y) {
        if (this.player.startSmokeAnimation) {
            this.player.startSmokeAnimation(x, y);
        }
    }

    /**
     * Set player action state
     * @param {string} action - Action type
     */
    setAction(action) {
        if (this.player.setAction) {
            this.player.setAction(action);
        }
    }

    /**
     * Get consecutive kills count
     * @returns {number}
     */
    getConsecutiveKills() {
        return this.player.consecutiveKills ?? 0;
    }

    /**
     * Set consecutive kills count
     * @param {number} count - Kill count
     */
    setConsecutiveKills(count) {
        this.player.consecutiveKills = count;
    }

    // ========================================
    // INTERACTION STATE
    // ========================================

    /**
     * Get interact on reach target
     * @returns {InteractTarget|null}
     */
    getInteractOnReach() {
        return this.player.interactOnReach;
    }

    /**
     * Set interact on reach target
     * @param {InteractTarget|null} target - Target coordinates
     */
    setInteractOnReach(target) {
        this.player.interactOnReach = target;
    }

    /**
     * Clear interact on reach
     */
    clearInteractOnReach() {
        if (this.player.clearInteractOnReach) {
            this.player.clearInteractOnReach();
        } else {
            this.player.interactOnReach = null;
        }
    }

    // ========================================
    // RAW ACCESS (Use sparingly)
    // ========================================

    /**
     * Get raw player reference (use only when absolutely necessary)
     * @returns {Object} The underlying player object
     * @deprecated Prefer using facade methods
     */
    getRawPlayer() {
        logger.warn('PlayerStatsFacade.getRawPlayer: Direct player access requested. This bypasses encapsulation.');
        return this.player;
    }
}

export default PlayerStatsFacade;
