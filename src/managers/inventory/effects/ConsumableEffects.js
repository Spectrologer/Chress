import { BaseItemEffect } from './BaseItemEffect.js';

/**
 * Food, Water, and Heart effects - Simple consumables
 */

export class FoodEffect extends BaseItemEffect {
    apply(game, item, context = {}) {
        const isAguamelin = item.foodType === 'food/aguamelin.png';

        // Restore hunger (and thirst for aguamelin)
        game.player.restoreHunger(isAguamelin ? 5 : 10);
        if (isAguamelin) {
            game.player.restoreThirst(5);
        }

        return { consumed: true, quantity: 1, success: true };
    }
}

export class WaterEffect extends BaseItemEffect {
    apply(game, item, context = {}) {
        game.player.restoreThirst(10);
        return { consumed: true, quantity: 1, success: true };
    }
}

export class HeartEffect extends BaseItemEffect {
    apply(game, item, context = {}) {
        game.player.setHealth(game.player.getHealth() + 1);
        return { consumed: true, quantity: 1, success: true };
    }
}
