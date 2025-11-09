import { Enemy, type EnemyData } from '@entities/Enemy';
import { TILE_TYPES, GRID_SIZE, SPAWN_PROBABILITIES } from '@core/constants/index';
import { findValidPlacement } from './GeneratorUtils';
import { ZoneStateManager } from './ZoneStateManager';
import { ContentRegistry } from '@core/ContentRegistry';
import type { GridManager } from '@managers/GridManager';

const MAX_WEIGHT_PER_LEVEL: Record<number, number> = {
    1: 4,
    2: 6,
    3: 8,
    4: 10
};

interface ItemWithPosition {
    x: number;
    y: number;
    [key: string]: unknown;
}

export class EnemyGenerator {
    private enemies: EnemyData[];
    private depth: number;
    private depthMultiplier: number;
    private gridManager: GridManager | null;
    private zoneX = 0;
    private zoneY = 0;
    private items: ItemWithPosition[] = [];

    constructor(enemies: EnemyData[], depth: number = 0) {
        this.enemies = enemies;
        this.depth = depth || 0;
        this.depthMultiplier = 1 + Math.max(0, (this.depth - 1)) * 0.02; // +2% per depth beyond first
        this.gridManager = null;
    }

    selectEnemyType(zoneLevel: number): string | null {
        // Get spawnable enemies from ContentRegistry
        const list = ContentRegistry.getSpawnableEnemies(zoneLevel);
        if (!list || list.length === 0) {
            return null;
        }

        let rand = Math.random();
        let cum = 0;
        for (let item of list) {
            cum += item.prob;
            if (rand < cum) return item.type;
        }
        return list[list.length - 1].type; // fallback
    }

    addRandomEnemy(zoneLevel: number, zoneX: number, zoneY: number): void {
        // Scale max weight by depth multiplier but cap at 20
        const baseMax = MAX_WEIGHT_PER_LEVEL[zoneLevel] || 12;
        const scaledMax = Math.min(20, Math.floor(baseMax * this.depthMultiplier));
        const maxWeight = scaledMax;
        let currentWeight = 0;
        let localId = 0; // Unique per zone
        let spawnAttempts = 0;
        while (currentWeight < maxWeight) {
            let enemyPlaced = false;
            const pos = findValidPlacement({
                maxAttempts: 50,
                validate: (x: number, y: number): boolean => this.isFloorTileAvailable(x, y, zoneX, zoneY)
            });
            if (pos) {
                let enemyType = this.selectEnemyType(zoneLevel);
                if (!enemyType) break; // No valid enemies for this level

                // Get enemy weight from ContentRegistry
                const enemyConfig = ContentRegistry.getEnemy(enemyType);
                let weight = enemyConfig ? enemyConfig.weight : 1;

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

    isTileOccupiedByEnemy(x: number, y: number): boolean {
        for (const enemy of this.enemies) {
            if (enemy.x === x && enemy.y === y) {
                return true;
            }
        }
        return false;
    }

    // Updated method that takes gridManager and items for full validation
    addRandomEnemyWithValidation(zoneLevel: number, zoneX: number, zoneY: number, gridManager: GridManager, items: ItemWithPosition[] = []): void {
        this.gridManager = gridManager;
        this.zoneX = zoneX;
        this.zoneY = zoneY;
        this.items = items;
        this.addRandomEnemy(zoneLevel, zoneX, zoneY);
    }

    isFloorTileAvailable(x: number, y: number, zoneX: number, zoneY: number): boolean {
        if (!this.gridManager) return false;
        const tile = this.gridManager.getTile(x, y);
        const tileValue = tile && typeof tile === 'object' && 'type' in tile ? (tile as { type: number }).type : tile;
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
