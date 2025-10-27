import { GRID_SIZE, TILE_TYPES, ZONE_CONSTANTS, GAMEPLAY_CONSTANTS } from './constants/index.js';
import { logger } from './logger.js';
import GridIterator from '../utils/GridIterator.js';
import { isTileType } from '../utils/TileUtils.js';

export function generateExits(zoneGen, zoneX, zoneY, zoneConnections, featureGenerator, zoneLevel) {
    const zoneKey = `${zoneX},${zoneY}`;
    const connections = zoneConnections.get(zoneKey);

    if (connections) {
        if (!Array.isArray(zoneGen.grid[0])) {
            for (let y = 0; y < GRID_SIZE; y++) {
                if (!Array.isArray(zoneGen.grid[y])) zoneGen.grid[y] = [];
            }
        }

        let effectiveConnections = { ...connections };
        if (zoneGen.currentDimension === 2) {
            effectiveConnections.north = connections.north !== null && Math.random() < GAMEPLAY_CONSTANTS.UNDERGROUND_CONNECTION_PROBABILITY ? connections.north : null;
            effectiveConnections.south = connections.south !== null && Math.random() < GAMEPLAY_CONSTANTS.UNDERGROUND_CONNECTION_PROBABILITY ? connections.south : null;
            effectiveConnections.west = connections.west !== null && Math.random() < GAMEPLAY_CONSTANTS.UNDERGROUND_CONNECTION_PROBABILITY ? connections.west : null;
            effectiveConnections.east = connections.east !== null && Math.random() < GAMEPLAY_CONSTANTS.UNDERGROUND_CONNECTION_PROBABILITY ? connections.east : null;
        }

        if (effectiveConnections.north !== null && effectiveConnections.north >= 0 && effectiveConnections.north < GRID_SIZE) {
            zoneGen.grid[0][effectiveConnections.north] = TILE_TYPES.EXIT;
        }
        if (effectiveConnections.south !== null && effectiveConnections.south >= 0 && effectiveConnections.south < GRID_SIZE) {
            zoneGen.grid[GRID_SIZE - 1][effectiveConnections.south] = TILE_TYPES.EXIT;
        }
        if (effectiveConnections.west !== null && effectiveConnections.west >= 0 && effectiveConnections.west < GRID_SIZE) {
            zoneGen.grid[effectiveConnections.west][0] = TILE_TYPES.EXIT;
        }
        if (effectiveConnections.east !== null && effectiveConnections.east >= 0 && effectiveConnections.east < GRID_SIZE) {
            zoneGen.grid[effectiveConnections.east][GRID_SIZE - 1] = TILE_TYPES.EXIT;
        }

        featureGenerator.blockExitsWithShrubbery(zoneLevel, effectiveConnections, zoneGen.currentDimension === 2);
    }
}

export function clearPathToExit(zoneGen, exitX, exitY) {
    let inwardX = exitX;
    let inwardY = exitY;
    if (exitY === 0) inwardY = 1;
    else if (exitY === GRID_SIZE - 1) inwardY = GRID_SIZE - 2;
    else if (exitX === 0) inwardX = 1;
    else if (exitX === GRID_SIZE - 1) inwardX = GRID_SIZE - 2;

    const adjacentTile = zoneGen.grid[inwardY][inwardX];
    if (isTileType(adjacentTile, TILE_TYPES.WALL) || isTileType(adjacentTile, TILE_TYPES.ROCK) || isTileType(adjacentTile, TILE_TYPES.SHRUBBERY)) {
        zoneGen.grid[inwardY][inwardX] = TILE_TYPES.FLOOR;
    }

    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = inwardX + dx;
            const ny = inwardY + dy;
            if (nx >= 1 && nx < GRID_SIZE - 1 && ny >= 1 && ny < GRID_SIZE - 1) {
                const tile = zoneGen.grid[ny][nx];
                if (isTileType(tile, TILE_TYPES.WALL) || isTileType(tile, TILE_TYPES.ROCK) || isTileType(tile, TILE_TYPES.SHRUBBERY)) {
                    zoneGen.grid[ny][nx] = TILE_TYPES.FLOOR;
                }
            }
        }
    }

    clearPathToCenter(zoneGen, inwardX, inwardY);
}

export function clearPathToCenter(zoneGen, startX, startY) {
    const centerX = Math.floor(GRID_SIZE / 2);
    const centerY = Math.floor(GRID_SIZE / 2);
    let currentX = startX;
    let currentY = startY;
    while (Math.abs(currentX - centerX) > 1 || Math.abs(currentY - centerY) > 1) {
        if (currentX < centerX) currentX++;
        else if (currentX > centerX) currentX--;
        else if (currentY < centerY) currentY++;
        else if (currentY > centerY) currentY--;

        const curTile = zoneGen.grid[currentY][currentX];
        if (isTileType(curTile, TILE_TYPES.WALL) || isTileType(curTile, TILE_TYPES.ROCK) || isTileType(curTile, TILE_TYPES.SHRUBBERY)) {
            zoneGen.grid[currentY][currentX] = TILE_TYPES.FLOOR;
        }
        if (currentX === centerX && currentY === centerY) break;
    }
}

export function clearZoneForShackOnly(zoneGen) {
    logger.log('Clearing first wilds zone for shack-only placement');
    GridIterator.forEach(zoneGen.grid, (tile, x, y) => {
        if (!isTileType(tile, TILE_TYPES.WALL) && !isTileType(tile, TILE_TYPES.EXIT) && !isTileType(tile, TILE_TYPES.FLOOR) && !isTileType(tile, TILE_TYPES.GRASS)) {
            zoneGen.grid[y][x] = TILE_TYPES.FLOOR;
        }
    });
    zoneGen.enemies = [];
}

export function forcePlaceShackInCenter(zoneGen, zoneX, zoneY) {
    const startX = ZONE_CONSTANTS.SHACK_START_POSITION.x;
    const startY = ZONE_CONSTANTS.SHACK_START_POSITION.y;
    for (let dy = 0; dy < ZONE_CONSTANTS.SHACK_SIZE; dy++) {
        for (let dx = 0; dx < ZONE_CONSTANTS.SHACK_SIZE; dx++) {
            const tileX = startX + dx;
            const tileY = startY + dy;
            if (dy === ZONE_CONSTANTS.SHACK_PORT_OFFSET.y && dx === ZONE_CONSTANTS.SHACK_PORT_OFFSET.x) zoneGen.grid[tileY][tileX] = TILE_TYPES.PORT;
            else zoneGen.grid[tileY][tileX] = TILE_TYPES.SHACK;
        }
    }
    logger.log(`Shack force-placed at zone (${zoneX}, ${zoneY}) position (${startX}, ${startY})`);
    return true;
}
