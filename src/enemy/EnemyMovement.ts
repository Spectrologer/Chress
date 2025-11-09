import { GRID_SIZE } from '@core/constants/index';
import { EnemyPathfinding } from './EnemyPathfinding';
import { EnemyChargeBehaviors } from './EnemyChargeBehaviors';
import { EnemyLineOfSight } from './EnemyLineOfSight';
import { EnemySpecialActions } from './EnemySpecialActions';
import { EnemyMoveCalculatorFactory } from './MoveCalculators';
import { TacticalAI } from './TacticalAI';
import type { Enemy, Player, Position, Grid, Game } from './MoveCalculators/base';

export const EnemyMovementMixin = {
    // Initialize tactical AI system
    initMovementSystem(this: any): void {
        if (!this.tacticalAI) {
            this.tacticalAI = new TacticalAI();
        }
    },

    planMoveTowards(this: any, player: Player, grid: Grid, enemies: Enemy[], playerPos: Position, isSimulation = false, game: Game | null = null): Position {
        // Ensure tactical AI is initialized
        this.initMovementSystem();

        // Get appropriate move calculator for this enemy type
        const calculator = EnemyMoveCalculatorFactory.getCalculator(this.enemyType);

        // Set tactical AI reference in calculator
        calculator.tacticalAI = this.tacticalAI;

        // Delegate move calculation to the specific calculator
        return calculator.calculateMove(this, player, playerPos, grid, enemies, isSimulation, game);
    }
};
