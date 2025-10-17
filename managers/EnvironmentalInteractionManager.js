import { TILE_TYPES } from '../core/constants.js';
import { Sign } from '../ui/Sign.js';

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
        const isAdjacent = (dx <= 1 && dy <= 1) && !(dx === 0 && dy === 0);

        if (isAdjacent) {
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
        let statueNpcType = null;

        if (statueTile === TILE_TYPES.LIZARDY_STATUE) {
            statueNpcType = 'statue_lizardy';
        } else if (statueTile === TILE_TYPES.LIZARDO_STATUE) {
            statueNpcType = 'statue_lizardo';
        } else if (statueTile === TILE_TYPES.LIZARDEAUX_STATUE) {
            statueNpcType = 'statue_lizardeaux';
        } else if (statueTile === TILE_TYPES.ZARD_STATUE) {
            statueNpcType = 'statue_zard';
        } else if (statueTile === TILE_TYPES.LAZERD_STATUE) {
            statueNpcType = 'statue_lazerd';
        } else if (statueTile === TILE_TYPES.LIZORD_STATUE) {
            statueNpcType = 'statue_lizord';
        } else if (statueTile === TILE_TYPES.BOMB_STATUE) {
            statueNpcType = 'statue_bomb';
        } else if (statueTile === TILE_TYPES.SPEAR_STATUE) {
            statueNpcType = 'statue_spear';
        } else if (statueTile === TILE_TYPES.BOW_STATUE) {
            statueNpcType = 'statue_bow';
        } else if (statueTile === TILE_TYPES.HORSE_STATUE) {
            statueNpcType = 'statue_horse';
        } else if (statueTile === TILE_TYPES.BOOK_STATUE) {
            statueNpcType = 'statue_book';
        } else if (statueTile === TILE_TYPES.SHOVEL_STATUE) {
            statueNpcType = 'statue_shovel';
        }

        if (statueNpcType) {
            // Check if player is adjacent to the statue
            const playerPos = this.game.player.getPosition();
            const dx = Math.abs(gridCoords.x - playerPos.x);
            const dy = Math.abs(gridCoords.y - playerPos.y);
            const isAdjacent = (dx <= 1 && dy <= 1) && !(dx === 0 && dy === 0);

            if (isAdjacent) {
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
        const isAdjacent = (dx <= 1 && dy <= 1) && !(dx === 0 && dy === 0);
        if (!isAdjacent) return;

        // Check if sign
        const signTile = this.game.grid[gridCoords.y]?.[gridCoords.x];
        if (signTile && typeof signTile === 'object' && signTile.type === TILE_TYPES.SIGN) {
            Sign.handleClick(signTile, this.game, isAdjacent);
            const isAlreadyDisplayed = this.game.displayingMessageForSign &&
                                      this.game.displayingMessageForSign.message === signTile.message;
            const showingNewMessage = !isAlreadyDisplayed;
            if (showingNewMessage && signTile.message !== this.game.lastSignMessage) {
                this.game.uiManager.addMessageToLog(`A sign reads: "${signTile.message.replace(/<br>/g, ' ')}"`);
                this.game.lastSignMessage = signTile.message;
            }
            return;
        }

        // Check enemy statue
        const statueTile = this.game.grid[gridCoords.y]?.[gridCoords.x];
        let statueNpcType = null;
    if (statueTile === TILE_TYPES.LIZARDY_STATUE) statueNpcType = 'statue_lizardy';
    else if (statueTile === TILE_TYPES.LIZARDO_STATUE) statueNpcType = 'statue_lizardo';
    else if (statueTile === TILE_TYPES.LIZARDEAUX_STATUE) statueNpcType = 'statue_lizardeaux';
    else if (statueTile === TILE_TYPES.ZARD_STATUE) statueNpcType = 'statue_zard';
    else if (statueTile === TILE_TYPES.LAZERD_STATUE) statueNpcType = 'statue_lazerd';
    else if (statueTile === TILE_TYPES.LIZORD_STATUE) statueNpcType = 'statue_lizord';
    else if (statueTile === TILE_TYPES.BOMB_STATUE) statueNpcType = 'statue_bomb';
    else if (statueTile === TILE_TYPES.SPEAR_STATUE) statueNpcType = 'statue_spear';
    else if (statueTile === TILE_TYPES.BOW_STATUE) statueNpcType = 'statue_bow';
    else if (statueTile === TILE_TYPES.HORSE_STATUE) statueNpcType = 'statue_horse';
    else if (statueTile === TILE_TYPES.BOOK_STATUE) statueNpcType = 'statue_book';
    else if (statueTile === TILE_TYPES.SHOVEL_STATUE) statueNpcType = 'statue_shovel';

        if (statueNpcType) {
            this.game.uiManager.showStatueInfo(statueNpcType);
            return;
        }
    }
}
