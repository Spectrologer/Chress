import { TILE_SIZE } from '@core/constants/index';
import { COLOR_CONSTANTS } from '@core/constants/rendering';
import type { TextureManager } from './TextureManager';
import type { IGame } from '@core/GameContext';

interface TransientGameState {
    isBombPlacementMode(): boolean;
    getBombPlacementPositions(): Array<{ x: number; y: number }>;
    getPendingCharge(): { targetX: number; targetY: number } | null;
}

export class UIRenderer {
    private game: IGame;
    private ctx: CanvasRenderingContext2D;
    private textureManager: TextureManager;

    constructor(game: IGame) {
        this.game = game;
        this.ctx = game.ctx;
        this.textureManager = game.textureManager;
    }

    drawBombPlacementIndicator(): void {
        const transientState = this.game.transientGameState;
        if (!transientState || !transientState.isBombPlacementMode()) {
            return;
        }

        const positions = transientState.getBombPlacementPositions();
        if (!positions || positions.length === 0) {
            return;
        }

        const bombImage = this.game.textureManager.getImage('bomb');
        if (bombImage && bombImage.complete) {
            this.ctx.save();
            // Make the bomb icons flash
            const alpha = COLOR_CONSTANTS.UI_FLASH_BASE_ALPHA + Math.sin(Date.now() * COLOR_CONSTANTS.UI_FLASH_SPEED) * COLOR_CONSTANTS.UI_FLASH_AMPLITUDE; // Flashes between 0.4 and 0.8
            this.ctx.globalAlpha = alpha;
            for (const pos of positions) {
                this.ctx.drawImage(
                    bombImage,
                    pos.x * TILE_SIZE,
                    pos.y * TILE_SIZE,
                    TILE_SIZE, TILE_SIZE
                );
            }
            this.ctx.restore();
        }
    }

    drawChargeConfirmationIndicator(): void {
        const pendingCharge = this.game.transientGameState?.getPendingCharge();
        if (!pendingCharge) {
            return;
        }

        const { targetX, targetY } = pendingCharge;

        // Draw a flashing yellow indicator at the target position
        const alpha = COLOR_CONSTANTS.UI_FLASH_ALT_BASE_ALPHA + Math.sin(Date.now() * COLOR_CONSTANTS.UI_FLASH_SPEED) * COLOR_CONSTANTS.UI_FLASH_ALT_AMPLITUDE; // Flashes between 0.2 and 0.8

        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        this.ctx.fillStyle = COLOR_CONSTANTS.HIGHLIGHT_COLOR; // Yellow
        this.ctx.fillRect(targetX * TILE_SIZE, targetY * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        this.ctx.restore();
    }
}
