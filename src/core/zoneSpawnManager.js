import { GRID_SIZE, TILE_TYPES } from './constants/index.js';
import { logger } from './logger.ts';
import GridIterator from '../utils/GridIterator.js';
import { isTileType } from '../utils/TileUtils.js';

export function isTileFree(zoneGen, x, y) {
    const tile = zoneGen.grid[y][x];
    if (isTileType(tile, TILE_TYPES.WALL) || isTileType(tile, TILE_TYPES.ROCK) || isTileType(tile, TILE_TYPES.SHRUBBERY) || isTileType(tile, TILE_TYPES.HOUSE) || isTileType(tile, TILE_TYPES.DEADTREE) || isTileType(tile, TILE_TYPES.WELL) || isTileType(tile, TILE_TYPES.SHACK) || isTileType(tile, TILE_TYPES.SIGN)) return false;
    if (zoneGen.enemies && zoneGen.enemies.some(e => e.x === x && e.y === y)) return false;
    if (isTileType(tile, TILE_TYPES.AXE) || isTileType(tile, TILE_TYPES.HAMMER) || isTileType(tile, TILE_TYPES.BISHOP_SPEAR)) return false;
    return true;
}

export function findOpenNpcSpawn(zoneGen, requiredNeighbors) {
    const candidates = GridIterator.findTiles(
        zoneGen.grid,
        (tile, x, y) => {
            if (!isTileFree(zoneGen, x, y)) return false;

            let walkableNeighbors = 0;
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    const nx = x + dx;
                    const ny = y + dy;
                    if (isTileFree(zoneGen, nx, ny)) {
                        walkableNeighbors++;
                    }
                }
            }
            return walkableNeighbors >= requiredNeighbors;
        },
        { skipBorders: true }
    );

    return candidates.length > 0 ? candidates[Math.floor(Math.random() * candidates.length)] : null;
}

export function findValidPlayerSpawn(zoneGen, avoidEntrance = false) {
    // Home zone spawn behavior - spawn on an exit tile for cinematic arrival
    if (zoneGen.currentZoneX === 0 && zoneGen.currentZoneY === 0 && zoneGen.currentDimension === 0) {
        // Find all exit tiles in the zone
        const exitTiles = GridIterator.findTiles(zoneGen.grid, tile => isTileType(tile, TILE_TYPES.EXIT));

        // Spawn on a random exit tile if any exist
        if (exitTiles.length > 0) {
            const spawnPos = exitTiles[Math.floor(Math.random() * exitTiles.length)];
            return spawnPos;
        }

        // Fallback to original behavior if no exits found
        const houseStartX = 3;
        const houseStartY = 3;
        const frontY = houseStartY + 3;
        for (let x = houseStartX; x < houseStartX + 4; x++) {
            if (isTileFree(zoneGen, x, frontY)) return { x, y: frontY };
        }
    }

    const entrancePos = zoneGen.game?.portTransitionData;
    const candidates = GridIterator.findTiles(
        zoneGen.grid,
        (tile, x, y) => {
            if (avoidEntrance && entrancePos && x === entrancePos.x && y === entrancePos.y) return false;
            return isTileFree(zoneGen, x, y);
        },
        { skipBorders: true }
    );

    if (candidates.length > 0) return candidates[Math.floor(Math.random() * candidates.length)];
    return null;
}
