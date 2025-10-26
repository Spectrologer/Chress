import { TILE_TYPES, GRID_SIZE } from '../constants.js';
import logger from '../logger.js';
import { ZoneStateManager } from '../../generators/ZoneStateManager.js';
import { BaseZoneHandler } from './BaseZoneHandler.js';
import { findValidPlayerSpawn as _findValidPlayerSpawn } from '../zoneSpawnManager.js';

class UndergroundHandler extends BaseZoneHandler {
    constructor(zoneGen, zoneX, zoneY, zoneConnections, foodAssets, exitSide) {
        const currentDepth = zoneGen.game?.player?.currentZone?.depth || zoneGen.game?.player?.undergroundDepth || 1;
        super(zoneGen, zoneX, zoneY, foodAssets, 2, currentDepth);
        this.zoneConnections = zoneConnections;
        this.exitSide = exitSide;
    }

    generate() {
        logger.log(`[ZONE SPAWN DEBUG] Generating zone (${this.zoneX}, ${this.zoneY}) - Level: ${this.zoneLevel}, Dimension: 2, FirstWildsPlaced: ${ZoneStateManager.firstWildsZonePlaced}, hasExits: ${this.exitSide !== null}`);

        this.generateExits(this.zoneConnections);
        this.incrementZoneCounter();

        if (!this.isHomeZone) {
            this.addRandomFeatures(true);
        }

        this.handlePortTransitions();
        this.addSpecialZoneItems();
        this.handleRandomStairdownPlacement();
        this.handleEnemySpawning();
        this.ensureExitAccess();

        const isFromPitfall = this.zoneGen.game.portTransitionData?.from === 'pitfall';
        this.zoneGen.playerSpawn = this.findPlayerSpawn(isFromPitfall);

        const result = this.buildResult();
        this.addReturnToSurfaceData(result);

        return result;
    }

    handlePortTransitions() {
        if (!this.zoneGen.game.portTransitionData) return;

        const { from, x, y } = this.zoneGen.game.portTransitionData;
        const isFromHole = from === 'hole';
        const isFromCistern = from === 'cistern';
        const isFromPitfall = from === 'pitfall';
        const isFromStairDown = from === 'stairdown';
        const isFromStairUp = from === 'stairup';

        if (isFromCistern) {
            this.structureGenerator.addCistern(this.zoneX, this.zoneY, true, x, y);
            this.zoneGen.grid[y + 1][x] = TILE_TYPES.CISTERN;
        } else if (isFromHole || isFromPitfall) {
            // Represent surface emergence as an up-stair object port
            this.zoneGen.grid[y][x] = { type: TILE_TYPES.PORT, portKind: 'stairup' };
            try { logger?.debug?.(`undergroundHandler: placed stairup at (${x},${y}) from ${from}`); } catch (e) {}
        } else if (isFromStairDown) {
            // Player descended using a stairdown: place a stairup at the emergence point
            this.zoneGen.grid[y][x] = { type: TILE_TYPES.PORT, portKind: 'stairup' };
            try { logger?.debug?.(`undergroundHandler: placed stairup at (${x},${y}) from stairdown`); } catch (e) {}
        } else if (isFromStairUp) {
            // Player ascended using a stairup: place a stairdown at the emergence point
            this.zoneGen.grid[y][x] = { type: TILE_TYPES.PORT, portKind: 'stairdown' };
            try { logger?.debug?.(`undergroundHandler: placed stairdown at (${x},${y}) from stairup`); } catch (e) {}
        }
    }

    handleRandomStairdownPlacement() {
        try {
            if (!this.isHomeZone && Math.random() < 0.15) {
                const avoidX = this.zoneGen.game?.portTransitionData?.x;
                const avoidY = this.zoneGen.game?.portTransitionData?.y;

                for (let attempts = 0; attempts < 50; attempts++) {
                    const sx = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
                    const sy = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;

                    // Skip the emergence location if present
                    if (avoidX !== undefined && avoidY !== undefined && sx === avoidX && sy === avoidY) {
                        try { logger.debug?.(`Skipping random stairdown placement at emergence coords (${sx},${sy})`); } catch (e) {}
                        continue;
                    }

                    const tile = this.zoneGen.grid[sy][sx];
                    const isFloor = tile === TILE_TYPES.FLOOR || (tile && tile.type === TILE_TYPES.FLOOR);
                    const isExit = tile === TILE_TYPES.EXIT;
                    const isObjectPort = tile && typeof tile === 'object' && tile.type === TILE_TYPES.PORT;

                    // Only place on a plain floor tile
                    if (isFloor && !isExit && !isObjectPort) {
                        this.zoneGen.grid[sy][sx] = { type: TILE_TYPES.PORT, portKind: 'stairdown' };
                        try { logger.debug?.(`Placed random stairdown at (${sx},${sy})`); } catch (e) {}
                        break;
                    }
                }
            }
        } catch (e) {
            // Non-fatal if placement fails
        }
    }

    handleEnemySpawning() {
        const isFromPitfall = this.zoneGen.game.portTransitionData?.from === 'pitfall';
        const baseProbabilities = { 1: 0.15, 2: 0.20, 3: 0.22, 4: 0.27 };
        const multiplier = isFromPitfall ? 2.5 : 1;
        const enemyProbability = this.calculateEnemyProbability(baseProbabilities, multiplier);
        this.spawnEnemyIfProbable(enemyProbability);
    }

    findPlayerSpawn(isFromPitfall) {
        return _findValidPlayerSpawn(this.zoneGen, isFromPitfall);
    }

    addReturnToSurfaceData(result) {
        const portData = this.zoneGen.game.portTransitionData;
        if (portData && (portData.from === 'hole' || portData.from === 'pitfall')) {
            result.returnToSurface = {
                from: portData.from,
                x: portData.x,
                y: portData.y
            };
        }
    }
}

export function handleUnderground(zoneGen, zoneX, zoneY, zoneConnections, foodAssets, exitSide) {
    const handler = new UndergroundHandler(zoneGen, zoneX, zoneY, zoneConnections, foodAssets, exitSide);
    return handler.generate();
}
