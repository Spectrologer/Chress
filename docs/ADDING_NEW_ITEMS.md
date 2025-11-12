# Adding New Items to Chesse

This guide documents the complete process for adding new items to the game, based on the implementation of Fischer's Cube.

## Table of Contents

1. [Overview](#overview)
2. [Quick Checklist](#quick-checklist)
3. [Detailed Implementation Steps](#detailed-implementation-steps)
4. [Testing](#testing)
5. [Common Pitfalls](#common-pitfalls)

## Overview

Adding a new item to Chesse requires updates across multiple systems:
- **Constants**: Tile types, spawn probabilities, assets
- **Types**: TypeScript interfaces for type safety
- **Effects**: Item behavior implementation
- **Registration**: ContentRegistry configuration
- **Rendering**: Visual representation on grid and in UI
- **Metadata**: Tooltips, image keys, stacking rules

## Quick Checklist

Use this checklist to ensure you've covered all necessary steps:

- [ ] **1. Constants** - Add tile type constant
- [ ] **2. Spawn Probability** - Define spawn rate and rules
- [ ] **3. Asset Registration** - Register image asset
- [ ] **4. TypeScript Types** - Create item interface
- [ ] **5. Item Effect** - Implement effect class
- [ ] **6. Item Registration** - Register with ContentRegistry
- [ ] **7. Item Metadata** - Add to STACKABLE_ITEMS, RADIAL_TYPES, etc.
- [ ] **8. Tile Registry** - Add to WALKABLE_TYPES if walkable
- [ ] **9. Tile Strategy Registry** - Add rendering strategy
- [ ] **10. Type Checks** - Add to TypeChecks.isItem()
- [ ] **11. Item Manager** - Add pickup handler
- [ ] **12. Item Effect Strategy** - Register effect handler
- [ ] **13. Radial Inventory UI** - Add image mapping (if radial)
- [ ] **14. Tests** - Write comprehensive tests
- [ ] **15. Documentation** - Update relevant docs

## Detailed Implementation Steps

### Step 1: Add Tile Type Constant

**File**: `src/core/constants/tiles.ts`

Add a new constant for your item's tile type:

```typescript
export const TILE_TYPES = {
    // ... existing constants
    FISCHERS_WAND: 108, // Fischer's Cube - Shuffles enemies and obstacles
    // ... more constants
} as const;
```

**Notes**:
- Use a unique number that doesn't conflict with existing tile types
- Add a descriptive comment explaining what the item does

### Step 2: Define Spawn Probability

**File**: `src/core/constants/spawning.ts`

Add the spawn probability to the interface and implementation:

```typescript
// Add to SpecialItemsProbabilities interface
interface SpecialItemsProbabilities {
    // ... existing items
    FISCHERS_WAND: number;
}

// Add to SPAWN_PROBABILITIES object
export const SPAWN_PROBABILITIES = {
    SPECIAL_ITEMS: {
        // ... existing items
        FISCHERS_WAND: 0.015 // Activated item, levels 1-4 (very powerful)
    }
}
```

**Notes**:
- Typical spawn rates: 0.04 (4%) for common items, 0.015 (1.5%) for rare items
- Consider game balance when setting spawn rates
- Add descriptive comments about spawn conditions

### Step 3: Register Asset

**File**: `src/core/constants/assets.ts`

Register the image asset path:

```typescript
export const IMAGE_ASSETS = [
    // ... existing assets
    'environment/doodads/cube.png',
    // ... more assets
];
```

**Notes**:
- Place the actual image file in `static/assets/items/` subdirectory
- Common subdirectories: `misc/`, `equipment/`, `consumables/`
- Use PNG format for items
- Standard item size: 32x32 pixels (scaled to tileSize at runtime)

### Step 4: Create TypeScript Interface

**File**: `src/managers/inventory/ItemMetadata.ts`

Add type definitions for your item:

```typescript
// Add item-specific interface
export interface FischersWandItem extends BaseItem {
    type: 'fischers_wand';
    uses: number; // For items with limited uses
    // OR
    quantity?: number; // For stackable consumables
}

// Add to InventoryItem union type
export type InventoryItem =
    | FoodItem
    | WaterItem
    // ... existing items
    | FischersWandItem
    | BaseItem;
```

**Notes**:
- Use `uses` for items with limited charges (weapons, tools)
- Use `quantity` for consumables (food, water, bombs)
- Include `disabled?: boolean` if item can be disabled
- The union type enables discriminated type checking

### Step 5: Implement Item Effect

**File**: `src/managers/inventory/effects/SpecialEffects.ts` (or appropriate category)

Create an effect class extending `BaseItemEffect`:

```typescript
import { BaseItemEffect, type ItemEffectContext, type ItemEffectResult, type Game } from './BaseItemEffect';
import { TILE_TYPES } from '@core/constants/index';
import { eventBus } from '@core/EventBus';
import { EventTypes } from '@core/EventTypes';
import type { FischersWandItem } from '../ItemMetadata';

export class FischersWandEffect extends BaseItemEffect {
    apply(game: Game, item: InventoryItem, context: ItemEffectContext = {}): ItemEffectResult {
        // Show visual feedback
        eventBus.emit(EventTypes.UI_SHOW_MESSAGE, {
            text: 'Fischer\'s Cube swirls the zone...<br>Everything shifts!',
            imageSrc: 'assets/environment/doodads/cube.png',
            isPersistent: true,
            isLargeText: false,
            useTypewriter: false
        });

        // Implement item logic here
        // ...

        // Return result
        return {
            consumed: true,  // Whether the item was used
            uses: 1,         // How many uses/quantity consumed
            success: true    // Whether the effect succeeded
        };
    }
}
```

**Effect Categories**:
- `ConsumableEffects.ts`: Food, Water, Hearts
- `ToolEffects.ts`: Axe, Hammer
- `WeaponEffects.ts`: Bomb, Bow, Spear, Horse Icon
- `SpecialEffects.ts`: Shovel, Note, Book, Fischer's Wand

**Return Values**:
- `consumed: true` - Item was used (decrements quantity/uses)
- `consumed: false` - Item was not used (no change)
- `uses: number` - How many charges/quantity to consume
- `success: boolean` - Whether effect worked (for conditional behavior)

### Step 6: Register with ContentRegistry

**File**: `src/config/registrations/ItemRegistrations.ts`

Register your item with the ContentRegistry:

```typescript
import { FischersWandEffect } from '@managers/inventory/effects/SpecialEffects';
import type { FischersWandItem } from '@managers/inventory/ItemMetadata';

export function registerItems(): void {
    // ... existing registrations

    ContentRegistry.registerItem('fischers_wand', {
        tileType: TILE_TYPES.FISCHERS_WAND,
        stackable: true,  // Can multiple be held?
        radial: true,     // Goes in radial menu?
        effect: new FischersWandEffect(),
        spawnWeight: SPAWN_PROBABILITIES.SPECIAL_ITEMS.FISCHERS_WAND,
        spawnRules: {
            minLevel: 1,        // Minimum zone level
            maxLevel: 4,        // Maximum zone level
            dimension: 'any',   // 'any', 0 (surface), 2 (underground)
            isActivated: true   // Requires statue activation
        },
        getTooltip: (item: FischersWandItem) => {
            const disabledText = item.disabled ? ' (DISABLED)' : '';
            return `Fischer's Cube${disabledText} - Shuffles all enemies and obstacles in the zone. Has ${item.uses} charges.`;
        },
        getImageKey: () => 'cube',
        metadata: {
            defaultUses: 1  // Default uses for new items
        }
    });
}
```

**Configuration Options**:
- `stackable`: Whether multiple items stack into one inventory slot
- `radial`: Whether item appears in radial quick-action menu
- `spawnWeight`: Probability of spawning (from Step 2)
- `spawnRules.dimension`: 'any', 0 (surface only), or 2 (underground only)
- `spawnRules.isActivated`: true = requires statue, false = spawns immediately

### Step 7: Update Item Metadata

**File**: `src/managers/inventory/ItemMetadata.ts`

Add to relevant constants and methods:

```typescript
export class ItemMetadata {
    // Add to stackable items (if stackable)
    static readonly STACKABLE_ITEMS: readonly ItemType[] = [
        // ... existing items
        'fischers_wand'
    ];

    // Add to radial types (if radial)
    static readonly RADIAL_TYPES: readonly ItemType[] = [
        // ... existing items
        'fischers_wand'
    ];

    // Add to tile type map
    static readonly TILE_TYPE_MAP: Record<number, ItemType> = {
        // ... existing mappings
        [TILE_TYPES.FISCHERS_WAND]: 'fischers_wand'
    };

    // Add to tooltip switch
    static getTooltipText(item: InventoryItem | null | undefined): string {
        // ... existing cases
        case 'fischers_wand':
            return `Fischer's Cube${disabledText} - Shuffles all enemies and obstacles in the zone. Has ${item.uses} charges.`;
        // ... more cases
    }

    // Add to image key map
    static getImageKey(item: InventoryItem | null | undefined): string | null {
        const keyMap: Record<ItemType, string> = {
            // ... existing mappings
            'fischers_wand': 'cube'
        };
        return keyMap[item.type] || null;
    }

    // Add to normalizeItem (if has uses)
    static normalizeItem<T extends Partial<InventoryItem>>(item: T): T {
        const itemsWithUses: Record<string, number> = {
            // ... existing items
            'fischers_wand': 1  // Default uses
        };
        // ... rest of method
    }
}
```

### Step 8: Add to Tile Registry (if walkable)

**File**: `src/core/TileRegistry.ts`

If your item tile should be walkable:

```typescript
export class TileRegistry {
    static readonly WALKABLE_TYPES: number[] = [
        // ... existing types
        TILE_TYPES.FISCHERS_WAND
    ];
}
```

**When to add**:
- Items on the ground should be walkable
- NPCs and structures should NOT be walkable

### Step 9: Add Rendering Strategy

**File**: `src/renderers/strategies/TileStrategyRegistry.ts`

Register how your item renders on the game grid:

```typescript
import { SimpleItemRenderStrategy } from './SimpleItemRenderStrategy.js';

export class TileStrategyRegistry {
    private initializeStrategies(): void {
        // ... existing strategies

        // Items
        this.register(TILE_TYPES.FISCHERS_WAND, new SimpleItemRenderStrategy(
            this.images,
            this.tileSize,
            'cube',                // Texture key
            TILE_TYPES.FISCHERS_WAND,
            '🧊',                  // Emoji fallback
            { scale: 1.0 }         // Rendering options
        ));
    }
}
```

**Rendering Options**:
- `scale`: Size multiplier (1.0 = full tile size)
- `rotation`: Rotation in radians
- `scaleToFit`: Auto-scale to fit tile
- `fallbackFontSize`: Font size for emoji fallback

### Step 10: Add to Type Checks

**File**: `src/utils/TypeChecks.ts`

Add type checking for your item:

```typescript
export function isItem(tile: Tile): boolean {
    const type = getTileType(tile);
    return (
        // ... existing checks
        type === TILE_TYPES.FISCHERS_WAND
    );
}
```

### Step 11: Add Item Pickup Handler

**File**: `src/managers/ItemManager.ts`

Add handling for picking up your item:

```typescript
handleItemPickup(player: Player, x: number, y: number, grid: Grid): void {
    const tile = grid[y][x];

    // ... existing cases

    case TILE_TYPES.FISCHERS_WAND:
        const itemType = ItemMetadata.TILE_TYPE_MAP[tile.type];
        if (itemType) {
            const item = ItemMetadata.normalizeItem({ type: itemType });
            this.addItemToInventory(player, item);
            grid[y][x] = TILE_TYPES.FLOOR;
        }
        break;
}
```

### Step 12: Register Effect Handler

**File**: `src/managers/inventory/ItemEffectStrategy.ts`

Import and register your effect:

```typescript
import { FischersWandEffect } from './effects/SpecialEffects';

export class ItemEffectStrategy {
    private static get effects(): Record<ItemType, BaseItemEffect> {
        if (!this._effects) {
            this._effects = {
                // ... existing effects
                'fischers_wand': new FischersWandEffect()
            };
        }
        return this._effects;
    }
}
```

### Step 13: Add to Radial Inventory UI (if radial)

**File**: `src/ui/RadialInventoryUI.ts`

If your item is radial, add image mapping:

```typescript
private _getImageForItem(item: InventoryItem): string {
    switch (item.type) {
        // ... existing cases
        case 'fischers_wand': return 'assets/environment/doodads/cube.png';
        default: return item.image || 'assets/items/unknown.png';
    }
}
```

**Note**: The path here is the full asset path, unlike the texture key used elsewhere.

### Step 14: Write Tests

**File**: `tests/YourItem.test.ts`

Create comprehensive tests for your item:

```typescript
import { YourItemEffect } from '@managers/inventory/effects/SpecialEffects';
import { TILE_TYPES } from '@core/constants/index';
import type { Game } from '@managers/inventory/effects/BaseItemEffect';
import type { YourItem } from '@managers/inventory/ItemMetadata';

describe('YourItemEffect', () => {
    let effect: YourItemEffect;
    let mockGame: Partial<Game>;

    beforeEach(() => {
        effect = new YourItemEffect();
        // Set up mock game state
    });

    describe('apply()', () => {
        test('should apply item effect correctly', () => {
            const item: YourItem = { type: 'your_item', uses: 1 };
            const result = effect.apply(mockGame as Game, item, {});

            expect(result.success).toBe(true);
            expect(result.consumed).toBe(true);
            expect(result.uses).toBe(1);
        });

        // Add more test cases
    });

    describe('Integration with ItemMetadata', () => {
        test('should have correct default uses', () => {
            const { ItemMetadata } = require('@managers/inventory/ItemMetadata');
            const item = ItemMetadata.normalizeItem({ type: 'your_item' });
            expect(item.uses).toBe(1);
        });

        test('should have correct tooltip', () => {
            const { ItemMetadata } = require('@managers/inventory/ItemMetadata');
            const item: YourItem = { type: 'your_item', uses: 1 };
            const tooltip = ItemMetadata.getTooltipText(item);
            expect(tooltip).toContain('Fischer\'s Cube');
        });
    });
});
```

**Test Coverage**:
- Effect application logic
- Edge cases (empty inventory, full inventory, etc.)
- Integration with ItemMetadata
- Type safety
- Spawn rules
- Rendering (if applicable)

## Common Pitfalls

### 1. Forgetting to Add to Radial Inventory UI

**Symptom**: Item works but doesn't display image in radial menu

**Fix**: Add case to `RadialInventoryUI._getImageForItem()` with full asset path

### 2. Item Not Walkable

**Symptom**: Can't walk over item on ground

**Fix**: Add to `TileRegistry.WALKABLE_TYPES`

### 3. No Effect Handler Error

**Symptom**: "No effect handler for item type: your_item"

**Fix**: Register effect in `ItemEffectStrategy.effects`

### 4. Item Not Rendering on Ground

**Symptom**: Item invisible on grid

**Fix**: Register in `TileStrategyRegistry.initializeStrategies()`

### 5. Item Not Stacking

**Symptom**: Multiple items take separate inventory slots

**Fix**: Add to `ItemMetadata.STACKABLE_ITEMS`

### 6. Missing Type Definitions

**Symptom**: TypeScript errors about unknown types

**Fix**:
- Add interface to `ItemMetadata.ts`
- Add to `InventoryItem` union type
- Add to `keyMap` in `getImageKey()` method

### 7. Incorrect Spawn Rules

**Symptom**: Item spawns in wrong zones or dimensions

**Fix**: Verify `spawnRules` in `ItemRegistrations.ts`:
```typescript
spawnRules: {
    minLevel: 1,
    maxLevel: 4,
    dimension: 'any',  // or 0 (surface) or 2 (underground)
    isActivated: true  // requires statue activation
}
```

### 8. Missing Asset File

**Symptom**: Broken image or emoji fallback shows

**Fix**:
- Place image in `static/assets/items/` directory
- Verify path in `assets.ts` matches actual file location
- Check file name capitalization (case-sensitive on some systems)

### 9. Tooltip Not Showing

**Symptom**: Hover shows no tooltip or incorrect text

**Fix**: Add case to `ItemMetadata.getTooltipText()` switch statement

### 10. Item Not Picked Up

**Symptom**: Walking over item doesn't add to inventory

**Fix**: Add case to `ItemManager.handleItemPickup()` switch statement

## File Modification Summary

Here's a quick reference of all files that need updates:

| File | Purpose | Required? |
|------|---------|-----------|
| `src/core/constants/tiles.ts` | Tile type constant | ✅ Always |
| `src/core/constants/spawning.ts` | Spawn probability | ✅ Always |
| `src/core/constants/assets.ts` | Asset registration | ✅ Always |
| `src/managers/inventory/ItemMetadata.ts` | Type definitions & metadata | ✅ Always |
| `src/managers/inventory/effects/*.ts` | Effect implementation | ✅ Always |
| `src/config/registrations/ItemRegistrations.ts` | ContentRegistry registration | ✅ Always |
| `src/managers/inventory/ItemEffectStrategy.ts` | Effect handler registration | ✅ Always |
| `src/core/TileRegistry.ts` | Walkability | ✅ If walkable |
| `src/renderers/strategies/TileStrategyRegistry.ts` | Rendering strategy | ✅ Always |
| `src/utils/TypeChecks.ts` | Type checking | ✅ Always |
| `src/managers/ItemManager.ts` | Pickup handling | ✅ Always |
| `src/ui/RadialInventoryUI.ts` | Radial menu image | ✅ If radial |
| `tests/YourItem.test.ts` | Tests | ✅ Always |

## Item Type Decision Tree

Use this to determine which category your item belongs to:

```
Is it consumed on use?
├─ Yes → Consumable
│  ├─ Restores stats? → ConsumableEffects.ts
│  └─ One-time use? → SpecialEffects.ts
└─ No → Non-consumable
   ├─ Used for gathering? → ToolEffects.ts
   ├─ Used in combat? → WeaponEffects.ts
   └─ Special mechanic? → SpecialEffects.ts

Should it stack?
├─ Consumables → stackable: true, use 'quantity'
└─ Limited-use items → stackable: true, use 'uses'

Should it be radial?
├─ Quick-action items (combat, escape) → radial: true
└─ Passive/story items → radial: false
```

## Example: Full Implementation

See the Fischer's Cube implementation as a complete reference:
- Radial item with limited uses
- Shuffles all entities in the zone
- Spawn rate: 1.5% (rare)
- Asset: `cube.png` (from `environment/doodads/`)
- Type: `FischersWandItem` with `uses: number`
- Effect: `FischersWandEffect` in `SpecialEffects.ts`

## Additional Resources

- [Item System Architecture](./ITEM_SYSTEM.md) - Overview of item system design
- [Testing Guide](./TESTING.md) - Testing best practices
- [ContentRegistry Documentation](./CONTENT_REGISTRY.md) - Registry system details
- [Event System](./EVENT_SYSTEM.md) - Using events for item feedback

## Questions?

If you encounter issues not covered here:
1. Check existing item implementations for similar behavior
2. Search codebase for similar error messages
3. Verify all checklist items are complete
4. Run tests to identify missing integrations

---

**Last Updated**: Based on Fischer's Cube implementation (January 2025)
