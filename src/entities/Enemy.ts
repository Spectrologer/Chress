import { BaseEnemy } from '@enemy/BaseEnemy';
import { EnemyMovementMixin } from '@enemy/EnemyMovement';
import { EnemyAttackMixin } from '@enemy/EnemyAttack';

export interface EnemyData {
    x: number;
    y: number;
    enemyType?: string;
    id?: string;
    health?: number;
    team?: 'player' | 'enemy';
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
    team?: 'player' | 'enemy';
}

export class Enemy extends BaseEnemy {
    // Index signature for dynamic property access
    [key: string]: any;

    // Tactical AI property (initialized by movement mixin)
    tacticalAI?: any;

    // Chess mode: Target move selected by TurnManager
    _chessTargetMove?: { x: number; y: number };

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
            lastY: this.lastY,
            team: this.team
        };
    }
}
