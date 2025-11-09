import { TILE_TYPES, GRID_SIZE, ANIMATION_CONSTANTS } from '@core/constants/index';
import { Position } from '@core/Position';
import { TileRegistry } from '@core/TileRegistry';
import { isBomb, isTileType } from '@utils/TileUtils';
import audioManager from '@utils/AudioManager';
import { eventBus } from '@core/EventBus';
import { EventTypes } from '@core/EventTypes';
import { errorHandler, ErrorSeverity } from '@core/ErrorHandler';
import type { Player } from './Player';
import type { Grid } from './Player';

export class PlayerMovement {
    private player: Player;

    constructor(player: Player) {
        this.player = player;
    }

    move(newX: number, newY: number, grid: Grid, onZoneTransition?: (x: number, y: number, side: string) => void): boolean {
        // CRITICAL SAFETY CHECK: Prevent ANY player movement during enemy turns
        // This is a final defensive layer to absolutely prevent input spam from causing movement
        const game = (window as any).gameInstance;
        if (game && !game.isPlayerTurn && !(game as any)._entranceAnimationInProgress) {
            return false;
        }

        const newPos = new Position(newX, newY);

        // Check if the new position is off-grid while player is on an exit tile
        if (!newPos.isInBounds(GRID_SIZE)) {
            // Only allow off-grid movement if player is currently on an exit tile
            if (isTileType(this.player['_position'].getTile(grid), TILE_TYPES.EXIT)) {
                return this.handleZoneTransition(newX, newY, onZoneTransition);
            }
            return false;
        }

        // Check if the new position is walkable
        if (this.isWalkable(newX, newY, grid)) {
            return this.executeMove(newX, newY, grid, newPos);
        } else {
            return false;
        }
    }

    private handleZoneTransition(newX: number, newY: number, onZoneTransition?: (x: number, y: number, side: string) => void): boolean {
        let newZoneX = this.player.currentZone.x;
        let newZoneY = this.player.currentZone.y;
        let exitSide = '';

        if (newX < 0) {
            newZoneX--;
            exitSide = 'left';
        } else if (newX >= GRID_SIZE) {
            newZoneX++;
            exitSide = 'right';
        } else if (newY < 0) {
            newZoneY--;
            exitSide = 'top';
        } else if (newY >= GRID_SIZE) {
            newZoneY++;
            exitSide = 'bottom';
        }

        if (onZoneTransition) {
            onZoneTransition(newZoneX, newZoneY, exitSide);
        }
        return true;
    }

    private executeMove(newX: number, newY: number, grid: Grid, newPos: Position): boolean {
        const tile = newPos.getTile(grid);
        if (typeof tile === 'object' && isBomb(tile)) {
            (window as any).gameInstance.explodeBomb(newX, newY);
            return false;
        }

        this.player.itemManager?.handleItemPickup?.(this.player, newX, newY, grid);

        this.player['_lastPosition'] = this.player['_position'].clone();
        this.player['_position'] = newPos;

        eventBus.emit(EventTypes.PLAYER_MOVED, this.player['_position'].toObject());

        const newTile = this.player['_position'].getTile(grid);
        if (isTileType(newTile, TILE_TYPES.PITFALL)) {
            (window as any).gameInstance.interactionManager.zoneManager.handlePitfallTransition(this.player.x, this.player.y);
            return true;
        }

        this.player.animations['liftFrames'] = ANIMATION_CONSTANTS.LIFT_FRAMES;
        audioManager.playSound('move');

        try {
            this.player.setAction('move');
        } catch (e) {
            errorHandler.handle(e as Error, ErrorSeverity.WARNING, {
                component: 'Player',
                action: 'set action to move'
            });
        }

        return true;
    }

    isWalkable(x: number, y: number, grid: Grid, fromX: number = this.player.x, fromY: number = this.player.y): boolean {
        const pos = new Position(x, y);

        if (!pos.isInBounds(GRID_SIZE)) {
            return false;
        }

        const tile = pos.getTile(grid);
        return TileRegistry.isWalkable(tile);
    }

    setPosition(x: number, y: number): void {
        this.player['_lastPosition'] = this.player['_position'].clone();
        this.player['_position'] = new Position(x, y);
        eventBus.emit(EventTypes.PLAYER_MOVED, this.player['_position'].toObject());
    }

    ensureValidPosition(grid: Grid): void {
        if (!this.isWalkable(this.player.x, this.player.y, grid)) {
            for (let radius = 1; radius < GRID_SIZE; radius++) {
                const positions = this.player['_position'].positionsWithinRadius(radius);
                for (const pos of positions) {
                    if (this.isWalkable(pos.x, pos.y, grid)) {
                        this.setPosition(pos.x, pos.y);
                        return;
                    }
                }
            }
        }
    }
}
