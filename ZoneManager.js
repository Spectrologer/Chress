import { GRID_SIZE, TILE_TYPES } from './constants.js';
import { Sign } from './Sign.js';

export class ZoneManager {
    constructor(game) {
        this.game = game;
    }

    transitionToZone(newZoneX, newZoneY, exitSide, exitX, exitY) {
        // Set flag to skip enemy movements this turn since player just entered zone
        this.game.justEnteredZone = true;

        // Reset sign message tracking for the new zone
        this.game.lastSignMessage = null;
        this.game.displayingMessageForSign = null;

        // Check if this is a special zone marked by a note
        const zoneKey = `${newZoneX},${newZoneY}`;
        const hasReachedSpecialZone = this.game.specialZones.has(zoneKey);

        // Check if this is entering a new region category
        const newRegion = this.game.uiManager.generateRegionName(newZoneX, newZoneY);
        const isNewRegion = newRegion !== this.game.currentRegion;

        // Update player's current zone (keep dimension)
        this.game.player.currentZone.x = newZoneX;
        this.game.player.currentZone.y = newZoneY;

        // Show region notification only if entering a new region
        if (isNewRegion) {
            this.game.uiManager.showRegionNotification(newZoneX, newZoneY);
            this.game.currentRegion = newRegion; // Update current region
        }

        // Decrease thirst and hunger when moving to a new zone
        this.game.player.onZoneTransition();

        // Generate or load the new zone
        this.game.generateZone();

        // Position player based on which exit they used
        this.positionPlayerAfterZoneTransition(exitSide, exitX, exitY);

        // If player spawned on shrubbery, remove it (restore exit)
        const playerPos = this.game.player.getPosition();
        if (this.game.grid[playerPos.y][playerPos.x] === TILE_TYPES.SHRUBBERY) {
            this.game.grid[playerPos.y][playerPos.x] = TILE_TYPES.EXIT;
        }

        // Ensure player is on a walkable tile
        this.game.player.ensureValidPosition(this.game.grid);

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
    }

    positionPlayerAfterZoneTransition(exitSide, exitX, exitY) {
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
            default:
                // Fallback to center
                this.game.player.setPosition(Math.floor(GRID_SIZE / 2), Math.floor(GRID_SIZE / 2));
                break;
        }
    }

    generateZone() {
        const currentZone = this.game.player.getCurrentZone();

        // Generate chunk connections for current area
        this.game.connectionManager.generateChunkConnections(currentZone.x, currentZone.y);

        // Generate or load the zone
        let zoneData = this.game.zoneGenerator.generateZone(
            currentZone.x,
            currentZone.y,
            currentZone.dimension,
            this.game.zones,
            this.game.connectionManager.zoneConnections,
            this.game.availableFoodAssets
        );

        this.game.grid = zoneData.grid;
        this.game.enemies = (zoneData.enemies || []).map(e => new this.game.Enemy(e));

        // Save the generated zone (include dimension in key)
        const zoneKey = `${currentZone.x},${currentZone.y}:${currentZone.dimension}`;
        this.game.zones.set(zoneKey, zoneData);
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
}
