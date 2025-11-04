import { BaseItemEffect, type ItemEffectContext, type ItemEffectResult, type Game } from './BaseItemEffect';
import type { InventoryItem, FoodItem, WaterItem, HeartItem } from '../ItemMetadata';

/**
 * Food, Water, and Heart effects - Simple consumables
 */

export class FoodEffect extends BaseItemEffect {
    apply(game: Game, item: InventoryItem, context: ItemEffectContext = {}): ItemEffectResult {
        const foodItem = item as FoodItem;
        const isAguamelin = foodItem.foodType === 'items/consumables/aguamelin.png';

        // Restore hunger (and thirst for aguamelin)
        game.player.restoreHunger(isAguamelin ? 5 : 10);
        if (isAguamelin) {
            game.player.restoreThirst(5);
        }

        return { consumed: true, quantity: 1, success: true };
    }
}

export class WaterEffect extends BaseItemEffect {
    apply(game: Game, item: InventoryItem, context: ItemEffectContext = {}): ItemEffectResult {
        game.player.restoreThirst(10);
        return { consumed: true, quantity: 1, success: true };
    }
}

export class HeartEffect extends BaseItemEffect {
    apply(game: Game, item: InventoryItem, context: ItemEffectContext = {}): ItemEffectResult {
        game.player.setHealth(game.player.getHealth() + 1);
        return { consumed: true, quantity: 1, success: true };
    }
}
