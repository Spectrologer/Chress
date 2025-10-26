import { TILE_TYPES } from '../core/constants.js';
import { Sign } from '../ui/Sign.js';
import { TileRegistry } from '../core/TileRegistry.js';
import { isAdjacent } from '../core/utils/DirectionUtils.js';

export class EnvironmentalInteractionManager {
    constructor(game) {
        this.game = game;
    }

    handleSignTap(gridCoords) {
        const signTile = this.game.grid[gridCoords.y]?.[gridCoords.x];
        if (!(signTile && typeof signTile === 'object' && signTile.type === TILE_TYPES.SIGN)) return false;

        // Check if player is adjacent to this sign
        const playerPos = this.game.player.getPosition();
        const dx = Math.abs(gridCoords.x - playerPos.x);
        const dy = Math.abs(gridCoords.y - playerPos.y);

        if (isAdjacent(dx, dy)) {
            // Check if this is a new message being displayed (not already showing)
            const isAlreadyDisplayed = this.game.displayingMessageForSign &&
                                      this.game.displayingMessageForSign.message === signTile.message;
            const showingNewMessage = !isAlreadyDisplayed;

            // Let Sign class handle the toggle logic
            Sign.handleClick(signTile, this.game, isAdjacent);

            // Add to log only when first showing the message
            if (showingNewMessage && signTile.message !== this.game.lastSignMessage) {
                this.game.uiManager.addMessageToLog(`A sign reads: "${signTile.message.replace(/<br>/g, ' ')}"`);
                this.game.lastSignMessage = signTile.message;
            }
            return true; // Interaction handled
        }

        return false;
    }

    handleStatueTap(gridCoords) {
        const statueTile = this.game.grid[gridCoords.y]?.[gridCoords.x];

        // Use centralized TileRegistry for statue mapping
        const statueNpcType = TileRegistry.getStatueNPCType(statueTile);

        if (statueNpcType) {
            // Check if player is adjacent to the statue
            const playerPos = this.game.player.getPosition();
            const dx = Math.abs(gridCoords.x - playerPos.x);
            const dy = Math.abs(gridCoords.y - playerPos.y);

            if (isAdjacent(dx, dy)) {
                this.game.uiManager.showStatueInfo(statueNpcType);
            }
            return true; // Interaction handled
        }

        return false;
    }

    forceInteractAt(gridCoords) {
        const playerPos = this.game.player.getPosition();
        const dx = Math.abs(gridCoords.x - playerPos.x);
        const dy = Math.abs(gridCoords.y - playerPos.y);
        if (!isAdjacent(dx, dy)) return;

        // Check if sign
        const signTile = this.game.grid[gridCoords.y]?.[gridCoords.x];
        if (signTile && typeof signTile === 'object' && signTile.type === TILE_TYPES.SIGN) {
            Sign.handleClick(signTile, this.game, isAdjacent(dx, dy));
            const isAlreadyDisplayed = this.game.displayingMessageForSign &&
                                      this.game.displayingMessageForSign.message === signTile.message;
            const showingNewMessage = !isAlreadyDisplayed;
            if (showingNewMessage && signTile.message !== this.game.lastSignMessage) {
                this.game.uiManager.addMessageToLog(`A sign reads: "${signTile.message.replace(/<br>/g, ' ')}"`);
                this.game.lastSignMessage = signTile.message;
            }
            return;
        }

        // Check enemy statue using centralized TileRegistry
        const statueTile = this.game.grid[gridCoords.y]?.[gridCoords.x];
        const statueNpcType = TileRegistry.getStatueNPCType(statueTile);

        if (statueNpcType) {
            this.game.uiManager.showStatueInfo(statueNpcType);
            return;
        }
    }
}
