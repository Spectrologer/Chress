import { TILE_TYPES } from '../core/constants.js';
import { Sign } from '../ui/Sign.js';
import { eventBus } from '../core/EventBus.js';
import { EventTypes } from '../core/EventTypes.js';
import { isAdjacent } from '../core/utils/DirectionUtils.js';

export class NPCInteractionManager {
    constructor(game) {
        this.game = game;
        this.npcConfig = this._initializeNPCConfig();
    }

    // Food/water trade
    tradeFoodForWater(foodType) {
        const index = this.game.player.inventory.findIndex(item => item.type === 'food' && item.foodType.includes(foodType));
        if (index >= 0 && this.game.player.inventory.length < 6) {
            this.game.player.inventory.splice(index, 1);
            this.game.player.inventory.push({ type: 'water' });
            eventBus.emit(EventTypes.UI_UPDATE_STATS, {});
        } else if (index >= 0 && this.game.player.inventory.length >= 6) {
            this.game.uiManager.addMessageToLog('Inventory is full! Cannot complete trade.');
        }
    }

    // NPC config mapping
    _initializeNPCConfig() {
        return {
            penne: { tileType: TILE_TYPES.PENNE, action: 'barter' },
            squig: { tileType: TILE_TYPES.SQUIG, action: 'barter' },
            rune: { tileType: TILE_TYPES.RUNE, action: 'barter' },
            nib: { tileType: TILE_TYPES.NIB, action: 'barter' },
            mark: { tileType: TILE_TYPES.MARK, action: 'barter' },
            axelotl: { tileType: TILE_TYPES.AXELOTL, action: 'barter' },
            gouge: { tileType: TILE_TYPES.GOUGE, action: 'barter' },
            crayn: { tileType: TILE_TYPES.CRAYN, action: 'dialogue' },
            felt: { tileType: TILE_TYPES.FELT, action: 'dialogue' },
            forge: { tileType: TILE_TYPES.FORGE, action: 'dialogue' }
        };
    }

    // Factory for NPC handlers
    _createNPCInteractionHandler(npcName) {
        const config = this.npcConfig[npcName];
        if (!config) return null;

        return (gridCoords) => {
            const playerPos = this.game.player.getPosition();
            const targetTile = this.game.grid[gridCoords.y]?.[gridCoords.x];
            if (targetTile !== config.tileType) return false;

            const dx = Math.abs(gridCoords.x - playerPos.x);
            const dy = Math.abs(gridCoords.y - playerPos.y);

            if (isAdjacent(dx, dy)) {
                if (config.action === 'barter') {
                    this.game.uiManager.showBarterWindow(npcName);
                } else if (config.action === 'dialogue') {
                    const npcData = Sign.getDialogueNpcData(npcName);
                    if (npcData) {
                        const message = npcData.messages[npcData.currentMessageIndex];
                        this.game.displayingMessageForSign = { message: message, type: 'npc' };
                        this.game.uiManager.showSignMessage(message, npcData.portrait, npcData.name);
                        npcData.currentMessageIndex = (npcData.currentMessageIndex + 1) % npcData.messages.length;
                    }
                }
                return true;
            }
            return false;
        };
    }

    // Check adjacency and interact
    _interactWithNPC(gridCoords, npcName) {
        const handler = this._createNPCInteractionHandler(npcName);
        return handler ? handler(gridCoords) : false;
    }

    // Factory pattern interactions
    interactWithPenne(gridCoords) { return this._interactWithNPC(gridCoords, 'penne'); }
    interactWithSquig(gridCoords) { return this._interactWithNPC(gridCoords, 'squig'); }
    interactWithRune(gridCoords) { return this._interactWithNPC(gridCoords, 'rune'); }
    interactWithNib(gridCoords) { return this._interactWithNPC(gridCoords, 'nib'); }
    interactWithMark(gridCoords) { return this._interactWithNPC(gridCoords, 'mark'); }
    interactWithAxelotl(gridCoords) { return this._interactWithNPC(gridCoords, 'axelotl'); }
    interactWithGouge(gridCoords) { return this._interactWithNPC(gridCoords, 'gouge'); }
    interactWithCrayn(gridCoords) { return this._interactWithNPC(gridCoords, 'crayn'); }
    interactWithFelt(gridCoords) { return this._interactWithNPC(gridCoords, 'felt'); }
    interactWithForge(gridCoords) { return this._interactWithNPC(gridCoords, 'forge'); }

    // Force interaction for pathing
    forceInteractAt(gridCoords) {
        const playerPos = this.game.player.getPosition();
        const dx = Math.abs(gridCoords.x - playerPos.x);
        const dy = Math.abs(gridCoords.y - playerPos.y);
        if (!isAdjacent(dx, dy)) return;

        const targetTile = this.game.grid[gridCoords.y]?.[gridCoords.x];

        // Find and trigger NPC
        for (const [npcName, config] of Object.entries(this.npcConfig)) {
            if (targetTile === config.tileType) {
                if (config.action === 'barter') {
                    this.game.uiManager.showBarterWindow(npcName);
                } else if (config.action === 'dialogue') {
                    const npcData = Sign.getDialogueNpcData(npcName);
                    if (npcData) {
                        const message = npcData.messages[npcData.currentMessageIndex];
                        this.game.displayingMessageForSign = { message: message, type: 'npc' };
                        this.game.uiManager.showSignMessage(message, npcData.portrait, npcData.name);
                        npcData.currentMessageIndex = (npcData.currentMessageIndex + 1) % npcData.messages.length;
                    }
                }
                return;
            }
        }
    }
}
