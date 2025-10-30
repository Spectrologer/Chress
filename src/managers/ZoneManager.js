// @ts-check

/**
 * @typedef {Object} Game
 * @property {any} player
 * @property {any} playerFacade
 * @property {any} gridManager
 * @property {any} enemyCollection
 * @property {any} npcManager
 * @property {any} npcRenderer
 * @property {any} zoneRepository
 * @property {any} zoneGenerator
 * @property {any} connectionManager
 * @property {any} transientGameState
 * @property {any} Enemy
 * @property {Array<Array<any>>} grid
 * @property {Object} zones
 * @property {Array<string>} availableFoodAssets
 * @property {string} [lastExitSide]
 * @property {Set<string>} defeatedEnemies
 * @property {any} [_services]
 * @property {any} [_newGameSpawnPosition]
 * @property {Function} generateZone
 */

/**
 * @typedef {Object} ZoneData
 * @property {Array<Array<any>>} grid - Zone grid
 * @property {Array<EnemyData>} enemies - Enemy list
 * @property {PlayerSpawn|null} playerSpawn - Spawn position
 * @property {ReturnCoords} [returnToSurface] - Surface return coords
 * @property {ReturnCoords} [returnToInterior] - Interior return coords
 */

/**
 * @typedef {Object} EnemyData
 * @property {number} x - X position
 * @property {number} y - Y position
 * @property {string} enemyType - Enemy type
 * @property {number} health - Health points
 * @property {string} id - Unique identifier
 */

/**
 * @typedef {Object} PlayerSpawn
 * @property {number} x - Spawn X coordinate
 * @property {number} y - Spawn Y coordinate
 */

/**
 * @typedef {Object} ReturnCoords
 * @property {number} x - X coordinate
 * @property {number} y - Y coordinate
 * @property {number} [zoneX] - Zone X coordinate
 * @property {number} [zoneY] - Zone Y coordinate
 */

/**
 * @typedef {Object} Treasure
 * @property {number} x - Grid X coordinate
 * @property {number} y - Grid Y coordinate
 * @property {string} type - Item type to spawn
 */

/**
 * ZoneManager - Orchestrates zone transitions and world navigation.
 *
 * Responsibilities:
 * 1. Zone Transitions: Moving between adjacent zones
 * 2. Zone Generation: Creating new zones or loading existing ones
 * 3. Player Positioning: Placing player at correct entrance/exit
 * 4. State Persistence: Saving/loading zone data
 * 5. Special Features: Treasure spawning, port transitions
 *
 * Architecture (Delegation Pattern):
 * - ZoneTransitionCoordinator: Handles player positioning logic
 * - ZoneTreasureManager: Manages special item spawns
 * - ZoneEventEmitter: Emits events and saves state
 *
 * Zone Types:
 * - Surface (dimension 0): Procedurally generated overworld
 * - Interior (dimension 1): Building interiors accessed via ports
 * - Underground (dimension 2): Cave systems with depth levels
 *
 * Transition Types:
 * - Exit: Move to adjacent zone via edge exit
 * - Port: Teleport to interior/underground
 * - Pitfall: Fall to underground level
 * - Stairs: Return from interior/underground
 *
 * State Management:
 * - Existing zones loaded from ZoneRepository
 * - New zones generated and saved
 * - Return coordinates preserved for ports/pitfalls
 */
import { GRID_SIZE, TILE_TYPES } from '../core/constants/index.js';
import { logger } from '../core/logger.js';
import { createZoneKey } from '../utils/ZoneKeyUtils.js';
import { isWithinGrid } from '../utils/GridUtils.js';
import { isTileObjectOfType, isTileObjectWithProperty, isPitfall } from '../utils/TypeChecks.js';
import { ZoneTransitionCoordinator } from './ZoneTransitionCoordinator.js';
import { ZoneTreasureManager } from './ZoneTreasureManager.js';
import { ZoneEventEmitter } from './ZoneEventEmitter.js';

export class ZoneManager {
    /**
     * Creates a new ZoneManager instance.
     *
     * @param {Game} game - The main game instance
     */
    constructor(game) {
        /** @type {Game} */
        this.game = game;

        /** @type {ZoneTransitionCoordinator} */
        this.transitionCoordinator = new ZoneTransitionCoordinator(game);

        /** @type {ZoneTreasureManager} */
        this.treasureManager = new ZoneTreasureManager(game);

        /** @type {ZoneEventEmitter} */
        this.eventEmitter = new ZoneEventEmitter(game);
    }


    /**
     * Executes a complete zone transition sequence.
     * Handles player movement from one zone to another.
     *
     * Transition Sequence:
     * 1. Initialize transition state (record exit side)
     * 2. Update player's zone coordinates
     * 3. Apply zone transition penalties (hunger/thirst, except ports)
     * 4. Generate or load target zone
     * 5. Position player at appropriate entrance
     * 6. Clear blocking tiles if necessary
     * 7. Validate player position
     * 8. Check for special treasures
     * 9. Emit events and save state
     *
     * Exit Side Effects:
     * - 'north', 'south', 'east', 'west': Normal zone transition
     *   - Player spawns at opposite edge
     *   - Hunger/thirst decrease
     * - 'port': Teleport to interior/underground
     *   - No hunger/thirst penalty
     *   - Spawn at port location or safe position
     * - 'pitfall': Fall to underground
     *   - Spawn at emergence point
     *
     * Position Validation:
     * - If player spawns on shrubbery: Replace with exit
     * - Ensure walkable tile (fallback to nearby valid tile)
     * - Sync lastX/lastY to prevent visual interpolation glitches
     *
     * @param {number} newZoneX - Target zone X coordinate
     * @param {number} newZoneY - Target zone Y coordinate
     * @param {string} exitSide - Exit used ('north', 'south', 'east', 'west', 'port', 'pitfall')
     * @param {number} exitX - X coordinate of exit used
     * @param {number} exitY - Y coordinate of exit used
     * @returns {void}
     */
    transitionToZone(newZoneX, newZoneY, exitSide, exitX, exitY) {
        const playerFacade = this.game.playerFacade;
        const gridManager = this.game.gridManager;

        // Step 1: Initialize transition state
        this.transitionCoordinator.initializeTransitionState(exitSide);

        const zoneKey = `${newZoneX},${newZoneY}`;

        // Step 2: Update player's current zone coordinates (maintains dimension)
        playerFacade.setCurrentZone(newZoneX, newZoneY);

        // Step 3: Apply survival penalties for normal transitions
        // Port transitions are instant teleports (no time passes)
        if (exitSide !== 'port') {
            playerFacade.onZoneTransition();  // Decrease hunger/thirst
        }

        // Step 4: Generate or load the target zone
        this.game.generateZone();

        // Debug logging for port transitions
        try {
            const transientState = this.game.transientGameState;
            const portData = transientState.getPortTransitionData();
            logger?.debug?.(`Transition complete: lastExitSide=${exitSide}, portTransitionData=${JSON.stringify(portData)}`);
        } catch (e) {}

        // Step 5: Position player at appropriate entrance
        this.transitionCoordinator.positionPlayerAfterTransition(exitSide, exitX, exitY);

        // Step 6: Clear blocking tiles at spawn position
        const playerPos = playerFacade.getPosition();
        if (gridManager.isTileType(playerPos.x, playerPos.y, TILE_TYPES.SHRUBBERY)) {
            // Shrubbery sometimes blocks exits - remove it to restore access
            gridManager.setTile(playerPos.x, playerPos.y, TILE_TYPES.EXIT);
        }

        // Step 7: Validate player position (move to nearest walkable if needed)
        this.game.player.ensureValidPosition(this.game.grid);

        // Prevent visual glitch: sync lastX/lastY with current position
        // Without this, player sprite interpolates from old zone position
        playerFacade.setLastPosition(playerPos.x, playerPos.y);

        // Step 8: Check for special treasures (one-time spawns)
        this.treasureManager.handleSpecialZoneTreasures(zoneKey);

        // Step 9: Emit events and persist state
        this.eventEmitter.finalizeTransition(newZoneX, newZoneY);
    }


    /**
     * Generates or loads a zone at the player's current location.
     * Manages the full zone lifecycle from generation to entity initialization.
     *
     * Zone Generation Flow:
     * 1. Determine zone key (includes dimension + depth for underground)
     * 2. Generate chunk connections for this area
     * 3. Load existing zone OR generate new zone
     * 4. Apply grid to game state
     * 5. Initialize managers (gridManager, enemyCollection, npcManager)
     * 6. Handle new game spawn positioning
     * 7. Patch emergence tiles for port transitions
     * 8. Filter defeated enemies from zone
     * 9. Sync zoneGenerator grid reference
     *
     * Zone Key Strategy:
     * - Surface/Interior: (x, y, dimension)
     * - Underground: (x, y, dimension, depth)
     * - Underground zones store each depth layer separately to preserve
     *   distinct layouts for each cave level
     *
     * Port Transition Handling:
     * When entering via port, the zone must have correct return coordinates:
     * - Interior (dimension 1): Save surface port coords in returnToSurface
     * - Underground from hole/pitfall: Save surface hole coords
     * - Underground from stairdown: Save interior stair coords
     *
     * Emergence Tile Patching:
     * If entering via port, ensure the spawn tile has the correct port type:
     * - stairdown -> stairup (and vice versa)
     * - hole/pitfall -> stairup (converts primitive to object-style PORT)
     * - cistern -> ensure cistern tile below port
     *
     * Entity Initialization:
     * - gridManager: Wraps grid array for tile operations
     * - enemyCollection: Wraps enemies array, recreated to capture new reference
     * - npcManager: Scans grid for NPC tiles and converts to entities
     *
     * New Game Spawn:
     * On first zone entry (no lastExitSide), position player off-screen
     * for entrance animation, then animate walking to playerSpawn exit.
     *
     * Defeated Enemy Filtering:
     * Enemies in defeatedEnemies set are filtered out when loading zones.
     * This preserves permanent enemy defeats across zone re-entries.
     *
     * @returns {void}
     */
    generateZone() {
        const currentZone = this.game.player.getCurrentZone();
        // For underground zones (dimension 2), include the player's depth so each depth layer is stored separately
        const depth = currentZone.depth || (this.game.player.undergroundDepth || 1);
        const zoneKey = createZoneKey(currentZone.x, currentZone.y, currentZone.dimension, depth);

        // Generate chunk connections for current area
        this.game.connectionManager.generateChunkConnections(currentZone.x, currentZone.y);

        // Check if we already have this zone loaded from saved state
        let zoneData;
        // If entering via a port, we must regenerate the zone to ensure the corresponding port exists.
        // This handles cases where a zone was generated without a port, but now needs one.
        const isPortTransition = this.game.lastExitSide === 'port';

        if (this.game.zoneRepository.hasByKey(zoneKey)) {
            // Use existing zone data (loaded from save or previously generated).
            // Previously we forced regeneration for port transitions which could
            // overwrite saved returnToSurface data (e.g. the surface hole where a
            // player fell through). Prefer reusing saved data to preserve that
            // mapping; generators will still patch emergence tiles below when
            // portTransitionData is present.
            zoneData = this.game.zoneRepository.getByKey(zoneKey);
        } else {
            // Generate new zone
            zoneData = this.game.zoneGenerator.generateZone(
                currentZone.x,
                currentZone.y,
                currentZone.dimension,
                this.game.zones,
                this.game.connectionManager.zoneConnections,
                this.game.availableFoodAssets,
                this.game.lastExitSide // Pass how the player entered
            );
            // Defensive: if a zoneGenerator mock or implementation returns falsy,
            // ensure we have a minimal zoneData structure to avoid runtime errors.
            if (!zoneData) {
                zoneData = {
                    grid: this.game.grid || Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(TILE_TYPES.FLOOR)),
                    enemies: [],
                    playerSpawn: null
                };
            }
            // Save the generated zone
            // If we are generating an interior zone as a result of entering via a surface port,
            // persist the surface port coordinates so we can return the player to that exact spot when exiting.
            const transientState = this.game.transientGameState;
            const portData = transientState.getPortTransitionData();

            if (currentZone.dimension === 1 && portData?.from === 'interior') {
                zoneData.returnToSurface = { x: portData.x, y: portData.y };
            }
            // If generating an underground zone as a result of falling through a hole/pitfall,
            // the underground handler may include returnToSurface metadata; ensure it's persisted
            // on the saved zoneData so surface exits can return the player to the exact hole.
            if (currentZone.dimension === 2 && portData && (portData.from === 'hole' || portData.from === 'pitfall')) {
                // Use returnToSurface provided by the generator result if available, otherwise fall back to portTransitionData
                if (!zoneData.returnToSurface) {
                    zoneData.returnToSurface = { x: portData.x, y: portData.y };
                }
            }
            // If generating an underground zone from an interior stairdown,
            // store metadata so stairup can return to the interior instead of surface
            if (currentZone.dimension === 2 && portData && portData.from === 'stairdown' && portData.fromDimension === 1) {
                zoneData.returnToInterior = { x: portData.x, y: portData.y, zoneX: currentZone.x, zoneY: currentZone.y };
            }
            this.game.zoneRepository.setByKey(zoneKey, zoneData);
        }

        this.game.grid = zoneData.grid;

        // Initialize gridManager and enemyCollection after grid/enemies are set
        // These facades wrap the arrays, so they must be created after the arrays exist
        if (!this.game.gridManager) {
            this.game.gridManager = this.game._services.get('gridManager');
        } else {
            // Update gridManager's grid reference when zone changes
            this.game.gridManager.setGrid(zoneData.grid);
        }
        // IMPORTANT: Always recreate enemyCollection to ensure it wraps the current array reference
        // The array reference might change during initialization, so we clear the cache
        if (this.game._services) {
            this.game._services._instances.delete('enemyCollection');
        }
        this.game.enemyCollection = this.game._services.get('enemyCollection');

        // Initialize NPC system after grid is set
        // NPCs are extracted from the grid and converted to entity objects
        if (!this.game.npcManager) {
            this.game.npcManager = this.game._services.get('npcManager');
        }
        if (!this.game.npcRenderer) {
            this.game.npcRenderer = this.game._services.get('npcRenderer');
        }
        // Scan grid for NPC tiles and convert them to NPC entities
        this.game.npcManager.initializeFromGrid();

        // For new games (no lastExitSide), use the playerSpawn from zone generation
        if (!this.game.lastExitSide && zoneData.playerSpawn) {
            // Store the exit tile position for entrance animation
            this.game._newGameSpawnPosition = { ...zoneData.playerSpawn };

            // Position player off-screen (one tile beyond the exit) for entrance animation
            let offScreenX = zoneData.playerSpawn.x;
            let offScreenY = zoneData.playerSpawn.y;

            // Determine off-screen position based on which edge the exit is on
            if (zoneData.playerSpawn.y === 0) {
                // Top edge exit - position player above the grid
                offScreenY = -1;
            } else if (zoneData.playerSpawn.y === GRID_SIZE - 1) {
                // Bottom edge exit - position player below the grid
                offScreenY = GRID_SIZE;
            } else if (zoneData.playerSpawn.x === 0) {
                // Left edge exit - position player to the left of the grid
                offScreenX = -1;
            } else if (zoneData.playerSpawn.x === GRID_SIZE - 1) {
                // Right edge exit - position player to the right of the grid
                offScreenX = GRID_SIZE;
            }

            this.game.playerFacade.setPosition(offScreenX, offScreenY);
        }

        // If we generated this zone as the result of a port transition, ensure
        // the emergence tile reflects the correct port object (stairup/stairdown)
        const gridManager = this.game.gridManager;
        const transientState = this.game.transientGameState;
        try {
            const portData = transientState.getPortTransitionData();
            if (this.game.lastExitSide === 'port' && portData) {
                const px = portData.x;
                const py = portData.y;
                const from = portData.from;
                if (isWithinGrid(px, py)) {
                    const existing = gridManager.getTile(px, py);
                    // If transition was from stairdown, we should have a stairup at emergence
                    if (from === 'stairdown') {
                        if (!isTileObjectWithProperty(existing, TILE_TYPES.PORT, 'portKind', 'stairup')) {
                            gridManager.setTile(px, py, { type: TILE_TYPES.PORT, portKind: 'stairup' });
                        }
                    } else if (from === 'stairup') {
                        if (!isTileObjectWithProperty(existing, TILE_TYPES.PORT, 'portKind', 'stairdown')) {
                            gridManager.setTile(px, py, { type: TILE_TYPES.PORT, portKind: 'stairdown' });
                        }
                    } else if (from === 'cistern') {
                        // ensure cistern top/port is present
                        const belowTile = gridManager.getTile(px, py + 1);
                        if (belowTile !== undefined && belowTile !== TILE_TYPES.CISTERN) {
                            this.transitionCoordinator.validateAndSetTile(this.game.grid, px, py + 1, TILE_TYPES.CISTERN);
                        }
                    } else if (from === 'hole' || from === 'pitfall') {
                        // Only convert a primitive PITFALL/hole into an object-style PORT
                        // (stairup) if the current tile at that location is still a
                        // primitive PITFALL. This prevents accidentally overwriting
                        // unrelated tiles with an up-stair.
                        const existing = gridManager.getTile(px, py);
                        const isPrimitivePitfall = isPitfall(existing) || existing === TILE_TYPES.HOLE;
                        if (isPrimitivePitfall) {
                            // Convert to an object-style PORT to mark the emergence point
                            gridManager.setTile(px, py, { type: TILE_TYPES.PORT, portKind: 'stairup' });
                            try { logger.debug && logger.debug(`Placed stairup at surface (${px},${py}) from ${from}`); } catch (e) {}
                        } else {
                            // Don't overwrite if something else occupies the tile
                            try { logger.debug && logger.debug(`Did not place stairup at (${px},${py}) - existing tile prevents conversion.`); } catch (e) {}
                        }
                        // If an object-style port is already present, leave it as-is.
                    }
                }
            }
        } catch (e) { /* non-fatal */ }
        // When loading enemies, filter out any that are in the defeatedEnemies set.
        const enemyCollection = this.game.enemyCollection;

        const allEnemies = (zoneData.enemies || []).map(e => new this.game.Enemy(e));
        const livingEnemies = allEnemies.filter(enemy => {
            const defeatedKey = `${enemy.id}`;
            return !this.game.defeatedEnemies.has(defeatedKey);
        });
        enemyCollection.replaceAll(livingEnemies, false); // Don't emit event for zone loads


        // Ensure zoneGenerator.grid points to the game grid for methods that need it
        this.game.zoneGenerator.grid = this.game.grid;
    }

    /**
     * Spawns treasure items on the grid at specified positions.
     * Delegates to ZoneTreasureManager for implementation.
     *
     * Treasure Types:
     * - Special zone treasures (one-time spawns)
     * - Randomly generated loot
     * - Story/quest items
     *
     * Use Case:
     * Called after zone generation to place special items or
     * during gameplay for dynamic loot spawning.
     *
     * @param {Array<Treasure>} treasures - Array of treasure definitions
     * @returns {void}
     */
    spawnTreasuresOnGrid(treasures) {
        // Delegate to treasure manager
        this.treasureManager.spawnTreasuresOnGrid(treasures);
    }

    /**
     * Saves the current zone's state to the zone repository.
     * Preserves grid changes and enemy positions for future visits.
     *
     * State Preservation:
     * - Grid: Deep cloned to prevent reference issues
     * - Enemies: Serialized with position, type, health, and ID
     * - playerSpawn: Not saved (only needed for generation)
     *
     * Why Save State:
     * 1. Player modifications: Bombed walls, collected items, etc.
     * 2. Enemy positions: Preserve combat state if player leaves mid-fight
     * 3. Zone changes: Opened doors, triggered events, etc.
     *
     * Defeated Enemies:
     * Defeated enemies are tracked separately in game.defeatedEnemies.
     * When loading a zone, this set is used to filter out permanently
     * defeated enemies. This method saves all living enemies in the zone.
     *
     * Zone Key Strategy:
     * - Surface/Interior: (x, y, dimension)
     * - Underground: (x, y, dimension, depth)
     * - Ensures each depth level has separate saved state
     *
     * Use Case:
     * Called before zone transitions to ensure current zone state is
     * preserved before loading the new zone.
     *
     * @returns {void}
     */
    saveCurrentZoneState() {
        // Save the current zone's grid and enemies to the zones map
        const currentZone = this.game.player.getCurrentZone();
        const depth = currentZone.depth || (this.game.player.undergroundDepth || 1);
        const zoneKey = createZoneKey(currentZone.x, currentZone.y, currentZone.dimension, depth);

        // Save current zone state to preserve any changes made during gameplay
        const enemyCollection = this.game.enemyCollection;
        this.game.zoneRepository.setByKey(zoneKey, {
            grid: JSON.parse(JSON.stringify(this.game.grid)),
            enemies: enemyCollection.map(enemy => ({
                x: enemy.x,
                y: enemy.y,
                enemyType: enemy.enemyType,
                health: enemy.health,
                id: enemy.id
            })),
            playerSpawn: null // playerSpawn not needed for current zone
        });

    logger.debug(`Saved current zone state for ${zoneKey}`);
    }
}
