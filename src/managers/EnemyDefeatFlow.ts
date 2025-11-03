import { createZoneKey } from '../utils/ZoneKeyUtils.js';
import audioManager from '../utils/AudioManager.js';
import { eventBus } from '../core/EventBus.ts';
import { EventTypes } from '../core/EventTypes.ts';
import type { Game } from '../core/Game.js';

interface Enemy {
    x: number;
    y: number;
    id: string;
    health: number;
    enemyType: string;
    _suppressAttackSound?: boolean;
    getPoints: () => number;
    takeDamage: (amount: number) => void;
    [key: string]: any;
}

interface ZoneInfo {
    x: number;
    y: number;
    dimension: number;
    depth?: number;
}

interface DefeatResult {
    defeated: boolean;
    consecutiveKills: number;
}

/**
 * EnemyDefeatFlow encapsulates all logic related to defeating enemies:
 * - Point animations
 * - Sound effects
 * - Adding points to player
 * - Marking enemy as defeated
 * - Removing from zone data
 * - Handling combo streaks
 */
export class EnemyDefeatFlow {
    private game: Game;

    constructor(game: Game) {
        this.game = game;
    }

    /**
     * Adds a point animation at the specified location
     */
    public addPointAnimation(x: number, y: number, amount: number): void {
        eventBus.emit(EventTypes.ANIMATION_REQUESTED, {
            type: 'point',
            x,
            y,
            data: { amount }
        });
        audioManager.playSound('point', { game: this.game });
    }

    /**
     * Awards points to the player with animation
     */
    public awardPoints(x: number, y: number, points: number): void {
        this.addPointAnimation(x, y, points);
        (this.game.player as any).addPoints(points);
    }

    /**
     * Plays attack sound if not suppressed by the enemy
     */
    public playAttackSound(enemy: Enemy): void {
        if (!enemy._suppressAttackSound) {
            audioManager.playSound('attack', { game: this.game });
        }
    }

    /**
     * Marks enemy as defeated in the global defeated enemies set
     */
    public markAsDefeated(enemy: Enemy): void {
        (this.game as any).defeatedEnemies.add(`${enemy.id}`);
    }

    /**
     * Checks if an enemy has already been defeated
     */
    public isAlreadyDefeated(enemy: Enemy): boolean {
        return (this.game as any).defeatedEnemies.has(`${enemy.id}`);
    }

    /**
     * Removes enemy from zone data to prevent respawn
     */
    public removeFromZoneData(enemy: Enemy, currentZone: ZoneInfo): void {
        const depth = currentZone.depth || ((this.game.player as any).undergroundDepth || 1);
        const zoneKey = createZoneKey(currentZone.x, currentZone.y, currentZone.dimension, depth);

        if (this.game.zoneRepository.hasByKey(zoneKey)) {
            const zoneData: any = this.game.zoneRepository.getByKey(zoneKey);
            zoneData.enemies = zoneData.enemies.filter((data: any) => data.id !== enemy.id);
            this.game.zoneRepository.setByKey(zoneKey, zoneData);
        }
    }

    /**
     * Handles combo kill logic for consecutive player kills
     */
    public handleComboKills(enemy: Enemy, enemyX: number, enemyY: number, initiator: string | null): number {
        if (initiator !== 'player' || !this.game.player) {
            // Non-player kills reset the streak
            if (this.game.player) {
                (this.game.player as any).consecutiveKills = 0;
                (this.game.player as any).lastActionResult = null;
            }
            return 0;
        }

        try {
            const player = this.game.player as any;

            // Only increment consecutive kills when previous action was an attack that resulted in a kill
            if (player.lastActionType === 'attack' && player.lastActionResult === 'kill') {
                player.consecutiveKills = (player.consecutiveKills || 0) + 1;
            } else {
                // Start a new streak - this kill counts as 1
                player.consecutiveKills = 1;
            }

            player.lastActionResult = 'kill';
            const consecutive = player.consecutiveKills;

            // If combo of 2 or more, show multiplier animation and award bonus points
            if (consecutive >= 2) {
                this._handleComboBonus(consecutive, enemyX, enemyY);
            }

            return consecutive;
        } catch (e) {
            return 0;
        }
    }

    /**
     * Handles combo bonus points and animations
     */
    private _handleComboBonus(comboCount: number, x: number, y: number): void {
        try {
            // Emit combo achieved event
            eventBus.emit(EventTypes.COMBO_ACHIEVED, {
                comboCount,
                x,
                y,
                bonusPoints: comboCount
            });

            // Play sound
            audioManager.playSound('point', { game: this.game });

            // Award bonus points equal to combo multiplier
            const bonus = comboCount;
            this.addPointAnimation(x, y, bonus);

            const player = this.game.player as any;
            if (player && typeof player.addPoints === 'function') {
                player.addPoints(bonus);
            }

            // Persist highest combo to localStorage
            this._saveComboRecord(comboCount);
        } catch (e) {
            // Non-fatal, continue
        }
    }

    /**
     * Saves combo record to localStorage if it exceeds previous record
     */
    private _saveComboRecord(comboCount: number): void {
        try {
            const prevCombo = parseInt(localStorage.getItem('chress:record:combo') || '0', 10) || 0;
            if (comboCount > prevCombo) {
                localStorage.setItem('chress:record:combo', String(comboCount));
            }
        } catch (e) {
            // Non-fatal
        }
    }

    /**
     * Emits an event notifying that an enemy was defeated
     */
    public emitDefeatEvent(enemy: Enemy, x: number, y: number, consecutiveKills: number): void {
        eventBus.emit(EventTypes.ENEMY_DEFEATED, {
            enemy,
            points: enemy.getPoints(),
            x,
            y,
            isComboKill: consecutiveKills >= 2
        });
    }

    /**
     * Main method to execute the complete enemy defeat flow
     */
    public executeDefeat(enemy: Enemy, currentZone: ZoneInfo, initiator: string | null = null): DefeatResult {
        // Check if already defeated to prevent double defeat/points
        if (this.isAlreadyDefeated(enemy)) {
            return { defeated: false, consecutiveKills: 0 };
        }

        // Ensure enemy is dead
        if (enemy.health > 0) {
            enemy.takeDamage(999);
        }

        // Ensure enemy has valid coordinates
        const enemyX = Number.isFinite(enemy.x) ? enemy.x : 0;
        const enemyY = Number.isFinite(enemy.y) ? enemy.y : 0;

        // Award points with animation
        this.awardPoints(enemyX, enemyY, enemy.getPoints());

        // Mark as defeated
        this.markAsDefeated(enemy);

        // Play attack sound
        this.playAttackSound(enemy);

        // Remove from zone data
        this.removeFromZoneData(enemy, currentZone);

        // Remove from active enemy collection and clear grid tile
        // This prevents the defeated enemy from blocking player movement
        const enemyCollection = this.game.enemyCollection;
        if (enemyCollection && typeof enemyCollection.remove === 'function') {
            enemyCollection.remove(enemy, true);
        }

        // Handle combo kills
        const consecutiveKills = this.handleComboKills(enemy, enemyX, enemyY, initiator);

        // Emit defeat event
        this.emitDefeatEvent(enemy, enemyX, enemyY, consecutiveKills);

        return { defeated: true, consecutiveKills };
    }
}
