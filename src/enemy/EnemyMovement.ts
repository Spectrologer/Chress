import { GRID_SIZE } from '../core/constants/index.ts';
import { EnemyPathfinding } from './EnemyPathfinding.js';
import { EnemyChargeBehaviors } from './EnemyChargeBehaviors.js';
import { EnemyLineOfSight } from './EnemyLineOfSight.js';
import { EnemySpecialActions } from './EnemySpecialActions.js';
import { EnemyMoveCalculatorFactory } from './MoveCalculators.js';
import { TacticalAI } from './TacticalAI.js';

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
