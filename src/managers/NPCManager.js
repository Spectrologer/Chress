import { BaseNPC } from '../npc/BaseNPC.js';
import { TILE_TYPES } from '../core/constants/index.js';
import { ContentRegistry } from '../core/ContentRegistry.js';

export class NPCManager {
    constructor(game) {
        this.game = game;
        this.npcs = [];
        this.nextId = 0;
    }

    /**
     * Creates an NPC from a tile position on the grid
     * @param {number} x - Grid x position
     * @param {number} y - Grid y position
     * @param {string} npcType - Type of NPC (e.g., 'axelotl', 'crayn', 'felt')
     * @param {string} spriteKey - Sprite key for rendering (defaults to npcType)
     * @returns {BaseNPC} - The created NPC
     */
    createNPC(x, y, npcType, spriteKey = null) {
        const npc = new BaseNPC({
            x,
            y,
            npcType,
            spriteKey: spriteKey || npcType,
            id: this.nextId++
        });
        this.npcs.push(npc);
        return npc;
    }

    /**
     * Gets all NPCs
     * @returns {BaseNPC[]}
     */
    getAll() {
        return this.npcs;
    }

    /**
     * Gets an NPC by ID
     * @param {number} id - NPC ID
     * @returns {BaseNPC|null}
     */
    getById(id) {
        return this.npcs.find(npc => npc.id === id) || null;
    }

    /**
     * Gets an NPC at a specific position
     * @param {number} x - Grid x position
     * @param {number} y - Grid y position
     * @returns {BaseNPC|null}
     */
    getNPCAt(x, y) {
        return this.npcs.find(npc => npc.x === x && npc.y === y) || null;
    }

    /**
     * Gets NPCs of a specific type
     * @param {string} npcType - Type of NPC
     * @returns {BaseNPC[]}
     */
    getByType(npcType) {
        return this.npcs.filter(npc => npc.npcType === npcType);
    }

    /**
     * Removes an NPC
     * @param {BaseNPC|number} npcOrId - NPC object or ID
     */
    removeNPC(npcOrId) {
        const gridManager = this.game.gridManager;

        // Find the NPC object
        let npcToRemove = null;
        if (typeof npcOrId === 'number') {
            npcToRemove = this.npcs.find(npc => npc.id === npcOrId);
            this.npcs = this.npcs.filter(npc => npc.id !== npcOrId);
        } else {
            npcToRemove = npcOrId;
            this.npcs = this.npcs.filter(npc => npc !== npcOrId);
        }

        // Clear the NPC from the grid
        if (npcToRemove && gridManager) {
            gridManager.setTile(npcToRemove.x, npcToRemove.y, TILE_TYPES.FLOOR);
        }
    }

    /**
     * Updates all NPC animations
     */
    updateAnimations() {
        for (const npc of this.npcs) {
            npc.updateAnimations();
        }
    }

    /**
     * Moves an NPC to a new position with animation
     * @param {BaseNPC} npc - The NPC to move
     * @param {number} newX - New grid x position
     * @param {number} newY - New grid y position
     */
    moveNPC(npc, newX, newY) {
        const gridManager = this.game.gridManager;
        const oldX = npc.x;
        const oldY = npc.y;

        // Check if the position is walkable
        if (!npc.isWalkable(newX, newY, gridManager)) {
            return false;
        }

        // Get the NPC's tile type to preserve it
        const npcTileType = gridManager.getTile(oldX, oldY);

        // Clear old position in grid
        gridManager.setTile(oldX, oldY, TILE_TYPES.FLOOR);

        // Set new position (this updates lastX/lastY automatically)
        npc.setPosition(newX, newY);

        // Update grid at new position
        gridManager.setTile(newX, newY, npcTileType);

        // Start lift animation
        npc.startLift();

        return true;
    }

    /**
     * Clears all NPCs (used when changing zones)
     */
    clear() {
        this.npcs = [];
    }

    /**
     * Initializes NPCs from the current grid
     * Scans the grid for NPC tiles and converts them to NPC entities
     */
    initializeFromGrid() {
        const gridManager = this.game.gridManager;
        if (!gridManager) return;

        // Clear existing NPCs
        this.clear();

        // Scan grid for NPC tiles
        const gridSize = gridManager.getSize();
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                const tile = gridManager.getTile(x, y);
                const tileType = tile && tile.type ? tile.type : tile;

                // Check if this is an NPC tile type
                let npcType = null;
                let spriteKey = null;

                // First, try to look up NPC config from ContentRegistry
                const npcConfig = ContentRegistry.getNPCByTileType(tileType);
                if (npcConfig && npcConfig.metadata && npcConfig.metadata.sprite) {
                    // Extract sprite path and convert to image key
                    // TextureLoader removes 'characters/npcs/' prefix from NPC paths
                    // e.g., "characters/npcs/gossip/aster.png" -> "gossip/aster"
                    const spritePath = npcConfig.metadata.sprite;
                    if (spritePath.startsWith('characters/npcs/')) {
                        spriteKey = spritePath.replace('characters/npcs/', '').replace('.png', '');
                    } else {
                        // Fallback: just use the filename
                        const parts = spritePath.split('/');
                        const filename = parts[parts.length - 1];
                        spriteKey = filename.replace('.png', '');
                    }
                    npcType = npcConfig.metadata.characterData?.id || spriteKey;
                } else {
                    // Fallback to hardcoded NPC types
                    switch (tileType) {
                        case TILE_TYPES.AXELOTL:
                            npcType = 'axelotl';
                            spriteKey = 'axolotl';
                            break;
                        case TILE_TYPES.CRAYN:
                            npcType = 'crayn';
                            spriteKey = 'crayn';
                            break;
                        case TILE_TYPES.FELT:
                            npcType = 'felt';
                            spriteKey = 'felt';
                            break;
                        // Add more NPC types as needed
                    }
                }

                if (npcType) {
                    // Create NPC entity
                    this.createNPC(x, y, npcType, spriteKey);

                    // IMPORTANT: Keep NPC tile in grid for collision and interaction
                    // NPCs are rendered as entities, but grid tiles are needed for:
                    // 1. Collision detection (player can't walk through NPCs)
                    // 2. Interaction system (clicking on NPC tiles)
                    // The NPCRenderer will draw over the tile rendering
                }
            }
        }
    }
}
