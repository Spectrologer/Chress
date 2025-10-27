import { GRID_SIZE, TILE_TYPES, DIMENSION_CONSTANTS, GAMEPLAY_CONSTANTS } from '../core/constants/index.js';
import { MultiTileHandler } from '../renderers/MultiTileHandler.js';
import { getExitDirection } from '../core/utils/transitionUtils.js';
import audioManager from '../utils/AudioManager.js';

export class ZoneTransitionManager {
    constructor(game, inputManager) {
        this.game = game;
        this.inputManager = inputManager;
    }

    checkForZoneTransitionGesture(tapCoords, playerPos) {
        // Validate that grid and player position are valid before checking
        if (!this.game.grid || !Array.isArray(this.game.grid)) return false;
        if (playerPos.y < 0 || playerPos.y >= GRID_SIZE || playerPos.x < 0 || playerPos.x >= GRID_SIZE) return false;
        if (!this.game.grid[playerPos.y]) return false;

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
        const direction = getExitDirection(exitX, exitY);

        if (direction) {
            // Simulate the key press to trigger zone transition
            this.inputManager.handleKeyPress({ key: direction, preventDefault: () => {} });
        }
    }

    handlePortTransition() {
        // Player tapped on a PORT tile they are standing on
        const playerPos = this.game.player.getPosition();
        const currentDim = this.game.player.currentZone.dimension;

        // Check if player is in a pitfall zone and hasn't survived required turns yet
        if (this.game.isInPitfallZone && this.game.pitfallTurnsSurvived < GAMEPLAY_CONSTANTS.PITFALL_SURVIVAL_TURNS) {
            const turnsRemaining = GAMEPLAY_CONSTANTS.PITFALL_SURVIVAL_TURNS - this.game.pitfallTurnsSurvived;
            const turnText = turnsRemaining === 1 ? 'turn' : 'turns';
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

        let targetDim, portType;
    if (currentDim === DIMENSION_CONSTANTS.SURFACE) {
            // On the surface, determine where the PORT leads
            const cisternPos = MultiTileHandler.findCisternPosition(playerPos.x, playerPos.y, this.game.grid);
            const isHole = MultiTileHandler.isHole(playerPos.x, playerPos.y, this.game.grid);

            if (cisternPos) {
                // Entering underground via cistern
                targetDim = DIMENSION_CONSTANTS.UNDERGROUND;
                portType = 'underground';
                this.game.portTransitionData = { from: 'cistern', x: playerPos.x, y: playerPos.y };
                // Ensure player's underground depth is initialized to 1 (first underground level)
                this.game.player.undergroundDepth = DIMENSION_CONSTANTS.DEFAULT_UNDERGROUND_DEPTH;
                this.game.player.currentZone.depth = DIMENSION_CONSTANTS.DEFAULT_UNDERGROUND_DEPTH;
            } else if (isHole) {
                targetDim = DIMENSION_CONSTANTS.UNDERGROUND;
                portType = 'underground';
                this.game.portTransitionData = { from: 'hole', x: playerPos.x, y: playerPos.y };
                // Ensure player's underground depth is initialized to 1 (first underground level)
                this.game.player.undergroundDepth = DIMENSION_CONSTANTS.DEFAULT_UNDERGROUND_DEPTH;
                this.game.player.currentZone.depth = DIMENSION_CONSTANTS.DEFAULT_UNDERGROUND_DEPTH;
            } else if (this.game.grid[playerPos.y]?.[playerPos.x] && this.game.grid[playerPos.y][playerPos.x].portKind === 'stairdown') {
                // Descend via stairdown into a deeper underground level
                // We represent deeper underground layers by keeping dimension=2 and tracking depth via player.undergroundDepth
                targetDim = DIMENSION_CONSTANTS.UNDERGROUND;
                portType = 'underground';
                // Mark transition as from stairdown so the new zone can place a stairup at emergence point
                this.game.portTransitionData = { from: 'stairdown', x: playerPos.x, y: playerPos.y };
                try { logger && logger.debug && logger.debug(`Port transition set: stairdown at (${playerPos.x},${playerPos.y}), prevDepth=${prevDepth} -> newDepth=${this.game.player.undergroundDepth}`); } catch (e) {}
                // Increase player's underground depth (surface==0 -> first underground == 1)
                const prevDepth = Number.isInteger(this.game.player.undergroundDepth) ? this.game.player.undergroundDepth : 0;
                this.game.player.undergroundDepth = prevDepth + 1;
                this.game.player.currentZone.depth = this.game.player.undergroundDepth;
            } else if (this.game.grid[playerPos.y]?.[playerPos.x] && this.game.grid[playerPos.y][playerPos.x].portKind === 'stairup') {
                // Ascend via stairup to a shallower underground level or surface
                const prevDepth = Number.isInteger(this.game.player.undergroundDepth) ? this.game.player.undergroundDepth : 0;
                // Decrease depth; if we were at depth 1, ascending returns to surface (depth 0)
                if (prevDepth > 1) {
                    targetDim = DIMENSION_CONSTANTS.UNDERGROUND;
                    portType = 'underground';
                    this.game.portTransitionData = { from: 'stairup', x: playerPos.x, y: playerPos.y };
                        try { logger && logger.debug && logger.debug(`Port transition set: stairup at (${playerPos.x},${playerPos.y}), newDepth=${this.game.player.undergroundDepth}`); } catch (e) {}
                    this.game.player.undergroundDepth = prevDepth - 1;
                    this.game.player.currentZone.depth = this.game.player.undergroundDepth;
                } else {
                    // prevDepth is 0 or 1 -> return to surface
                    targetDim = DIMENSION_CONSTANTS.SURFACE;
                    portType = this.game.player.currentZone.portType;
                    // Mark transition so the surface emergence will get the matching stairdown
                    this.game.portTransitionData = { from: 'stairup', x: playerPos.x, y: playerPos.y };
                        try { logger && logger.debug && logger.debug(`Port transition set: stairup->surface at (${playerPos.x},${playerPos.y})`); } catch (e) {}
                    this.game.player.undergroundDepth = DIMENSION_CONSTANTS.DEFAULT_SURFACE_DEPTH;
                    this.game.player.currentZone.depth = DIMENSION_CONSTANTS.DEFAULT_SURFACE_DEPTH;
                }
            } else {
                // Entering interior via house/shack door
                targetDim = DIMENSION_CONSTANTS.INTERIOR;
                portType = 'interior';
                // Record the surface port coords so we can return the player to this exact port when exiting the interior
                this.game.portTransitionData = { from: 'interior', x: playerPos.x, y: playerPos.y };
            }
        } else {
            // Exiting to surface or handling stair transitions while underground
            // If currently in underground, check for stair portals that should change depth rather than exit to surface
            if (currentDim === DIMENSION_CONSTANTS.UNDERGROUND) {
                const tileUnderPlayer = this.game.grid[playerPos.y]?.[playerPos.x];
                const portKind = tileUnderPlayer && tileUnderPlayer.portKind;
                if (portKind === 'stairdown') {
                    // Descend further: keep dimension=2 but increase player's underground depth and mark transition
                    targetDim = DIMENSION_CONSTANTS.UNDERGROUND;
                    portType = 'underground';
                    this.game.portTransitionData = { from: 'stairdown', x: playerPos.x, y: playerPos.y };
                    const prevDepth2 = Number.isInteger(this.game.player.undergroundDepth) ? this.game.player.undergroundDepth : 0;
                    this.game.player.undergroundDepth = prevDepth2 + 1;
                    this.game.player.currentZone.depth = this.game.player.undergroundDepth;
                } else if (portKind === 'stairup') {
                    // Ascend one level: if depth > 1, stay in underground with decreased depth; if depth == 1, go to surface
                    const currentDepth = Number.isInteger(this.game.player.undergroundDepth) ? this.game.player.undergroundDepth : 0;
                    if (currentDepth > 1) {
                        targetDim = DIMENSION_CONSTANTS.UNDERGROUND;
                        portType = 'underground';
                        this.game.portTransitionData = { from: 'stairup', x: playerPos.x, y: playerPos.y };
                        this.game.player.undergroundDepth = currentDepth - 1;
                        this.game.player.currentZone.depth = this.game.player.undergroundDepth;
                    } else {
                        // Depth 1 (or 0) -> surface
                        targetDim = DIMENSION_CONSTANTS.SURFACE;
                        portType = this.game.player.currentZone.portType;
                        // Ensure we mark a stairup->surface transition so surface gets a stairdown
                        this.game.portTransitionData = { from: 'stairup', x: playerPos.x, y: playerPos.y };
                        this.game.player.undergroundDepth = DIMENSION_CONSTANTS.DEFAULT_SURFACE_DEPTH;
                        this.game.player.currentZone.depth = DIMENSION_CONSTANTS.DEFAULT_SURFACE_DEPTH;
                    }
                } else {
                    // Regular port: surface exit
                    targetDim = DIMENSION_CONSTANTS.SURFACE;
                    portType = this.game.player.currentZone.portType;
                }
            } else {
                // Exiting to surface from interior (non-underground)
                targetDim = DIMENSION_CONSTANTS.SURFACE;
                portType = this.game.player.currentZone.portType;
            }
        }

        this.game.player.currentZone.dimension = targetDim;
        this.game.player.currentZone.portType = portType;
        this.game.transitionToZone(this.game.player.currentZone.x, this.game.player.currentZone.y, 'port', playerPos.x, playerPos.y);
    }

    handlePitfallTransition(x, y) {
        // Player stepped on a pitfall trap
        // Player fell through a pitfall. Keep the surface tile as a primitive PITFALL
        // (do not place an object-style 'stairup' on the surface). The underground
        // generator will handle any emergence metadata.
        if (this.game.grid && this.game.grid[y]) {
            this.game.grid[y][x] = TILE_TYPES.PITFALL;
        }

        // Set data for the transition
        this.game.portTransitionData = { from: 'pitfall', x, y };

        // Transition to the underground dimension
        // Mark the player's zone/dimension and port type so exits back to surface
        // are recognized as coming from underground (so we can return to the same port)
        this.game.player.currentZone.dimension = 2; // Underground
        this.game.player.currentZone.portType = 'underground';
        // Ensure player's underground depth is initialized to 1 (first underground level)
        this.game.player.undergroundDepth = 1;
        this.game.player.currentZone.depth = 1;
        this.game.transitionToZone(this.game.player.currentZone.x, this.game.player.currentZone.y, 'port', x, y);
        // Some callers/tests expect portTransitionData to remain available immediately after
        // calling handlePitfallTransition. The ZoneManager.transitionToZone clears it at the
        // end of the transition; to support those expectations (and to preserve the
        // original coordinates for any immediate post-transition logic), restore it here.
        this.game.portTransitionData = { from: 'pitfall', x, y };
    }

    isTransitionEligible(gridCoords, playerPos) {
        // Check if tapped tile is an exit and player is already on it - trigger zone transition
        if (gridCoords.x === playerPos.x && gridCoords.y === playerPos.y) {
            const tileUnderPlayer = this.game.grid[playerPos.y]?.[playerPos.x];

            if (tileUnderPlayer === TILE_TYPES.EXIT) {
                this.handleExitTap(gridCoords.x, gridCoords.y);
                return true;
            } else if (tileUnderPlayer === TILE_TYPES.PORT || (tileUnderPlayer && tileUnderPlayer.type === TILE_TYPES.PORT)) {
                this.handlePortTransition();
                return true;
            }
        }
        return false;
    }
}
