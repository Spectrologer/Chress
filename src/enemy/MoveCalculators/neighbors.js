// @ts-check
import { Position } from '../../core/Position.js';

/**
 * @typedef {Array<Array<number>>} Grid
 */

/**
 * @typedef {Object} Entity
 * @property {Function} isWalkable - Check if a position is walkable
 */

/**
 * Gets adjacent tiles around a position
 * Accepts either Position object or separate x, y coordinates
 * Returns array of Position objects
 *
 * @param {Position|number} xOrPos - Position object or X coordinate
 * @param {boolean|number} [yOrAllowDiagonal] - Y coordinate or allowDiagonal flag
 * @param {boolean} [allowDiagonal=true] - Whether to include diagonal neighbors
 * @returns {Position[]} Array of adjacent positions
 */
export function adjacentTiles(xOrPos, yOrAllowDiagonal, allowDiagonal = true) {
    let pos;
    let diagonal;

    if (xOrPos instanceof Position) {
        pos = xOrPos;
        diagonal = typeof yOrAllowDiagonal === 'boolean' ? yOrAllowDiagonal : true;
    } else {
        pos = new Position(/** @type {number} */ (xOrPos), /** @type {number} */ (yOrAllowDiagonal));
        diagonal = allowDiagonal;
    }

    return pos.getNeighbors(diagonal);
}

/**
 * Gets adjacent tiles filtered by walkability
 * Accepts either Position object or separate x, y coordinates
 * Returns array of Position objects that are walkable
 *
 * @param {Position|number} xOrPos - Position object or X coordinate
 * @param {Grid|number} yOrGrid - Grid or Y coordinate
 * @param {Entity|Grid} gridOrEntity - Entity or Grid
 * @param {boolean|Entity} [entityOrAllowDiagonal] - Entity or allowDiagonal flag
 * @param {boolean} [allowDiagonal=true] - Whether to include diagonal neighbors
 * @returns {Position[]} Array of walkable adjacent positions
 */
export function neighborsFiltered(xOrPos, yOrGrid, gridOrEntity, entityOrAllowDiagonal, allowDiagonal = true) {
    let pos, grid, entity, diagonal;

    if (xOrPos instanceof Position) {
        pos = xOrPos;
        grid = /** @type {Grid} */ (yOrGrid);
        entity = /** @type {Entity} */ (gridOrEntity);
        diagonal = typeof entityOrAllowDiagonal === 'boolean' ? entityOrAllowDiagonal : true;
    } else {
        pos = new Position(/** @type {number} */ (xOrPos), /** @type {number} */ (yOrGrid));
        grid = /** @type {Grid} */ (gridOrEntity);
        entity = /** @type {Entity} */ (entityOrAllowDiagonal);
        diagonal = allowDiagonal;
    }

    return pos.getValidNeighbors(
        p => p.isInBounds(grid.length) && entity.isWalkable(p.x, p.y, grid),
        diagonal
    );
}
