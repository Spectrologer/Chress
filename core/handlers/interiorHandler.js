import { TILE_TYPES, GRID_SIZE } from '../constants.js';
import logger from '../logger.js';
import { ZoneStateManager } from '../../generators/ZoneStateManager.js';
import { validateAndSetTile } from '../../generators/GeneratorUtils.js';
import { findOpenNpcSpawn as _findOpenNpcSpawn, findValidPlayerSpawn as _findValidPlayerSpawn } from '../zoneSpawnManager.js';

export function handleInterior(zoneGen, zoneX, zoneY, foodAssets) {
    // Interior of the house at (0,0)
    if (zoneX === 0 && zoneY === 0) {
        const portX = Math.floor(GRID_SIZE / 2);
        const portY = GRID_SIZE - 1; // Bottom edge
        zoneGen.grid[portY][portX] = TILE_TYPES.PORT;

        zoneGen.grid[4][4] = TILE_TYPES.CRAYN;
        zoneGen.grid[6][3] = TILE_TYPES.FELT;
        zoneGen.grid[3][3] = TILE_TYPES.FORGE;

        zoneGen.grid[1][1] = TILE_TYPES.LIZARDY_STATUE;
        zoneGen.grid[1][2] = TILE_TYPES.LIZARDO_STATUE;
        zoneGen.grid[1][3] = TILE_TYPES.ZARD_STATUE;
        zoneGen.grid[1][5] = TILE_TYPES.LIZARDEAUX_STATUE;
        zoneGen.grid[1][6] = TILE_TYPES.LIZORD_STATUE;
        zoneGen.grid[1][7] = TILE_TYPES.LAZERD_STATUE;

        zoneGen.grid[6][6] = TILE_TYPES.TABLE;
        zoneGen.grid[5][7] = TILE_TYPES.TABLE;
        zoneGen.grid[6][7] = TILE_TYPES.TABLE;

        const houseStartX = 3;
        const houseStartY = 3;
        const leftItems = [TILE_TYPES.BOMB_STATUE, TILE_TYPES.SPEAR_STATUE, TILE_TYPES.BOW_STATUE];
        const rightItems = [TILE_TYPES.HORSE_STATUE, TILE_TYPES.BOOK_STATUE, TILE_TYPES.SHOVEL_STATUE];

        for (let i = 0; i < 3; i++) {
            const y = houseStartY + i;
            const leftX = houseStartX - 2;
            const rightX = houseStartX + 4;
            if (!(zoneGen.grid[y][leftX] && typeof zoneGen.grid[y][leftX] === 'object' && zoneGen.grid[y][leftX].type === TILE_TYPES.SIGN)) {
                validateAndSetTile(zoneGen.grid, leftX, y, leftItems[i]);
            }
            if (!(zoneGen.grid[y][rightX] && typeof zoneGen.grid[y][rightX] === 'object' && zoneGen.grid[y][rightX].type === TILE_TYPES.SIGN)) {
                validateAndSetTile(zoneGen.grid, rightX, y, rightItems[i]);
            }
        }

        if (Math.random() < 0.1) {
            const pos = _findOpenNpcSpawn(zoneGen, 2);
            if (pos) zoneGen.grid[pos.y][pos.x] = TILE_TYPES.LION;
        }
        if (Math.random() < 0.1) {
            const pos = _findOpenNpcSpawn(zoneGen, 2);
            if (pos) zoneGen.grid[pos.y][pos.x] = TILE_TYPES.SQUIG;
        }

        const itemPool = [
            { type: TILE_TYPES.FOOD, foodType: foodAssets[Math.floor(Math.random() * foodAssets.length)] },
            TILE_TYPES.BOMB,
            { type: TILE_TYPES.BISHOP_SPEAR, uses: 3 },
            { type: TILE_TYPES.HORSE_ICON, uses: 3 },
            TILE_TYPES.WATER,
            { type: TILE_TYPES.BOOK_OF_TIME_TRAVEL, uses: 3 },
        ];

        const numItemsToSpawn = 1 + (Math.random() < 0.5 ? 1 : 0);
        const tableTiles = [{ x: 6, y: 6 }, { x: 5, y: 7 }, { x: 6, y: 7 }];
        for (let i = 0; i < numItemsToSpawn; i++) {
            const tableSpot = tableTiles.pop();
            if (tableSpot) {
                const itemToSpawn = itemPool[Math.floor(Math.random() * itemPool.length)];
                if (itemToSpawn.type === TILE_TYPES.FOOD && (!foodAssets || foodAssets.length === 0)) {
                    zoneGen.grid[tableSpot.y][tableSpot.x] = TILE_TYPES.WATER;
                } else {
                    zoneGen.grid[tableSpot.y][tableSpot.x] = itemToSpawn;
                }
            }
        }

        return {
            grid: JSON.parse(JSON.stringify(zoneGen.grid)),
            enemies: [],
            playerSpawn: { x: Math.floor(GRID_SIZE / 2), y: Math.floor(GRID_SIZE / 2) + 2 }
        };
    } else {
        // Shack interiors
        if (ZoneStateManager.wildsShackSpawnZone && zoneX === ZoneStateManager.wildsShackSpawnZone.x && zoneY === ZoneStateManager.wildsShackSpawnZone.y) {
            const gougePos = _findOpenNpcSpawn(zoneGen, 2);
            if (gougePos) zoneGen.grid[gougePos.y][gougePos.x] = TILE_TYPES.GOUGE;
        }

        const portX = Math.floor(GRID_SIZE / 2);
        const portY = GRID_SIZE - 1;
        zoneGen.grid[portY][portX] = TILE_TYPES.PORT;

        const findValidShackSpawn = () => {
            const validSpawns = [];
            for (let y = 2; y < GRID_SIZE - 2; y++) {
                for (let x = 1; x < GRID_SIZE - 1; x++) {
                    if (zoneGen.grid[y][x] === TILE_TYPES.FLOOR) validSpawns.push({ x, y });
                }
            }
            if (validSpawns.length > 0) return validSpawns[Math.floor(Math.random() * validSpawns.length)];
            return null;
        };

        let additionalItems = 0;
        if (Math.random() < 0.25) additionalItems++;
        if (additionalItems >= 1 && Math.random() < 0.20) additionalItems++;
        if (additionalItems >= 2 && Math.random() < 0.15) additionalItems++;
        if (additionalItems >= 3 && Math.random() < 0.10) additionalItems++;
        if (additionalItems >= 4 && Math.random() < 0.05) additionalItems++;
        const totalItems = 2 + additionalItems;

        for (let i = 0; i < totalItems; i++) {
            const pos = findValidShackSpawn();
            if (pos) {
                const isWater = Math.random() < 0.5;
                if (isWater) zoneGen.grid[pos.y][pos.x] = TILE_TYPES.WATER;
                else {
                    if (foodAssets && foodAssets.length > 0) {
                        zoneGen.grid[pos.y][pos.x] = { type: TILE_TYPES.FOOD, foodType: foodAssets[Math.floor(Math.random() * foodAssets.length)] };
                    } else {
                        zoneGen.grid[pos.y][pos.x] = TILE_TYPES.WATER;
                    }
                }
            }
        }

        return {
            grid: JSON.parse(JSON.stringify(zoneGen.grid)),
            enemies: [],
            playerSpawn: { x: portX, y: Math.floor(GRID_SIZE / 2) + 1 }
        };
    }
}
