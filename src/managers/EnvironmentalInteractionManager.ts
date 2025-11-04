import { TILE_TYPES } from '../core/constants/index';
import { Sign } from '../ui/Sign';
import { TileRegistry } from '../core/TileRegistry';
import { isAdjacent } from '../core/utils/DirectionUtils';
import { eventBus } from '../core/EventBus';
import { EventTypes } from '../core/EventTypes';
import { isTileObjectOfType } from '../utils/TypeChecks';
import type { Game } from '../core/game';
import type { Position } from '../core/Position';

interface SignTile {
    type: string;
    message: string;
    [key: string]: any;
}

export class EnvironmentalInteractionManager {
    private game: Game;

    constructor(game: Game) {
        this.game = game;
    }

    public handleSignTap(gridCoords: Position): boolean {
        const gridManager = this.game.gridManager;
        const tile = gridManager.getTile(gridCoords.x, gridCoords.y);
        if (!isTileObjectOfType(tile, TILE_TYPES.SIGN)) return false;
        const signTile = tile as unknown as SignTile;

        // Check if player is adjacent to this sign
        const playerPos = (this.game.player as any).getPosition() as Position;
        const dx = Math.abs(gridCoords.x - playerPos.x);
        const dy = Math.abs(gridCoords.y - playerPos.y);

        if (isAdjacent(dx, dy)) {
            const transientState = this.game.transientGameState;

            // Check if this is a new message being displayed (not already showing)
            const displayingSign = transientState.getDisplayingSignMessage();
            const isAlreadyDisplayed = displayingSign && displayingSign.message === signTile.message;
            const showingNewMessage = !isAlreadyDisplayed;

            // Let Sign class handle the toggle logic
            Sign.handleClick(signTile, this.game as any, true);

            // Add to log only when first showing the message
            const lastMessage = transientState.getLastSignMessage();
            if (showingNewMessage && signTile.message !== lastMessage) {
                eventBus.emit(EventTypes.UI_MESSAGE_LOG, {
                    text: `A sign reads: "${signTile.message.replace(/<br>/g, ' ')}"`,
                    category: 'environment',
                    priority: 'info'
                });
                transientState.setLastSignMessage(signTile.message);
            }
            return true; // Interaction handled
        }

        return false;
    }

    public handleStatueTap(gridCoords: Position): boolean {
        const gridManager = this.game.gridManager;
        const tile = gridManager.getTile(gridCoords.x, gridCoords.y);

        // Get tile type for TileRegistry
        const tileType = typeof tile === 'object' && tile !== null ? (tile as any).type : tile;

        // Use centralized TileRegistry for statue mapping
        const statueNpcType = TileRegistry.getStatueNPCType(tileType);

        if (statueNpcType) {
            // Check if player is adjacent to the statue
            const playerPos = (this.game.player as any).getPosition() as Position;
            const dx = Math.abs(gridCoords.x - playerPos.x);
            const dy = Math.abs(gridCoords.y - playerPos.y);

            if (isAdjacent(dx, dy)) {
                eventBus.emit(EventTypes.UI_DIALOG_SHOW, {
                    type: 'statue',
                    npc: statueNpcType
                });
            }
            return true; // Interaction handled
        }

        return false;
    }

    public forceInteractAt(gridCoords: Position): void {
        const gridManager = this.game.gridManager;
        const playerPos = (this.game.player as any).getPosition() as Position;
        const dx = Math.abs(gridCoords.x - playerPos.x);
        const dy = Math.abs(gridCoords.y - playerPos.y);
        if (!isAdjacent(dx, dy)) return;

        const transientState = this.game.transientGameState;

        // Check if sign
        const tile = gridManager.getTile(gridCoords.x, gridCoords.y);
        if (isTileObjectOfType(tile, TILE_TYPES.SIGN)) {
            const signTile = tile as unknown as SignTile;
            Sign.handleClick(signTile, this.game as any, true);
            const displayingSign = transientState.getDisplayingSignMessage();
            const isAlreadyDisplayed = displayingSign && displayingSign.message === signTile.message;
            const showingNewMessage = !isAlreadyDisplayed;
            const lastMessage = transientState.getLastSignMessage();
            if (showingNewMessage && signTile.message !== lastMessage) {
                eventBus.emit(EventTypes.UI_MESSAGE_LOG, {
                    text: `A sign reads: "${signTile.message.replace(/<br>/g, ' ')}"`,
                    category: 'environment',
                    priority: 'info'
                });
                transientState.setLastSignMessage(signTile.message);
            }
            return;
        }

        // Check enemy statue using centralized TileRegistry
        const statueTile2 = gridManager.getTile(gridCoords.x, gridCoords.y);
        const statueTileType = typeof statueTile2 === 'object' && statueTile2 !== null ? (statueTile2 as any).type : statueTile2;
        const statueNpcType = TileRegistry.getStatueNPCType(statueTileType);

        if (statueNpcType) {
            eventBus.emit(EventTypes.UI_DIALOG_SHOW, {
                type: 'statue',
                npc: statueNpcType
            });
            return;
        }
    }
}
