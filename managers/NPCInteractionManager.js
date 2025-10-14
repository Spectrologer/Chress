import { TILE_TYPES } from '../core/constants.js';
import { Sign } from '../ui/Sign.js';

export class NPCInteractionManager {
    constructor(game) {
        this.game = game;
    }

    // Food/water trade logic (moved from interactWithNPC)
    tradeFoodForWater(foodType) {
        const index = this.game.player.inventory.findIndex(item => item.type === 'food' && item.foodType.includes(foodType));
        if (index >= 0 && this.game.player.inventory.length < 6) {
            this.game.player.inventory.splice(index, 1);
            this.game.player.inventory.push({ type: 'water' });
            this.game.uiManager.updatePlayerStats();
        } else if (index >= 0 && this.game.player.inventory.length >= 6) {
            this.game.uiManager.addMessageToLog('Inventory is full! Cannot complete trade.');
        }
    }

    // Interaction logic for each NPC type
    interactWithPenne(gridCoords) {
        const playerPos = this.game.player.getPosition();
        const targetTile = this.game.grid[gridCoords.y]?.[gridCoords.x];
        if (targetTile !== TILE_TYPES.PENNE) return false;

        const dx = Math.abs(gridCoords.x - playerPos.x);
        const dy = Math.abs(gridCoords.y - playerPos.y);
        const isAdjacent = (dx <= 1 && dy <= 1) && !(dx === 0 && dy === 0);
        if (isAdjacent) {
            this.game.uiManager.showBarterWindow('penne');
            return true;
        }
        return false;
    }

    interactWithSquig(gridCoords) {
        const playerPos = this.game.player.getPosition();
        const targetTile = this.game.grid[gridCoords.y]?.[gridCoords.x];
        if (targetTile !== TILE_TYPES.SQUIG) return false;

        const dx = Math.abs(gridCoords.x - playerPos.x);
        const dy = Math.abs(gridCoords.y - playerPos.y);
        const isAdjacent = (dx <= 1 && dy <= 1) && !(dx === 0 && dy === 0);
        if (isAdjacent) {
            this.game.uiManager.showBarterWindow('squig');
            return true;
        }
        return false;
    }

    interactWithRune(gridCoords) {
        const playerPos = this.game.player.getPosition();
        const targetTile = this.game.grid[gridCoords.y]?.[gridCoords.x];
        if (targetTile !== TILE_TYPES.RUNE) return false;

        const dx = Math.abs(gridCoords.x - playerPos.x);
        const dy = Math.abs(gridCoords.y - playerPos.y);
        const isAdjacent = (dx <= 1 && dy <= 1) && !(dx === 0 && dy === 0);
        if (isAdjacent) {
            this.game.uiManager.showBarterWindow('rune');
            return true;
        }
        return false;
    }

    interactWithNib(gridCoords) {
        const playerPos = this.game.player.getPosition();
        const targetTile = this.game.grid[gridCoords.y]?.[gridCoords.x];
        if (targetTile !== TILE_TYPES.NIB) return false;

        const dx = Math.abs(gridCoords.x - playerPos.x);
        const dy = Math.abs(gridCoords.y - playerPos.y);
        const isAdjacent = (dx <= 1 && dy <= 1) && !(dx === 0 && dy === 0);
        if (isAdjacent) {
            this.game.uiManager.showBarterWindow('nib');
            return true;
        }
        return false;
    }

    interactWithMark(gridCoords) {
        const playerPos = this.game.player.getPosition();
        const targetTile = this.game.grid[gridCoords.y]?.[gridCoords.x];
        if (targetTile !== TILE_TYPES.MARK) return false;

        const dx = Math.abs(gridCoords.x - playerPos.x);
        const dy = Math.abs(gridCoords.y - playerPos.y);
        const isAdjacent = (dx <= 1 && dy <= 1) && !(dx === 0 && dy === 0);
        if (isAdjacent) {
            this.game.uiManager.showBarterWindow('mark');
            return true;
        }
        return false;
    }

    interactWithAxelotl(gridCoords) {
        const playerPos = this.game.player.getPosition();
        const targetTile = this.game.grid[gridCoords.y]?.[gridCoords.x];
        if (targetTile !== TILE_TYPES.AXELOTL) return false;

        const dx = Math.abs(gridCoords.x - playerPos.x);
        const dy = Math.abs(gridCoords.y - playerPos.y);
        const isAdjacent = (dx <= 1 && dy <= 1) && !(dx === 0 && dy === 0);
        if (isAdjacent) {
            this.game.uiManager.showBarterWindow('axelotl');
            return true;
        }
        return false;
    }

    interactWithCrayn(gridCoords) {
        const playerPos = this.game.player.getPosition();
        const targetTile = this.game.grid[gridCoords.y]?.[gridCoords.x];
        if (targetTile !== TILE_TYPES.CRAYN) return false;

        const dx = Math.abs(gridCoords.x - playerPos.x);
        const dy = Math.abs(gridCoords.y - playerPos.y);
        const isAdjacent = (dx <= 1 && dy <= 1) && !(dx === 0 && dy === 0);
        if (isAdjacent) {
            const npcData = Sign.getDialogueNpcData('crayn');
            if (npcData) {
                const message = npcData.messages[npcData.currentMessageIndex];
                this.game.displayingMessageForSign = { message: message, type: 'npc' };
                this.game.uiManager.showSignMessage(message, npcData.portrait, npcData.name);
                npcData.currentMessageIndex = (npcData.currentMessageIndex + 1) % npcData.messages.length;
            }
            return true;
        }
        return false;
    }

    interactWithFelt(gridCoords) {
        const playerPos = this.game.player.getPosition();
        const targetTile = this.game.grid[gridCoords.y]?.[gridCoords.x];
        if (targetTile !== TILE_TYPES.FELT) return false;

        const dx = Math.abs(gridCoords.x - playerPos.x);
        const dy = Math.abs(gridCoords.y - playerPos.y);
        const isAdjacent = (dx <= 1 && dy <= 1) && !(dx === 0 && dy === 0);
        if (isAdjacent) {
            const npcData = Sign.getDialogueNpcData('felt');
            if (npcData) {
                const message = npcData.messages[npcData.currentMessageIndex];
                this.game.displayingMessageForSign = { message: message, type: 'npc' };
                this.game.uiManager.showSignMessage(message, npcData.portrait, npcData.name);
                npcData.currentMessageIndex = (npcData.currentMessageIndex + 1) % npcData.messages.length;
            }
            return true;
        }
        return false;
    }

    interactWithForge(gridCoords) {
        const playerPos = this.game.player.getPosition();
        const targetTile = this.game.grid[gridCoords.y]?.[gridCoords.x];
        if (targetTile !== TILE_TYPES.FORGE) return false;

        const dx = Math.abs(gridCoords.x - playerPos.x);
        const dy = Math.abs(gridCoords.y - playerPos.y);
        const isAdjacent = (dx <= 1 && dy <= 1) && !(dx === 0 && dy === 0);
        if (isAdjacent) {
            const npcData = Sign.getDialogueNpcData('forge');
            if (npcData) {
                const message = npcData.messages[npcData.currentMessageIndex];
                this.game.displayingMessageForSign = { message: message, type: 'npc' };
                this.game.uiManager.showSignMessage(message, npcData.portrait, npcData.name);
                npcData.currentMessageIndex = (npcData.currentMessageIndex + 1) % npcData.messages.length;
            }
            return true;
        }
        return false;
    }

    // Force interaction for pathing adjacency (subset of triggerInteractAt logic)
    forceInteractAt(gridCoords) {
        const playerPos = this.game.player.getPosition();
        const dx = Math.abs(gridCoords.x - playerPos.x);
        const dy = Math.abs(gridCoords.y - playerPos.y);
        const isAdjacent = (dx <= 1 && dy <= 1) && !(dx === 0 && dy === 0);
        if (!isAdjacent) return;

        // Check NPC types
        if (this.game.grid[gridCoords.y]?.[gridCoords.x] === TILE_TYPES.PENNE) {
            this.game.uiManager.showBarterWindow('penne');
            return;
        }
        if (this.game.grid[gridCoords.y]?.[gridCoords.x] === TILE_TYPES.SQUIG) {
            this.game.uiManager.showBarterWindow('squig');
            return;
        }
        if (this.game.grid[gridCoords.y]?.[gridCoords.x] === TILE_TYPES.RUNE) {
            this.game.uiManager.showBarterWindow('rune');
            return;
        }
        if (this.game.grid[gridCoords.y]?.[gridCoords.x] === TILE_TYPES.NIB) {
            this.game.uiManager.showBarterWindow('nib');
            return;
        }
        if (this.game.grid[gridCoords.y]?.[gridCoords.x] === TILE_TYPES.CRAYN) {
            const npcData = Sign.getDialogueNpcData('crayn');
            if (npcData) {
                const message = npcData.messages[npcData.currentMessageIndex];
                this.game.displayingMessageForSign = { message: message, type: 'npc' };
                this.game.uiManager.showSignMessage(message, npcData.portrait, npcData.name);
                npcData.currentMessageIndex = (npcData.currentMessageIndex + 1) % npcData.messages.length;
            }
            return;
        }
        if (this.game.grid[gridCoords.y]?.[gridCoords.x] === TILE_TYPES.FELT) {
            const npcData = Sign.getDialogueNpcData('felt');
            if (npcData) {
                const message = npcData.messages[npcData.currentMessageIndex];
                this.game.displayingMessageForSign = { message: message, type: 'npc' };
                this.game.uiManager.showSignMessage(message, npcData.portrait, npcData.name);
                npcData.currentMessageIndex = (npcData.currentMessageIndex + 1) % npcData.messages.length;
            }
            return;
        }
        if (this.game.grid[gridCoords.y]?.[gridCoords.x] === TILE_TYPES.FORGE) {
            const npcData = Sign.getDialogueNpcData('forge');
            if (npcData) {
                const message = npcData.messages[npcData.currentMessageIndex];
                this.game.displayingMessageForSign = { message: message, type: 'npc' };
                this.game.uiManager.showSignMessage(message, npcData.portrait, npcData.name);
                npcData.currentMessageIndex = (npcData.currentMessageIndex + 1) % npcData.messages.length;
            }
            return;
        }
        if (this.game.grid[gridCoords.y]?.[gridCoords.x] === TILE_TYPES.AXELOTL) {
            this.game.uiManager.showBarterWindow('axelotl');
            return;
        }
    }
}
