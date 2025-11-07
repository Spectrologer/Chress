import { TILE_TYPES, GRID_SIZE, SPAWN_PROBABILITIES } from '../constants/index';
import { logger } from '../logger';
import { ZoneStateManager } from '@generators/ZoneStateManager';
import { BaseZoneHandler } from './BaseZoneHandler';
import { findValidPlayerSpawn as _findValidPlayerSpawn } from '../zoneSpawnManager';
import { isPort, isTileType } from '@utils/TileUtils';
import type { Coordinates } from '../PositionTypes';
import type { ZoneGenerator } from '../ZoneGenerator';

interface ZoneConnections {
    north: number | null;
    south: number | null;
    west: number | null;
    east: number | null;
}

interface PortTransitionData {
    from: string;
    x?: number;
    y?: number;
}

interface ZoneGenerationResult {
    grid: unknown[][];
    enemies: unknown[];
    playerSpawn: Coordinates | null;
    returnToSurface?: {
        from: string;
        x?: number;
        y?: number;
    };
}

class UndergroundHandler extends BaseZoneHandler {
    private zoneConnections: ZoneConnections;
    private exitSide: string | null;

    constructor(
        zoneGen: ZoneGenerator,
        zoneX: number,
        zoneY: number,
        zoneConnections: ZoneConnections,
        foodAssets: string[],
        exitSide: string | null
    ) {
        // Extract current depth before super() call - accessing private property via any cast
        const currentDepth: number = (zoneGen as any).game?.player?.currentZone?.depth || (zoneGen as any).game?.player?.undergroundDepth || 1;
        super(zoneGen, zoneX, zoneY, foodAssets, 2, currentDepth);
        this.zoneConnections = zoneConnections;
        this.exitSide = exitSide;
    }

    generate(): ZoneGenerationResult {
        logger.log(`[ZONE SPAWN DEBUG] Generating zone (${this.zoneX}, ${this.zoneY}) - Level: ${this.zoneLevel}, Dimension: 2, FirstWildsPlaced: ${this.game.zoneGenState.firstWildsZonePlaced}, hasExits: ${this.exitSide !== null}`);

        this.generateExits(this.zoneConnections);
        this.incrementZoneCounter();

        if (!this.isHomeZone) {
            this.addRandomFeatures(true);
        }

        this.handlePortTransitions();
        this.addSpecialZoneItems();
        this.handleRandomStairdownPlacement();
        this.handleEnemySpawning();
        this.handleGossipNPCSpawning();
        this.ensureExitAccess();

        const transientState = this.zoneGen.game.transientGameState;
        const portData: PortTransitionData | null = transientState.getPortTransitionData();
        const isFromPitfall: boolean = portData?.from === 'pitfall';
        this.zoneGen.playerSpawn = this.findPlayerSpawn(isFromPitfall);

        const result: ZoneGenerationResult = this.buildResult();
        this.addReturnToSurfaceData(result);

        return result;
    }

    handlePortTransitions(): void {
        const transientState = this.zoneGen.game.transientGameState;
        const portData: PortTransitionData | null = transientState.getPortTransitionData();
        if (!portData) return;

        const { from, x, y } = portData;
        const handlers: Record<string, () => void> = {
            cistern: () => {
                this.structureGenerator.addCistern(this.zoneX, this.zoneY, true, x, y);
                this.zoneGen.gridManager.setTile(x, y + 1, TILE_TYPES.CISTERN);
            },
            hole: () => this.placeStairPort(x!, y!, 'stairup', from),
            pitfall: () => this.placeStairPort(x!, y!, 'stairup', from),
            stairdown: () => this.placeStairPort(x!, y!, 'stairup', from),
            stairup: () => this.placeStairPort(x!, y!, 'stairdown', from)
        };

        handlers[from]?.();
    }

    placeStairPort(x: number, y: number, portKind: string, from: string): void {
        this.zoneGen.gridManager.setTile(x, y, { type: TILE_TYPES.PORT, portKind });
        try { logger?.debug?.(`undergroundHandler: placed ${portKind} at (${x},${y}) from ${from}`); } catch (e) {}
    }

    handleRandomStairdownPlacement(): void {
        try {
            if (!this.isHomeZone && Math.random() < SPAWN_PROBABILITIES.STAIRS_DOWN) {
                const transientState = this.zoneGen.game.transientGameState;
                const portData: PortTransitionData | null = transientState.getPortTransitionData();
                const avoidX: number | undefined = portData?.x;
                const avoidY: number | undefined = portData?.y;

                for (let attempts: number = 0; attempts < 50; attempts++) {
                    const sx: number = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
                    const sy: number = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;

                    // Skip the emergence location if present
                    if (avoidX !== undefined && avoidY !== undefined && sx === avoidX && sy === avoidY) {
                        try { logger.debug?.(`Skipping random stairdown placement at emergence coords (${sx},${sy})`); } catch (e) {}
                        continue;
                    }

                    const tile = this.zoneGen.gridManager.getTile(sx, sy);
                    const isFloor: boolean = isTileType(tile, TILE_TYPES.FLOOR);
                    const isExit: boolean = isTileType(tile, TILE_TYPES.EXIT);
                    const isObjectPort: boolean = isPort(tile);

                    // Only place on a plain floor tile
                    if (isFloor && !isExit && !isObjectPort) {
                        this.zoneGen.gridManager.setTile(sx, sy, { type: TILE_TYPES.PORT, portKind: 'stairdown' });
                        try { logger.debug?.(`Placed random stairdown at (${sx},${sy})`); } catch (e) {}
                        break;
                    }
                }
            }
        } catch (e) {
            // Non-fatal if placement fails
        }
    }

    handleEnemySpawning(): void {
        const transientState = this.zoneGen.game.transientGameState;
        const portData: PortTransitionData | null = transientState.getPortTransitionData();
        const isFromPitfall: boolean = portData?.from === 'pitfall';
        const baseProbabilities: Record<number, number> = {
            1: SPAWN_PROBABILITIES.UNDERGROUND_ENEMY.HOME,
            2: SPAWN_PROBABILITIES.UNDERGROUND_ENEMY.WOODS,
            3: SPAWN_PROBABILITIES.UNDERGROUND_ENEMY.WILDS,
            4: SPAWN_PROBABILITIES.UNDERGROUND_ENEMY.FRONTIER
        };
        const multiplier: number = isFromPitfall ? SPAWN_PROBABILITIES.UNDERGROUND_ENEMY.PITFALL_MULTIPLIER : 1;
        const enemyProbability: number = this.calculateEnemyProbability(baseProbabilities, multiplier);
        this.spawnEnemyIfProbable(enemyProbability);
    }

    findPlayerSpawn(isFromPitfall: boolean): Coordinates | null {
        return _findValidPlayerSpawn(this.zoneGen, isFromPitfall);
    }

    addReturnToSurfaceData(result: ZoneGenerationResult): void {
        const transientState = this.zoneGen.game.transientGameState;
        const portData: PortTransitionData | null = transientState.getPortTransitionData();
        if (portData && (portData.from === 'hole' || portData.from === 'pitfall')) {
            result.returnToSurface = {
                from: portData.from,
                x: portData.x,
                y: portData.y
            };
        }
    }
}

export function handleUnderground(
    zoneGen: ZoneGenerator,
    zoneX: number,
    zoneY: number,
    zoneConnections: ZoneConnections,
    foodAssets: string[],
    exitSide: string | null
): ZoneGenerationResult {
    const handler: UndergroundHandler = new UndergroundHandler(zoneGen, zoneX, zoneY, zoneConnections, foodAssets, exitSide);
    return handler.generate();
}
