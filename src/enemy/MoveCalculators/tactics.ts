/**
 * Tactical adjustment functions for enemy cooperative behavior.
 *
 * These functions modify enemy movement to create intelligent group tactics:
 * - Flanking: Spread out around the player instead of clustering
 * - Clustering: Maintain cohesive formations
 * - Defensive Retreat: Pull back when threatened
 * - Anti-Stacking: Avoid blocking allies
 */

import { GRID_SIZE } from '@core/constants/index';
import { EnemyPathfinding } from '@enemy/EnemyPathfinding';
import type { Position, Enemy, Player, Grid, Game } from './base';

export interface TacticalAI {
    calculateAllyDistance: (x: number, y: number, enemies: Enemy[], currentEnemy: Enemy) => number;
    calculateDirectionDiversity: (x: number, y: number, playerX: number, playerY: number, enemies: Enemy[], currentEnemy: Enemy) => number;
    isStackedBehind: (x: number, y: number, playerX: number, playerY: number, enemies: Enemy[], currentEnemy: Enemy) => boolean;
    getDefensiveMoves: (enemy: Enemy, playerX: number, playerY: number, proposedX: number, proposedY: number, grid: Grid, enemies: Enemy[]) => Position[];
}

/**
 * Adjusts enemy movement to improve tactical positioning through better
 * clustering and directional diversity (flanking behavior).
 *
 * Algorithm:
 * 1. Evaluate the proposed move's tactical metrics
 * 2. Check all alternative moves from current position
 * 3. Calculate tactical gains for each alternative:
 *    a. Clustering gain: How much closer to allies
 *    b. Diversity gain: How much better spread around player
 * 4. Accept alternative if:
 *    - Clustering improves by >0.3 OR diversity improves
 *    - Doesn't move too far from player (+2 tiles max)
 *    - Doesn't stack behind another enemy
 *
 * Tactical Thresholds:
 * - Clustering gain > 0.3: Significant enough to justify position change
 * - Distance tolerance +2: Can move slightly farther if tactics improve
 *
 * Use Case:
 * Called after basic pathfinding to refine positions for cooperative play.
 * Prevents enemies from all attacking from the same direction.
 */
export function applyTacticalAdjustments(
    tacticalAI: TacticalAI | null,
    enemy: Enemy,
    next: Position,
    playerX: number,
    playerY: number,
    grid: Grid,
    enemies: Enemy[]
): Position {
    if (!tacticalAI) return next;

    // Evaluate tactical metrics of the proposed move
    const currentDistToPlayer = Math.abs(next.x - playerX) + Math.abs(next.y - playerY);
    const currentClustering = tacticalAI.calculateAllyDistance(next.x, next.y, enemies, enemy);
    const currentDiversity = tacticalAI.calculateDirectionDiversity(next.x, next.y, playerX, playerY, enemies, enemy);
    const moveDirs = EnemyPathfinding.getMovementDirections(enemy.enemyType);

    // Evaluate all alternative moves from current position
    for (const dir of moveDirs) {
        const altX = enemy.x + dir.x;
        const altY = enemy.y + dir.y;

        // Bounds and walkability checks
        if (altX < 0 || altX >= GRID_SIZE || altY < 0 || altY >= GRID_SIZE) continue;
        if (!enemy.isWalkable(altX, altY, grid)) continue;
        if (enemies.some(e => e.x === altX && e.y === altY)) continue;

        // Calculate tactical metrics for this alternative
        const altDistToPlayer = Math.abs(altX - playerX) + Math.abs(altY - playerY);
        const altClustering = tacticalAI.calculateAllyDistance(altX, altY, enemies, enemy);
        const altDiversity = tacticalAI.calculateDirectionDiversity(altX, altY, playerX, playerY, enemies, enemy);

        // Calculate tactical improvements
        // Lower clustering value = tighter formation (positive gain means moving closer to allies)
        const clusteringGain = currentClustering - altClustering;
        // Higher diversity = better spread (positive gain means better flanking)
        const diversityGain = altDiversity - currentDiversity;

        // Accept alternative if tactically superior and not too far from player
        if ((clusteringGain > 0.3 || diversityGain > 0) &&
            altDistToPlayer <= currentDistToPlayer + 2 &&
            !tacticalAI.isStackedBehind(altX, altY, playerX, playerY, enemies, enemy)) {
            next.x = altX;
            next.y = altY;
            break;  // Take first improvement found
        }
    }

    return next;
}

/**
 * Applies defensive retreat logic when an enemy is threatened by the player.
 * Overrides aggressive moves to prioritize survival.
 *
 * Algorithm:
 * 1. Special case: Allow lizord (knight) to bump attack player
 * 2. Check if proposed move keeps enemy in threat range (distance <= 2)
 * 3. If threatened, get defensive move alternatives
 * 4. If defensive move available:
 *    a. Add smoke animation for multi-tile retreats
 *    b. Override with defensive position
 *
 * Distance Threshold (distance <= 2):
 * - Player moves 1 tile per turn
 * - Distance 2 = 2 turns to reach enemy
 * - Distance 1 = 1 turn to reach enemy (immediate threat)
 * - Triggers defensive behavior to maintain safety buffer
 *
 * Special Case - Lizord Knight Bump:
 * Lizords can attack by landing on the player (knight move).
 * This is allowed as an offensive option even when threatened.
 * Checks for L-shaped move: (dx=2,dy=1) or (dx=1,dy=2)
 *
 * Smoke Animation:
 * Added when defensive retreat covers >1 tile (Chebyshev distance).
 * Places smoke at midpoint for visual feedback of multi-tile movement.
 */
export function applyDefensiveMoves(
    tacticalAI: TacticalAI | null,
    enemy: Enemy,
    player: Player,
    next: Position,
    playerX: number,
    playerY: number,
    grid: Grid,
    enemies: Enemy[],
    isSimulation: boolean,
    game: Game | null,
    logger: any
): Position {
    if (!tacticalAI) return next;

    // Special case: Lizord (knight) can bump attack the player
    if (enemy.enemyType === 'lizord') {
        // Check if this is a valid knight move (L-shape)
        const startDx = Math.abs(next.x - enemy.x);
        const startDy = Math.abs(next.y - enemy.y);
        const isKnightMove = (startDx === 2 && startDy === 1) || (startDx === 1 && startDy === 2);

        // If knight is landing on player, allow it (offensive bump attack)
        if (isKnightMove && next.x === playerX && next.y === playerY) {
            if (!isSimulation) {
                logger && logger.debug && logger.debug(`[Lizord Debug] allowing knight bump to ${next.x},${next.y}`);
            }
            return next;
        }
    }

    // Calculate distance to player from proposed position
    const dx = Math.abs(next.x - playerX);
    const dy = Math.abs(next.y - playerY);
    const nextDistance = dx + dy;  // Manhattan distance

    // If proposed move keeps enemy in threat range, consider defensive retreat
    if (nextDistance <= 2) {
        const defensiveMoves = tacticalAI.getDefensiveMoves(enemy, playerX, playerY, next.x, next.y, grid, enemies);

        if (defensiveMoves.length > 0) {
            // Debug logging for lizord defensive decisions
            if (enemy.enemyType === 'lizord' && !isSimulation) {
                logger && logger.debug && logger.debug(
                    `[Lizord Debug] defensiveMoves candidates=${defensiveMoves.map(m => `${m.x},${m.y}`).join(';')}`
                );
            }

            // Add smoke animation for multi-tile defensive retreats
            // Chebyshev distance > 1 means moving more than 1 tile in any direction
            if (!isSimulation && Math.max(Math.abs(defensiveMoves[0].x - enemy.x), Math.abs(defensiveMoves[0].y - enemy.y)) > 1) {
                enemy.smokeAnimations.push({
                    x: enemy.x + (defensiveMoves[0].x - enemy.x) / 2,  // Midpoint X
                    y: enemy.y + (defensiveMoves[0].y - enemy.y) / 2,  // Midpoint Y
                    frame: 18  // Smoke animation frame count
                });
            }

            // Override with defensive position
            return { x: defensiveMoves[0].x, y: defensiveMoves[0].y };
        }
    }

    // Not threatened or no defensive options available - proceed with original move
    return next;
}
