import { GRID_SIZE, TILE_TYPES, ZONE_CONSTANTS, GAMEPLAY_CONSTANTS } from './constants/index';
import { logger } from './logger';
import GridIterator from '@utils/GridIterator';
import { isTileType } from '@utils/TileUtils';
import { getGridManager } from '@utils/GridUtils';
import type { GridManager, TileObject } from '../types/game';
import type { FeatureGenerator } from '@generators/FeatureGenerator';

interface ZoneConnections {
    north: number | null;
    south: number | null;
    west: number | null;
    east: number | null;
}

interface ZoneGenContext {
    grid: (number | TileObject | null)[][];
    gridManager?: GridManager;
    game?: {
        gridManager?: GridManager;
    };
    enemies: unknown[];
    currentDimension: number;
}

/**
 * Generates exit tiles on zone borders based on zone connections.
 * For underground zones, applies connection probability to limit exits.
 */
export function generateExits(
    zoneGen: ZoneGenContext,
    zoneX: number,
    zoneY: number,
    zoneConnections: Map<string, ZoneConnections>,
    featureGenerator: FeatureGenerator,
    zoneLevel: number
): void {
    const zoneKey = `${zoneX},${zoneY}`;
    const connections = zoneConnections.get(zoneKey);

    if (connections) {
        if (!Array.isArray(zoneGen.grid[0])) {
            for (let y = 0; y < GRID_SIZE; y++) {
                if (!Array.isArray(zoneGen.grid[y])) zoneGen.grid[y] = [];
            }
        }

        const gridManager = getGridManager(zoneGen, 'generateExits') as GridManager | null;
        if (!gridManager) return;

        const effectiveConnections: ZoneConnections = { ...connections };
        if (zoneGen.currentDimension === 2) {
            effectiveConnections.north = connections.north !== null && Math.random() < GAMEPLAY_CONSTANTS.UNDERGROUND_CONNECTION_PROBABILITY ? connections.north : null;
            effectiveConnections.south = connections.south !== null && Math.random() < GAMEPLAY_CONSTANTS.UNDERGROUND_CONNECTION_PROBABILITY ? connections.south : null;
            effectiveConnections.west = connections.west !== null && Math.random() < GAMEPLAY_CONSTANTS.UNDERGROUND_CONNECTION_PROBABILITY ? connections.west : null;
            effectiveConnections.east = connections.east !== null && Math.random() < GAMEPLAY_CONSTANTS.UNDERGROUND_CONNECTION_PROBABILITY ? connections.east : null;
        }

        if (effectiveConnections.north !== null && effectiveConnections.north >= 0 && effectiveConnections.north < GRID_SIZE) {
            gridManager.setTile(effectiveConnections.north, 0, TILE_TYPES.EXIT);
        }
        if (effectiveConnections.south !== null && effectiveConnections.south >= 0 && effectiveConnections.south < GRID_SIZE) {
            gridManager.setTile(effectiveConnections.south, GRID_SIZE - 1, TILE_TYPES.EXIT);
        }
        if (effectiveConnections.west !== null && effectiveConnections.west >= 0 && effectiveConnections.west < GRID_SIZE) {
            gridManager.setTile(0, effectiveConnections.west, TILE_TYPES.EXIT);
        }
        if (effectiveConnections.east !== null && effectiveConnections.east >= 0 && effectiveConnections.east < GRID_SIZE) {
            gridManager.setTile(GRID_SIZE - 1, effectiveConnections.east, TILE_TYPES.EXIT);
        }

        featureGenerator.blockExitsWithShrubbery(zoneLevel, effectiveConnections, zoneGen.currentDimension === 2);
    }
}

/**
 * Clears a path from an exit tile inward toward the zone center.
 * Ensures exits are accessible by removing obstacles.
 */
export function clearPathToExit(zoneGen: ZoneGenContext, exitX: number, exitY: number): void {
    let inwardX: number = exitX;
    let inwardY: number = exitY;
    if (exitY === 0) inwardY = 1;
    else if (exitY === GRID_SIZE - 1) inwardY = GRID_SIZE - 2;
    else if (exitX === 0) inwardX = 1;
    else if (exitX === GRID_SIZE - 1) inwardX = GRID_SIZE - 2;

    const gridManager = getGridManager(zoneGen, 'clearPathToExit') as GridManager | null;
    if (!gridManager) return;

    const adjacentTile: number | TileObject | null | undefined = gridManager.getTile(inwardX, inwardY);
    if (isTileType(adjacentTile, TILE_TYPES.WALL) || isTileType(adjacentTile, TILE_TYPES.ROCK) || isTileType(adjacentTile, TILE_TYPES.SHRUBBERY)) {
        gridManager.setTile(inwardX, inwardY, TILE_TYPES.FLOOR);
    }

    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx: number = inwardX + dx;
            const ny: number = inwardY + dy;
            if (nx >= 1 && nx < GRID_SIZE - 1 && ny >= 1 && ny < GRID_SIZE - 1) {
                const tile: number | TileObject | null | undefined = gridManager.getTile(nx, ny);
                if (isTileType(tile, TILE_TYPES.WALL) || isTileType(tile, TILE_TYPES.ROCK) || isTileType(tile, TILE_TYPES.SHRUBBERY)) {
                    gridManager.setTile(nx, ny, TILE_TYPES.FLOOR);
                }
            }
        }
    }

    clearPathToCenter(zoneGen, inwardX, inwardY);
}

/**
 * Clears a path from a starting position toward the center of the zone.
 * Creates a walkable corridor by removing obstacles along the path.
 */
export function clearPathToCenter(zoneGen: ZoneGenContext, startX: number, startY: number): void {
    const centerX: number = Math.floor(GRID_SIZE / 2);
    const centerY: number = Math.floor(GRID_SIZE / 2);
    let currentX: number = startX;
    let currentY: number = startY;

    const gridManager = getGridManager(zoneGen, 'clearPathToCenter') as GridManager | null;
    if (!gridManager) return;

    while (Math.abs(currentX - centerX) > 1 || Math.abs(currentY - centerY) > 1) {
        if (currentX < centerX) currentX++;
        else if (currentX > centerX) currentX--;
        else if (currentY < centerY) currentY++;
        else if (currentY > centerY) currentY--;

        const curTile: number | TileObject | null | undefined = gridManager.getTile(currentX, currentY);
        if (isTileType(curTile, TILE_TYPES.WALL) || isTileType(curTile, TILE_TYPES.ROCK) || isTileType(curTile, TILE_TYPES.SHRUBBERY)) {
            gridManager.setTile(currentX, currentY, TILE_TYPES.FLOOR);
        }
        if (currentX === centerX && currentY === centerY) break;
    }
}

/**
 * Clears all features from the zone except exits, leaving only floor tiles.
 * Used for the first wilds zone to ensure the shack spawns reliably.
 */
export function clearZoneForShackOnly(zoneGen: ZoneGenContext): void {
    logger.log('Clearing first wilds zone for shack-only placement');

    const gridManager = getGridManager(zoneGen, 'clearZoneForShackOnly') as GridManager | null;
    if (!gridManager) return;

    // Use GridIterator to iterate over all tiles
    GridIterator.forEach(zoneGen.grid, (tile: number | TileObject | null | undefined, x: number, y: number) => {
        if (!isTileType(tile, TILE_TYPES.WALL) && !isTileType(tile, TILE_TYPES.EXIT) && !isTileType(tile, TILE_TYPES.FLOOR) && !isTileType(tile, TILE_TYPES.GRASS)) {
            gridManager.setTile(x, y, TILE_TYPES.FLOOR);
        }
    });
    zoneGen.enemies = [];
}

/**
 * Forces a shack structure to be placed at the center of the zone.
 * Returns true if successful, false if gridManager is unavailable.
 */
export function forcePlaceShackInCenter(zoneGen: ZoneGenContext, zoneX: number, zoneY: number): boolean {
    const startX: number = ZONE_CONSTANTS.SHACK_START_POSITION.x;
    const startY: number = ZONE_CONSTANTS.SHACK_START_POSITION.y;

    const gridManager = getGridManager(zoneGen, 'forcePlaceShackInCenter') as GridManager | null;
    if (!gridManager) return false;

    for (let dy = 0; dy < ZONE_CONSTANTS.SHACK_SIZE; dy++) {
        for (let dx = 0; dx < ZONE_CONSTANTS.SHACK_SIZE; dx++) {
            const tileX: number = startX + dx;
            const tileY: number = startY + dy;
            if (dy === ZONE_CONSTANTS.SHACK_PORT_OFFSET.y && dx === ZONE_CONSTANTS.SHACK_PORT_OFFSET.x) {
                gridManager.setTile(tileX, tileY, TILE_TYPES.PORT);
            } else {
                gridManager.setTile(tileX, tileY, TILE_TYPES.SHACK);
            }
        }
    }
    logger.log(`Shack force-placed at zone (${zoneX}, ${zoneY}) position (${startX}, ${startY})`);
    return true;
}
