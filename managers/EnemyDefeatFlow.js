import { createZoneKey } from '../utils/ZoneKeyUtils.js';
import audioManager from '../utils/AudioManager.js';
import { eventBus } from '../core/EventBus.js';
import { EventTypes } from '../core/EventTypes.js';

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
    constructor(game) {
        this.game = game;
    }

    /**
     * Adds a point animation at the specified location
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} amount - Amount of points to display
     */
    addPointAnimation(x, y, amount) {
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
     * @param {number} x - X coordinate for animation
     * @param {number} y - Y coordinate for animation
     * @param {number} points - Points to award
     */
    awardPoints(x, y, points) {
        this.addPointAnimation(x, y, points);
        this.game.player.addPoints(points);
    }

    /**
     * Plays attack sound if not suppressed by the enemy
     * @param {Object} enemy - The enemy entity
     */
    playAttackSound(enemy) {
        if (!enemy._suppressAttackSound) {
            audioManager.playSound('attack', { game: this.game });
        }
    }

    /**
     * Marks enemy as defeated in the global defeated enemies set
     * @param {Object} enemy - The enemy entity
     */
    markAsDefeated(enemy) {
        this.game.defeatedEnemies.add(`${enemy.id}`);
    }

    /**
     * Checks if an enemy has already been defeated
     * @param {Object} enemy - The enemy entity
     * @returns {boolean} True if already defeated
     */
    isAlreadyDefeated(enemy) {
        return this.game.defeatedEnemies.has(`${enemy.id}`);
    }

    /**
     * Removes enemy from zone data to prevent respawn
     * @param {Object} enemy - The enemy entity
     * @param {Object} currentZone - Current zone information
     */
    removeFromZoneData(enemy, currentZone) {
        const depth = currentZone.depth || (this.game.player.undergroundDepth || 1);
        const zoneKey = createZoneKey(currentZone.x, currentZone.y, currentZone.dimension, depth);

        if (this.game.zones.has(zoneKey)) {
            const zoneData = this.game.zones.get(zoneKey);
            zoneData.enemies = zoneData.enemies.filter(data => data.id !== enemy.id);
            this.game.zones.set(zoneKey, zoneData);
        }
    }

    /**
     * Handles combo kill logic for consecutive player kills
     * @param {Object} enemy - The enemy entity
     * @param {number} enemyX - Enemy X coordinate
     * @param {number} enemyY - Enemy Y coordinate
     * @param {string} initiator - Who initiated the kill ('player', 'bomb', etc.)
     * @returns {number} Current consecutive kill count
     */
    handleComboKills(enemy, enemyX, enemyY, initiator) {
        if (initiator !== 'player' || !this.game.player) {
            // Non-player kills reset the streak
            if (this.game.player) {
                this.game.player.consecutiveKills = 0;
                this.game.player.lastActionResult = null;
            }
            return 0;
        }

        try {
            const player = this.game.player;

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
     * @private
     * @param {number} comboCount - Current combo count
     * @param {number} x - X coordinate for animation
     * @param {number} y - Y coordinate for animation
     */
    _handleComboBonus(comboCount, x, y) {
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

            if (this.game.player && typeof this.game.player.addPoints === 'function') {
                this.game.player.addPoints(bonus);
            }

            // Persist highest combo to localStorage
            this._saveComboRecord(comboCount);
        } catch (e) {
            // Non-fatal, continue
        }
    }

    /**
     * Saves combo record to localStorage if it exceeds previous record
     * @private
     * @param {number} comboCount - Current combo count
     */
    _saveComboRecord(comboCount) {
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
     * @param {Object} enemy - The enemy entity
     * @param {number} x - Enemy X coordinate
     * @param {number} y - Enemy Y coordinate
     * @param {number} consecutiveKills - Current combo count
     */
    emitDefeatEvent(enemy, x, y, consecutiveKills) {
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
     * @param {Object} enemy - The enemy entity
     * @param {Object} currentZone - Current zone information
     * @param {string} initiator - Who initiated the kill ('player', 'bomb', etc.)
     * @returns {Object} { defeated: boolean, consecutiveKills: number }
     */
    executeDefeat(enemy, currentZone, initiator = null) {
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

        // Handle combo kills
        const consecutiveKills = this.handleComboKills(enemy, enemyX, enemyY, initiator);

        // Emit defeat event
        this.emitDefeatEvent(enemy, enemyX, enemyY, consecutiveKills);

        return { defeated: true, consecutiveKills };
    }
}
