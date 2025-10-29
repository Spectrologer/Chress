import { TILE_TYPES } from '../core/constants/index.js';
import { Sign } from '../ui/Sign.js';
import { TileRegistry } from '../core/TileRegistry.js';
import { isAdjacent } from '../core/utils/DirectionUtils.js';
import { eventBus } from '../core/EventBus.js';
import { EventTypes } from '../core/EventTypes.js';
import { isTileObjectOfType } from '../utils/TypeChecks.js';

export class EnvironmentalInteractionManager {
    constructor(game) {
        this.game = game;
    }

    handleSignTap(gridCoords) {
        const gridManager = this.game.gridManager;
        const signTile = gridManager.getTile(gridCoords.x, gridCoords.y);
        if (!isTileObjectOfType(signTile, TILE_TYPES.SIGN)) return false;

        // Check if player is adjacent to this sign
        const playerPos = this.game.player.getPosition();
        const dx = Math.abs(gridCoords.x - playerPos.x);
        const dy = Math.abs(gridCoords.y - playerPos.y);

        if (isAdjacent(dx, dy)) {
            const transientState = this.game.transientGameState;

            // Check if this is a new message being displayed (not already showing)
            const displayingSign = transientState.getDisplayingSignMessage();
            const isAlreadyDisplayed = displayingSign && displayingSign.message === signTile.message;
            const showingNewMessage = !isAlreadyDisplayed;

            // Let Sign class handle the toggle logic
            Sign.handleClick(signTile, this.game, isAdjacent);

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

    handleStatueTap(gridCoords) {
        const gridManager = this.game.gridManager;
        const statueTile = gridManager.getTile(gridCoords.x, gridCoords.y);

        // Use centralized TileRegistry for statue mapping
        const statueNpcType = TileRegistry.getStatueNPCType(statueTile);

        if (statueNpcType) {
            // Check if player is adjacent to the statue
            const playerPos = this.game.player.getPosition();
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

    forceInteractAt(gridCoords) {
        const gridManager = this.game.gridManager;
        const playerPos = this.game.player.getPosition();
        const dx = Math.abs(gridCoords.x - playerPos.x);
        const dy = Math.abs(gridCoords.y - playerPos.y);
        if (!isAdjacent(dx, dy)) return;

        const transientState = this.game.transientGameState;

        // Check if sign
        const signTile = gridManager.getTile(gridCoords.x, gridCoords.y);
        if (isTileObjectOfType(signTile, TILE_TYPES.SIGN)) {
            Sign.handleClick(signTile, this.game, isAdjacent(dx, dy));
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
        const statueTile = gridManager.getTile(gridCoords.x, gridCoords.y);
        const statueNpcType = TileRegistry.getStatueNPCType(statueTile);

        if (statueNpcType) {
            eventBus.emit(EventTypes.UI_DIALOG_SHOW, {
                type: 'statue',
                npc: statueNpcType
            });
            return;
        }
    }
}
