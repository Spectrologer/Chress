/**
 * ZoneManager - Orchestrates zone transitions and world navigation.
 *
 * Responsibilities:
 * 1. Zone Transitions: Moving between adjacent zones
 * 2. Zone Generation: Creating new zones or loading existing ones (delegated)
 * 3. Player Positioning: Placing player at correct entrance/exit
 * 4. State Persistence: Saving/loading zone data (delegated)
 * 5. Special Features: Treasure spawning, port transitions
 *
 * Refactored Architecture:
 * - ZoneTransitionCoordinator: Handles player positioning logic
 * - ZoneTreasureManager: Manages special item spawns
 * - ZoneEventEmitter: Emits events and saves state
 * - ZoneGenerationOrchestrator: Zone generation and loading
 * - ZonePersistenceManager: Zone state saving
 */
import { TILE_TYPES } from '../core/constants/index.js';
import { ZoneTransitionCoordinator } from './ZoneTransitionCoordinator.js';
import { ZoneTreasureManager } from './ZoneTreasureManager.js';
import { ZoneEventEmitter } from './ZoneEventEmitter.js';
import { ZoneGenerationOrchestrator } from './ZoneGenerationOrchestrator.js';
import { ZonePersistenceManager } from './ZonePersistenceManager.js';

interface EnemyData {
    x: number;
    y: number;
    enemyType: string;
    health: number;
    id: string;
}

interface PlayerSpawn {
    x: number;
    y: number;
}

interface ReturnCoords {
    x: number;
    y: number;
    zoneX?: number;
    zoneY?: number;
}

interface ZoneData {
    grid: Array<Array<any>>;
    enemies: EnemyData[];
    playerSpawn: PlayerSpawn | null;
    returnToSurface?: ReturnCoords;
    returnToInterior?: ReturnCoords;
}

export interface Treasure {
    x: number;
    y: number;
    type: string;
}

interface Game {
    playerFacade: any;
    player: any;
    gridManager: any;
    enemyCollection: any;
    npcManager: any;
    npcRenderer: any;
    zoneRepository: any;
    zoneGenerator: any;
    connectionManager: any;
    transientGameState: any;
    Enemy: any;
    grid: Array<Array<any>>;
    zones: Record<string, any>;
    availableFoodAssets: string[];
    lastExitSide?: string;
    defeatedEnemies: Set<string>;
    _services?: any;
    _newGameSpawnPosition?: any;
    generateZone: () => void;
}

export class ZoneManager {
    private game: Game;
    private transitionCoordinator: ZoneTransitionCoordinator;
    private treasureManager: ZoneTreasureManager;
    private eventEmitter: ZoneEventEmitter;
    private generationOrchestrator: ZoneGenerationOrchestrator;
    private persistenceManager: ZonePersistenceManager;

    /**
     * Creates a new ZoneManager instance.
     *
     * @param game - The main game instance
     */
    constructor(game: Game) {
        this.game = game;
        this.transitionCoordinator = new ZoneTransitionCoordinator(game);
        this.treasureManager = new ZoneTreasureManager(game);
        this.eventEmitter = new ZoneEventEmitter(game);
        this.generationOrchestrator = new ZoneGenerationOrchestrator(game, this.transitionCoordinator);
        this.persistenceManager = new ZonePersistenceManager(game);
    }

    /**
     * Executes a complete zone transition sequence.
     *
     * @param newZoneX - Target zone X coordinate
     * @param newZoneY - Target zone Y coordinate
     * @param exitSide - Exit used ('north', 'south', 'east', 'west', 'port', 'pitfall')
     * @param exitX - X coordinate of exit used
     * @param exitY - Y coordinate of exit used
     */
    transitionToZone(newZoneX: number, newZoneY: number, exitSide: string, exitX: number, exitY: number): void {
        const playerFacade = this.game.playerFacade;
        const gridManager = this.game.gridManager;

        // Step 1: Initialize transition state
        this.transitionCoordinator.initializeTransitionState(exitSide);

        const zoneKey = `${newZoneX},${newZoneY}`;

        // Step 2: Update player's current zone coordinates
        playerFacade.setCurrentZone(newZoneX, newZoneY);

        // Step 3: Apply survival penalties for normal transitions
        if (exitSide !== 'port') {
            playerFacade.onZoneTransition();
        }

        // Step 4: Generate or load the target zone
        this.game.generateZone();

        // Step 5: Position player at appropriate entrance
        this.transitionCoordinator.positionPlayerAfterTransition(exitSide, exitX, exitY);

        // Step 6: Clear blocking tiles at spawn position
        const playerPos = playerFacade.getPosition();
        if (gridManager.isTileType(playerPos.x, playerPos.y, TILE_TYPES.SHRUBBERY)) {
            gridManager.setTile(playerPos.x, playerPos.y, TILE_TYPES.EXIT);
        }

        // Step 7: Validate player position
        this.game.player.ensureValidPosition(this.game.grid);

        // Sync lastX/lastY to prevent visual interpolation glitches
        playerFacade.setLastPosition(playerPos.x, playerPos.y);

        // Step 8: Check for special treasures
        this.treasureManager.handleSpecialZoneTreasures(zoneKey);

        // Step 9: Emit events and persist state
        this.eventEmitter.finalizeTransition(newZoneX, newZoneY);
    }

    /**
     * Generates or loads a zone at the player's current location.
     * Delegates to ZoneGenerationOrchestrator.
     */
    generateZone(): void {
        this.generationOrchestrator.generateZone();
    }

    /**
     * Spawns treasure items on the grid at specified positions.
     * Delegates to ZoneTreasureManager.
     *
     * @param treasures - Array of treasure definitions
     */
    spawnTreasuresOnGrid(treasures: Treasure[]): void {
        this.treasureManager.spawnTreasuresOnGrid(treasures);
    }

    /**
     * Saves the current zone's state to the zone repository.
     * Delegates to ZonePersistenceManager.
     */
    saveCurrentZoneState(): void {
        this.persistenceManager.saveCurrentZoneState();
    }
}
