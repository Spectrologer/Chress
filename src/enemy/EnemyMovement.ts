import { GRID_SIZE } from '@core/constants/index';
import { EnemyPathfinding } from './EnemyPathfinding';
import { EnemyChargeBehaviors } from './EnemyChargeBehaviors';
import { EnemyLineOfSight } from './EnemyLineOfSight';
import { EnemySpecialActions } from './EnemySpecialActions';
import { EnemyMoveCalculatorFactory } from './MoveCalculators';
import { TacticalAI } from './TacticalAI';

export const EnemyMovementMixin = {
    // Initialize tactical AI system
    initMovementSystem() {
        if (!this.tacticalAI) {
            this.tacticalAI = new TacticalAI();
        }
    },

    planMoveTowards(player, grid, enemies, playerPos, isSimulation = false, game = null) {
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
