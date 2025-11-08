import { GRID_SIZE, TILE_TYPES } from '@core/constants/index';
import { logger } from '@core/logger';
import { createZoneKey } from '@utils/ZoneKeyUtils';
import { isWithinGrid } from '@utils/GridUtils';
import { isTileType, isTileObjectOfType, isTileObjectWithProperty, TileTypeChecker } from '@utils/TypeChecks';
import type { Game } from '@core/game';
import type { Position } from '@core/Position';
import type { TileObject } from '@core/SharedTypes';

export interface ZoneData {
    playerSpawn?: Position;
    metadata?: {
        playerSpawn?: Position;
    };
    returnToSurface?: {
        x: number;
        y: number;
    };
}

export interface PortTransitionData {
    from?: string;
    x?: number;
    y?: number;
    toInterior?: boolean;
}

interface TileWithPosition {
    x: number;
    y: number;
    [key: string]: unknown;
}

/**
 * ZoneTransitionCoordinator handles player positioning logic during zone transitions
 */
export class ZoneTransitionCoordinator {
    private game: Game;

    constructor(game: Game) {
        this.game = game;
    }

    /**
     * Initialize transition state (pitfall tracking,textbox reset, etc.)
     */
    public initializeTransitionState(exitSide: string): void {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this.game as any).lastExitSide = exitSide;

        const transientState = this.game.transientGameState;

        // Reset textbox message tracking for the new zone
        transientState.clearLastSignMessage();
        transientState.clearDisplayingSignMessage();

        // Set pitfall zone flag based on transition data
        const portData = transientState.getPortTransitionData();
        const isPitfallEntry = portData?.from === 'pitfall';

        if (exitSide !== 'port') {
            transientState.exitPitfallZone();
        }

        // If entering a pitfall zone, reset the turn counter
        if (isPitfallEntry) {
            transientState.enterPitfallZone();
        }
    }

    /**
     * Position player after pitfall transition
     */
    private _positionAfterPitfall(exitX: number, exitY: number): void {
        const playerFacade = this.game.playerFacade;
        const currentZone = playerFacade.getCurrentZone();

        const portZoneKey = createZoneKey(
            currentZone.x,
            currentZone.y,
            currentZone.dimension,
            currentZone.depth
        );
        const zoneData: ZoneData | undefined = this.game.zoneRepository.getByKey(portZoneKey);

        if (zoneData?.playerSpawn) {
            playerFacade.setPosition(zoneData.playerSpawn.x, zoneData.playerSpawn.y);
        } else {
            playerFacade.setPosition(exitX, exitY);
            this.validateAndSetTile(this.game.grid, exitX, exitY, TILE_TYPES.PORT);
        }
    }

    /**
     * Position player after entering an interior
     */
    private _positionAfterInteriorEntry(exitX: number, exitY: number): void {
        const playerFacade = this.game.playerFacade;
        const gridManager = this.game.gridManager;
        const transientState = this.game.transientGameState;
        const currentZone = playerFacade.getCurrentZone();

        // Get the surface port coordinates from transient state
        const portData = transientState.getPortTransitionData();
        const surfacePortX = portData?.x ?? exitX;
        const surfacePortY = portData?.y ?? exitY;

        // Default fallback position
        const defaultPortX = Math.floor(GRID_SIZE / 2);
        const defaultPortY = GRID_SIZE - 1; // bottom edge

        // PRIORITY 1: Try to use the surface port coordinates if they're valid
        if (surfacePortX != null && surfacePortY != null &&
            surfacePortX >= 0 && surfacePortX < GRID_SIZE &&
            surfacePortY >= 0 && surfacePortY < GRID_SIZE) {

            // If there's no PORT at this position, create one
            if (!gridManager.isTileType(surfacePortX, surfacePortY, TILE_TYPES.PORT)) {
                // Only create if the tile is walkable/replaceable
                const currentTile = gridManager.getTile(surfacePortX, surfacePortY);
                if (!currentTile || currentTile === TILE_TYPES.FLOOR ||
                    gridManager.isTileType(surfacePortX, surfacePortY, TILE_TYPES.FLOOR)) {
                    this.validateAndSetTile(this.game.grid, surfacePortX, surfacePortY, TILE_TYPES.PORT);
                }
            }

            // Place player at the corresponding interior port position
            if (gridManager.isTileType(surfacePortX, surfacePortY, TILE_TYPES.PORT)) {
                playerFacade.setPosition(surfacePortX, surfacePortY);
                return;
            }
        }

        // PRIORITY 2: Check if the zone has custom playerSpawn metadata (from board JSON)
        // Only use this if we don't have valid surface coordinates
        const zoneKey = createZoneKey(
            currentZone.x,
            currentZone.y,
            currentZone.dimension,
            currentZone.depth
        );
        const zoneData: ZoneData | undefined = this.game.zoneRepository.getByKey(zoneKey);

        // Only use board's playerSpawn if it's explicitly defined in metadata
        // (not the default center position from BoardLoader)
        if (zoneData?.metadata?.playerSpawn) {
            playerFacade.setPosition(zoneData.metadata.playerSpawn.x, zoneData.metadata.playerSpawn.y);
            return;
        }

        // PRIORITY 3: Check if a PORT with portKind 'interior' exists (entrance from surface)
        let interiorPortX: number | null = null;
        let interiorPortY: number | null = null;
        let anyPortX: number | null = null;
        let anyPortY: number | null = null;

        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                const tile = gridManager.getTile(x, y);
                if (gridManager.isTileType(x, y, TILE_TYPES.PORT)) {
                    // Store first PORT we find as fallback
                    if (anyPortX === null) {
                        anyPortX = x;
                        anyPortY = y;
                    }
                    // Check if it's specifically an interior port
                    if (isTileObjectWithProperty(tile, TILE_TYPES.PORT, 'portKind', 'interior')) {
                        interiorPortX = x;
                        interiorPortY = y;
                        break;
                    }
                }
            }
            if (interiorPortX !== null) break;
        }

        // PRIORITY 4: Prefer interior port, then any port, then create default
        if (interiorPortX !== null) {
            playerFacade.setPosition(interiorPortX, interiorPortY!);
        } else if (anyPortX !== null) {
            playerFacade.setPosition(anyPortX, anyPortY!);
        } else {
            // No PORT exists, create one at the default position
            this.validateAndSetTile(this.game.grid, defaultPortX, defaultPortY, TILE_TYPES.PORT);
            playerFacade.setPosition(defaultPortX, defaultPortY);
        }
    }

    /**
     * Position player after exiting underground to surface
     */
    private _positionAfterUndergroundExit(exitX: number, exitY: number): void {
        const playerFacade = this.game.playerFacade;
        const currentZone = playerFacade.getCurrentZone();
        let portX = exitX;
        let portY = exitY;

        try {
            const undergroundDepth = currentZone.depth;
            const undergroundZoneKey = createZoneKey(
                currentZone.x,
                currentZone.y,
                2,
                undergroundDepth
            );
            const undergroundData: ZoneData | undefined = this.game.zoneRepository.getByKey(undergroundZoneKey);

            if (undergroundData?.returnToSurface) {
                portX = undergroundData.returnToSurface.x;
                portY = undergroundData.returnToSurface.y;
            } else {
                const transientState = this.game.transientGameState;
                const portData = transientState.getPortTransitionData();
                if (portData && (portData.from === 'hole' || portData.from === 'pitfall')) {
                    portX = portData.x!;
                    portY = portData.y!;
                }
            }
        } catch (e) {
            // Non-fatal, fall back to exitX/exitY
        }

        this.validateAndSetTile(this.game.grid, portX, portY, TILE_TYPES.PORT);
        playerFacade.setPosition(portX, portY);
    }

    /**
     * Position player after exiting interior to surface
     */
    private _positionAfterInteriorExit(exitX: number, exitY: number): void {
        const playerFacade = this.game.playerFacade;
        const gridManager = this.game.gridManager;
        const currentZone = playerFacade.getCurrentZone();

        const interiorZoneKey = createZoneKey(currentZone.x, currentZone.y, 1);
        const interiorZoneData: ZoneData | undefined = this.game.zoneRepository.getByKey(interiorZoneKey);

        // Try recorded return coordinates
        if (interiorZoneData?.returnToSurface) {
            const { x: sx, y: sy } = interiorZoneData.returnToSurface;
            if (sx !== undefined && sy !== undefined) {
                playerFacade.setPosition(sx, sy);
                this.validateAndSetTile(this.game.grid, sx, sy, TILE_TYPES.PORT);
                return;
            }
        }

        // Try exit coords if they're a PORT
        if (isWithinGrid(exitX, exitY) && gridManager.isTileType(exitX, exitY, TILE_TYPES.PORT)) {
            playerFacade.setPosition(exitX, exitY);
            return;
        }

        // Search for any PORT tile using GridManager
        const portTile = gridManager.findFirst((tile: TileObject) => isTileType(tile, TILE_TYPES.PORT)) as TileWithPosition | undefined;
        if (portTile) {
            playerFacade.setPosition(portTile.x, portTile.y);
            return;
        }

        // Fallback to exitX/exitY
        playerFacade.setPosition(exitX, exitY);
        this.validateAndSetTile(this.game.grid, exitX, exitY, TILE_TYPES.PORT);
    }

    /**
     * Position player after regular port transition
     */
    private _positionAfterRegularPort(exitX: number, exitY: number): void {
        const playerFacade = this.game.playerFacade;
        playerFacade.setPosition(exitX, exitY);
        this.validateAndSetTile(this.game.grid, exitX, exitY, TILE_TYPES.PORT);
    }

    /**
     * Position player after returning to interior from underground via stairup
     */
    private _positionAfterUndergroundToInterior(exitX: number, exitY: number): void {
        const playerFacade = this.game.playerFacade;

        // Find the stairdown port in the interior
        let stairdownX: number | null = null;
        let stairdownY: number | null = null;
        const gridManager = this.game.gridManager;

        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                const tile = gridManager.getTile(x, y);
                if (isTileObjectWithProperty(tile, TILE_TYPES.PORT, 'portKind', 'stairdown')) {
                    stairdownX = x;
                    stairdownY = y;
                    break;
                }
            }
            if (stairdownX !== null) break;
        }

        // Position player at the stairdown port
        if (stairdownX !== null) {
            playerFacade.setPosition(stairdownX, stairdownY!);
        } else {
            // Fallback: place at exitX/exitY
            playerFacade.setPosition(exitX, exitY);
            this.validateAndSetTile(this.game.grid, exitX, exitY, TILE_TYPES.PORT);
        }
    }

    /**
     * Handle port positioning based on context
     */
    private _positionAfterPortTransition(exitX: number, exitY: number): void {
        const playerFacade = this.game.playerFacade;
        const transientState = this.game.transientGameState;
        const currentZone = playerFacade.getCurrentZone();
        const portData = transientState.getPortTransitionData();

        if (portData?.from === 'pitfall') {
            this._positionAfterPitfall(exitX, exitY);
        } else if (currentZone.dimension === 1 && portData?.toInterior) {
            // Returning to interior from underground via stairup
            this._positionAfterUndergroundToInterior(exitX, exitY);
        } else if (currentZone.dimension === 1) {
            // Entering interior from surface
            this._positionAfterInteriorEntry(exitX, exitY);
        } else if (currentZone.dimension === 0 && currentZone.portType === 'underground') {
            this._positionAfterUndergroundExit(exitX, exitY);
        } else if (currentZone.dimension === 0) {
            this._positionAfterInteriorExit(exitX, exitY);
        } else {
            this._positionAfterRegularPort(exitX, exitY);
        }
    }

    /**
     * Position player after transition based on exit side
     */
    public positionPlayerAfterTransition(exitSide: string, exitX: number, exitY: number): void {
        const gridManager = this.game.gridManager;
        const playerFacade = this.game.playerFacade;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const zoneGenerator = (this.game as any).zoneGenerator;

        switch (exitSide) {
            case 'bottom':
                // Came from bottom, enter north side at corresponding x position
                gridManager.setTile(exitX, 0, TILE_TYPES.EXIT);
                zoneGenerator.clearPathToExit(exitX, 0);
                playerFacade.setPosition(exitX, 0);
                break;
            case 'top':
                // Came from top, enter south side at corresponding x position
                gridManager.setTile(exitX, GRID_SIZE - 1, TILE_TYPES.EXIT);
                zoneGenerator.clearPathToExit(exitX, GRID_SIZE - 1);
                playerFacade.setPosition(exitX, GRID_SIZE - 1);
                break;
            case 'right':
                // Came from right, enter west side at corresponding y position
                gridManager.setTile(0, exitY, TILE_TYPES.EXIT);
                zoneGenerator.clearPathToExit(0, exitY);
                playerFacade.setPosition(0, exitY);
                break;
            case 'left':
                // Came from left, enter east side at corresponding y position
                gridManager.setTile(GRID_SIZE - 1, exitY, TILE_TYPES.EXIT);
                zoneGenerator.clearPathToExit(GRID_SIZE - 1, exitY);
                playerFacade.setPosition(GRID_SIZE - 1, exitY);
                break;
            case 'teleport':
                // Teleport: place in center
                playerFacade.setPosition(Math.floor(GRID_SIZE / 2), Math.floor(GRID_SIZE / 2));
                break;
            case 'port':
                this._positionAfterPortTransition(exitX, exitY);
                break;
            default:
                // Fallback to center
                playerFacade.setPosition(Math.floor(GRID_SIZE / 2), Math.floor(GRID_SIZE / 2));
                break;
        }
    }

    /**
     * Helper to safely set a tile on the grid, checking bounds.
     */
    public validateAndSetTile(gridOrGridManager: unknown, x: number, y: number, tile: TileObject | number): void {
        if (isWithinGrid(x, y)) {
            // Use gridManager if available
            const gridManager = this.game.gridManager;

            // If we're trying to set a primitive PORT tile, don't overwrite an existing
            // object-style PORT (which may contain metadata like portKind: 'stairup').
            if (tile === TILE_TYPES.PORT) {
                const existing = gridManager.getTile(x, y);
                if (isTileObjectOfType(existing, TILE_TYPES.PORT)) {
                    // Preserve the object port
                    return;
                }
            }

            gridManager.setTile(x, y, tile);
        }
    }
}
