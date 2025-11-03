import { BaseEnemy } from '../enemy/BaseEnemy.js';
import { EnemyMovementMixin } from '../enemy/EnemyMovement.js';
import { EnemyAttackMixin } from '../enemy/EnemyAttack.js';

export interface EnemyData {
    x: number;
    y: number;
    enemyType?: string;
    id?: string;
    health?: number;
}

export class Enemy extends BaseEnemy {
    constructor(data: EnemyData) {
        super(data);
        Object.assign(this, EnemyMovementMixin);
        Object.assign(this, EnemyAttackMixin);
    }
}
