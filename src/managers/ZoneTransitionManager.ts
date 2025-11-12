import { GRID_SIZE, TILE_TYPES, DIMENSION_CONSTANTS, GAMEPLAY_CONSTANTS } from '@core/constants/index';
import { MultiTileHandler } from '@renderers/MultiTileHandler';
import { getExitDirection } from '@core/utils/TransitionUtils';
import audioManager from '@utils/AudioManager';
import { eventBus } from '@core/EventBus';
import { EventTypes } from '@core/EventTypes';
import { createZoneKey } from '@utils/ZoneKeyUtils';
import type { Game } from '@core/game';
import type { InputManager } from './InputManager';
import type { GridManager } from './GridManager';
import type { ZoneRepository } from '@repositories/ZoneRepository';
import type { Position } from '@core/Position';
import type { Grid, Tile, TileObject } from '@core/SharedTypes';

export interface TapCoords {
    x: number;
    y: number;
}

export interface ZoneInfo {
    x: number;
    y: number;
    dimension: number;
    depth?: number;
}

export interface ZoneData {
    returnToInterior?: boolean;
    playerSpawn?: Position;
    grid?: Grid;
    enemies?: Array<{ x: number; y: number; enemyType: string; health: number; id: string }>;
    terrainTextures?: Record<string, string>;
    overlayTextures?: Record<string, string>;
    rotations?: Record<string, number>;
    overlayRotations?: Record<string, number>;
}

export interface TileData {
    type?: number;
    portKind?: string;
    interaction?: string;
    npc?: string;
}

interface PortTransitionData {
    from: string;
    x: number;
    y: number;
    toInterior?: boolean;
    fromDimension?: number;
}

export class ZoneTransitionManager {
    private game: Game;
    private inputManager: InputManager;

    constructor(game: Game, inputManager: InputManager) {
        this.game = game;
        this.inputManager = inputManager;
    }

    /**
     * Checks if a tap gesture should trigger a zone transition.
     * Validates that the player is on an EXIT tile and tapping toward/beyond the edge.
     */
    public checkForZoneTransitionGesture(tapCoords: TapCoords, playerPos: Position): boolean {
        const gridManager: GridManager = this.game.gridManager;
        if (!this.game.grid || !Array.isArray(this.game.grid)) return false;
        if (playerPos.y < 0 || playerPos.y >= GRID_SIZE || playerPos.x < 0 || playerPos.x >= GRID_SIZE) return false;
        if (!gridManager.isWithinBounds(playerPos.x, playerPos.y)) return false;

        // If player is on an exit tile and taps outside the grid or on the same edge, trigger transition
        const isOnExit: boolean = gridManager.isTileType(playerPos.x, playerPos.y, TILE_TYPES.EXIT);
        if (!isOnExit) return false;

        // Check if tap is outside grid boundaries (attempting to go beyond current zone)
        if (tapCoords.x < 0 || tapCoords.x >= GRID_SIZE || tapCoords.y < 0 || tapCoords.y >= GRID_SIZE) {
            this.handleExitTap(playerPos.x, playerPos.y);
            return true;
        }

        // Check if player is on edge exit and tapping towards that edge
        if (playerPos.y === 0 && tapCoords.y < playerPos.y) {
            // On top edge, tapping up/beyond row
            this.handleExitTap(playerPos.x, playerPos.y);
            return true;
        } else if (playerPos.y === GRID_SIZE - 1 && tapCoords.y > playerPos.y) {
            // On bottom edge, tapping down/beyond row
            this.handleExitTap(playerPos.x, playerPos.y);
            return true;
        } else if (playerPos.x === 0 && tapCoords.x < playerPos.x) {
            // On left edge, tapping left/beyond column
            this.handleExitTap(playerPos.x, playerPos.y);
            return true;
        } else if (playerPos.x === GRID_SIZE - 1 && tapCoords.x > playerPos.x) {
            // On right edge, tapping right/beyond column
            this.handleExitTap(playerPos.x, playerPos.y);
            return true;
        }

        return false;
    }

    /**
     * Handles tapping on exit tiles to trigger zone transitions.
     * Determines the exit direction and simulates a keyboard event.
     */
    public handleExitTap(exitX: number, exitY: number): void {
        const direction: string | null = getExitDirection(exitX, exitY);

        if (direction) {
            // Simulate the key press to trigger zone transition
            const fakeEvent = {
                key: direction,
                preventDefault: () => {},
                stopPropagation: () => {},
                bubbles: false,
                cancelable: true,
                composed: false
            } as unknown as KeyboardEvent;
            this.inputManager.handleKeyPress(fakeEvent);
        }
    }

    /**
     * Handles player transition through a PORT tile (cistern, hole, stairs, door).
     * Manages dimension changes between surface, underground, and interior zones.
     */
    public handlePortTransition(): void {
        const gridManager = this.game.gridManager;
        const playerFacade = this.game.playerFacade;
        const transientState = this.game.transientGameState;

        if (!gridManager || !playerFacade || !transientState) {
            return;
        }

        const playerPos: Position = playerFacade.getPosition();
        const currentDim: number = playerFacade.getZoneDimension();

        // Check if player is in a pitfall zone and hasn't survived required turns yet
        if (transientState.isInPitfallZone() && transientState.getPitfallTurnsSurvived() < GAMEPLAY_CONSTANTS.PITFALL_SURVIVAL_TURNS) {
            const turnsRemaining: number = GAMEPLAY_CONSTANTS.PITFALL_SURVIVAL_TURNS - transientState.getPitfallTurnsSurvived();
            const turnText: string = turnsRemaining === 1 ? 'turn' : 'turns';
            // Use event instead of direct UIManager call
            eventBus.emit(EventTypes.UI_OVERLAY_MESSAGE_SHOW, {
                text: `You must survive ${turnsRemaining} more ${turnText} to escape!`,
                persistent: false,
                largeText: false,
                useTypewriter: true
            });
            audioManager.playSound('error', { game: this.game });
            return;
        }

        let targetDim: number;
        let portType: string;

        if (currentDim === DIMENSION_CONSTANTS.SURFACE) {
            // On the surface, determine where the PORT leads
            // Check if there's a CISTERN tile below the player's position (cisterns are now 1x1 grate objects)
            const tileBelow = gridManager.isWithinBounds(playerPos.x, playerPos.y + 1)
                ? gridManager.getTile(playerPos.x, playerPos.y + 1)
                : undefined;
            const isCistern = tileBelow === TILE_TYPES.CISTERN;
            const isHole: boolean = MultiTileHandler.isHole(playerPos.x, playerPos.y, gridManager as any);

            if (isCistern) {
                // Entering underground via cistern
                targetDim = DIMENSION_CONSTANTS.UNDERGROUND;
                portType = 'underground';
                transientState.setPortTransitionData({ from: 'cistern', x: playerPos.x, y: playerPos.y });
                // Ensure player's underground depth is initialized to 1 (first underground level)
                playerFacade.setUndergroundDepth(DIMENSION_CONSTANTS.DEFAULT_UNDERGROUND_DEPTH);
            } else if (isHole) {
                targetDim = DIMENSION_CONSTANTS.UNDERGROUND;
                portType = 'underground';
                transientState.setPortTransitionData({ from: 'hole', x: playerPos.x, y: playerPos.y });
                // Ensure player's underground depth is initialized to 1 (first underground level)
                playerFacade.setUndergroundDepth(DIMENSION_CONSTANTS.DEFAULT_UNDERGROUND_DEPTH);
            } else if (gridManager.getTile(playerPos.x, playerPos.y) && (gridManager.getTile(playerPos.x, playerPos.y) as TileObject).portKind === 'stairdown') {
                // Descend via stairdown into a deeper underground level
                // We represent deeper underground layers by keeping dimension=2 and tracking depth via player.undergroundDepth
                targetDim = DIMENSION_CONSTANTS.UNDERGROUND;
                portType = 'underground';
                // Mark transition as from stairdown so the new zone can place a stairup at emergence point
                transientState.setPortTransitionData({ from: 'stairdown', x: playerPos.x, y: playerPos.y });
                // Increase player's underground depth (surface==0 -> first underground == 1)
                const prevDepth: number = playerFacade.getUndergroundDepth();
                const newDepth: number = prevDepth + 1;
                playerFacade.setUndergroundDepth(newDepth);
            } else if (gridManager.getTile(playerPos.x, playerPos.y) && (gridManager.getTile(playerPos.x, playerPos.y) as TileObject).portKind === 'stairup') {
                // Ascend via stairup to a shallower underground level or surface
                const prevDepth: number = playerFacade.getUndergroundDepth();
                // Decrease depth; if we were at depth 1, ascending returns to surface (depth 0)
                if (prevDepth > 1) {
                    targetDim = DIMENSION_CONSTANTS.UNDERGROUND;
                    portType = 'underground';
                    transientState.setPortTransitionData({ from: 'stairup', x: playerPos.x, y: playerPos.y });
                    const newDepth: number = prevDepth - 1;
                    playerFacade.setUndergroundDepth(newDepth);
                } else {
                    // prevDepth is 0 or 1 -> return to surface
                    targetDim = DIMENSION_CONSTANTS.SURFACE;
                    portType = playerFacade.getPortType();
                    // Mark transition so the surface emergence will get the matching stairdown
                    transientState.setPortTransitionData({ from: 'stairup', x: playerPos.x, y: playerPos.y });
                    playerFacade.setUndergroundDepth(DIMENSION_CONSTANTS.DEFAULT_SURFACE_DEPTH);
                }
            } else {
                // Entering interior via house/shack door
                targetDim = DIMENSION_CONSTANTS.INTERIOR;
                portType = 'interior';
                // Record the surface port coords so we can return the player to this exact port when exiting the interior
                transientState.setPortTransitionData({ from: 'interior', x: playerPos.x, y: playerPos.y });
            }
        } else {
            // Exiting to surface or handling stair transitions while underground or interior
            const tileUnderPlayer: Tile | undefined = gridManager.getTile(playerPos.x, playerPos.y);
            const portKind: string | undefined = tileUnderPlayer && typeof tileUnderPlayer === 'object' && 'portKind' in tileUnderPlayer ? (tileUnderPlayer as TileObject).portKind : undefined;

            // If currently in underground, check for stair portals that should change depth rather than exit to surface
            if (currentDim === DIMENSION_CONSTANTS.UNDERGROUND) {
                if (portKind === 'stairdown') {
                    // Descend further: keep dimension=2 but increase player's underground depth and mark transition
                    targetDim = DIMENSION_CONSTANTS.UNDERGROUND;
                    portType = 'underground';
                    transientState.setPortTransitionData({ from: 'stairdown', x: playerPos.x, y: playerPos.y });
                    const prevDepth2: number = playerFacade.getUndergroundDepth();
                    playerFacade.setUndergroundDepth(prevDepth2 + 1);
                } else if (portKind === 'stairup') {
                    // Ascend one level: if depth > 1, stay in underground with decreased depth; if depth == 1, check if we should return to interior or surface
                    const currentDepth: number = playerFacade.getUndergroundDepth();
                    if (currentDepth > 1) {
                        targetDim = DIMENSION_CONSTANTS.UNDERGROUND;
                        portType = 'underground';
                        transientState.setPortTransitionData({ from: 'stairup', x: playerPos.x, y: playerPos.y });
                        playerFacade.setUndergroundDepth(currentDepth - 1);
                    } else {
                        // Depth 1 - check if this underground zone is connected to an interior
                        const currentZone: ZoneInfo = playerFacade.getCurrentZone();
                        const undergroundZoneKey: string = createZoneKey(
                            currentZone.x,
                            currentZone.y,
                            DIMENSION_CONSTANTS.UNDERGROUND,
                            currentDepth
                        );
                        const zoneRepository = this.game.zoneRepository;
                        const undergroundZoneData: ZoneData | undefined = zoneRepository?.getByKey(undergroundZoneKey);

                        if (undergroundZoneData?.returnToInterior) {
                            // Return to interior dimension
                            targetDim = DIMENSION_CONSTANTS.INTERIOR;
                            portType = 'interior';
                            transientState.setPortTransitionData({ from: 'stairup', x: playerPos.x, y: playerPos.y, toInterior: true });
                            playerFacade.setUndergroundDepth(DIMENSION_CONSTANTS.DEFAULT_SURFACE_DEPTH);
                        } else {
                            // Return to surface
                            targetDim = DIMENSION_CONSTANTS.SURFACE;
                            portType = playerFacade.getPortType();
                            transientState.setPortTransitionData({ from: 'stairup', x: playerPos.x, y: playerPos.y });
                            playerFacade.setUndergroundDepth(DIMENSION_CONSTANTS.DEFAULT_SURFACE_DEPTH);
                        }
                    }
                } else {
                    // Regular port: surface exit
                    targetDim = DIMENSION_CONSTANTS.SURFACE;
                    portType = playerFacade.getPortType();
                }
            } else if (currentDim === DIMENSION_CONSTANTS.INTERIOR) {
                // Handle stair transitions from interior dimension
                if (portKind === 'stairdown') {
                    // Descend from interior to underground
                    targetDim = DIMENSION_CONSTANTS.UNDERGROUND;
                    portType = 'underground';
                    transientState.setPortTransitionData({ from: 'stairdown', x: playerPos.x, y: playerPos.y, fromDimension: currentDim });
                    // Ensure player's underground depth is initialized to 1 (first underground level)
                    playerFacade.setUndergroundDepth(DIMENSION_CONSTANTS.DEFAULT_UNDERGROUND_DEPTH);
                } else if (portKind === 'stairup') {
                    // Ascend from interior - this is unusual but would go to surface
                    targetDim = DIMENSION_CONSTANTS.SURFACE;
                    portType = playerFacade.getPortType();
                    transientState.setPortTransitionData({ from: 'stairup', x: playerPos.x, y: playerPos.y });
                    playerFacade.setUndergroundDepth(DIMENSION_CONSTANTS.DEFAULT_SURFACE_DEPTH);
                } else {
                    // Regular port: surface exit (normal interior->surface transition)
                    targetDim = DIMENSION_CONSTANTS.SURFACE;
                    portType = playerFacade.getPortType();
                }
            } else {
                // Exiting to surface from other dimensions
                targetDim = DIMENSION_CONSTANTS.SURFACE;
                portType = playerFacade.getPortType();
            }
        }

        // Use PlayerFacade to atomically update zone state
        playerFacade.updateZoneState({
            dimension: targetDim,
            portType: portType
        });

        const currentZone: ZoneInfo = playerFacade.getCurrentZone();
        this.game.transitionToZone(currentZone.x, currentZone.y, 'port', playerPos.x, playerPos.y);
    }

    /**
     * Handles player falling through a pitfall trap.
     * Transitions player to underground dimension and marks the surface tile.
     */
    public handlePitfallTransition(x: number, y: number): void {
        const gridManager = this.game.gridManager;
        const transientState = this.game.transientGameState;
        const playerFacade = this.game.playerFacade;

        if (!gridManager || !transientState || !playerFacade) {
            return;
        }

        if (gridManager.isWithinBounds(x, y)) {
            gridManager.setTile(x, y, TILE_TYPES.PITFALL);
        }

        // Set data for the transition
        transientState.setPortTransitionData({ from: 'pitfall', x, y });

        // Transition to the underground dimension
        // Use PlayerFacade to atomically update zone state
        playerFacade.updateZoneState({
            dimension: 2, // Underground
            portType: 'underground',
            depth: 1 // First underground level
        });

        const currentZone: ZoneInfo = playerFacade.getCurrentZone();
        this.game.transitionToZone(currentZone.x, currentZone.y, 'port', x, y);
        // Some callers/tests expect portTransitionData to remain available immediately after
        // calling handlePitfallTransition. The ZoneManager.transitionToZone clears it at the
        // end of the transition; to support those expectations (and to preserve the
        // original coordinates for any immediate post-transition logic), restore it here.
        transientState.setPortTransitionData({ from: 'pitfall', x, y });
    }

    /**
     * Checks if the tapped coordinates are eligible for a zone transition.
     * Returns true if a transition was triggered (EXIT or PORT tile).
     */
    public isTransitionEligible(gridCoords: Position, playerPos: Position): boolean {
        // Check if tapped tile is an exit and player is already on it - trigger zone transition
        if (gridCoords.x === playerPos.x && gridCoords.y === playerPos.y) {
            const gridManager = this.game.gridManager;
            if (!gridManager) {
                return false;
            }

            const tileUnderPlayer: Tile | undefined = gridManager.getTile(playerPos.x, playerPos.y);

            if (tileUnderPlayer === TILE_TYPES.EXIT) {
                this.handleExitTap(gridCoords.x, gridCoords.y);
                return true;
            } else if (tileUnderPlayer === TILE_TYPES.PORT || (tileUnderPlayer && (tileUnderPlayer as TileObject).type === TILE_TYPES.PORT)) {
                this.handlePortTransition();
                return true;
            }
        }
        return false;
    }
}
