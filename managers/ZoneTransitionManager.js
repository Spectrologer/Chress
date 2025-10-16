import { GRID_SIZE, TILE_TYPES } from '../core/constants.js';
import { MultiTileHandler } from '../renderers/MultiTileHandler.js';

export class ZoneTransitionManager {
    constructor(game, inputManager) {
        this.game = game;
        this.inputManager = inputManager;
    }

    checkForZoneTransitionGesture(tapCoords, playerPos) {
        // If player is on an exit tile and taps outside the grid or on the same edge, trigger transition
        const isOnExit = this.game.grid[playerPos.y][playerPos.x] === TILE_TYPES.EXIT;
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

    // Handle tapping on exit tiles to trigger zone transitions
    handleExitTap(exitX, exitY) {
        // Determine which direction to move based on exit position
        let direction = '';

        if (exitY === 0) {
            // Top edge exit - move north
            direction = 'arrowup';
        } else if (exitY === GRID_SIZE - 1) {
            // Bottom edge exit - move south
            direction = 'arrowdown';
        } else if (exitX === 0) {
            // Left edge exit - move west
            direction = 'arrowleft';
        } else if (exitX === GRID_SIZE - 1) {
            // Right edge exit - move east
            direction = 'arrowright';
        }

        if (direction) {
            // Simulate the key press to trigger zone transition
            this.inputManager.handleKeyPress({ key: direction, preventDefault: () => {} });
        }
    }

    handlePortTransition() {
        // Player tapped on a PORT tile they are standing on
        const playerPos = this.game.player.getPosition();
        const currentDim = this.game.player.currentZone.dimension;

        // Check if player is in a pitfall zone and hasn't survived 10 turns yet
        if (this.game.isInPitfallZone && this.game.pitfallTurnsSurvived < 10) {
            const turnsRemaining = 10 - this.game.pitfallTurnsSurvived;
            const turnText = turnsRemaining === 1 ? 'turn' : 'turns';
            this.game.uiManager.showOverlayMessage(`You must survive ${turnsRemaining} more ${turnText} to escape!`);
            this.game.soundManager.playSound('error');
            return;
        }

        let targetDim, portType;
        if (currentDim === 0) {
            // On the surface, determine where the PORT leads
            const cisternPos = MultiTileHandler.findCisternPosition(playerPos.x, playerPos.y, this.game.grid);
            const isHole = MultiTileHandler.isHole(playerPos.x, playerPos.y, this.game.grid);

            if (cisternPos) {
                // Entering underground via cistern
                targetDim = 2;
                portType = 'underground';
                this.game.portTransitionData = { from: 'cistern', x: playerPos.x, y: playerPos.y };
            } else if (isHole) {
                targetDim = 2;
                portType = 'underground';
                this.game.portTransitionData = { from: 'hole', x: playerPos.x, y: playerPos.y };
            } else {
                // Entering interior via house/shack door
                targetDim = 1;
                portType = 'interior';
                // Record the surface port coords so we can return the player to this exact port when exiting the interior
                this.game.portTransitionData = { from: 'interior', x: playerPos.x, y: playerPos.y };
            }
        } else {
            // Exiting to surface from interior/under
            targetDim = 0;
            portType = this.game.player.currentZone.portType;
        }

        this.game.player.currentZone.dimension = targetDim;
        this.game.player.currentZone.portType = portType;
        this.game.transitionToZone(this.game.player.currentZone.x, this.game.player.currentZone.y, 'port', playerPos.x, playerPos.y);
    }

    handlePitfallTransition(x, y) {
        // Player stepped on a pitfall trap
        this.game.grid[y][x] = TILE_TYPES.PORT; // The pitfall becomes a hole

        // Set data for the transition
        this.game.portTransitionData = { from: 'pitfall', x, y };

        // Transition to the underground dimension
        this.game.player.currentZone.dimension = 2; // Underground
        this.game.transitionToZone(this.game.player.currentZone.x, this.game.player.currentZone.y, 'port', x, y);
    }

    isTransitionEligible(gridCoords, playerPos) {
        // Check if tapped tile is an exit and player is already on it - trigger zone transition
        if (gridCoords.x === playerPos.x && gridCoords.y === playerPos.y) {
            const tileUnderPlayer = this.game.grid[playerPos.y]?.[playerPos.x];

            if (tileUnderPlayer === TILE_TYPES.EXIT) {
                this.handleExitTap(gridCoords.x, gridCoords.y);
                return true;
            } else if (tileUnderPlayer === TILE_TYPES.PORT) {
                this.handlePortTransition();
                return true;
            }
        }
        return false;
    }
}
