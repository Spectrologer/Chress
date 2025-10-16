import { Enemy } from '../entities/Enemy.js';
import { TILE_TYPES, GRID_SIZE } from '../core/constants.js';
import { findValidPlacement } from './GeneratorUtils.js';
import { ZoneStateManager } from './ZoneStateManager.js';

const ENEMY_WEIGHTS = {
    lizardy: 1,
    lizardo: 2,
    lizardeaux: 3,
    lizord: 3,
    lazerd: 5,
    zard: 3
};

const MAX_WEIGHT_PER_LEVEL = {
    1: 4,
    2: 6,
    3: 8,
    4: 10
};

const ENEMY_SPAWN_PROBS = {
    1: [
        { type: 'lizardy', prob: 0.8 },
        { type: 'lizardo', prob: 0.15 },
        { type: 'lizardeaux', prob: 0.05 }
    ],
    2: [
        { type: 'lizardy', prob: 0.5 },
        { type: 'lizardo', prob: 0.25 },
        { type: 'lizardeaux', prob: 0.1 },
        { type: 'zard', prob: 0.1 },
        { type: 'lizord', prob: 0.05 }
    ],
    3: [
        { type: 'lizardy', prob: 0.2 },
        { type: 'lizardo', prob: 0.2 },
        { type: 'lizardeaux', prob: 0.2 },
        { type: 'zard', prob: 0.2 },
        { type: 'lizord', prob: 0.1 },
        { type: 'lazerd', prob: 0.1 }
    ],
    4: [
        { type: 'lizardeaux', prob: 0.25 },
        { type: 'lizardy', prob: 0.25 },
        { type: 'lizord', prob: 0.25 },
        { type: 'lazerd', prob: 0.15 },
        { type: 'zard', prob: 0.10 }
    ]
};

export class EnemyGenerator {
    constructor(enemies) {
        this.enemies = enemies;
    }

    selectEnemyType(zoneLevel) {
        const list = ENEMY_SPAWN_PROBS[zoneLevel] || ENEMY_SPAWN_PROBS[1];
        let rand = Math.random();
        let cum = 0;
        for (let item of list) {
            cum += item.prob;
            if (rand < cum) return item.type;
        }
        return list[list.length - 1].type; // fallback
    }

    addRandomEnemy(zoneLevel, zoneX, zoneY) {
        const maxWeight = MAX_WEIGHT_PER_LEVEL[zoneLevel] || 12;
        let currentWeight = 0;
        let localId = 0; // Unique per zone
        let spawnAttempts = 0;
        while (currentWeight < maxWeight) {
            let enemyPlaced = false;
            const pos = findValidPlacement({
                maxAttempts: 50,
                validate: (x, y) => this.isFloorTileAvailable(x, y, zoneX, zoneY)
            });
            if (pos) {
                let enemyType = this.selectEnemyType(zoneLevel);
                let weight = ENEMY_WEIGHTS[enemyType];
                if (currentWeight + weight <= maxWeight) {
                    this.enemies.push({ x: pos.x, y: pos.y, enemyType: enemyType, id: `${zoneX}_${zoneY}_${localId++}` });
                    currentWeight += weight;
                    enemyPlaced = true;
                    spawnAttempts++;
                }
            }
            if (!enemyPlaced) {
                break;
            }
        }
    }

    isFloorTileAvailable(x, y, zoneX, zoneY) {
        // Need to check grid, enemy positions, items etc. - we'll inject these dependencies
        // For now, basic check
        return true;
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
        const tileValue = tile && tile.type ? tile.type : tile;
        // Only place on normal floor tiles
        if (tileValue !== TILE_TYPES.FLOOR) return false;
        // Check for enemy
        if (this.isTileOccupiedByEnemy(x, y)) return false;
        // Check for other items
        for (let item of this.items) {
            if (item.x === x && item.y === y) return false;
        }
        return true;
    }
}
