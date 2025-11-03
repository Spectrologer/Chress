import { TILE_SIZE, CANVAS_SIZE, ANIMATION_CONSTANTS } from '../core/constants/index';
import type { TextureManager } from './TextureManager';
import type { IGame } from '../core/GameContext';

interface NPC {
    x: number;
    y: number;
    npcType: string;
    spriteKey?: string;
    liftFrames: number;
    lastX?: number;
    lastY?: number;
    bumpOffsetX: number;
    bumpOffsetY: number;
    liftOffsetY: number;
}

interface NPCManager {
    getAll(): NPC[];
}

export class NPCRenderer {
    private game: IGame;
    private ctx: CanvasRenderingContext2D;
    private textureManager: TextureManager;

    constructor(game: IGame) {
        this.game = game;
        this.ctx = game.ctx;
        this.textureManager = game.textureManager;
    }

    drawNPCs(): void {
        // Get NPCs from the NPC manager
        const npcs = this.game.npcManager ? this.game.npcManager.getAll() : [];

        for (let i = 0; i < npcs.length; i++) {
            const npc = npcs[i];

            // Get the sprite key for this NPC type
            const spriteKey = npc.spriteKey || npc.npcType;
            const npcImage = this.game.textureManager.getImage(spriteKey);

            if (npcImage && npcImage.complete) {
                let pixelXBase: number, pixelYBase: number;

                // If the NPC is moving (lift animation is active), interpolate its position for a slide effect.
                if (npc.liftFrames > 0 && npc.lastX !== undefined && npc.lastY !== undefined) {
                    const remaining = npc.liftFrames;
                    const totalFrames = ANIMATION_CONSTANTS.LIFT_FRAMES || 15;
                    const progress = 1 - (remaining / totalFrames);
                    pixelXBase = (npc.lastX + (npc.x - npc.lastX) * progress) * TILE_SIZE + npc.bumpOffsetX;
                    pixelYBase = (npc.lastY + (npc.y - npc.lastY) * progress) * TILE_SIZE + npc.bumpOffsetY + npc.liftOffsetY;
                } else {
                    pixelXBase = npc.x * TILE_SIZE + npc.bumpOffsetX;
                    pixelYBase = npc.y * TILE_SIZE + npc.bumpOffsetY + npc.liftOffsetY;
                }

                this.ctx.save();

                // Clamp coordinates to prevent drawing outside the canvas during animations
                pixelXBase = Math.max(-TILE_SIZE / 2, Math.min(CANVAS_SIZE - TILE_SIZE / 2, pixelXBase));
                pixelYBase = Math.max(-TILE_SIZE / 2, Math.min(CANVAS_SIZE - TILE_SIZE / 2, pixelYBase));

                this.ctx.drawImage(
                    npcImage,
                    pixelXBase,
                    pixelYBase,
                    TILE_SIZE,
                    TILE_SIZE
                );

                this.ctx.restore();
            } else {
                // Fallback to colored tile if sprite not loaded
                let pixelXBase = npc.x * TILE_SIZE + npc.bumpOffsetX;
                let pixelYBase = npc.y * TILE_SIZE + npc.bumpOffsetY;
                pixelXBase = Math.max(-TILE_SIZE / 2, Math.min(CANVAS_SIZE - TILE_SIZE / 2, pixelXBase));
                pixelYBase = Math.max(-TILE_SIZE / 2, Math.min(CANVAS_SIZE - TILE_SIZE / 2, pixelYBase));
                this.ctx.fillStyle = '#FFD700'; // Gold color for NPCs
                this.ctx.fillRect(
                    pixelXBase + 2,
                    pixelYBase + 2,
                    TILE_SIZE - 4,
                    TILE_SIZE - 4
                );
            }
        }
    }
}
