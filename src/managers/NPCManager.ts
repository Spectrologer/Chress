import { BaseNPC } from '@npc/BaseNPC';
import { TILE_TYPES } from '@core/constants/index';
import { ContentRegistry } from '@core/ContentRegistry';
import type { IGame } from '@core/GameContext';

interface NPCConfig {
    x: number;
    y: number;
    npcType: string;
    spriteKey: string;
    id: string;
}

export class NPCManager {
    private game: IGame;
    private npcs: BaseNPC[];
    private nextId: number;

    constructor(game: IGame) {
        this.game = game;
        this.npcs = [];
        this.nextId = 0;
    }

    // Interaction methods that delegate to NPCInteractionManager
    // These are needed for compatibility with InteractionManager
    interactWithPenne(gridCoords: { x: number; y: number }): boolean {
        return this.game.npcInteractionManager?.interactWithPenne(gridCoords) ?? false;
    }

    interactWithSquig(gridCoords: { x: number; y: number }): boolean {
        return this.game.npcInteractionManager?.interactWithSquig(gridCoords) ?? false;
    }

    interactWithRune(gridCoords: { x: number; y: number }): boolean {
        return this.game.npcInteractionManager?.interactWithRune(gridCoords) ?? false;
    }

    interactWithNib(gridCoords: { x: number; y: number }): boolean {
        return this.game.npcInteractionManager?.interactWithNib(gridCoords) ?? false;
    }

    interactWithMark(gridCoords: { x: number; y: number }): boolean {
        return this.game.npcInteractionManager?.interactWithMark(gridCoords) ?? false;
    }

    interactWithAxelotl(gridCoords: { x: number; y: number }): boolean {
        return this.game.npcInteractionManager?.interactWithAxelotl(gridCoords) ?? false;
    }

    interactWithGouge(gridCoords: { x: number; y: number }): boolean {
        return this.game.npcInteractionManager?.interactWithGouge(gridCoords) ?? false;
    }

    interactWithCrayn(gridCoords: { x: number; y: number }): boolean {
        return this.game.npcInteractionManager?.interactWithCrayn(gridCoords) ?? false;
    }

    interactWithFelt(gridCoords: { x: number; y: number }): boolean {
        return this.game.npcInteractionManager?.interactWithFelt(gridCoords) ?? false;
    }

    interactWithForge(gridCoords: { x: number; y: number }): boolean {
        return this.game.npcInteractionManager?.interactWithForge(gridCoords) ?? false;
    }

    interactWithDynamicNPC(gridCoords: { x: number; y: number }): boolean {
        return this.game.npcInteractionManager?.interactWithDynamicNPC(gridCoords) ?? false;
    }

    forceInteractAt(gridCoords: { x: number; y: number }): void {
        this.game.npcInteractionManager?.forceInteractAt(gridCoords);
    }

    /**
     * Creates an NPC from a tile position on the grid
     * @param x - Grid x position
     * @param y - Grid y position
     * @param npcType - Type of NPC (e.g., 'axelotl', 'crayn', 'felt')
     * @param spriteKey - Sprite key for rendering (defaults to npcType)
     * @returns The created NPC
     */
    createNPC(x: number, y: number, npcType: string, spriteKey: string | null = null): BaseNPC {
        const npc = new BaseNPC({
            x,
            y,
            npcType,
            spriteKey: spriteKey || npcType,
            id: String(this.nextId++)
        });
        this.npcs.push(npc);
        return npc;
    }

    /**
     * Gets all NPCs
     */
    getAll(): BaseNPC[] {
        return this.npcs;
    }

    /**
     * Gets an NPC by ID
     */
    getById(id: number | string): BaseNPC | null {
        const idStr = typeof id === 'number' ? String(id) : id;
        return this.npcs.find(npc => npc.id === idStr) || null;
    }

    /**
     * Gets an NPC at a specific position
     */
    getNPCAt(x: number, y: number): BaseNPC | null {
        return this.npcs.find(npc => npc.x === x && npc.y === y) || null;
    }

    /**
     * Gets NPCs of a specific type
     */
    getByType(npcType: string): BaseNPC[] {
        return this.npcs.filter(npc => npc.npcType === npcType);
    }

    /**
     * Removes an NPC
     */
    removeNPC(npcOrId: BaseNPC | number | string): void {
        const gridManager = this.game.gridManager;

        // Find the NPC object
        let npcToRemove: BaseNPC | null = null;
        if (typeof npcOrId === 'number' || typeof npcOrId === 'string') {
            const idStr = typeof npcOrId === 'number' ? String(npcOrId) : npcOrId;
            npcToRemove = this.npcs.find(npc => npc.id === idStr) || null;
            this.npcs = this.npcs.filter(npc => npc.id !== idStr);
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
    updateAnimations(): void {
        for (const npc of this.npcs) {
            npc.updateAnimations();
        }
    }

    /**
     * Moves an NPC to a new position with animation
     */
    moveNPC(npc: BaseNPC, newX: number, newY: number): boolean {
        const gridManager = this.game.gridManager;
        const oldX = npc.x;
        const oldY = npc.y;

        // Check if the position is walkable
        if (!npc.isWalkable(newX, newY, gridManager.getRawGrid())) {
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
    clear(): void {
        this.npcs = [];
    }

    /**
     * Initializes NPCs from the current grid
     * Scans the grid for NPC tiles and converts them to NPC entities
     */
    initializeFromGrid(): void {
        const gridManager = this.game.gridManager;
        if (!gridManager) return;

        // Clear existing NPCs
        this.clear();

        // Scan grid for NPC tiles
        const gridSize = gridManager.getSize();
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                const tile = gridManager.getTile(x, y);
                const tileType = tile && typeof tile === 'object' && 'type' in tile ? tile.type : tile;

                // Check if this is an NPC tile type
                let npcType: string | null = null;
                let spriteKey: string | null = null;

                // First, try to look up NPC config from ContentRegistry
                const npcConfig = typeof tileType === 'number' ? ContentRegistry.getNPCByTileType(tileType) : null;
                if (npcConfig && npcConfig.metadata && npcConfig.metadata.sprite) {
                    // Extract sprite path and convert to image key
                    // TextureLoader removes 'characters/npcs/' prefix from NPC paths
                    // e.g., "characters/npcs/gossip/aster.png" -> "gossip/aster"
                    const spritePath = npcConfig.metadata.sprite;
                    if (typeof spritePath === 'string' && spritePath.startsWith('characters/npcs/')) {
                        spriteKey = spritePath.replace('characters/npcs/', '').replace('.png', '');
                    } else if (typeof spritePath === 'string') {
                        // Fallback: just use the filename
                        const parts = spritePath.split('/');
                        const filename = parts[parts.length - 1];
                        spriteKey = filename.replace('.png', '');
                    }
                    npcType = npcConfig.metadata.characterData && typeof npcConfig.metadata.characterData === 'object' && 'id' in npcConfig.metadata.characterData
                        ? (npcConfig.metadata.characterData.id as string)
                        : spriteKey;
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

                if (npcType && spriteKey) {
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
