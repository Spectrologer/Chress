import { Position } from '../../core/Position.js';

/**
 * Gets adjacent tiles around a position
 * Accepts either Position object or separate x, y coordinates
 * Returns array of Position objects
 */
export function adjacentTiles(xOrPos, yOrAllowDiagonal, allowDiagonal = true) {
    let pos;
    let diagonal;

    if (xOrPos instanceof Position) {
        pos = xOrPos;
        diagonal = yOrAllowDiagonal !== undefined ? yOrAllowDiagonal : true;
    } else {
        pos = new Position(xOrPos, yOrAllowDiagonal);
        diagonal = allowDiagonal;
    }

    return pos.getNeighbors(diagonal);
}

/**
 * Gets adjacent tiles filtered by walkability
 * Accepts either Position object or separate x, y coordinates
 * Returns array of Position objects that are walkable
 */
export function neighborsFiltered(xOrPos, yOrGrid, gridOrEntity, entityOrAllowDiagonal, allowDiagonal = true) {
    let pos, grid, entity, diagonal;

    if (xOrPos instanceof Position) {
        pos = xOrPos;
        grid = yOrGrid;
        entity = gridOrEntity;
        diagonal = entityOrAllowDiagonal !== undefined ? entityOrAllowDiagonal : true;
    } else {
        pos = new Position(xOrPos, yOrGrid);
        grid = gridOrEntity;
        entity = entityOrAllowDiagonal;
        diagonal = allowDiagonal;
    }

    return pos.getValidNeighbors(
        p => p.isInBounds(grid.length) && entity.isWalkable(p.x, p.y, grid),
        diagonal
    );
}
