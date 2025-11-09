import type { BaseItemEffect, ItemEffectContext, ItemEffectResult, Game } from './effects/BaseItemEffect';
import type { InventoryItem, ItemType } from './ItemMetadata';

// Lazy-loaded effect classes to avoid circular dependencies
let FoodEffect: any;
let WaterEffect: any;
let HeartEffect: any;
let AxeEffect: any;
let HammerEffect: any;
let BombEffect: any;
let BowEffect: any;
let BishopSpearEffect: any;
let HorseIconEffect: any;
let ShovelEffect: any;
let NoteEffect: any;
let BookOfTimeTravelEffect: any;
let FischersCubeEffect: any;
let TeleportBranchEffect: any;

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
    private static _effects: Record<ItemType, BaseItemEffect> | null = null;
    private static _initialized = false;

    /**
     * Initialize effect classes (call once during app initialization)
     * Uses dynamic imports to avoid circular dependencies
     */
    static async initialize(): Promise<void> {
        if (this._initialized) {
            return;
        }

        // Dynamic imports to avoid circular dependencies in production builds
        const [
            consumables,
            tools,
            weapons,
            special
        ] = await Promise.all([
            import('./effects/ConsumableEffects'),
            import('./effects/ToolEffects'),
            import('./effects/WeaponEffects'),
            import('./effects/SpecialEffects')
        ]);

        FoodEffect = consumables.FoodEffect;
        WaterEffect = consumables.WaterEffect;
        HeartEffect = consumables.HeartEffect;
        AxeEffect = tools.AxeEffect;
        HammerEffect = tools.HammerEffect;
        BombEffect = weapons.BombEffect;
        BowEffect = weapons.BowEffect;
        BishopSpearEffect = weapons.BishopSpearEffect;
        HorseIconEffect = weapons.HorseIconEffect;
        ShovelEffect = special.ShovelEffect;
        NoteEffect = special.NoteEffect;
        BookOfTimeTravelEffect = special.BookOfTimeTravelEffect;
        FischersCubeEffect = special.FischersCubeEffect;
        TeleportBranchEffect = special.TeleportBranchEffect;

        this._initialized = true;
    }

    private static get effects(): Record<ItemType, BaseItemEffect> {
        if (!this._effects) {
            if (!this._initialized) {
                throw new Error('[ItemEffectStrategy] Effects not initialized. Call initialize() during app startup.');
            }

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
                'book_of_time_travel': new BookOfTimeTravelEffect(),
                'fischers_cube': new FischersCubeEffect(),
                'teleport_branch': new TeleportBranchEffect()
            };
        }
        return this._effects;
    }

    /**
     * Apply item effect using the appropriate strategy
     * @param game - Game instance
     * @param item - Item being used
     * @param context - Context (fromRadial, targetX, targetY, etc.)
     * @returns Result with consumed, quantity/uses, and success flags
     */
    static applyEffect(game: Game, item: InventoryItem, context: ItemEffectContext = {}): ItemEffectResult {
        if (!game || !item || !item.type) {
            return { consumed: false, success: false };
        }

        const effect = this.effects[item.type as ItemType];
        if (!effect) {
            console.warn(`No effect handler for item type: ${item.type}`);
            return { consumed: false, success: false };
        }

        return effect.apply(game, item, context);
    }

    /**
     * Check if an item type has an effect handler
     */
    static hasEffect(itemType: string): boolean {
        return itemType in this.effects;
    }
}
