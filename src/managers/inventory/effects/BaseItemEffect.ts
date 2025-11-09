import audioManager from '@utils/AudioManager';
import { TILE_TYPES } from '@core/constants/index';
import { isFloor } from '@utils/TileUtils';
import type { IGame } from '@core/context';
import type { InventoryItem } from '../ItemMetadata';
import type { Grid, Tile } from '@core/SharedTypes';

export interface ItemEffectContext {
    fromRadial?: boolean;
    targetX?: number;
    targetY?: number;
    data?: Record<string, any>;
}

export interface ItemEffectResult {
    consumed: boolean;
    quantity?: number;
    uses?: number;
    success: boolean;
}

// Re-export IGame as Game for backward compatibility
export type Game = IGame;

export interface RadialPatternConfig {
    onRadial?: (game: Game, item: InventoryItem) => void;
    message?: string;
    dropTileType: number | { type: number; [key: string]: any };
}

/**
 * BaseItemEffect - Abstract base class for all item effects
 *
 * All item effect classes should extend this and implement the apply() method.
 */
export abstract class BaseItemEffect {
    /**
     * Apply the item effect
     * @param game - Game instance
     * @param item - Item being used
     * @param context - Context (fromRadial, targetX, targetY, etc.)
     * @returns Result with consumed, quantity/uses, and success flags
     */
    abstract apply(game: Game, item: InventoryItem, context?: ItemEffectContext): ItemEffectResult;

    /**
     * Play sound effect for item usage
     * @protected
     * @param game - Game instance
     * @param soundName - Sound name
     */
    protected _playSound(game: Game, soundName: string): void {
        audioManager.playSound(soundName, { game });
    }

    /**
     * Show overlay message
     * @protected
     * @param game - Game instance
     * @param text - Message text
     * @param imageSrc - Image source URL
     * @param instant - Whether to show instantly
     * @param noTypewriter - Whether to disable typewriter effect
     */
    protected _showMessage(
        game: Game,
        text: string,
        imageSrc: string | null = null,
        instant = true,
        noTypewriter = false
    ): void {
        if (game.uiManager && typeof game.uiManager.showOverlayMessage === 'function') {
            game.uiManager.showOverlayMessage(text, imageSrc || '', instant, true, noTypewriter);
        }
    }

    /**
     * Drop item on current tile (player's position)
     * @protected
     * @param game - Game instance
     * @param itemType - Item type name (for logging/debugging)
     * @param tileType - Tile type to place (can be constant or object)
     * @returns True if item was dropped successfully
     */
    protected _dropItem(game: Game, itemType: string, tileType: number | { type: number; [key: string]: any }): boolean {
        if (!game.player || !game.grid) {
            return false;
        }

        const px = game.player.x;
        const py = game.player.y;
        const currentTile = game.grid[py][px];

        if (isFloor(currentTile)) {
            game.grid[py][px] = tileType;
            return true;
        }
        return false;
    }

    /**
     * Template method for radial/non-radial pattern
     * Handles the common pattern of:
     * - If radial: Enter a mode/show message
     * - If non-radial: Drop item on floor
     *
     * @protected
     * @param game - Game instance
     * @param item - Item being used
     * @param context - Context (fromRadial, etc.)
     * @param config - Configuration object
     * @returns Result with consumed, quantity/uses, and success flags
     */
    protected _applyRadialPattern(
        game: Game,
        item: InventoryItem,
        context: ItemEffectContext,
        config: RadialPatternConfig
    ): ItemEffectResult {
        const { fromRadial = false } = context;
        const isRadial = fromRadial || (game.player?.radialInventory && game.player.radialInventory.indexOf(item) >= 0);

        if (isRadial) {
            // Execute radial-specific behavior
            if (config.onRadial) {
                config.onRadial(game, item);
            }

            // Show message
            if (config.message) {
                this._showMessage(game, config.message, null, true, false);
            }

            return { consumed: false, success: true };
        } else {
            // Non-radial: Drop item on floor
            this._dropItem(game, item.type, config.dropTileType);
            return { consumed: true, success: true };
        }
    }
}
