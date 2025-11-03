import { BaseItemEffect, type ItemEffectContext, type ItemEffectResult, type Game } from './BaseItemEffect.js';
import { TILE_TYPES } from '../../../core/constants/index.js';
import type { InventoryItem } from '../ItemMetadata.js';

interface RadialEffectConfig {
    name: string;
    onRadial: (game: Game, item: InventoryItem) => void;
    message: string;
    dropTileType: number | object;
}

interface WeaponChargeConfig {
    name: string;
    selectionType: string;
    tileType: number;
    uses: number;
    message: string;
}

interface BombEffectConfig {
    name: string;
    message: string;
    dropTileType: number | object;
    enterPlacementMode: (game: Game) => void;
    getValidPositions: (game: Game) => Array<{ x: number; y: number }>;
}

interface ConsumableEffectConfig {
    name: string;
    onUse: (game: Game, item: InventoryItem, context: ItemEffectContext) => ItemEffectResult;
}

interface BaseEffectConfig {
    type: 'radial' | 'weapon-charge' | 'bomb' | 'consumable';
}

type EffectConfig =
    | (BaseEffectConfig & { type: 'radial' } & RadialEffectConfig)
    | (BaseEffectConfig & { type: 'weapon-charge' } & WeaponChargeConfig)
    | (BaseEffectConfig & { type: 'bomb' } & BombEffectConfig)
    | (BaseEffectConfig & { type: 'consumable' } & ConsumableEffectConfig);

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
     * @param config - Effect configuration
     * @returns A configured item effect instance
     */
    static createRadialEffect(config: RadialEffectConfig): BaseItemEffect {
        const { name, onRadial, message, dropTileType } = config;

        return new (class extends BaseItemEffect {
            apply(game: Game, item: InventoryItem, context: ItemEffectContext = {}): ItemEffectResult {
                return this._applyRadialPattern(game, item, context, {
                    onRadial,
                    message,
                    dropTileType
                });
            }

            toString(): string {
                return `RadialEffect(${name})`;
            }
        })();
    }

    /**
     * Create a weapon charge effect (Bow, Bishop Spear, Horse Icon)
     * @param config - Effect configuration
     * @returns A configured weapon effect instance
     */
    static createWeaponChargeEffect(config: WeaponChargeConfig): BaseItemEffect {
        const { name, selectionType, tileType, uses, message } = config;

        return new (class extends BaseItemEffect {
            apply(game: Game, item: InventoryItem, context: ItemEffectContext = {}): ItemEffectResult {
                return this._applyRadialPattern(game, item, context, {
                    onRadial: (game, item) => {
                        game.transientGameState.setPendingCharge({ selectionType, item });
                    },
                    message,
                    dropTileType: { type: tileType, uses: (item as any).uses || uses }
                });
            }

            toString(): string {
                return `WeaponChargeEffect(${name})`;
            }
        })();
    }

    /**
     * Create a bomb-like effect (placement mode with adjacent tiles)
     * @param config - Effect configuration
     * @returns A configured bomb effect instance
     */
    static createBombEffect(config: BombEffectConfig): BaseItemEffect {
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
     * @param config - Effect configuration
     * @returns A configured consumable effect instance
     */
    static createConsumableEffect(config: ConsumableEffectConfig): BaseItemEffect {
        const { name, onUse } = config;

        return new (class extends BaseItemEffect {
            apply(game: Game, item: InventoryItem, context: ItemEffectContext = {}): ItemEffectResult {
                return onUse(game, item, context);
            }

            toString(): string {
                return `ConsumableEffect(${name})`;
            }
        })();
    }

    /**
     * Create an effect from a configuration object
     * Automatically determines which factory method to use based on config
     * @param config - Effect configuration with 'type' field
     * @returns A configured effect instance
     */
    static create(config: EffectConfig): BaseItemEffect {
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
                throw new Error(`Unknown effect type: ${(config as any).type}`);
        }
    }
}

export default ItemEffectFactory;
