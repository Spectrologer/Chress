// @ts-check
import { BaseEnemy } from '../enemy/BaseEnemy.js';
import { EnemyMovementMixin } from '../enemy/EnemyMovement.js';
import { EnemyAttackMixin } from '../enemy/EnemyAttack.js';

/**
 * @typedef {Object} EnemyData
 * @property {number} x - X coordinate
 * @property {number} y - Y coordinate
 * @property {string} [enemyType] - Enemy type (lizard, lizardy, lizardo, etc.)
 * @property {string} [id] - Unique identifier
 * @property {number} [health] - Health points
 */

/**
 * Enemy entity class with movement and attack capabilities
 * Extends BaseEnemy and applies movement/attack mixins
 */
export class Enemy extends BaseEnemy {
    /**
     * Creates a new Enemy instance
     * @param {EnemyData} data - Enemy initialization data
     */
    constructor(data) {
        super(data);
        // Apply mixins
        Object.assign(this, EnemyMovementMixin);
        Object.assign(this, EnemyAttackMixin);
    }
}
