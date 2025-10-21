import { GRID_SIZE, TILE_TYPES } from './constants.js';
import logger from './logger.js';

export function isTileFree(zoneGen, x, y) {
    const tile = zoneGen.grid[y][x];
    if (tile === TILE_TYPES.WALL || tile === TILE_TYPES.ROCK || tile === TILE_TYPES.SHRUBBERY || tile === TILE_TYPES.HOUSE || tile === TILE_TYPES.DEADTREE || tile === TILE_TYPES.WELL || tile === TILE_TYPES.SHACK || tile === TILE_TYPES.SIGN || (tile && tile.type === TILE_TYPES.SIGN)) return false;
    if (zoneGen.enemies && zoneGen.enemies.some(e => e.x === x && e.y === y)) return false;
    if (tile === TILE_TYPES.AXE || tile === TILE_TYPES.HAMMER || (tile && tile.type === TILE_TYPES.BISHOP_SPEAR) || tile === TILE_TYPES.NOTE) return false;
    return true;
}

export function findOpenNpcSpawn(zoneGen, requiredNeighbors) {
    const candidates = [];
    for (let y = 1; y < GRID_SIZE - 1; y++) {
        for (let x = 1; x < GRID_SIZE - 1; x++) {
            if (isTileFree(zoneGen, x, y)) {
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
                if (walkableNeighbors >= requiredNeighbors) candidates.push({ x, y });
            }
        }
    }
    return candidates.length > 0 ? candidates[Math.floor(Math.random() * candidates.length)] : null;
}

export function findValidPlayerSpawn(zoneGen, avoidEntrance = false) {
    // Preserve original home zone behavior
    if (zoneGen.currentZoneX === 0 && zoneGen.currentZoneY === 0 && zoneGen.currentDimension === 0) {
        const houseStartX = 3;
        const houseStartY = 3;
        const frontY = houseStartY + 3;
        for (let x = houseStartX; x < houseStartX + 4; x++) {
            if (isTileFree(zoneGen, x, frontY)) return { x, y: frontY };
        }
    }

    const candidates = [];
    const entrancePos = zoneGen.game?.portTransitionData;
    for (let y = 1; y < GRID_SIZE - 1; y++) {
        for (let x = 1; x < GRID_SIZE - 1; x++) {
            if (avoidEntrance && entrancePos && x === entrancePos.x && y === entrancePos.y) continue;
            if (isTileFree(zoneGen, x, y)) candidates.push({ x, y });
        }
    }
    if (candidates.length > 0) return candidates[Math.floor(Math.random() * candidates.length)];
    return null;
}
