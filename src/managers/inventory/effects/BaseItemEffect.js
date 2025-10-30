// @ts-check
import audioManager from '../../../utils/AudioManager.js';
import { TILE_TYPES } from '../../../core/constants/index.js';
import { isFloor } from '../../../utils/TileUtils.js';

/**
 * @typedef {Object} ItemEffectContext
 * @property {boolean} [fromRadial] - Whether item is used from radial menu
 * @property {number} [targetX] - Target X coordinate
 * @property {number} [targetY] - Target Y coordinate
 * @property {*} [data] - Additional context data
 */

/**
 * @typedef {Object} ItemEffectResult
 * @property {boolean} consumed - Whether the item was consumed
 * @property {number} [quantity] - Remaining quantity
 * @property {number} [uses] - Remaining uses
 * @property {boolean} success - Whether the effect was successful
 */

/**
 * @typedef {Object} Item
 * @property {string} type - Item type identifier
 * @property {string} [name] - Item name
 * @property {number} [quantity] - Item quantity
 * @property {number} [uses] - Item uses
 * @property {*} [data] - Additional item data
 */

/**
 * @typedef {Object} Game
 * @property {any} player - Player instance
 * @property {Array<Array<number>>} grid - Game grid
 * @property {any} [uiManager] - UI manager instance
 * @property {boolean} [playerJustAttacked] - Whether player just attacked
 */

/**
 * @typedef {Object} RadialPatternConfig
 * @property {((game: Game, item: Item) => void)} [onRadial] - Callback for radial behavior
 * @property {string} [message] - Message to show in radial mode
 * @property {number|Object} dropTileType - Tile type to drop (for non-radial)
 */

/**
 * BaseItemEffect - Abstract base class for all item effects
 *
 * All item effect classes should extend this and implement the apply() method.
 */
export class BaseItemEffect {
    /**
     * Apply the item effect
     * @param {Game} game - Game instance
     * @param {Item} item - Item being used
     * @param {ItemEffectContext} context - Context (fromRadial, targetX, targetY, etc.)
     * @returns {ItemEffectResult} - { consumed: bool, quantity/uses: number, success: bool }
     */
    apply(game, item, context = {}) {
        throw new Error('BaseItemEffect.apply() must be implemented by subclass');
    }

    /**
     * Play sound effect for item usage
     * @protected
     * @param {Game} game - Game instance
     * @param {string} soundName - Sound name
     * @returns {void}
     */
    _playSound(game, soundName) {
        audioManager.playSound(soundName, { game });
    }

    /**
     * Show overlay message
     * @protected
     * @param {Game} game - Game instance
     * @param {string} text - Message text
     * @param {string|null} [imageSrc=null] - Image source URL
     * @param {boolean} [instant=true] - Whether to show instantly
     * @param {boolean} [noTypewriter=false] - Whether to disable typewriter effect
     * @returns {void}
     */
    _showMessage(game, text, imageSrc = null, instant = true, noTypewriter = false) {
        if (game.uiManager && typeof game.uiManager.showOverlayMessage === 'function') {
            game.uiManager.showOverlayMessage(text, imageSrc, instant, true, noTypewriter);
        }
    }

    /**
     * Drop item on current tile (player's position)
     * @protected
     * @param {Game} game - Game instance
     * @param {string} itemType - Item type name (for logging/debugging)
     * @param {number|Object} tileType - Tile type to place (can be constant or object)
     * @returns {boolean} - True if item was dropped successfully
     */
    _dropItem(game, itemType, tileType) {
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
     * @param {Game} game - Game instance
     * @param {Item} item - Item being used
     * @param {ItemEffectContext} context - Context (fromRadial, etc.)
     * @param {RadialPatternConfig} config - Configuration object
     * @returns {ItemEffectResult} - { consumed: bool, quantity/uses: number, success: bool }
     */
    _applyRadialPattern(game, item, context, config) {
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
