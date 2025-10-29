import audioManager from '../../../utils/AudioManager.js';
import { TILE_TYPES } from '../../../core/constants/index.js';
import { isFloor } from '../../../utils/TileUtils.js';

/**
 * BaseItemEffect - Abstract base class for all item effects
 *
 * All item effect classes should extend this and implement the apply() method.
 */
export class BaseItemEffect {
    /**
     * Apply the item effect
     * @param {Object} game - Game instance
     * @param {Object} item - Item being used
     * @param {Object} context - Context (fromRadial, targetX, targetY, etc.)
     * @returns {Object} - { consumed: bool, quantity/uses: number, success: bool }
     */
    apply(game, item, context = {}) {
        throw new Error('BaseItemEffect.apply() must be implemented by subclass');
    }

    /**
     * Play sound effect for item usage
     * @protected
     */
    _playSound(game, soundName) {
        audioManager.playSound(soundName, { game });
    }

    /**
     * Show overlay message
     * @protected
     */
    _showMessage(game, text, imageSrc = null, instant = true, noTypewriter = false) {
        if (game.uiManager && typeof game.uiManager.showOverlayMessage === 'function') {
            game.uiManager.showOverlayMessage(text, imageSrc, instant, true, noTypewriter);
        }
    }

    /**
     * Drop item on current tile (player's position)
     * @protected
     * @param {Object} game - Game instance
     * @param {string} itemType - Item type name (for logging/debugging)
     * @param {*} tileType - Tile type to place (can be constant or object)
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
     * @param {Object} game - Game instance
     * @param {Object} item - Item being used
     * @param {Object} context - Context (fromRadial, etc.)
     * @param {Object} config - Configuration object
     * @param {Function} config.onRadial - Callback for radial behavior: (game, item) => void
     * @param {string} config.message - Message to show in radial mode
     * @param {*} config.dropTileType - Tile type to drop (for non-radial)
     * @returns {Object} - { consumed: bool, quantity/uses: number, success: bool }
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
