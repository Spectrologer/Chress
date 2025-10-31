/**
 * Line-of-Sight Utilities
 * Provides shared LOS checking functionality for combat, AI, and pathfinding systems
 */

export interface StepDirection {
  stepX: number; // Direction on X axis (-1, 0, or 1)
  stepY: number; // Direction on Y axis (-1, 0, or 1)
}

export interface Enemy {
  x: number;
  y: number;
}

export type IsWalkableFunction = (x: number, y: number, grid: any[][]) => boolean;

export type LineType = 'orthogonal' | 'diagonal' | null;

export interface LineOfSightOptions {
  isWalkable?: IsWalkableFunction;
  checkEnemies?: boolean;
  enemies?: Enemy[];
  includeEndpoint?: boolean;
  allowedLineType?: LineType;
}

/**
 * Calculate step direction from one point to another
 * @param fromX - Starting X coordinate
 * @param fromY - Starting Y coordinate
 * @param toX - Target X coordinate
 * @param toY - Target Y coordinate
 * @returns Direction vector (-1, 0, or 1 for each axis)
 */
export function calculateStepDirection(fromX: number, fromY: number, toX: number, toY: number): StepDirection {
    return {
        stepX: toX > fromX ? 1 : toX < fromX ? -1 : 0,
        stepY: toY > fromY ? 1 : toY < fromY ? -1 : 0
    };
}

/**
 * Determine the type of line between two points
 * @param fromX - Starting X coordinate
 * @param fromY - Starting Y coordinate
 * @param toX - Target X coordinate
 * @param toY - Target Y coordinate
 * @returns 'orthogonal', 'diagonal', or null if neither
 */
export function getLineType(fromX: number, fromY: number, toX: number, toY: number): LineType {
    const dx = Math.abs(toX - fromX);
    const dy = Math.abs(toY - fromY);

    const sameRow = fromY === toY;
    const sameCol = fromX === toX;
    const sameDiagonal = dx === dy && dx > 0;

    if (sameRow || sameCol) return 'orthogonal';
    if (sameDiagonal) return 'diagonal';
    return null;
}

/**
 * Check if there's a clear line of sight between two points
 * @param fromX - Starting X coordinate
 * @param fromY - Starting Y coordinate
 * @param toX - Target X coordinate
 * @param toY - Target Y coordinate
 * @param grid - The game grid
 * @param options - Configuration options
 * @returns True if line of sight is clear
 */
export function checkLineOfSight(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    grid: any[][],
    options: LineOfSightOptions = {}
): boolean {
    const {
        isWalkable,
        checkEnemies = false,
        enemies = [],
        includeEndpoint = false,
        allowedLineType = null
    } = options;

    if (!isWalkable) {
        throw new Error('isWalkable function is required for checkLineOfSight');
    }

    // Check if line type is allowed
    if (allowedLineType) {
        const lineType = getLineType(fromX, fromY, toX, toY);
        if (lineType !== allowedLineType) {
            return false;
        }
    }

    const { stepX, stepY } = calculateStepDirection(fromX, fromY, toX, toY);

    // If no movement, return true (same position)
    if (stepX === 0 && stepY === 0) {
        return true;
    }

    let checkX = fromX + stepX;
    let checkY = fromY + stepY;

    // Check each tile along the path (excluding the endpoint)
    while (checkX !== toX || checkY !== toY) {
        // Check walkability
        if (!isWalkable(checkX, checkY, grid)) {
            return false;
        }

        // Check for enemy blocking
        if (checkEnemies && enemies.length > 0) {
            const enemyBlocking = enemies.some(enemy =>
                enemy.x === checkX && enemy.y === checkY
            );
            if (enemyBlocking) {
                return false;
            }
        }

        checkX += stepX;
        checkY += stepY;
    }

    // Check the endpoint if includeEndpoint is true
    if (includeEndpoint) {
        if (!isWalkable(toX, toY, grid)) {
            return false;
        }

        if (checkEnemies && enemies.length > 0) {
            const enemyBlocking = enemies.some(enemy =>
                enemy.x === toX && enemy.y === toY
            );
            if (enemyBlocking) {
                return false;
            }
        }
    }

    return true;
}

/**
 * Check orthogonal (rook-like) line of sight
 * @param fromX - Starting X coordinate
 * @param fromY - Starting Y coordinate
 * @param toX - Target X coordinate
 * @param toY - Target Y coordinate
 * @param grid - The game grid
 * @param options - Configuration options (same as checkLineOfSight)
 * @returns True if orthogonal line of sight is clear
 */
export function checkOrthogonalLineOfSight(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    grid: any[][],
    options: LineOfSightOptions = {}
): boolean {
    return checkLineOfSight(fromX, fromY, toX, toY, grid, {
        ...options,
        allowedLineType: 'orthogonal'
    });
}

/**
 * Check diagonal (bishop-like) line of sight
 * @param fromX - Starting X coordinate
 * @param fromY - Starting Y coordinate
 * @param toX - Target X coordinate
 * @param toY - Target Y coordinate
 * @param grid - The game grid
 * @param options - Configuration options (same as checkLineOfSight)
 * @returns True if diagonal line of sight is clear
 */
export function checkDiagonalLineOfSight(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    grid: any[][],
    options: LineOfSightOptions = {}
): boolean {
    return checkLineOfSight(fromX, fromY, toX, toY, grid, {
        ...options,
        allowedLineType: 'diagonal'
    });
}

/**
 * Check queen-like (orthogonal or diagonal) line of sight
 * @param fromX - Starting X coordinate
 * @param fromY - Starting Y coordinate
 * @param toX - Target X coordinate
 * @param toY - Target Y coordinate
 * @param grid - The game grid
 * @param options - Configuration options (same as checkLineOfSight)
 * @returns True if queen-like line of sight is clear
 */
export function checkQueenLineOfSight(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    grid: any[][],
    options: LineOfSightOptions = {}
): boolean {
    const lineType = getLineType(fromX, fromY, toX, toY);

    // Queen can only see along orthogonal or diagonal lines
    if (lineType !== 'orthogonal' && lineType !== 'diagonal') {
        return false;
    }

    return checkLineOfSight(fromX, fromY, toX, toY, grid, options);
}
