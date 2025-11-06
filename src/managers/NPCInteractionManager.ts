import { Sign } from '@ui/Sign';
import { eventBus } from '@core/EventBus';
import { EventTypes } from '@core/EventTypes';
import { isAdjacent } from '@core/utils/DirectionUtils';
import { NPC_CONFIG } from '@config/NPCConfig';
import { ContentRegistry } from '@core/ContentRegistry';
import { Position } from '@core/Position';
import { TileTypeChecker } from '@utils/TypeChecks';
import type { IGame, ICoordinates } from '@core/GameContext';

interface NPCConfigEntry {
    tileType: number;
    action: 'barter' | 'dialogue';
}

export class NPCInteractionManager {
    private game: IGame;
    private npcConfig: Record<string, NPCConfigEntry>;

    constructor(game: IGame) {
        this.game = game;
        this.npcConfig = NPC_CONFIG;
    }

    /**
     * Dynamic NPC interaction handler for NPCs registered in ContentRegistry
     * This handles all NPCs defined in JSON files automatically
     */
    interactWithDynamicNPC(gridCoords: ICoordinates): boolean {
        const playerPos = this.game.player.getPosition();
        const targetTile = this.game.grid[gridCoords.y]?.[gridCoords.x];

        // Get the tile type using TypeChecks utility
        const tileType = TileTypeChecker.getTileType(targetTile);

        // Look up NPC by tile type in ContentRegistry
        const npcConfig = ContentRegistry.getNPCByTileType(tileType);
        if (!npcConfig) return false;

        // Check if NPC has character data (dialogue NPCs)
        const characterData = npcConfig.metadata?.characterData;
        if (!characterData) return false;

        const dx = Math.abs(gridCoords.x - playerPos.x);
        const dy = Math.abs(gridCoords.y - playerPos.y);

        if (isAdjacent(dx, dy)) {
            // Track NPC position for distance-based auto-close
            this.game.transientGameState.setCurrentNPCPosition(Position.from(gridCoords));

            // Handle based on NPC action type
            if (npcConfig.action === 'dialogue') {
                const characterId = (characterData as any)?.id || 'unknown';
                const npcData = Sign.getDialogueNpcData(characterId, this.game as any);
                if (npcData) {
                    const message = npcData.messages[npcData.currentMessageIndex];
                    const buttonText = npcData.buttonTexts?.[npcData.currentMessageIndex] || null;
                    const signData = { message: message, type: 'npc' };

                    // Set both old and new state for compatibility
                    (this.game as any).displayingMessageForSign = signData;
                    if (this.game.transientGameState) {
                        this.game.transientGameState.setDisplayingSignMessage(signData);
                    }

                    // Use event instead of direct UIManager call
                    eventBus.emit(EventTypes.UI_DIALOG_SHOW, {
                    type: 'sign',
                    message: message,
                    portrait: npcData.portrait,
                    name: npcData.name,
                    buttonText: buttonText,
                    category: npcData.category,
                        portraitBackground: npcData.portraitBackground
                    });

                    // Advance dialogue based on cycle mode
                    if (npcData.cycleMode === 'sequential') {
                        // Sequential: advance to next message, stop at last
                        if (npcData.currentMessageIndex < npcData.messages.length - 1) {
                            npcData.currentMessageIndex++;
                        }
                    } else {
                        // Loop (default): cycle back to first message
                        npcData.currentMessageIndex = (npcData.currentMessageIndex + 1) % npcData.messages.length;
                    }
                }
            } else if (npcConfig.action === 'barter') {
                // Use event instead of direct UIManager call
                const characterId = (characterData as any)?.id || 'unknown';
                eventBus.emit(EventTypes.UI_DIALOG_SHOW, {
                    type: 'barter',
                    npc: characterId,
                    playerPos: playerPos,
                    npcPos: gridCoords
                });
            }

            return true;
        }

        return false;
    }

    // Food/water trade
    tradeFoodForWater(foodType: string): void {
        const index = this.game.player.inventory.findIndex((item: any) => item && item.type === 'food' && item.foodType.includes(foodType));
        if (index >= 0) {
            const nonNullCount = this.game.player.inventory.filter(item => item !== null).length;
            if (nonNullCount < 6) {
                this.game.player.inventory[index] = null as any;
                this.game.player.inventory.push({ type: 'water' });
                eventBus.emit(EventTypes.UI_UPDATE_STATS, {});
            } else {
                // Use event instead of direct UIManager call
                eventBus.emit(EventTypes.UI_MESSAGE_LOG, {
                    text: 'Inventory is full! Cannot complete trade.',
                    category: 'trade',
                    priority: 'warning',
                    timestamp: Date.now()
                });
            }
        }
    }

    // Factory for NPC handlers
    private _createNPCInteractionHandler(npcName: string): ((gridCoords: ICoordinates) => boolean) | null {
        const config = this.npcConfig[npcName];
        if (!config) return null;

        return (gridCoords: ICoordinates) => {
            const playerPos = this.game.player.getPosition();
            const targetTile = this.game.grid[gridCoords.y]?.[gridCoords.x];
            if (targetTile !== config.tileType) return false;

            const dx = Math.abs(gridCoords.x - playerPos.x);
            const dy = Math.abs(gridCoords.y - playerPos.y);

            if (isAdjacent(dx, dy)) {
                // Track NPC position for distance-based auto-close
                this.game.transientGameState.setCurrentNPCPosition(Position.from(gridCoords));

                if (config.action === 'barter') {
                    // Use event instead of direct UIManager call
                    eventBus.emit(EventTypes.UI_DIALOG_SHOW, {
                        type: 'barter',
                        npc: npcName,
                        playerPos: playerPos,
                        npcPos: gridCoords
                    });
                } else if (config.action === 'dialogue') {
                    const npcData = Sign.getDialogueNpcData(npcName, this.game as any);
                    if (npcData) {
                        const message = npcData.messages[npcData.currentMessageIndex];
                        const buttonText = npcData.buttonTexts?.[npcData.currentMessageIndex] || null;
                        const signData = { message: message, type: 'npc' };

                        // Set both old and new state for compatibility
                        (this.game as any).displayingMessageForSign = signData;
                        if (this.game.transientGameState) {
                            this.game.transientGameState.setDisplayingSignMessage(signData);
                        }

                        // Use event instead of direct UIManager call
                        eventBus.emit(EventTypes.UI_DIALOG_SHOW, {
                        type: 'sign',
                        message: message,
                        portrait: npcData.portrait,
                        name: npcData.name,
                        buttonText: buttonText,
                        category: npcData.category,
                            portraitBackground: npcData.portraitBackground
                        });

                        // Advance dialogue based on cycle mode
                        if (npcData.cycleMode === 'sequential') {
                            // Sequential: advance to next message, stop at last
                            if (npcData.currentMessageIndex < npcData.messages.length - 1) {
                                npcData.currentMessageIndex++;
                            }
                        } else {
                            // Loop (default): cycle back to first message
                            npcData.currentMessageIndex = (npcData.currentMessageIndex + 1) % npcData.messages.length;
                        }
                    }
                }
                return true;
            }
            return false;
        };
    }

    // Check adjacency and interact
    private _interactWithNPC(gridCoords: ICoordinates, npcName: string): boolean {
        const handler = this._createNPCInteractionHandler(npcName);
        return handler ? handler(gridCoords) : false;
    }

    // Factory pattern interactions
    interactWithPenne(gridCoords: ICoordinates): boolean { return this._interactWithNPC(gridCoords, 'penne'); }
    interactWithSquig(gridCoords: ICoordinates): boolean { return this._interactWithNPC(gridCoords, 'squig'); }
    interactWithRune(gridCoords: ICoordinates): boolean { return this._interactWithNPC(gridCoords, 'rune'); }
    interactWithNib(gridCoords: ICoordinates): boolean { return this._interactWithNPC(gridCoords, 'nib'); }
    interactWithMark(gridCoords: ICoordinates): boolean { return this._interactWithNPC(gridCoords, 'mark'); }
    interactWithAxelotl(gridCoords: ICoordinates): boolean { return this._interactWithNPC(gridCoords, 'axelotl'); }
    interactWithGouge(gridCoords: ICoordinates): boolean { return this._interactWithNPC(gridCoords, 'gouge'); }
    interactWithCrayn(gridCoords: ICoordinates): boolean { return this._interactWithNPC(gridCoords, 'crayn'); }
    interactWithFelt(gridCoords: ICoordinates): boolean { return this._interactWithNPC(gridCoords, 'felt'); }
    interactWithForge(gridCoords: ICoordinates): boolean { return this._interactWithNPC(gridCoords, 'forge'); }

    // Force interaction for pathing
    forceInteractAt(gridCoords: ICoordinates): void {
        const playerPos = this.game.player.getPosition();
        const dx = Math.abs(gridCoords.x - playerPos.x);
        const dy = Math.abs(gridCoords.y - playerPos.y);
        if (!isAdjacent(dx, dy)) return;

        const targetTile = this.game.grid[gridCoords.y]?.[gridCoords.x];

        // First try hardcoded NPCs from NPC_CONFIG
        for (const [npcName, config] of Object.entries(this.npcConfig)) {
            if (targetTile === config.tileType) {
                // Track NPC position for distance-based auto-close
                this.game.transientGameState.setCurrentNPCPosition(Position.from(gridCoords));

                if (config.action === 'barter') {
                    // Use event instead of direct UIManager call
                    eventBus.emit(EventTypes.UI_DIALOG_SHOW, {
                        type: 'barter',
                        npc: npcName,
                        playerPos: playerPos,
                        npcPos: gridCoords
                    });
                } else if (config.action === 'dialogue') {
                    const npcData = Sign.getDialogueNpcData(npcName, this.game as any);
                    if (npcData) {
                        const message = npcData.messages[npcData.currentMessageIndex];
                        const buttonText = npcData.buttonTexts?.[npcData.currentMessageIndex] || null;
                        const signData = { message: message, type: 'npc' };

                        // Set both old and new state for compatibility
                        (this.game as any).displayingMessageForSign = signData;
                        if (this.game.transientGameState) {
                            this.game.transientGameState.setDisplayingSignMessage(signData);
                        }

                        // Use event instead of direct UIManager call
                        eventBus.emit(EventTypes.UI_DIALOG_SHOW, {
                        type: 'sign',
                        message: message,
                        portrait: npcData.portrait,
                        name: npcData.name,
                        buttonText: buttonText,
                        category: npcData.category,
                            portraitBackground: npcData.portraitBackground
                        });

                        // Advance dialogue based on cycle mode
                        if (npcData.cycleMode === 'sequential') {
                            // Sequential: advance to next message, stop at last
                            if (npcData.currentMessageIndex < npcData.messages.length - 1) {
                                npcData.currentMessageIndex++;
                            }
                        } else {
                            // Loop (default): cycle back to first message
                            npcData.currentMessageIndex = (npcData.currentMessageIndex + 1) % npcData.messages.length;
                        }
                    }
                }
                return;
            }
        }

        // If not found in hardcoded config, try dynamic NPCs from ContentRegistry
        this.interactWithDynamicNPC(gridCoords);
    }
}
