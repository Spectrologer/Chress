import { TextBox } from '@ui/textbox';
import { eventBus } from '@core/EventBus';
import { EventTypes } from '@core/EventTypes';
import { isAdjacent } from '@core/utils/DirectionUtils';
import { NPC_CONFIG } from '@config/NPCConfig';
import { ContentRegistry } from '@core/ContentRegistry';
import { Position } from '@core/Position';
import { TileTypeChecker } from '@utils/TypeChecks';
import type { IGame, ICoordinates } from '@core/context';

interface NPCConfigEntry {
    tileType: number;
    action: 'barter' | 'dialogue';
}

interface CharacterData {
    id: string;
    name?: string;
    portrait?: string;
    category?: string;
}

interface InventoryItem {
    type: string;
    foodType?: string;
    [key: string]: unknown;
}

// Type guard for character data
function hasCharacterId(obj: unknown): obj is { id: string } {
    return typeof obj === 'object' && obj !== null && 'id' in obj && typeof (obj as { id: unknown }).id === 'string';
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
        const playerPos = this.game.playerFacade?.getPosition();
        if (!playerPos) return false;

        if (!this.game.grid) return false;
        const gridRow = this.game.grid[gridCoords.y];
        if (!gridRow) return false;
        const targetTile = gridRow[gridCoords.x];

        // Get the tile type using TypeChecks utility
        const tileType = TileTypeChecker.getTileType(targetTile);

        // Look up NPC by tile type in ContentRegistry
        const npcConfig = ContentRegistry.getNPCByTileType(tileType ?? 0);
        if (!npcConfig) return false;

        // Check if NPC has character data (dialogue NPCs)
        const characterData = npcConfig.metadata?.characterData;
        if (!characterData) return false;

        const dx = Math.abs(gridCoords.x - playerPos.x);
        const dy = Math.abs(gridCoords.y - playerPos.y);

        if (isAdjacent(dx, dy)) {
            // Track NPC position for distance-based auto-close
            this.game.transientGameState?.setCurrentNPCPosition(Position.from(gridCoords));

            // Handle based on NPC action type
            if (npcConfig.action === 'dialogue') {
                const characterId = hasCharacterId(characterData) ? characterData.id : 'unknown';
                const npcData = TextBox.getDialogueNpcData(characterId, this.game);
                if (npcData) {
                    const message = npcData.messages[npcData.currentMessageIndex];
                    const buttonText = npcData.buttonTexts?.[npcData.currentMessageIndex] || null;
                    const signData = { message: message, type: 'npc' };

                    // Set both old and new state for compatibility
                    this.game.displayingMessageForSign = signData;
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
                    const cycleMode = typeof npcData.cycleMode === 'string' ? npcData.cycleMode : 'loop';
                    if (cycleMode === 'sequential') {
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
                const characterId = hasCharacterId(characterData) ? characterData.id : 'unknown';
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
        const inventory = this.game.player?.inventory as InventoryItem[] | null | undefined;
        if (!inventory) return;

        const index = inventory.findIndex((item: InventoryItem | null) =>
            item && item.type === 'food' && item.foodType?.includes(foodType)
        );
        if (index !== undefined && index >= 0) {
            const nonNullCount = inventory.filter(item => item !== null).length;
            if (nonNullCount < 6) {
                inventory[index] = null;
                inventory.push({ type: 'water' });
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
            const playerPos = this.game.playerFacade?.getPosition();
            if (!playerPos) return false;

            if (!this.game.grid) return false;
            const gridRow = this.game.grid[gridCoords.y];
            if (!gridRow) return false;
            const targetTile = gridRow[gridCoords.x];
            if (targetTile !== config.tileType) return false;

            const dx = Math.abs(gridCoords.x - playerPos.x);
            const dy = Math.abs(gridCoords.y - playerPos.y);

            if (isAdjacent(dx, dy)) {
                // Track NPC position for distance-based auto-close
                this.game.transientGameState?.setCurrentNPCPosition(Position.from(gridCoords));

                if (config.action === 'barter') {
                    // Use event instead of direct UIManager call
                    eventBus.emit(EventTypes.UI_DIALOG_SHOW, {
                        type: 'barter',
                        npc: npcName,
                        playerPos: playerPos,
                        npcPos: gridCoords
                    });
                } else if (config.action === 'dialogue') {
                    const npcData = TextBox.getDialogueNpcData(npcName, this.game);
                    if (npcData) {
                        const message = npcData.messages[npcData.currentMessageIndex];
                        const buttonText = npcData.buttonTexts?.[npcData.currentMessageIndex] || null;
                        const signData = { message: message, type: 'npc' };

                        // Set both old and new state for compatibility
                        this.game.displayingMessageForSign = signData;
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
                        const cycleMode = typeof npcData.cycleMode === 'string' ? npcData.cycleMode : 'loop';
                        if (cycleMode === 'sequential') {
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
        const playerPos = this.game.playerFacade?.getPosition();
        if (!playerPos) return;

        const dx = Math.abs(gridCoords.x - playerPos.x);
        const dy = Math.abs(gridCoords.y - playerPos.y);
        if (!isAdjacent(dx, dy)) return;

        if (!this.game.grid) return;
        const gridRow = this.game.grid[gridCoords.y];
        if (!gridRow) return;
        const targetTile = gridRow[gridCoords.x];

        // First try hardcoded NPCs from NPC_CONFIG
        for (const [npcName, config] of Object.entries(this.npcConfig)) {
            if (targetTile === config.tileType) {
                // Track NPC position for distance-based auto-close
                this.game.transientGameState?.setCurrentNPCPosition(Position.from(gridCoords));

                if (config.action === 'barter') {
                    // Use event instead of direct UIManager call
                    eventBus.emit(EventTypes.UI_DIALOG_SHOW, {
                        type: 'barter',
                        npc: npcName,
                        playerPos: playerPos,
                        npcPos: gridCoords
                    });
                } else if (config.action === 'dialogue') {
                    const npcData = TextBox.getDialogueNpcData(npcName, this.game);
                    if (npcData) {
                        const message = npcData.messages[npcData.currentMessageIndex];
                        const buttonText = npcData.buttonTexts?.[npcData.currentMessageIndex] || null;
                        const signData = { message: message, type: 'npc' };

                        // Set both old and new state for compatibility
                        this.game.displayingMessageForSign = signData;
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
                        const cycleMode = typeof npcData.cycleMode === 'string' ? npcData.cycleMode : 'loop';
                        if (cycleMode === 'sequential') {
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
