// @ts-check
import { TILE_TYPES } from '../core/constants/index.js';
import { getNPCCharacterData } from '../core/NPCLoader.js';

/**
 * @typedef {Object} SignData
 * @property {string} message - The message to display
 * @property {number} [x] - X coordinate of the sign
 * @property {number} [y] - Y coordinate of the sign
 */

/**
 * @typedef {Object} StatueData
 * @property {string} message - HTML message for the statue
 */

/**
 * @typedef {Object} BarterNpcData
 * @property {string} name - NPC name
 * @property {string} portrait - Portrait image path
 * @property {string} message - Greeting message
 * @property {string} subclass - NPC subclass (merchant)
 * @property {number} [voicePitch] - Voice pitch for audio
 * @property {Array<Trade>} trades - Available trades
 */

/**
 * @typedef {Object} Trade
 * @property {string} id - Trade identifier
 * @property {string} requiredItem - Required item type
 * @property {number} requiredAmount - Required quantity
 * @property {string} requiredItemName - Display name of required item
 * @property {string} requiredItemImg - Icon path for required item
 * @property {string} receivedItemName - Display name of received item
 * @property {string} receivedItemImg - Icon path for received item
 */

/**
 * @typedef {Object} DialogueNpcData
 * @property {string} name - NPC name
 * @property {string} portrait - Portrait image path
 * @property {string} subclass - NPC subclass (dialogue)
 * @property {number} [voicePitch] - Voice pitch for audio
 * @property {number} currentMessageIndex - Current message index
 * @property {string} cycleMode - Cycle mode (loop, once, etc.)
 * @property {Array<string>} messages - Dialogue messages
 */

/**
 * @typedef {Object} GameInstance
 * @property {any} transientGameState - Transient game state
 * @property {any} gridManager - Grid manager
 * @property {any} npcManager - NPC manager
 * @property {Array<Array<any>>} grid - Game grid
 * @property {Function} showSignMessage - Show sign message
 * @property {Function} hideOverlayMessage - Hide overlay message
 * @property {Function} render - Render game
 * @property {any} [displayingMessageForSign] - Legacy property
 * @property {Map<string, DialogueNpcData>} [dialogueState] - Dialogue state cache
 */

// Sign class, refactored to be a static utility class for NPC and statue message handling.
export class Sign {

    // Track spawned messages to avoid duplicates
    static spawnedMessages = new Set();

    // Statue dialogue content
    static statueData = {
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
     * @param {string} statueType - Statue type (lizardy, lizardo, bomb, etc.)
     * @returns {StatueData} Statue data with message
     */
    static getStatueData(statueType) {
        return Sign.statueData[statueType] || Sign.statueData.default;
    }

    /**
     * Get barter NPC data
     * @param {string} npcType - NPC type
     * @returns {BarterNpcData|null} Barter NPC data or null
     */
    static getBarterNpcData(npcType) {
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
                trades: characterData.interaction.trades.map(trade => ({
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
     * @param {SignData} signData - Sign data
     * @param {GameInstance} gameInstance - Game instance
     * @param {boolean} playerAdjacent - Whether player is adjacent
     * @returns {void}
     */
    static handleClick(signData, gameInstance, playerAdjacent) {
        if (!playerAdjacent) {
            return; // Only respond to clicks when adjacent
        }

        const transientState = gameInstance.transientGameState;

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
     * @param {SignData} signData - Sign data
     * @param {GameInstance} gameInstance - Game instance
     * @returns {void}
     */
    static displayMessageForSign(signData, gameInstance) {
        // Use the dedicated sign message method for persistent display
        gameInstance.showSignMessage(signData.message, 'assets/environment/doodads/sign.png');
        gameInstance.transientGameState.setDisplayingSignMessage(signData);
    }

    /**
     * Static method to hide the currently displayed sign message
     * @param {GameInstance} gameInstance - Game instance
     * @returns {void}
     */
    static hideMessageForSign(gameInstance) {
        const transientState = gameInstance.transientGameState;

        // Check if we're closing axolotl post-trade dialogue
        const signData = transientState?.getDisplayingSignMessage();
        const shouldAxolotlLeave = signData?.message === "Thanks a lot'l.";

        let didHide = false;

        if (transientState && transientState.isDisplayingSignMessage()) {
            gameInstance.hideOverlayMessage();
            transientState.clearDisplayingSignMessage();
            // Clear NPC position tracking when message is dismissed
            transientState.clearCurrentNPCPosition();
            didHide = true;
        }

        // Also clear the old property for compatibility
        if (gameInstance.displayingMessageForSign) {
            if (!didHide) {
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
     * @param {GameInstance} gameInstance - Game instance
     * @returns {void}
     */
    static makeAxolotlLeave(gameInstance) {
        const grid = gameInstance.grid;
        const npcManager = gameInstance.npcManager;

        if (!npcManager) {
            console.warn('NPC Manager not available');
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
        let exitX = null;
        let exitY = null;

        const gridManager = gameInstance.gridManager;
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
            gameInstance.render();
            return;
        }

        // Animate axolotl walking to exit with hop animation
        const walkToExit = () => {
            if (axolotl.x === exitX && axolotl.y === exitY) {
                // Reached exit, remove axolotl and restore the exit tile
                npcManager.removeNPC(axolotl);
                // Restore the exit tile (removeNPC sets it to FLOOR)
                gridManager.setTile(exitX, exitY, TILE_TYPES.EXIT);
                gameInstance.render();
                return;
            }

            // Calculate next position (move towards exit)
            let newX = axolotl.x;
            let newY = axolotl.y;

            if (newX < exitX) {
                newX++;
            } else if (newX > exitX) {
                newX--;
            }

            if (newY < exitY) {
                newY++;
            } else if (newY > exitY) {
                newY--;
            }

            // Move NPC (this automatically sets lastX/lastY and starts lift animation)
            npcManager.moveNPC(axolotl, newX, newY);
            gameInstance.render();

            // Continue walking after animation completes (match LIFT_FRAMES duration)
            setTimeout(walkToExit, 250);
        };

        // Start walking after a short delay
        setTimeout(walkToExit, 500);
    }


    /**
     * Get or create dialogue data for an NPC
     * Uses a cache to persist dialogue state across interactions
     * @param {string} npcType - The type of NPC (e.g., 'felt', 'crayn')
     * @param {GameInstance} [gameInstance] - Optional game instance for persistent state
     * @returns {DialogueNpcData|null} - Dialogue data with persistent currentMessageIndex
     */
    static getDialogueNpcData(npcType, gameInstance = null) {
        // Initialize dialogue state cache if not present
        if (gameInstance && !gameInstance.dialogueState) {
            gameInstance.dialogueState = new Map();
        }

        // Check if we have cached dialogue data for this NPC
        if (gameInstance?.dialogueState?.has(npcType)) {
            return gameInstance.dialogueState.get(npcType);
        }

        // Get from loaded JSON data
        const characterData = getNPCCharacterData(npcType);
        if (characterData && characterData.interaction?.type === 'dialogue') {
            // Convert JSON format to expected format
            const dialogueData = {
                name: characterData.name,
                portrait: characterData.display.portrait,
                subclass: 'dialogue',
                voicePitch: characterData.audio?.voicePitch,
                currentMessageIndex: 0,
                cycleMode: characterData.interaction.cycleMode || 'loop',
                messages: characterData.interaction.dialogueTree.map(entry => entry.text),
                buttonTexts: characterData.interaction.dialogueTree.map(entry => entry.buttonText || null)
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
     * @param {string} npcType - NPC type
     * @returns {any} Character data from JSON
     */
    static getNPCCharacterData(npcType) {
        return getNPCCharacterData(npcType);
    }
}
