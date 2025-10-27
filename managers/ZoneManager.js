import { GRID_SIZE, TILE_TYPES } from '../core/constants/index.js';
import { Sign } from '../ui/Sign.js';
import { logger } from '../core/logger.js';
import { createZoneKey } from '../utils/ZoneKeyUtils.js';
import { eventBus } from '../core/EventBus.js';
import { EventTypes } from '../core/EventTypes.js';
import { isWithinGrid } from '../utils/GridUtils.js';
import { isFloor, isTileType, isTileObjectOfType, isTileObjectWithProperty, isPort, isPitfall } from '../utils/TypeChecks.js';

export class ZoneManager {
    constructor(game) {
        this.game = game;
    }

    /**
     * Initialize transition state (pitfall tracking, sign reset, etc.)
     */
    _initializeTransitionState(exitSide) {
        this.game.lastExitSide = exitSide;

        const transientState = this.game.transientGameState;

        // Reset sign message tracking for the new zone
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
     * Handle special zone treasures if player reached a marked zone
     */
    _handleSpecialZoneTreasures(zoneKey) {
        if (this.game.specialZones.has(zoneKey)) {
            const treasures = this.game.specialZones.get(zoneKey);
            this.game.spawnTreasuresOnGrid(treasures);
            this.game.specialZones.delete(zoneKey);
        }
    }

    /**
     * Emit events and save state after transition
     */
    _finalizeTransition(newZoneX, newZoneY) {
        const playerFacade = this.game.playerFacade;
        const dimension = playerFacade.getZoneDimension();

        eventBus.emit(EventTypes.ZONE_CHANGED, {
            x: newZoneX,
            y: newZoneY,
            dimension
        });

        const playerPos = playerFacade.getPosition();
        eventBus.emit(EventTypes.PLAYER_MOVED, {
            x: playerPos.x,
            y: playerPos.y
        });

        this.game.gameStateManager.saveGameState();

        // Clear the one-time transition data
        const transientState = this.game.transientGameState;
        const portData = transientState.getPortTransitionData();
        try {
            logger?.debug?.(`Clearing portTransitionData (was=${JSON.stringify(portData)})`);
        } catch (e) {}
        transientState.clearPortTransitionData();
    }

    transitionToZone(newZoneX, newZoneY, exitSide, exitX, exitY) {
        const playerFacade = this.game.playerFacade;
        const gridManager = this.game.gridManager;

        this._initializeTransitionState(exitSide);

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
        this.positionPlayerAfterTransition(exitSide, exitX, exitY);

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
        this._handleSpecialZoneTreasures(zoneKey);

        // Emit events and save state
        this._finalizeTransition(newZoneX, newZoneY);
    }

    /**
     * Position player after pitfall transition
     */
    _positionAfterPitfall(exitX, exitY) {
        const playerFacade = this.game.playerFacade;
        const currentZone = playerFacade.getCurrentZone();

        const portZoneKey = createZoneKey(
            currentZone.x,
            currentZone.y,
            currentZone.dimension,
            currentZone.depth
        );
        const zoneData = this.game.zoneRepository.getByKey(portZoneKey);

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
    _positionAfterInteriorEntry() {
        const playerFacade = this.game.playerFacade;
        const portX = Math.floor(GRID_SIZE / 2);
        const portY = GRID_SIZE - 1; // bottom edge
        this.validateAndSetTile(this.game.grid, portX, portY, TILE_TYPES.PORT);
        playerFacade.setPosition(portX, portY);
    }

    /**
     * Position player after exiting underground to surface
     */
    _positionAfterUndergroundExit(exitX, exitY) {
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
            const undergroundData = this.game.zoneRepository.getByKey(undergroundZoneKey);

            if (undergroundData?.returnToSurface) {
                portX = undergroundData.returnToSurface.x;
                portY = undergroundData.returnToSurface.y;
            } else {
                const transientState = this.game.transientGameState;
                const portData = transientState.getPortTransitionData();
                if (portData && (portData.from === 'hole' || portData.from === 'pitfall')) {
                    portX = portData.x;
                    portY = portData.y;
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
    _positionAfterInteriorExit(exitX, exitY) {
        const playerFacade = this.game.playerFacade;
        const gridManager = this.game.gridManager;
        const currentZone = playerFacade.getCurrentZone();

        const interiorZoneKey = createZoneKey(currentZone.x, currentZone.y, 1);
        const interiorZoneData = this.game.zoneRepository.getByKey(interiorZoneKey);

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
        const portTile = gridManager.findFirst(tile => isTileType(tile, TILE_TYPES.PORT));
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
    _positionAfterRegularPort(exitX, exitY) {
        const playerFacade = this.game.playerFacade;
        playerFacade.setPosition(exitX, exitY);
        this.validateAndSetTile(this.game.grid, exitX, exitY, TILE_TYPES.PORT);
    }

    /**
     * Handle port positioning based on context
     */
    _positionAfterPortTransition(exitX, exitY) {
        const playerFacade = this.game.playerFacade;
        const transientState = this.game.transientGameState;
        const currentZone = playerFacade.getCurrentZone();
        const portData = transientState.getPortTransitionData();

        if (portData?.from === 'pitfall') {
            this._positionAfterPitfall(exitX, exitY);
        } else if (currentZone.dimension === 1) {
            this._positionAfterInteriorEntry();
        } else if (currentZone.dimension === 0 && currentZone.portType === 'underground') {
            this._positionAfterUndergroundExit(exitX, exitY);
        } else if (currentZone.dimension === 0) {
            this._positionAfterInteriorExit(exitX, exitY);
        } else {
            this._positionAfterRegularPort(exitX, exitY);
        }
    }

    positionPlayerAfterTransition(exitSide, exitX, exitY) {
        const gridManager = this.game.gridManager;
        switch (exitSide) {
            case 'bottom':
                // Came from bottom, enter north side at corresponding x position
                gridManager.setTile(exitX, 0, TILE_TYPES.EXIT);
                this.game.zoneGenerator.clearPathToExit(exitX, 0);
                this.game.player.setPosition(exitX, 0);
                break;
            case 'top':
                // Came from top, enter south side at corresponding x position
                gridManager.setTile(exitX, GRID_SIZE - 1, TILE_TYPES.EXIT);
                this.game.zoneGenerator.clearPathToExit(exitX, GRID_SIZE - 1);
                this.game.player.setPosition(exitX, GRID_SIZE - 1);
                break;
            case 'right':
                // Came from right, enter west side at corresponding y position
                gridManager.setTile(0, exitY, TILE_TYPES.EXIT);
                this.game.zoneGenerator.clearPathToExit(0, exitY);
                this.game.player.setPosition(0, exitY);
                break;
            case 'left':
                // Came from left, enter east side at corresponding y position
                gridManager.setTile(GRID_SIZE - 1, exitY, TILE_TYPES.EXIT);
                this.game.zoneGenerator.clearPathToExit(GRID_SIZE - 1, exitY);
                this.game.player.setPosition(GRID_SIZE - 1, exitY);
                break;
            case 'teleport':
                // Teleport: place in center
                this.game.player.setPosition(Math.floor(GRID_SIZE / 2), Math.floor(GRID_SIZE / 2));
                break;
            case 'port':
                this._positionAfterPortTransition(exitX, exitY);
                break;
            default:
                // Fallback to center
                this.game.player.setPosition(Math.floor(GRID_SIZE / 2), Math.floor(GRID_SIZE / 2));
                break;
        }
    }

    /**
     * Helper to safely set a tile on the grid, checking bounds.
     * @param {Array<Array<any>>} grid The game grid.
     * @param {number} x The x-coordinate.
     * @param {number} y The y-coordinate.
     * @param {any} tile The tile to set.
     */
    validateAndSetTile(grid, x, y, tile) {
        if (isWithinGrid(x, y)) {
            // If we're trying to set a primitive PORT tile, don't overwrite an existing
            // object-style PORT (which may contain metadata like portKind: 'stairup').
            if (tile === TILE_TYPES.PORT) {
                const existing = grid[y] && grid[y][x];
                if (isTileObjectOfType(existing, TILE_TYPES.PORT)) {
                    // Preserve the object port
                    return;
                }
            }

            grid[y][x] = tile;
        }
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

            this.game.player.setPosition(offScreenX, offScreenY);
            logger.log('[ZONE GEN] New game detected, positioning player off-screen at:', { x: offScreenX, y: offScreenY }, 'exit tile at:', zoneData.playerSpawn);
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
                            this.validateAndSetTile(this.game.grid, px, py + 1, TILE_TYPES.CISTERN);
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
        // Spawn treasures on grid at valid floor positions
        const gridManager = this.game.gridManager;
        for (const treasure of treasures) {
            // Try to place treasure in a valid location (max 50 attempts)
            for (let attempts = 0; attempts < 50; attempts++) {
                const x = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
                const y = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;

                // Check if tile is floor and not occupied or blocked
                const tile = gridManager.getTile(x, y);
                const isFloorTile = isFloor(tile);
                const isExit = isTileType(tile, TILE_TYPES.EXIT);

                if (isFloorTile && !isExit) {
                    // Place the treasure
                    gridManager.setTile(x, y, treasure);
                    break; // Successfully placed
                }
            }
        }

        // Add message to log via event
        eventBus.emit(EventTypes.UI_MESSAGE_LOG, {
            text: 'Treasures found scattered throughout the zone!',
            category: 'treasure',
            priority: 'info',
            timestamp: Date.now()
        });
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
