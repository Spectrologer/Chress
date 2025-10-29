import { BaseEnemy } from '../enemy/BaseEnemy.js';
import { EnemyMovementMixin } from '../enemy/EnemyMovement.js';
import { EnemyAttackMixin } from '../enemy/EnemyAttack.js';

export class Enemy extends BaseEnemy {
    constructor(data) {
        super(data);
        // Apply mixins
        Object.assign(this, EnemyMovementMixin);
        Object.assign(this, EnemyAttackMixin);
    }
}
