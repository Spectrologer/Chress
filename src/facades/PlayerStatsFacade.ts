import { eventBus } from '@core/EventBus';
import { EventTypes } from '@core/EventTypes';
import { logger } from '@core/logger';

/**
 * Player stats interface
 */
export interface PlayerStats {
    /** Health points */
    health?: number;
    /** Hunger level */
    hunger?: number;
    /** Thirst level */
    thirst?: number;
    /** Maximum health */
    maxHealth?: number;
    /** Player points */
    points?: number;
    /** Spent discoveries count */
    spentDiscoveries?: number;
    /** Take damage function */
    takeDamage?: (amount: number) => void;
}

/**
 * Interaction target interface
 */
export interface InteractTarget {
    /** Target X coordinate */
    x: number;
    /** Target Y coordinate */
    y: number;
    /** Additional interaction data */
    data?: unknown;
}

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
     */
    getStats(): PlayerStats {
        return this.player.stats ? { ...this.player.stats } : {};
    }

    /**
     * Get stats reference (use sparingly)
     * @deprecated Use getStats() for safer access
     */
    getStatsRef(): PlayerStats | undefined {
        logger.warn('PlayerStatsFacade.getStatsRef: Direct stats reference requested.');
        return this.player.stats;
    }

    /**
     * Get health value
     */
    getHealth(): number {
        return this.player.stats?.health ?? 0;
    }

    /**
     * Get hunger value
     */
    getHunger(): number {
        return this.player.stats?.hunger ?? 0;
    }

    /**
     * Get thirst value
     */
    getThirst(): number {
        return this.player.stats?.thirst ?? 0;
    }

    /**
     * Take damage (delegates to PlayerStats)
     */
    takeDamage(amount: number): void {
        if (this.player.takeDamage) {
            this.player.takeDamage(amount);
        } else if (this.player.stats?.takeDamage) {
            this.player.stats.takeDamage(amount);
        }

        eventBus.emit(EventTypes.UI_UPDATE_STATS, {});
    }

    /**
     * Restore health
     */
    restoreHealth(amount: number): void {
        if (this.player.restoreHealth) {
            this.player.restoreHealth(amount);
        }

        eventBus.emit(EventTypes.UI_UPDATE_STATS, {});
    }

    /**
     * Restore hunger
     */
    restoreHunger(amount: number): void {
        if (this.player.restoreHunger) {
            this.player.restoreHunger(amount);
        }

        eventBus.emit(EventTypes.UI_UPDATE_STATS, {});
    }

    /**
     * Get points
     */
    getPoints(): number {
        return this.player.getPoints?.() ?? this.player.points ?? 0;
    }

    /**
     * Add points with event emission
     */
    addPoints(points: number): void {
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
     */
    getSpentDiscoveries(): number {
        return this.player.getSpentDiscoveries?.() ?? this.player.spentDiscoveries ?? 0;
    }

    /**
     * Set spent discoveries
     */
    setSpentDiscoveries(count: number): void {
        if (this.player.setSpentDiscoveries) {
            this.player.setSpentDiscoveries(count);
        } else {
            this.player.spentDiscoveries = count;
        }
    }

    /**
     * Update a specific stat property (for settings like musicEnabled)
     */
    updateStat(statName: string, value: unknown): void {
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
     */
    startBump(dx: number, dy: number): void {
        if (this.player.startBump) {
            this.player.startBump(dx, dy);
        }
    }

    /**
     * Start backflip animation
     */
    startBackflip(): void {
        if (this.player.startBackflip) {
            this.player.startBackflip();
        }
    }

    /**
     * Start attack animation
     */
    startAttackAnimation(): void {
        if (this.player.startAttackAnimation) {
            this.player.startAttackAnimation();
        }
    }

    /**
     * Start explosion animation
     */
    startSplodeAnimation(x: number, y: number): void {
        if (this.player.startSplodeAnimation) {
            this.player.startSplodeAnimation(x, y);
        }
    }

    /**
     * Start smoke animation
     */
    startSmokeAnimation(x: number, y: number): void {
        if (this.player.startSmokeAnimation) {
            this.player.startSmokeAnimation(x, y);
        }
    }

    /**
     * Set player action state
     */
    setAction(action: string): void {
        if (this.player.setAction) {
            this.player.setAction(action);
        }
    }

    /**
     * Get consecutive kills count
     */
    getConsecutiveKills(): number {
        return this.player.consecutiveKills ?? 0;
    }

    /**
     * Set consecutive kills count
     */
    setConsecutiveKills(count: number): void {
        this.player.consecutiveKills = count;
    }

    // ========================================
    // INTERACTION STATE
    // ========================================

    /**
     * Get interact on reach target
     */
    getInteractOnReach(): InteractTarget | null {
        return this.player.interactOnReach;
    }

    /**
     * Set interact on reach target
     */
    setInteractOnReach(target: InteractTarget | null): void {
        this.player.interactOnReach = target;
    }

    /**
     * Clear interact on reach
     */
    clearInteractOnReach(): void {
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
     * @deprecated Prefer using facade methods
     */
    getRawPlayer(): any {
        logger.warn('PlayerStatsFacade.getRawPlayer: Direct player access requested. This bypasses encapsulation.');
        return this.player;
    }
}

export default PlayerStatsFacade;
