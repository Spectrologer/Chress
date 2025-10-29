import { GRID_SIZE, TILE_TYPES } from '../core/constants/index.js';
import { logger } from '../core/logger.js';
import { createZoneKey } from '../utils/ZoneKeyUtils.js';
import { isWithinGrid } from '../utils/GridUtils.js';
import { isTileObjectOfType, isTileObjectWithProperty, isPitfall } from '../utils/TypeChecks.js';
import { ZoneTransitionCoordinator } from './ZoneTransitionCoordinator.js';
import { ZoneTreasureManager } from './ZoneTreasureManager.js';
import { ZoneEventEmitter } from './ZoneEventEmitter.js';

export class ZoneManager {
    constructor(game) {
        this.game = game;
        this.transitionCoordinator = new ZoneTransitionCoordinator(game);
        this.treasureManager = new ZoneTreasureManager(game);
        this.eventEmitter = new ZoneEventEmitter(game);
    }


    transitionToZone(newZoneX, newZoneY, exitSide, exitX, exitY) {
        const playerFacade = this.game.playerFacade;
        const gridManager = this.game.gridManager;

        this.transitionCoordinator.initializeTransitionState(exitSide);

        const zoneKey = `${newZoneX},${newZoneY}`;

        // Update player's current zone (keep dimension)
        playerFacade.setCurrentZone(newZoneX, newZoneY);

        // Decrease thirst and hunger when moving to a new zone, unless using a port
        if (exitSide !== 'port') {
            playerFacade.onZoneTransition();
        }

        // Generate or load the new zone
        this.game.generateZone();

        try {
            const transientState = this.game.transientGameState;
            const portData = transientState.getPortTransitionData();
            logger?.debug?.(`Transition complete: lastExitSide=${exitSide}, portTransitionData=${JSON.stringify(portData)}`);
        } catch (e) {}

        // Position player based on which exit they used
        this.transitionCoordinator.positionPlayerAfterTransition(exitSide, exitX, exitY);

        // If player spawned on shrubbery, remove it (restore exit)
        const playerPos = playerFacade.getPosition();
        if (gridManager.isTileType(playerPos.x, playerPos.y, TILE_TYPES.SHRUBBERY)) {
            gridManager.setTile(playerPos.x, playerPos.y, TILE_TYPES.EXIT);
        }

        // Ensure player is on a walkable tile
        this.game.player.ensureValidPosition(this.game.grid);

        // Prevent cross-zone interpolation - sync lastX/lastY with current position
        playerFacade.setLastPosition(playerPos.x, playerPos.y);

        // Check for special zone treasures
        this.treasureManager.handleSpecialZoneTreasures(zoneKey);

        // Emit events and save state
        this.eventEmitter.finalizeTransition(newZoneX, newZoneY);
    }


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

    spawnTreasuresOnGrid(treasures) {
        // Delegate to treasure manager
        this.treasureManager.spawnTreasuresOnGrid(treasures);
    }

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
