import { GRID_SIZE } from '../../core/constants.js';
import { EnemyPathfinding } from '../EnemyPathfinding.js';

export function applyTacticalAdjustments(tacticalAI, enemy, next, playerX, playerY, grid, enemies) {
    if (!tacticalAI) return next;

    const currentDistToPlayer = Math.abs(next.x - playerX) + Math.abs(next.y - playerY);
    const currentClustering = tacticalAI.calculateAllyDistance(next.x, next.y, enemies, enemy);
    const currentDiversity = tacticalAI.calculateDirectionDiversity(next.x, next.y, playerX, playerY, enemies, enemy);
    const moveDirs = EnemyPathfinding.getMovementDirections(enemy.enemyType);

    for (const dir of moveDirs) {
        const altX = enemy.x + dir.x;
        const altY = enemy.y + dir.y;
        if (altX < 0 || altX >= GRID_SIZE || altY < 0 || altY >= GRID_SIZE) continue;
        if (!enemy.isWalkable(altX, altY, grid)) continue;
        if (enemies.some(e => e.x === altX && e.y === altY)) continue;

        const altDistToPlayer = Math.abs(altX - playerX) + Math.abs(altY - playerY);
        const altClustering = tacticalAI.calculateAllyDistance(altX, altY, enemies, enemy);
        const altDiversity = tacticalAI.calculateDirectionDiversity(altX, altY, playerX, playerY, enemies, enemy);

        const clusteringGain = currentClustering - altClustering;
        const diversityGain = altDiversity - currentDiversity;
        if ((clusteringGain > 0.3 || diversityGain > 0) &&
            altDistToPlayer <= currentDistToPlayer + 2 &&
            !tacticalAI.isStackedBehind(altX, altY, playerX, playerY, enemies, enemy)) {
            next.x = altX;
            next.y = altY;
            break;
        }
    }

    return next;
}

export function applyDefensiveMoves(tacticalAI, enemy, player, next, playerX, playerY, grid, enemies, isSimulation, game, logger) {
    if (!tacticalAI) return next;

    if (enemy.enemyType === 'lizord') {
        const startDx = Math.abs(next.x - enemy.x);
        const startDy = Math.abs(next.y - enemy.y);
        const isKnightMove = (startDx === 2 && startDy === 1) || (startDx === 1 && startDy === 2);
        if (isKnightMove && next.x === playerX && next.y === playerY) {
            if (!isSimulation) logger && logger.debug && logger.debug(`[Lizord Debug] allowing knight bump to ${next.x},${next.y}`);
            return next;
        }
    }

    const dx = Math.abs(next.x - playerX);
    const dy = Math.abs(next.y - playerY);
    const nextDistance = dx + dy;

    if (nextDistance <= 2) {
        const defensiveMoves = tacticalAI.getDefensiveMoves(enemy, playerX, playerY, next.x, next.y, grid, enemies);
        if (defensiveMoves.length > 0) {
            if (enemy.enemyType === 'lizord' && !isSimulation) {
                logger && logger.debug && logger.debug(`[Lizord Debug] defensiveMoves candidates=${defensiveMoves.map(m=>`${m.x},${m.y}`).join(';')}`);
            }
            if (!isSimulation && Math.max(Math.abs(defensiveMoves[0].x - enemy.x), Math.abs(defensiveMoves[0].y - enemy.y)) > 1) {
                enemy.smokeAnimations.push({
                    x: enemy.x + (defensiveMoves[0].x - enemy.x) / 2,
                    y: enemy.y + (defensiveMoves[0].y - enemy.y) / 2,
                    frame: 18
                });
            }
            return { x: defensiveMoves[0].x, y: defensiveMoves[0].y };
        }
    }

    return next;
}
