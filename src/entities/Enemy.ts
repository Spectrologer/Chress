import { BaseEnemy } from '@enemy/BaseEnemy';
import { EnemyMovementMixin } from '@enemy/EnemyMovement';
import { EnemyAttackMixin } from '@enemy/EnemyAttack';

export interface EnemyData {
    x: number;
    y: number;
    enemyType?: string;
    id?: string;
    health?: number;
}

export interface SerializedEnemy {
    x: number;
    y: number;
    enemyType: string;
    id: string;
    health: number;
    attack: number;
    lastX: number;
    lastY: number;
}

export class Enemy extends BaseEnemy {
    // Index signature for dynamic property access
    [key: string]: any;

    // Tactical AI property (initialized by movement mixin)
    tacticalAI?: any;

    constructor(data: EnemyData) {
        super(data);
        Object.assign(this, EnemyMovementMixin);
        Object.assign(this, EnemyAttackMixin);
    }

    /**
     * Serialize enemy state for saving
     */
    serialize(): SerializedEnemy {
        return {
            x: this.x,
            y: this.y,
            enemyType: this.enemyType,
            id: this.id,
            health: this.health,
            attack: this.attack,
            lastX: this.lastX,
            lastY: this.lastY
        };
    }
}
