import { FoodEffect, WaterEffect, HeartEffect } from './effects/ConsumableEffects.js';
import { AxeEffect, HammerEffect } from './effects/ToolEffects.js';
import { BombEffect, BowEffect, BishopSpearEffect, HorseIconEffect } from './effects/WeaponEffects.js';
import { ShovelEffect, NoteEffect, BookOfTimeTravelEffect } from './effects/SpecialEffects.js';

/**
 * ItemEffectStrategy - Strategy pattern for item effects
 *
 * This orchestrates all item effects by delegating to specific effect classes.
 * Each item type has its own effect class following the strategy pattern.
 *
 * Effect classes are organized by category:
 * - ConsumableEffects: Food, Water, Heart
 * - ToolEffects: Axe, Hammer
 * - WeaponEffects: Bomb, Bow, Bishop Spear, Horse Icon
 * - SpecialEffects: Shovel, Note, Book of Time Travel
 *
 * This replaces ALL old item usage logic from:
 * - InventoryActions.useInventoryItem()
 * - ItemUsageHandler.applyItemUse()
 * - ItemService.useInventoryItem()
 * - InventoryService.useInventoryItem()
 * - ItemUsageManager.useItem()
 */
export class ItemEffectStrategy {
    // Lazy initialization - effects are created on first access to avoid circular dependency issues
    static _effects = null;

    static get effects() {
        if (!this._effects) {
            this._effects = {
                'food': new FoodEffect(),
                'water': new WaterEffect(),
                'heart': new HeartEffect(),
                'axe': new AxeEffect(),
                'hammer': new HammerEffect(),
                'bomb': new BombEffect(),
                'bow': new BowEffect(),
                'bishop_spear': new BishopSpearEffect(),
                'horse_icon': new HorseIconEffect(),
                'shovel': new ShovelEffect(),
                'note': new NoteEffect(),
                'book_of_time_travel': new BookOfTimeTravelEffect()
            };
        }
        return this._effects;
    }

    /**
     * Apply item effect using the appropriate strategy
     * @param {Object} game - Game instance
     * @param {Object} item - Item being used
     * @param {Object} context - Context (fromRadial, targetX, targetY, etc.)
     * @returns {Object} - { consumed: bool, quantity/uses: number, success: bool }
     */
    static applyEffect(game, item, context = {}) {
        if (!game || !item || !item.type) {
            return { consumed: false, success: false };
        }

        const effect = this.effects[item.type];
        if (!effect) {
            console.warn(`No effect handler for item type: ${item.type}`);
            return { consumed: false, success: false };
        }

        return effect.apply(game, item, context);
    }

    /**
     * Check if an item type has an effect handler
     */
    static hasEffect(itemType) {
        return itemType in this.effects;
    }
}
