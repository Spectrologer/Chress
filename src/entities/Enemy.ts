import { BaseEnemy } from '../enemy/BaseEnemy';
import { EnemyMovementMixin } from '../enemy/EnemyMovement';
import { EnemyAttackMixin } from '../enemy/EnemyAttack';

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
