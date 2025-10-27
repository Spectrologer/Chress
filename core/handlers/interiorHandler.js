import { TILE_TYPES, GRID_SIZE, SPAWN_PROBABILITIES, ZONE_CONSTANTS } from '../constants/index.js';
import { ZoneStateManager } from '../../generators/ZoneStateManager.js';
import { validateAndSetTile } from '../../generators/GeneratorUtils.js';
import { findOpenNpcSpawn as _findOpenNpcSpawn } from '../zoneSpawnManager.js';
import { BaseZoneHandler } from './BaseZoneHandler.js';

class InteriorHandler extends BaseZoneHandler {
    constructor(zoneGen, zoneX, zoneY, foodAssets) {
        super(zoneGen, zoneX, zoneY, foodAssets, 1, 0);
    }

    generate() {
        if (this.isHomeZone) {
            return this.generateHomeInterior();
        } else {
            return this.generateShackInterior();
        }
    }

    generateHomeInterior() {
        const portX = Math.floor(GRID_SIZE / 2);
        const portY = GRID_SIZE - 1;
        this.zoneGen.grid[portY][portX] = TILE_TYPES.PORT;

        this.placeHomeNPCs();
        this.placeHomeStatues();
        this.placeHomeTables();
        this.placeHomeWallStatues();
        this.placeTableItems();

        this.zoneGen.playerSpawn = { x: Math.floor(GRID_SIZE / 2), y: Math.floor(GRID_SIZE / 2) + 2 };
        return this.buildHomeResult();
    }

    placeHomeNPCs() {
        this.zoneGen.grid[4][4] = TILE_TYPES.CRAYN;
        this.zoneGen.grid[6][3] = TILE_TYPES.FELT;
        this.zoneGen.grid[3][3] = TILE_TYPES.FORGE;

        if (Math.random() < SPAWN_PROBABILITIES.INTERIOR.HOME_PENNE_NPC) {
            const pos = _findOpenNpcSpawn(this.zoneGen, 2);
            if (pos) this.zoneGen.grid[pos.y][pos.x] = TILE_TYPES.PENNE;
        }
        if (Math.random() < SPAWN_PROBABILITIES.INTERIOR.HOME_SQUIG_NPC) {
            const pos = _findOpenNpcSpawn(this.zoneGen, 2);
            if (pos) this.zoneGen.grid[pos.y][pos.x] = TILE_TYPES.SQUIG;
        }
    }

    placeHomeStatues() {
        this.zoneGen.grid[1][1] = TILE_TYPES.LIZARDY_STATUE;
        this.zoneGen.grid[1][2] = TILE_TYPES.LIZARDO_STATUE;
        this.zoneGen.grid[1][3] = TILE_TYPES.ZARD_STATUE;
        this.zoneGen.grid[1][5] = TILE_TYPES.LIZARDEAUX_STATUE;
        this.zoneGen.grid[1][6] = TILE_TYPES.LIZORD_STATUE;
        this.zoneGen.grid[1][7] = TILE_TYPES.LAZERD_STATUE;
    }

    placeHomeTables() {
        this.zoneGen.grid[6][6] = TILE_TYPES.TABLE;
        this.zoneGen.grid[5][7] = TILE_TYPES.TABLE;
        this.zoneGen.grid[6][7] = TILE_TYPES.TABLE;
    }

    placeHomeWallStatues() {
        const houseStartX = ZONE_CONSTANTS.HOUSE_START_POSITION.x;
        const houseStartY = ZONE_CONSTANTS.HOUSE_START_POSITION.y;
        const leftItems = [TILE_TYPES.BOMB_STATUE, TILE_TYPES.SPEAR_STATUE, TILE_TYPES.BOW_STATUE];
        const rightItems = [TILE_TYPES.HORSE_STATUE, TILE_TYPES.BOOK_STATUE, TILE_TYPES.SHOVEL_STATUE];

        for (let i = 0; i < 3; i++) {
            const y = houseStartY + i;
            const leftX = houseStartX - 2;
            const rightX = houseStartX + 4;

            const isSignLeft = this.zoneGen.grid[y][leftX]?.type === TILE_TYPES.SIGN;
            const isSignRight = this.zoneGen.grid[y][rightX]?.type === TILE_TYPES.SIGN;

            if (!isSignLeft) {
                validateAndSetTile(this.zoneGen.grid, leftX, y, leftItems[i]);
            }
            if (!isSignRight) {
                validateAndSetTile(this.zoneGen.grid, rightX, y, rightItems[i]);
            }
        }
    }

    placeTableItems() {
        const itemPool = [
            { type: TILE_TYPES.FOOD, foodType: this.foodAssets[Math.floor(Math.random() * this.foodAssets.length)] },
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
                if (itemToSpawn.type === TILE_TYPES.FOOD && (!this.foodAssets || this.foodAssets.length === 0)) {
                    this.zoneGen.grid[tableSpot.y][tableSpot.x] = TILE_TYPES.WATER;
                } else {
                    this.zoneGen.grid[tableSpot.y][tableSpot.x] = itemToSpawn;
                }
            }
        }
    }

    generateShackInterior() {
        // Note: Gouge's shack now uses a custom board (boards/canon/gouges.json)
        // which is registered dynamically when the wilds shack spawns.
        // The board system handles layout, so this procedural code is only used
        // for non-Gouge shacks.
        this.handleShackGouge();
        this.placeShackPort();
        this.placeShackItems();

        const portX = Math.floor(GRID_SIZE / 2);
        this.zoneGen.playerSpawn = { x: portX, y: Math.floor(GRID_SIZE / 2) + 1 };
        return this.buildHomeResult();
    }

    handleShackGouge() {
        // Gouge now spawns via board system (boards/canon/gouges.json)
        // This code is kept for backwards compatibility but won't run for Gouge's shack
        const isWildsShackZone = ZoneStateManager.wildsShackSpawnZone
            && this.zoneX === ZoneStateManager.wildsShackSpawnZone.x
            && this.zoneY === ZoneStateManager.wildsShackSpawnZone.y;

        if (isWildsShackZone) {
            // Board system will handle this, so this code path is not used
            // Left here for reference or fallback if board fails to load
            const gougePos = _findOpenNpcSpawn(this.zoneGen, 2);
            if (gougePos) this.zoneGen.grid[gougePos.y][gougePos.x] = TILE_TYPES.GOUGE;
        }
    }

    placeShackPort() {
        const portX = Math.floor(GRID_SIZE / 2);
        const portY = GRID_SIZE - 1;
        this.zoneGen.grid[portY][portX] = TILE_TYPES.PORT;
    }

    placeShackItems() {
        let additionalItems = 0;
        if (Math.random() < SPAWN_PROBABILITIES.INTERIOR.SHACK_ITEM_1) additionalItems++;
        if (additionalItems >= 1 && Math.random() < SPAWN_PROBABILITIES.INTERIOR.SHACK_ITEM_2) additionalItems++;
        if (additionalItems >= 2 && Math.random() < SPAWN_PROBABILITIES.INTERIOR.SHACK_ITEM_3) additionalItems++;
        if (additionalItems >= 3 && Math.random() < SPAWN_PROBABILITIES.INTERIOR.SHACK_ITEM_4) additionalItems++;
        if (additionalItems >= 4 && Math.random() < SPAWN_PROBABILITIES.INTERIOR.SHACK_ITEM_5) additionalItems++;
        const totalItems = 2 + additionalItems;

        for (let i = 0; i < totalItems; i++) {
            const pos = this.findValidShackSpawn();
            if (pos) {
                const isWater = Math.random() < 0.5;
                if (isWater) {
                    this.zoneGen.grid[pos.y][pos.x] = TILE_TYPES.WATER;
                } else {
                    if (this.foodAssets && this.foodAssets.length > 0) {
                        this.zoneGen.grid[pos.y][pos.x] = {
                            type: TILE_TYPES.FOOD,
                            foodType: this.foodAssets[Math.floor(Math.random() * this.foodAssets.length)]
                        };
                    } else {
                        this.zoneGen.grid[pos.y][pos.x] = TILE_TYPES.WATER;
                    }
                }
            }
        }
    }

    findValidShackSpawn() {
        const validSpawns = [];
        for (let y = 2; y < GRID_SIZE - 2; y++) {
            for (let x = 1; x < GRID_SIZE - 1; x++) {
                if (this.zoneGen.grid[y][x] === TILE_TYPES.FLOOR) {
                    validSpawns.push({ x, y });
                }
            }
        }
        if (validSpawns.length > 0) {
            return validSpawns[Math.floor(Math.random() * validSpawns.length)];
        }
        return null;
    }

    buildHomeResult() {
        return {
            grid: JSON.parse(JSON.stringify(this.zoneGen.grid)),
            enemies: [],
            playerSpawn: this.zoneGen.playerSpawn
        };
    }
}

export function handleInterior(zoneGen, zoneX, zoneY, foodAssets) {
    const handler = new InteriorHandler(zoneGen, zoneX, zoneY, foodAssets);
    return handler.generate();
}
