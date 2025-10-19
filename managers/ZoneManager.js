import { GRID_SIZE, TILE_TYPES } from '../core/constants.js';
import { Sign } from '../ui/Sign.js';
import { logger } from '../core/logger.js';

export class ZoneManager {
    constructor(game) {
        this.game = game;
    }

    transitionToZone(newZoneX, newZoneY, exitSide, exitX, exitY) {
        // Set flag to skip enemy movements this turn since player just entered zone
        this.game.lastExitSide = exitSide; // Store how we entered for generation logic

        this.game.justEnteredZone = true;

        // Reset sign message tracking for the new zone
        this.game.lastSignMessage = null;
        this.game.displayingMessageForSign = null;

        // Set pitfall zone flag based on transition data
        this.game.isInPitfallZone = this.game.portTransitionData?.from === 'pitfall';
        if (exitSide !== 'port') {
            this.game.pitfallTurnsSurvived = 0; // Reset on any non-port transition
            this.game.isInPitfallZone = false; // Clear flag if not a port transition
        }

        // Check if this is a special zone marked by a note
        const zoneKey = `${newZoneX},${newZoneY}`;
        const hasReachedSpecialZone = this.game.specialZones.has(zoneKey);

        // If entering a pitfall zone, reset the turn counter
        if (this.game.isInPitfallZone) {
            this.game.pitfallTurnsSurvived = 0;
        }

        // Update player's current zone (keep dimension)
        this.game.player.setCurrentZone(newZoneX, newZoneY);

        // Check if this is entering a new region category
        const newRegion = this.game.uiManager.generateRegionName(newZoneX, newZoneY);
        const isNewRegion = newRegion !== this.game.currentRegion;

        // Show region notification only if entering a new region
        if (isNewRegion) {
            this.game.uiManager.showRegionNotification(newZoneX, newZoneY);
            this.game.currentRegion = newRegion; // Update current region
        }

        // Decrease thirst and hunger when moving to a new zone, unless using a port
        if (exitSide !== 'port') {
            this.game.player.onZoneTransition();
        }

        // Generate or load the new zone
        this.game.generateZone();

        // Position player based on which exit they used
        this.positionPlayerAfterTransition(exitSide, exitX, exitY);

        // If player spawned on shrubbery, remove it (restore exit)
        const playerPos = this.game.player.getPosition();
        if (this.game.grid[playerPos.y][playerPos.x] === TILE_TYPES.SHRUBBERY) {
            this.game.grid[playerPos.y][playerPos.x] = TILE_TYPES.EXIT;
        }

        // Ensure player is on a walkable tile
        this.game.player.ensureValidPosition(this.game.grid);

        // Prevent cross-zone interpolation: reset last position to current so renderer doesn't
        // interpolate from previous zone coordinates (which may be off-screen).
        if (this.game.player) {
            this.game.player.lastX = this.game.player.x;
            this.game.player.lastY = this.game.player.y;
        }

        // Check for special zone treasures
        if (hasReachedSpecialZone) {
            const treasures = this.game.specialZones.get(zoneKey);
            this.game.spawnTreasuresOnGrid(treasures);

            // Remove the special zone marker since it was used
            this.game.specialZones.delete(zoneKey);
        }

        // Update UI
        this.game.uiManager.updateZoneDisplay();
        this.game.uiManager.updatePlayerPosition();
        this.game.uiManager.updatePlayerStats();

        // Set background music based on zone dimension (0=surface,1=interior,2=underground)
        try {
            const dimension = this.game.player.currentZone && typeof this.game.player.currentZone.dimension === 'number'
                ? this.game.player.currentZone.dimension
                : 0;
            if (this.game.soundManager && typeof this.game.soundmanager?.setMusicForZone === 'function') {
                this.game.soundManager.setMusicForZone({ dimension });
            } else if (this.game.soundManager && typeof this.game.soundManager.setMusicForZone === 'function') {
                this.game.soundManager.setMusicForZone({ dimension });
            } else if (typeof window !== 'undefined' && window.soundManager && typeof window.soundManager.setMusicForZone === 'function') {
                window.soundManager.setMusicForZone({ dimension });
            }
        } catch (e) {
            // Non-fatal if music can't be set
        }

        // Save game state after zone transition
        this.game.gameStateManager.saveGameState();

        // Now that the transition is complete, clear the one-time transition data
        this.game.portTransitionData = null;
    }

    positionPlayerAfterTransition(exitSide, exitX, exitY) {
        switch (exitSide) {
            case 'bottom':
                // Came from bottom, enter north side at corresponding x position
                this.game.grid[0][exitX] = TILE_TYPES.EXIT;
                this.game.zoneGenerator.clearPathToExit(exitX, 0);
                this.game.player.setPosition(exitX, 0);
                break;
            case 'top':
                // Came from top, enter south side at corresponding x position
                this.game.grid[GRID_SIZE - 1][exitX] = TILE_TYPES.EXIT;
                this.game.zoneGenerator.clearPathToExit(exitX, GRID_SIZE - 1);
                this.game.player.setPosition(exitX, GRID_SIZE - 1);
                break;
            case 'right':
                // Came from right, enter west side at corresponding y position
                this.game.grid[exitY][0] = TILE_TYPES.EXIT;
                this.game.zoneGenerator.clearPathToExit(0, exitY);
                this.game.player.setPosition(0, exitY);
                break;
            case 'left':
                // Came from left, enter east side at corresponding y position
                this.game.grid[exitY][GRID_SIZE - 1] = TILE_TYPES.EXIT;
                this.game.zoneGenerator.clearPathToExit(GRID_SIZE - 1, exitY);
                this.game.player.setPosition(GRID_SIZE - 1, exitY);
                break;
            case 'teleport':
                // Teleport: place in center
                this.game.player.setPosition(Math.floor(GRID_SIZE / 2), Math.floor(GRID_SIZE / 2));
                break;
            case 'port':
                // For pitfalls, the player spawns at a random valid location, not on the entrance.
                // The zoneData contains the correct spawn point.
                const zoneData = this.game.zones.get(`${this.game.player.currentZone.x},${this.game.player.currentZone.y}:${this.game.player.currentZone.dimension}`);

                if (this.game.portTransitionData?.from === 'pitfall') {
                    // Entering underground via pitfall: Use the zone's designated spawn point.
                    this.game.player.setPosition(zoneData.playerSpawn.x, zoneData.playerSpawn.y);
                } else if (this.game.player.currentZone.dimension === 1) { // Entering an interior
                    // Entering an interior: place player at bottom-middle of interior (consistent spawn)
                    const portX = Math.floor(GRID_SIZE / 2);
                    const portY = GRID_SIZE - 1; // bottom edge
                    this.validateAndSetTile(this.game.grid, portX, portY, TILE_TYPES.PORT);
                    this.game.player.setPosition(portX, portY);
                } else if (this.game.player.currentZone.dimension === 0 && this.game.player.currentZone.portType === 'underground') {
                    // Exiting to the surface FROM underground. Place player at the port they came from.
                    const portX = exitX;
                    const portY = exitY;
                    this.validateAndSetTile(this.game.grid, portX, portY, TILE_TYPES.PORT);
                    this.game.player.setPosition(portX, portY);
                } else if (this.game.player.currentZone.dimension === 0) {
                    // Exiting to the surface. Prefer the interior's recorded return coordinates if available.
                    const interiorZoneKey = `${this.game.player.currentZone.x},${this.game.player.currentZone.y}:1`;
                    const interiorZoneData = this.game.zones.get(interiorZoneKey);
                    let placed = false;

                    if (interiorZoneData && interiorZoneData.returnToSurface) {
                        const sx = interiorZoneData.returnToSurface.x;
                        const sy = interiorZoneData.returnToSurface.y;
                        if (sx !== undefined && sy !== undefined) {
                            this.game.player.setPosition(sx, sy);
                            this.validateAndSetTile(this.game.grid, sx, sy, TILE_TYPES.PORT);
                            placed = true;
                        }
                    }

                    if (!placed) {
                        // If the explicit exit coords are a PORT in the new grid, use them
                        if (exitX >= 0 && exitX < GRID_SIZE && exitY >= 0 && exitY < GRID_SIZE && this.game.grid[exitY][exitX] === TILE_TYPES.PORT) {
                            this.game.player.setPosition(exitX, exitY);
                            placed = true;
                        }
                    }

                    if (!placed) {
                        // Search the grid for any PORT tile and use the first found
                        for (let y = 0; y < GRID_SIZE && !placed; y++) {
                            for (let x = 0; x < GRID_SIZE; x++) {
                                if (this.game.grid[y][x] === TILE_TYPES.PORT) {
                                    this.game.player.setPosition(x, y);
                                    placed = true;
                                    break;
                                }
                            }
                        }
                    }

                    if (!placed) {
                        // Fallback to using exitX/exitY
                        this.game.player.setPosition(exitX, exitY);
                        this.validateAndSetTile(this.game.grid, exitX, exitY, TILE_TYPES.PORT);
                    }
                } else {
                    // For regular ports (cisterns, holes, doors), spawn at the entrance.
                    // exitX and exitY are the coordinates of the port used in the previous zone.
                    this.game.player.setPosition(exitX, exitY);
                    this.validateAndSetTile(this.game.grid, exitX, exitY, TILE_TYPES.PORT);
                }
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
        if (y >= 0 && y < GRID_SIZE && x >= 0 && x < GRID_SIZE) {
            grid[y][x] = tile;
        }
    }

    generateZone() {
        const currentZone = this.game.player.getCurrentZone();
        const zoneKey = `${currentZone.x},${currentZone.y}:${currentZone.dimension}`;

        // Generate chunk connections for current area
        this.game.connectionManager.generateChunkConnections(currentZone.x, currentZone.y);

        // Check if we already have this zone loaded from saved state
        let zoneData;
        // If entering via a port, we must regenerate the zone to ensure the corresponding port exists.
        // This handles cases where a zone was generated without a port, but now needs one.
        const isPortTransition = this.game.lastExitSide === 'port';

        if (this.game.zones.has(zoneKey) && !isPortTransition) {
            // Use existing zone data (loaded from save or previously generated)
            zoneData = this.game.zones.get(zoneKey);
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
            // Save the generated zone
            // If we are generating an interior zone as a result of entering via a surface port,
            // persist the surface port coordinates so we can return the player to that exact spot when exiting.
            if (currentZone.dimension === 1 && this.game.portTransitionData?.from === 'interior') {
                zoneData.returnToSurface = { x: this.game.portTransitionData.x, y: this.game.portTransitionData.y };
            }
            this.game.zones.set(zoneKey, zoneData);
        }

        this.game.grid = zoneData.grid;
        // When loading enemies, filter out any that are in the defeatedEnemies set.
        const allEnemies = (zoneData.enemies || []).map(e => new this.game.Enemy(e));
        this.game.enemies = allEnemies.filter(enemy => {
            const defeatedKey = `${enemy.id}`;
            return !this.game.defeatedEnemies.has(defeatedKey);
        });


        // Ensure zoneGenerator.grid points to the game grid for methods that need it
        this.game.zoneGenerator.grid = this.game.grid;
    }

    spawnTreasuresOnGrid(treasures) {
        // Spawn treasures on grid at valid floor positions
        for (const treasure of treasures) {
            // Try to place treasure in a valid location (max 50 attempts)
            for (let attempts = 0; attempts < 50; attempts++) {
                const x = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
                const y = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;

                // Check if tile is floor and not occupied or blocked
                const tile = this.game.grid[y][x];
                const isFloor = tile === TILE_TYPES.FLOOR ||
                    (tile && typeof tile === 'object' && tile.type === TILE_TYPES.FLOOR);
                const isExit = tile === TILE_TYPES.EXIT;

                if (isFloor && !isExit) {
                    // Place the treasure
                    this.game.grid[y][x] = treasure;
                    break; // Successfully placed
                }
            }
        }

        // Add message to log
        this.game.uiManager.addMessageToLog('Treasures found scattered throughout the zone!');
    }

    saveCurrentZoneState() {
        // Save the current zone's grid and enemies to the zones map
        const currentZone = this.game.player.getCurrentZone();
        const zoneKey = `${currentZone.x},${currentZone.y}:${currentZone.dimension}`;

        // Save current zone state to preserve any changes made during gameplay
        this.game.zones.set(zoneKey, {
            grid: JSON.parse(JSON.stringify(this.game.grid)),
            enemies: [...this.game.enemies.map(enemy => ({
                x: enemy.x,
                y: enemy.y,
                enemyType: enemy.enemyType,
                health: enemy.health,
                id: enemy.id
            }))],
            playerSpawn: null // playerSpawn not needed for current zone
        });

    logger.debug(`Saved current zone state for ${zoneKey}`);
    }
}
