import { BaseItemEffect } from './BaseItemEffect.js';
import { TILE_TYPES } from '../../../core/constants/index.js';

/**
 * ItemEffectFactory - Factory for creating item effects that follow common patterns
 *
 * Eliminates code duplication in WeaponEffects.js where all effects follow identical patterns.
 * Uses a configuration-based approach to create effect instances.
 *
 * @example
 * // Create a weapon effect with radial behavior
 * const bombEffect = ItemEffectFactory.createRadialEffect({
 *   name: 'Bomb',
 *   onRadial: (game, item) => game.transientGameState.enterBombPlacementMode(),
 *   message: 'Tap a tile to place a bomb',
 *   dropTileType: { type: TILE_TYPES.BOMB, actionsSincePlaced: 0, justPlaced: true }
 * });
 */
export class ItemEffectFactory {
    /**
     * Create an effect that follows the radial pattern
     * @param {Object} config - Effect configuration
     * @param {string} config.name - Effect name (for debugging)
     * @param {Function} config.onRadial - Callback for radial behavior: (game, item) => void
     * @param {string} config.message - Message to show in radial mode
     * @param {*} config.dropTileType - Tile type to drop (for non-radial)
     * @returns {BaseItemEffect} A configured item effect instance
     */
    static createRadialEffect(config) {
        const { name, onRadial, message, dropTileType } = config;

        return new (class extends BaseItemEffect {
            apply(game, item, context = {}) {
                return this._applyRadialPattern(game, item, context, {
                    onRadial,
                    message,
                    dropTileType
                });
            }

            toString() {
                return `RadialEffect(${name})`;
            }
        })();
    }

    /**
     * Create a weapon charge effect (Bow, Bishop Spear, Horse Icon)
     * @param {Object} config - Effect configuration
     * @param {string} config.name - Weapon name
     * @param {string} config.selectionType - Selection type identifier
     * @param {number} config.tileType - Tile type constant
     * @param {number} config.uses - Number of uses for the weapon
     * @param {string} config.message - Message to show
     * @returns {BaseItemEffect} A configured weapon effect instance
     */
    static createWeaponChargeEffect(config) {
        const { name, selectionType, tileType, uses, message } = config;

        return new (class extends BaseItemEffect {
            apply(game, item, context = {}) {
                return this._applyRadialPattern(game, item, context, {
                    onRadial: (game, item) => {
                        game.transientGameState.setPendingCharge({ selectionType, item });
                    },
                    message,
                    dropTileType: { type: tileType, uses: item.uses || uses }
                });
            }

            toString() {
                return `WeaponChargeEffect(${name})`;
            }
        })();
    }

    /**
     * Create a bomb-like effect (placement mode with adjacent tiles)
     * @param {Object} config - Effect configuration
     * @param {string} config.name - Effect name
     * @param {string} config.message - Message to show
     * @param {*} config.dropTileType - Tile type to drop
     * @param {Function} config.enterPlacementMode - Function to enter placement mode
     * @param {Function} config.getValidPositions - Function to get valid placement positions
     * @returns {BaseItemEffect} A configured bomb effect instance
     */
    static createBombEffect(config) {
        const { name, message, dropTileType, enterPlacementMode, getValidPositions } = config;

        return this.createRadialEffect({
            name,
            onRadial: (game, item) => {
                enterPlacementMode(game);
                const positions = getValidPositions(game);
                positions.forEach(pos => {
                    game.transientGameState.addBombPlacementPosition(pos);
                });
            },
            message,
            dropTileType
        });
    }

    /**
     * Create a simple consumable effect
     * @param {Object} config - Effect configuration
     * @param {string} config.name - Effect name
     * @param {Function} config.onUse - Callback when item is used: (game, item, context) => result
     * @returns {BaseItemEffect} A configured consumable effect instance
     */
    static createConsumableEffect(config) {
        const { name, onUse } = config;

        return new (class extends BaseItemEffect {
            apply(game, item, context = {}) {
                return onUse(game, item, context);
            }

            toString() {
                return `ConsumableEffect(${name})`;
            }
        })();
    }

    /**
     * Create an effect from a configuration object
     * Automatically determines which factory method to use based on config
     * @param {Object} config - Effect configuration with 'type' field
     * @returns {BaseItemEffect} A configured effect instance
     */
    static create(config) {
        switch (config.type) {
            case 'radial':
                return this.createRadialEffect(config);
            case 'weapon-charge':
                return this.createWeaponChargeEffect(config);
            case 'bomb':
                return this.createBombEffect(config);
            case 'consumable':
                return this.createConsumableEffect(config);
            default:
                throw new Error(`Unknown effect type: ${config.type}`);
        }
    }
}

export default ItemEffectFactory;
