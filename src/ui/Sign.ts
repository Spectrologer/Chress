import { TILE_TYPES } from '../core/constants/index';
import { getNPCCharacterData } from '../core/NPCLoader';
import type { IGame } from '../core/GameContext';

export interface SignData {
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
    requiredItemImg: string;
    receivedItemName: string;
    receivedItemImg: string;
}

export interface BarterNpcData {
    name: string;
    portrait: string;
    message: string;
    subclass: string;
    voicePitch?: number;
    trades: Trade[];
}

export interface DialogueNpcData {
    name: string;
    portrait: string;
    subclass: string;
    voicePitch?: number;
    currentMessageIndex: number;
    cycleMode: string;
    messages: string[];
    buttonTexts?: (string | null)[];
}

// Use IGame type for better compatibility across all UI components
export type GameInstance = IGame;

// Sign class, refactored to be a static utility class for NPC and statue message handling.
export class Sign {

    // Track spawned messages to avoid duplicates
    static spawnedMessages = new Set<string>();

    // Statue dialogue content
    static statueData: Record<string, StatueData> = {
        lizardy: {
            message: 'Moves <strong>north and south</strong> one tile at a time and can only attack diagonally in the direction it is traveling.<br><br><em>If it could only be so simple.</em>'
        },
        lizardo: {
            message: 'Moves <strong>orthogonally and diagonally</strong> (8-way).<br><br><em>Wants to be like the lazerd.</em>'
        },
        lizardeaux: {
            message: '<strong>Charges</strong> in straight lines to ram players from any distance.<br><br><em>A powerful linear combatant.</em>'
        },
        zard: {
            message: 'Moves and <strong>charges diagonally</strong> to attack from a distance.<br><br><em>Hard to catch, too.</em>'
        },
        lazerd: {
            message: 'Moves and <strong>charges in any direction</strong>.<br><br><em>A master of all directional movement.</em>'
        },
        lizord: {
            message: 'Moves in <strong>L-shapes</strong>.<br><br><em>A real fork in the road.</em>'
        },
        // Item statue descriptions
        bomb: {
            message: 'Select from inventory to place on an adjacent tile. It explodes after two turns, or if you tap it.<br><br><em>Destroys walls, enemies, and can even launch you.</em>'
        },
        spear: {
            message: 'Tap an enemy on a diagonal line to charge through them.<br><br><em>Hold down to disable, tap to drop.</em>'
        },
        bow: {
            message: 'Tap an enemy in a straight line (up, down, left, or right) to shoot an arrow.<br><br><em>Patience is key.</em>'
        },
        horse: {
            message: 'Tap an enemy in an L-shape (like a knight) to charge them.<br><br><em>Hold down to disable, tap to drop.</em>'
        },
        book: {
            message: 'Use from inventory to pass your turn, allowing enemies to move while you stand still.<br><br><em>A tactical tool for repositioning foes.</em>'
        },
        shovel: {
            message: 'Select from inventory, then tap an adjacent empty floor tile to dig a hole.<br><br><em>What lies beneath?</em>'
        },
        default: {
            message: 'An ancient statue depicting a mysterious creature from the wilderness.'
        }
    };


    /**
     * Get statue data by type
     */
    static getStatueData(statueType: string): StatueData {
        return Sign.statueData[statueType] || Sign.statueData.default;
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
                portrait: characterData.display.portrait,
                message: characterData.interaction.greeting,
                subclass: 'merchant',
                voicePitch: characterData.audio?.voicePitch,
                trades: characterData.interaction.trades.map((trade: any) => ({
                    id: trade.id,
                    requiredItem: trade.requires.resource,
                    requiredAmount: trade.requires.amount,
                    requiredItemName: trade.requires.displayName,
                    requiredItemImg: trade.requires.icon,
                    receivedItemName: trade.gives.displayName,
                    receivedItemImg: trade.gives.icon
                }))
            };
        }

        return null;
    }

    /**
     * Handle click interaction (toggle message display)
     */
    static handleClick(signData: SignData, gameInstance: GameInstance, playerAdjacent: boolean): void {
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
            Sign.hideMessageForSign(gameInstance);
        } else {
            // If another sign message is showing, hide it first to avoid overlap
            if (transientState.isDisplayingSignMessage()) {
                Sign.hideMessageForSign(gameInstance);
            }
            // Now, display the new one
            Sign.displayMessageForSign(signData, gameInstance);
        }
    }

    /**
     * Static method to display message for a sign object
     */
    static displayMessageForSign(signData: SignData, gameInstance: GameInstance): void {
        // Use the dedicated sign message method for persistent display
        if (gameInstance.showSignMessage && signData.message) {
            gameInstance.showSignMessage(signData.message, 'assets/environment/doodads/sign.png');
        }
        if (gameInstance.transientGameState) {
            gameInstance.transientGameState.setDisplayingSignMessage(signData);
        }
    }

    /**
     * Static method to hide the currently displayed sign message
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
            Sign.makeAxolotlLeave(gameInstance);
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
            console.warn('NPC Manager not available');
            return;
        }

        if (!gridManager) {
            console.warn('Grid Manager not available');
            return;
        }

        // Find axolotl NPC
        const axolotls = npcManager.getByType('axelotl');
        if (axolotls.length === 0) {
            console.warn('No axolotl NPC found');
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
            return gameInstance.dialogueState.get(npcType) || null;
        }

        // Get from loaded JSON data
        const characterData = getNPCCharacterData(npcType);
        if (characterData && characterData.interaction?.type === 'dialogue') {
            // Convert JSON format to expected format
            const dialogueData: DialogueNpcData = {
                name: characterData.name,
                portrait: characterData.display.portrait,
                subclass: 'dialogue',
                voicePitch: characterData.audio?.voicePitch,
                currentMessageIndex: 0,
                cycleMode: characterData.interaction.cycleMode || 'loop',
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
