import { Enemy } from '../Enemy.js';
import { TILE_TYPES, GRID_SIZE } from '../constants.js';
import { ZoneStateManager } from './ZoneStateManager.js';

export class EnemyGenerator {
    constructor(enemies) {
        this.enemies = enemies;
    }

    addRandomEnemy(zoneLevel, zoneX, zoneY) {
        // Add multiple lizards based on zone level
        let enemyCount = 1; // Default for home

        if (zoneLevel === 2) {
            // Woods: 1-2 lizards
            enemyCount = Math.floor(Math.random() * 2) + 1;
        } else if (zoneLevel === 3) {
            // Wilds: 1-3 lizards
            enemyCount = Math.floor(Math.random() * 3) + 1;
        } else if (zoneLevel === 4) {
            // Frontier: 1-4 lizards (including lizardeaux)
            enemyCount = Math.floor(Math.random() * 4) + 1;
        }

        let localId = 0; // Unique per zone

        for (let count = 0; count < enemyCount; count++) {
            // Try to place the enemy in a valid location (max 50 attempts per enemy)
            for (let attempts = 0; attempts < 50; attempts++) {
                const x = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
                const y = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;

                // Only place on floor tiles (not on walls, rocks, grass, etc.) and not already occupied by enemy
                if (this.isFloorTileAvailable(x, y, zoneX, zoneY)) {
                    // Determine enemy type - 'lizardo' appears in the Wilds (level 3), 'lizardeaux' appears in Frontier (level 4)
                    let enemyType = 'lizardy';
                    if (zoneLevel === 3 && Math.random() < 0.5) {
                        enemyType = 'lizardo';
                    } else if (zoneLevel === 4) {
                        // In Frontier, mix lizardeaux, lizardy, lizord, and lazerd
                        const rand = Math.random();
                        if (rand < 0.25) {
                            enemyType = 'lizardeaux';
                        } else if (rand < 0.5) {
                            enemyType = 'lizardy';
                        } else if (rand < 0.75) {
                            enemyType = 'lizord';
                        } else {
                            enemyType = 'lazerd';
                        }
                    }
                    this.enemies.push({ x, y, enemyType: enemyType, id: `${zoneX}_${zoneY}_${localId++}` });
                    break; // Successfully placed enemy
                }
            }
        }
    }

    isFloorTileAvailable(x, y, zoneX, zoneY) {
        // Need to check grid, enemy positions, items etc. - we'll inject these dependencies
        // For now, basic check
        return true; // Placeholder - this will be passed from parent generator
    }

    isTileOccupiedByEnemy(x, y) {
        for (const enemy of this.enemies) {
            if (enemy.x === x && enemy.y === y) {
                return true;
            }
        }
        return false;
    }

    // Updated method that takes grid and items for full validation
    addRandomEnemyWithValidation(zoneLevel, zoneX, zoneY, grid, items = []) {
        this.grid = grid;
        this.zoneX = zoneX;
        this.zoneY = zoneY;
        this.items = items;
        this.addRandomEnemy(zoneLevel, zoneX, zoneY);
    }

    isFloorTileAvailable(x, y, zoneX, zoneY) {
        const tile = this.grid[y][x];
        // Check for impassable tiles
        if (tile === TILE_TYPES.WALL || tile === TILE_TYPES.ROCK || tile === TILE_TYPES.SHRUBBERY || tile === TILE_TYPES.HOUSE || tile === TILE_TYPES.DEADTREE || tile === TILE_TYPES.WELL || tile === TILE_TYPES.SIGN || (tile && tile.type === TILE_TYPES.SIGN)) {
            return false;
        }
        // Check for enemy
        if (this.isTileOccupiedByEnemy(x, y)) return false;
        // Check for items (axe, hammer, bishop spear, etc.)
        if (tile === TILE_TYPES.AXE || tile === TILE_TYPES.HAMMER || (tile && tile.type === TILE_TYPES.BISHOP_SPEAR) || tile === TILE_TYPES.NOTE) return false;
        // Check for other items
        for (let item of this.items) {
            if (item.x === x && item.y === y) return false;
        }
        return true;
    }
}
