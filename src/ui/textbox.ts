import { TILE_TYPES } from '@core/constants/index';
import { getNPCCharacterData, getStatueData } from '@core/NPCLoader';
import type { IGame } from '@core/context';
import { logger } from '@core/logger';
import { ContentRegistry } from '@core/ContentRegistry';

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

        // Get NPC position before clearing it
        const npcPosition = transientState?.getCurrentNPCPosition();

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

        // Check if NPC should leave after interaction
        if (npcPosition) {
            TextBox.makeNPCLeaveIfNeeded(gameInstance, npcPosition.x, npcPosition.y);
        }
    }

    /**
     * Check if NPC at given position should leave, and make them leave if needed
     */
    static makeNPCLeaveIfNeeded(gameInstance: GameInstance, npcX: number, npcY: number): void {
        const gridManager = gameInstance.gridManager;
        const npcManager = gameInstance.npcManager;

        if (!gridManager || !npcManager) {
            return;
        }

        // Get the tile type at the NPC position
        const tileType = gridManager.getTile(npcX, npcY);

        // Look up NPC configuration
        const npcConfig = ContentRegistry.getNPCByTileType(tileType);

        if (!npcConfig) {
            return;
        }

        // Check if this NPC has leaveAfterTrade behavior
        const characterData = npcConfig.metadata?.characterData;
        const shouldLeave = characterData?.behavior?.leaveAfterTrade === true;

        if (!shouldLeave) {
            return;
        }

        // Get NPC ID from character data
        const npcId = characterData?.id;
        if (!npcId) {
            return;
        }

        // For dialogue NPCs, check if they've reached their last message
        if (npcConfig.action === 'dialogue') {
            const dialogueData = TextBox.getDialogueNpcData(npcId, gameInstance);
            if (dialogueData) {
                const isLastMessage = dialogueData.currentMessageIndex >= dialogueData.messages.length - 1;
                const isSequential = dialogueData.cycleMode === 'sequential';

                // Only leave if:
                // 1. It's sequential mode AND we've shown the last message, OR
                // 2. It's not sequential (single message or loop mode)
                if (!(isSequential && isLastMessage) && dialogueData.messages.length > 1) {
                    return; // Don't leave yet, more dialogue to show
                }
            }
        }

        // For barter NPCs or dialogue NPCs that have finished, make them leave
        // Find the NPC entity at this position
        const npc = npcManager.getNPCAt(npcX, npcY);
        if (!npc) {
            return;
        }

        TextBox.makeNPCLeave(gameInstance, npc);
    }

    /**
     * Helper method to make any NPC walk to exit and disappear
     * @deprecated Use makeNPCLeave instead - keeping for backwards compatibility
     */
    static makeAxolotlLeave(gameInstance: GameInstance): void {
        const npcManager = gameInstance.npcManager;
        if (!npcManager) {
            return;
        }

        // Find axolotl NPC
        const axolotls = npcManager.getByType('axelotl');
        if (axolotls.length === 0) {
            return;
        }

        TextBox.makeNPCLeave(gameInstance, axolotls[0]);
    }

    /**
     * Generic helper method to make any NPC walk to exit and disappear
     */
    static makeNPCLeave(gameInstance: GameInstance, npc: any): void {
        const gridManager = gameInstance.gridManager;
        const npcManager = gameInstance.npcManager;

        if (!npcManager || !gridManager) {
            logger.warn('NPC Manager or Grid Manager not available');
            return;
        }

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
            // No exit found, just remove NPC immediately
            npcManager.removeNPC(npc);
            if (gameInstance.render) {
                gameInstance.render();
            }
            return;
        }

        // Animate NPC walking to exit with hop animation
        const walkToExit = (): void => {
            if (npc.x === exitX && npc.y === exitY) {
                // Reached exit, remove NPC and restore the exit tile
                npcManager.removeNPC(npc);
                // Restore the exit tile (removeNPC sets it to FLOOR)
                gridManager.setTile(exitX!, exitY!, TILE_TYPES.EXIT);
                if (gameInstance.render) {
                    gameInstance.render();
                }
                return;
            }

            // Calculate next position (move towards exit)
            let newX = npc.x;
            let newY = npc.y;

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
            npcManager.moveNPC(npc, newX, newY);
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
