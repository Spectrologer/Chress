import audioManager from '../../../utils/AudioManager.js';
import { TILE_TYPES } from '../../../core/constants/index.js';
import { isFloor } from '../../../utils/TileUtils.js';
import type { InventoryItem } from '../ItemMetadata.js';

export interface ItemEffectContext {
    fromRadial?: boolean;
    targetX?: number;
    targetY?: number;
    data?: any;
}

export interface ItemEffectResult {
    consumed: boolean;
    quantity?: number;
    uses?: number;
    success: boolean;
}

export interface Game {
    player: any;
    grid: any[][];
    uiManager?: any;
    playerJustAttacked?: boolean;
    transientGameState?: any;
    inventoryService?: any;
    bombManager?: any;
    [key: string]: any;
}

export interface RadialPatternConfig {
    onRadial?: (game: Game, item: InventoryItem) => void;
    message?: string;
    dropTileType: number | object;
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
        instant: boolean = true,
        noTypewriter: boolean = false
    ): void {
        if (game.uiManager && typeof game.uiManager.showOverlayMessage === 'function') {
            game.uiManager.showOverlayMessage(text, imageSrc, instant, true, noTypewriter);
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
    protected _dropItem(game: Game, itemType: string, tileType: number | object): boolean {
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
        const isRadial = fromRadial || (game.player.radialInventory && game.player.radialInventory.indexOf(item) >= 0);

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
