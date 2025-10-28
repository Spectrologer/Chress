/**
 * Line-of-Sight Utilities
 * Provides shared LOS checking functionality for combat, AI, and pathfinding systems
 */

/**
 * Calculate step direction from one point to another
 * @param {number} fromX - Starting X coordinate
 * @param {number} fromY - Starting Y coordinate
 * @param {number} toX - Target X coordinate
 * @param {number} toY - Target Y coordinate
 * @returns {{stepX: number, stepY: number}} Direction vector (-1, 0, or 1 for each axis)
 */
export function calculateStepDirection(fromX, fromY, toX, toY) {
    return {
        stepX: toX > fromX ? 1 : toX < fromX ? -1 : 0,
        stepY: toY > fromY ? 1 : toY < fromY ? -1 : 0
    };
}

/**
 * Determine the type of line between two points
 * @param {number} fromX - Starting X coordinate
 * @param {number} fromY - Starting Y coordinate
 * @param {number} toX - Target X coordinate
 * @param {number} toY - Target Y coordinate
 * @returns {string|null} 'orthogonal', 'diagonal', or null if neither
 */
export function getLineType(fromX, fromY, toX, toY) {
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
 * @param {number} fromX - Starting X coordinate
 * @param {number} fromY - Starting Y coordinate
 * @param {number} toX - Target X coordinate
 * @param {number} toY - Target Y coordinate
 * @param {Array} grid - The game grid
 * @param {Object} options - Configuration options
 * @param {Function} options.isWalkable - Function to check if a tile is walkable: (x, y, grid) => boolean
 * @param {boolean} [options.checkEnemies=false] - Whether to check for enemy blocking
 * @param {Array} [options.enemies=[]] - Array of enemies to check for blocking
 * @param {boolean} [options.includeEndpoint=false] - Whether to check walkability of the target tile
 * @param {string|null} [options.allowedLineType=null] - Restrict to 'orthogonal', 'diagonal', or null for any
 * @returns {boolean} True if line of sight is clear
 */
export function checkLineOfSight(fromX, fromY, toX, toY, grid, options = {}) {
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
 * @param {number} fromX - Starting X coordinate
 * @param {number} fromY - Starting Y coordinate
 * @param {number} toX - Target X coordinate
 * @param {number} toY - Target Y coordinate
 * @param {Array} grid - The game grid
 * @param {Object} options - Configuration options (same as checkLineOfSight)
 * @returns {boolean} True if orthogonal line of sight is clear
 */
export function checkOrthogonalLineOfSight(fromX, fromY, toX, toY, grid, options = {}) {
    return checkLineOfSight(fromX, fromY, toX, toY, grid, {
        ...options,
        allowedLineType: 'orthogonal'
    });
}

/**
 * Check diagonal (bishop-like) line of sight
 * @param {number} fromX - Starting X coordinate
 * @param {number} fromY - Starting Y coordinate
 * @param {number} toX - Target X coordinate
 * @param {number} toY - Target Y coordinate
 * @param {Array} grid - The game grid
 * @param {Object} options - Configuration options (same as checkLineOfSight)
 * @returns {boolean} True if diagonal line of sight is clear
 */
export function checkDiagonalLineOfSight(fromX, fromY, toX, toY, grid, options = {}) {
    return checkLineOfSight(fromX, fromY, toX, toY, grid, {
        ...options,
        allowedLineType: 'diagonal'
    });
}

/**
 * Check queen-like (orthogonal or diagonal) line of sight
 * @param {number} fromX - Starting X coordinate
 * @param {number} fromY - Starting Y coordinate
 * @param {number} toX - Target X coordinate
 * @param {number} toY - Target Y coordinate
 * @param {Array} grid - The game grid
 * @param {Object} options - Configuration options (same as checkLineOfSight)
 * @returns {boolean} True if queen-like line of sight is clear
 */
export function checkQueenLineOfSight(fromX, fromY, toX, toY, grid, options = {}) {
    const lineType = getLineType(fromX, fromY, toX, toY);

    // Queen can only see along orthogonal or diagonal lines
    if (lineType !== 'orthogonal' && lineType !== 'diagonal') {
        return false;
    }

    return checkLineOfSight(fromX, fromY, toX, toY, grid, options);
}
