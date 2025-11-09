import { TILE_TYPES } from '@core/constants/index';
import { getNPCCharacterData, getStatueData } from '@core/NPCLoader';
import type { IGame } from '@core/context';
import { logger } from '@core/logger';

// Type-safe asset paths
type PortraitPath = `assets/characters/${string}.png`;
type ItemAssetPath = `assets/items/${string}.png`;

// NPC subclass types
type NPCSubclass = 'merchant' | 'dialogue' | 'quest';

// Dialogue cycle modes
type CycleMode = 'loop' | 'once' | 'stop-at-end';

export interface TextBoxData {
    message?: string;
    x?: number;
    y?: number;
}

export interface StatueData {
    message: string;
}

export interface Trade {
    id: string;
    requiredItem: string;
    requiredAmount: number;
    requiredItemName: string;
    requiredItemImg: ItemAssetPath;
    receivedItemName: string;
    receivedItemImg: ItemAssetPath;
}

export interface BarterNpcData {
    name: string;
    portrait: PortraitPath;
    message: string;
    subclass: NPCSubclass;
    voicePitch?: number;
    trades: Trade[];
}

export interface DialogueNpcData {
    name: string;
    portrait: PortraitPath;
    portraitBackground?: string;
    subclass: NPCSubclass;
    category: string;
    voicePitch?: number;
    currentMessageIndex: number;
    cycleMode: CycleMode;
    messages: string[];
    buttonTexts?: (string | null)[];
}

// Use IGame type for better compatibility across all UI components
export type GameInstance = IGame;

// TextBox class, refactored to be a static utility class for NPC and statue message handling.
export class TextBox {

    // Track spawned messages to avoid duplicates
    static spawnedMessages = new Set<string>();

    /**
     * Get statue data by type
     * Now loads from JSON files via NPCLoader
     */
    static getStatueData(statueType: string): StatueData {
        const data = getStatueData(statueType);
        if (data?.interaction?.message) {
            return { message: data.interaction.message };
        }
        // Fallback for missing data
        return { message: 'An ancient statue depicting a mysterious creature from the wilderness.' };
    }

    /**
     * Get barter NPC data
     */
    static getBarterNpcData(npcType: string): BarterNpcData | null {
        // Get from loaded JSON data
        const characterData = getNPCCharacterData(npcType);
        if (characterData && characterData.interaction?.type === 'barter') {
            // Convert JSON format to expected format
            return {
                name: characterData.name,
                portrait: characterData.display.portrait as PortraitPath,
                message: characterData.interaction.greeting,
                subclass: 'merchant' as const,
                voicePitch: characterData.audio?.voicePitch,
                trades: characterData.interaction.trades.map((trade: any) => ({
                    id: trade.id,
                    requiredItem: trade.requires.resource,
                    requiredAmount: trade.requires.amount,
                    requiredItemName: trade.requires.displayName,
                    requiredItemImg: trade.requires.icon as ItemAssetPath,
                    receivedItemName: trade.gives.displayName,
                    receivedItemImg: trade.gives.icon as ItemAssetPath
                }))
            };
        }

        return null;
    }

    /**
     * Handle click interaction (toggle message display)
     */
    static handleClick(signData: TextBoxData, gameInstance: GameInstance, playerAdjacent: boolean): void {
        if (!playerAdjacent) {
            return; // Only respond to clicks when adjacent
        }

        const transientState = gameInstance.transientGameState;
        if (!transientState) return;

        // Check if this specific sign's message is currently displayed
        const displayingSign = transientState.getDisplayingSignMessage();
        const isDisplayed = displayingSign && displayingSign.message === signData.message;

        if (isDisplayed) {
            // Message is showing, hide it
            TextBox.hideMessageForSign(gameInstance);
        } else {
            // If another textbox message is showing, hide it first to avoid overlap
            if (transientState.isDisplayingSignMessage()) {
                TextBox.hideMessageForSign(gameInstance);
            }
            // Now, display the new one
            TextBox.displayMessageForSign(signData, gameInstance);
        }
    }

    /**
     * Static method to display message for a textbox object
     */
    static displayMessageForSign(signData: TextBoxData, gameInstance: GameInstance): void {
        // Use the dedicated textbox message method for persistent display
        if (gameInstance.showSignMessage && signData.message) {
            gameInstance.showSignMessage(signData.message, 'assets/environment/doodads/sign.png');
        }
        if (gameInstance.transientGameState) {
            gameInstance.transientGameState.setDisplayingSignMessage(signData);
        }
    }

    /**
     * Static method to hide the currently displayed textbox message
     */
    static hideMessageForSign(gameInstance: GameInstance): void {
        const transientState = gameInstance.transientGameState;

        // Check if we're closing axolotl post-trade dialogue
        const signData = transientState?.getDisplayingSignMessage();
        const shouldAxolotlLeave = signData?.message === "Thanks a lot'l.";

        let didHide = false;

        if (transientState && transientState.isDisplayingSignMessage()) {
            if (gameInstance.hideOverlayMessage) {
                gameInstance.hideOverlayMessage();
            }
            transientState.clearDisplayingSignMessage();
            // Clear NPC position tracking when message is dismissed
            transientState.clearCurrentNPCPosition();
            didHide = true;
        }

        // Also clear the old property for compatibility
        if (gameInstance.displayingMessageForSign) {
            if (!didHide && gameInstance.hideOverlayMessage) {
                gameInstance.hideOverlayMessage();
            }
            gameInstance.displayingMessageForSign = null;

            // Also clear NPC position if using old system
            if (transientState) {
                transientState.clearCurrentNPCPosition();
            }
        }

        // Make axolotl walk off after post-trade dialogue
        if (shouldAxolotlLeave) {
            TextBox.makeAxolotlLeave(gameInstance);
        }
    }

    /**
     * Helper method to make axolotl walk to exit and disappear
     */
    static makeAxolotlLeave(gameInstance: GameInstance): void {
        const grid = gameInstance.grid;
        const npcManager = gameInstance.npcManager;
        const gridManager = gameInstance.gridManager;

        if (!npcManager) {
            logger.warn('NPC Manager not available');
            return;
        }

        if (!gridManager) {
            logger.warn('Grid Manager not available');
            return;
        }

        // Find axolotl NPC
        const axolotls = npcManager.getByType('axelotl');
        if (axolotls.length === 0) {
            logger.warn('No axolotl NPC found');
            return;
        }

        const axolotl = axolotls[0];

        // Find exit on the right side (well board has exit at 9,5)
        let exitX: number | null = null;
        let exitY: number | null = null;

        const gridSize = gridManager.getSize();

        for (let y = 0; y < gridSize; y++) {
            for (let x = gridSize - 1; x >= 0; x--) {
                if (gridManager.getTile(x, y) === TILE_TYPES.EXIT) {
                    exitX = x;
                    exitY = y;
                    break;
                }
            }
            if (exitX !== null) break;
        }

        if (exitX === null) {
            // No exit found, just remove axolotl immediately
            npcManager.removeNPC(axolotl);
            if (gameInstance.render) {
                gameInstance.render();
            }
            return;
        }

        // Animate axolotl walking to exit with hop animation
        const walkToExit = (): void => {
            if (axolotl.x === exitX && axolotl.y === exitY) {
                // Reached exit, remove axolotl and restore the exit tile
                npcManager.removeNPC(axolotl);
                // Restore the exit tile (removeNPC sets it to FLOOR)
                gridManager.setTile(exitX!, exitY!, TILE_TYPES.EXIT);
                if (gameInstance.render) {
                    gameInstance.render();
                }
                return;
            }

            // Calculate next position (move towards exit)
            let newX = axolotl.x;
            let newY = axolotl.y;

            if (newX < exitX!) {
                newX++;
            } else if (newX > exitX!) {
                newX--;
            }

            if (newY < exitY!) {
                newY++;
            } else if (newY > exitY!) {
                newY--;
            }

            // Move NPC (this automatically sets lastX/lastY and starts lift animation)
            npcManager.moveNPC(axolotl, newX, newY);
            if (gameInstance.render) {
                gameInstance.render();
            }

            // Continue walking after animation completes (match LIFT_FRAMES duration)
            setTimeout(walkToExit, 250);
        };

        // Start walking after a short delay
        setTimeout(walkToExit, 500);
    }


    /**
     * Get or create dialogue data for an NPC
     * Uses a cache to persist dialogue state across interactions
     */
    static getDialogueNpcData(npcType: string, gameInstance: GameInstance | null = null): DialogueNpcData | null {
        // Initialize dialogue state cache if not present
        if (gameInstance && !gameInstance.dialogueState) {
            gameInstance.dialogueState = new Map();
        }

        // Check if we have cached dialogue data for this NPC
        if (gameInstance?.dialogueState?.has(npcType)) {
            const cachedData = gameInstance.dialogueState.get(npcType) as DialogueNpcData | undefined;
            return cachedData ?? null;
        }

        // Get from loaded JSON data
        const characterData = getNPCCharacterData(npcType);
        if (characterData && characterData.interaction?.type === 'dialogue') {
            // Convert JSON format to expected format
            const dialogueData: DialogueNpcData = {
                name: characterData.name,
                portrait: characterData.display.portrait as PortraitPath,
                portraitBackground: characterData.display.portraitBackground,
                subclass: 'dialogue' as const,
                category: characterData.metadata?.category || 'unknown',
                voicePitch: characterData.audio?.voicePitch,
                currentMessageIndex: 0,
                cycleMode: (characterData.interaction.cycleMode || 'loop') as CycleMode,
                messages: characterData.interaction.dialogueTree.map((entry: any) => entry.text),
                buttonTexts: characterData.interaction.dialogueTree.map((entry: any) => entry.buttonText || null)
            };

            // Cache the dialogue data if game instance is provided
            if (gameInstance?.dialogueState) {
                gameInstance.dialogueState.set(npcType, dialogueData);
            }

            return dialogueData;
        }

        return null;
    }

    /**
     * Get NPC character data from loader
     */
    static getNPCCharacterData(npcType: string): any {
        return getNPCCharacterData(npcType);
    }
}
