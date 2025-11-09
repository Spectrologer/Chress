import { BaseMoveCalculator } from './base';

/**
 * Lizord Move Calculator
 *
 * CHESS PIECE: KNIGHT
 * - Moves in L-shaped pattern (2 squares + 1 perpendicular)
 * - Can jump over other pieces (unique in chess)
 * - 8 possible destination squares from any position
 * - Excellent for tactical flanking
 *
 * Movement: L-shaped jumps (2+1 squares)
 * Attack: Handled in interaction.js
 *
 * Note: Uses BaseMoveCalculator behavior; special interactions handled separately
 */
export class LizordMoveCalculator extends BaseMoveCalculator {
    // uses BaseMoveCalculator behavior; special interactions handled in interaction.js
}
