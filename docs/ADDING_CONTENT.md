# Adding New Content to Chress

This guide explains how to add new items, NPCs, enemies, and zones to the game using the unified ContentRegistry system.

## Quick Start

All game content is registered in **one file**: [`config/ContentRegistrations.js`](../config/ContentRegistrations.js)

Instead of editing 7-8 different files, you now register everything in one place!

---

## Table of Contents

1. [Adding a New Item](#adding-a-new-item)
2. [Adding a New NPC](#adding-a-new-npc)
3. [Adding a New Enemy](#adding-a-new-enemy)
4. [Adding a New Zone Type](#adding-a-new-zone-type)
5. [Advanced Examples](#advanced-examples)

---

## Adding a New Item

### Step 1: Define the Tile Type

First, add a tile type constant in [`core/constants/tiles.js`](../core/constants/tiles.js):

```javascript
export const TILE_TYPES = {
    // ... existing types
    MAGIC_SWORD: 51  // Use next available ID
};
```

### Step 2: Create the Item Effect (if applicable)

If your item does something when used, create an effect class:

```javascript
// managers/inventory/effects/WeaponEffects.js
import { BaseItemEffect } from './BaseItemEffect.js';

export class MagicSwordEffect extends BaseItemEffect {
    apply(game, item, context = {}) {
        // Implement item behavior
        console.log('Magic sword used!');

        // Return result
        return {
            consumed: false,  // Item not consumed
            success: true     // Action succeeded
        };
    }
}
```

### Step 3: Register in ContentRegistry

Open [`config/ContentRegistrations.js`](../config/ContentRegistrations.js) and add to the `registerItems()` function:

```javascript
import { MagicSwordEffect } from '../managers/inventory/effects/WeaponEffects.js';

function registerItems() {
    // ... existing items

    ContentRegistry.registerItem('magic_sword', {
        tileType: TILE_TYPES.MAGIC_SWORD,
        stackable: false,                    // Can't stack in inventory
        radial: true,                        // Goes in radial inventory
        effect: new MagicSwordEffect(),      // What happens when used
        spawnWeight: 0.03,                   // 3% spawn chance
        spawnRules: {
            minLevel: 2,                     // Only spawns in level 2+
            maxLevel: 4,                     // Up to level 4
            dimension: 'any',                // Any dimension (0=surface, 2=underground)
            isActivated: true                // Subject to level 1 surface restriction
        },
        getTooltip: (item) => {
            const disabledText = item.disabled ? ' (DISABLED)' : '';
            return `Magic Sword${disabledText} - A powerful blade. Has ${item.uses} charges.`;
        },
        getImageKey: () => 'magic_sword',    // Texture key
        metadata: {
            defaultUses: 5                   // Spawns with 5 uses
        }
    });
}
```

### Step 4: Add Asset (Optional)

If you have a custom sprite, add it to the assets folder and update the texture loader.

**That's it!** Your item will now:
- Spawn in appropriate zones
- Appear in inventory with the correct tooltip
- Execute its effect when used
- Stack/not stack based on config

---

## Adding a New NPC

There are two systems for NPCs:
1. **JSON-based NPCs** (recommended for gossip NPCs) - Auto-discovered, data-driven
2. **Registered NPCs** (for merchants/tutorial NPCs) - Manually registered in code

### Method 1: JSON-Based NPCs (Recommended for Gossip NPCs)

This is the preferred method for dialogue-based NPCs that spawn procedurally.

#### Step 1: Create Character JSON File

Create a JSON file in `src/characters/gossip/your_npc.json`:

```json
{
  "id": "your_npc",
  "name": "Your NPC",
  "type": "dialogue",
  "metadata": {
    "description": "A friendly character with interesting stories.",
    "created": "2025-11-03T00:00:00.000Z",
    "version": "1.0.0",
    "category": "gossip"
  },
  "display": {
    "sprite": "characters/npcs/gossip/your_npc.png",
    "portrait": "characters/npcs/portraits/your_npcface.png",
    "tileType": "YOUR_NPC"
  },
  "placement": {
    "zone": null,
    "x": null,
    "y": null,
    "dimension": 0,
    "spawnLogic": "procedural",
    "spawnWeight": 0.005,
    "level": 1
  },
  "interaction": {
    "type": "dialogue",
    "cycleMode": "sequential",
    "dialogueTree": [
      {
        "id": "msg_0",
        "text": "Hello traveler! I have much to share.",
        "buttonText": "Tell me more."
      },
      {
        "id": "msg_1",
        "text": "The world is vast and full of mysteries.",
        "buttonText": "Interesting."
      }
    ]
  },
  "behavior": {
    "movementType": "stationary",
    "walkable": false
  },
  "audio": {
    "voicePitch": 110
  }
}
```

**Dialogue Configuration:**
- `cycleMode`: "sequential" (cycles through messages), "random", or "once"
- `dialogueTree`: Array of message objects with text and button labels
- `voicePitch`: 50-250, affects text-to-speech (if implemented)

#### Step 2: Add Tile Type Constant

Add to `src/core/constants/tiles.ts`:

```typescript
export const TILE_TYPES = {
    // ... existing types
    YOUR_NPC: 88,  // Use next available ID
} as const;
```

#### Step 3: Add to Tile Registry

Update `src/renderers/strategies/TileStrategyRegistry.js` in the `registerGossipNPCs()` method:

```javascript
const gossipNPCs = [
    'ASTER', 'BLOT', /* ... existing NPCs ... */,
    'YOUR_NPC'  // Add your NPC name in UPPERCASE
];
```

#### Step 4: Add Assets to Asset Registry

Add sprite and portrait to `src/core/constants/assets.ts`:

```typescript
export const IMAGE_ASSETS = [
    // ... existing assets ...

    // Gossip NPCs
    'characters/npcs/gossip/your_npc.png',

    // NPC Portraits
    'characters/npcs/portraits/your_npcface.png',
] as const;
```

#### Step 5: Add Color Fallback (Optional)

Add a fallback color in `src/core/constants/tiles.ts`:

```typescript
export const TILE_COLORS: Record<number, string> = {
    // ... existing colors ...
    [TILE_TYPES.YOUR_NPC]: '#9370DB', // Medium purple
};
```

#### Step 6: Add Visual Assets

Place your sprite and portrait files:
- Sprite: `static/assets/characters/npcs/gossip/your_npc.png`
- Portrait: `static/assets/characters/npcs/portraits/your_npcface.png`

**That's it!** The NPC will be auto-discovered and loaded by the system.

#### Testing JSON-Based NPCs

- Press **"O"** key in-game to spawn a random gossip NPC
- Check browser console for any loading errors
- NPCs spawn procedurally based on `spawnWeight` (0.005 = 0.5% per zone)

---

### Method 2: Registered NPCs (For Merchants/Tutorial NPCs)

Use this for NPCs with complex barter systems or fixed placements.

#### Step 1: Define Tile Type

```javascript
// core/constants/tiles.js
export const TILE_TYPES = {
    ELDER_MERCHANT: 52
};
```

#### Step 2: Register the NPC

```javascript
// config/registrations/NPCRegistrations.js

export function registerNPCs() {
    // ... existing NPCs

    ContentRegistry.registerNPC('elder_merchant', {
        tileType: TILE_TYPES.ELDER_MERCHANT,
        action: 'barter',                    // 'barter', 'dialogue', or 'quest'
        placement: {
            zone: 'home_interior',           // Where it can spawn
            spawnWeight: 0.15,               // 15% chance
            dimension: 0                      // Surface only
        }
    });
}
```

#### Fixed Position NPCs

For NPCs that always appear in the same spot (like home NPCs):

```javascript
ContentRegistry.registerNPC('elder_merchant', {
    tileType: TILE_TYPES.ELDER_MERCHANT,
    action: 'dialogue',
    placement: {
        zone: 'home_interior',
        x: 5,                                // Fixed X position
        y: 5                                 // Fixed Y position
    }
});
```

---

## Adding a New Enemy

### Step 1: Define Enemy Type

Enemies don't need tile types - they're referenced by ID.

### Step 2: Register the Enemy

```javascript
// config/ContentRegistrations.js

function registerEnemies() {
    // ... existing enemies

    ContentRegistry.registerEnemy('fire_lizard', {
        weight: 4,                           // Spawn cost (1-5 scale)
        spawnRules: {
            level1: 0,                       // 0% at level 1
            level2: 0.1,                     // 10% at level 2
            level3: 0.2,                     // 20% at level 3
            level4: 0.3                      // 30% at level 4
        },
        behaviorType: 'aggressive',          // AI behavior identifier
        stats: {
            health: 4,
            damage: 2,
            speed: 1.5
        },
        metadata: {
            description: 'A fiery lizard that charges at the player'
        }
    });
}
```

The enemy will now spawn based on zone level with the specified probabilities.

---

## Adding a New Zone Type

Zone types are more complex and require creating a handler class.

### Step 1: Create Zone Handler

```javascript
// core/handlers/LavaZoneHandler.js

import { BaseZoneHandler } from './BaseZoneHandler.js';

export class LavaZoneHandler extends BaseZoneHandler {
    constructor(zoneGen, zoneX, zoneY, zoneConnections, foodAssets) {
        super(zoneGen, zoneX, zoneY, foodAssets, 3, 0); // dimension 3, depth 0
        this.connections = zoneConnections;
    }

    generate() {
        // Custom generation logic
        this.fillWithFloor();
        this.addLavaRivers();
        this.addRandomFeatures();
        this.addSpecialZoneItems();

        // Find player spawn
        this.zoneGen.playerSpawn = this.findPlayerSpawn();

        return this.buildResult();
    }

    addLavaRivers() {
        // Custom lava generation logic
    }
}
```

### Step 2: Register Zone Handler

```javascript
// core/ZoneGenerator.js

import { LavaZoneHandler } from './handlers/LavaZoneHandler.js';

// In generateZone() method:
if (dimension === 3) {
    const handler = new LavaZoneHandler(this, zoneX, zoneY, zoneConnections, this.foodAssets);
    return handler.generate();
}
```

---

## Advanced Examples

### Example: Consumable Item with Quantity

```javascript
ContentRegistry.registerItem('health_potion', {
    tileType: TILE_TYPES.HEALTH_POTION,
    stackable: true,
    radial: false,
    effect: new HealthPotionEffect(),
    spawnWeight: 0.05,
    spawnRules: {
        minLevel: 1,
        maxLevel: 4,
        dimension: 'any'
    },
    getTooltip: (item) => {
        const qty = item.quantity > 1 ? ` (x${item.quantity})` : '';
        return `Health Potion${qty} - Restores 20 health`;
    },
    getImageKey: () => 'health_potion'
});
```

### Example: Tool with Durability

```javascript
ContentRegistry.registerItem('pickaxe', {
    tileType: TILE_TYPES.PICKAXE,
    stackable: false,
    radial: false,
    effect: new PickaxeEffect(),
    spawnWeight: 0.02,
    spawnRules: {
        dimension: 2  // Underground only
    },
    getTooltip: (item) => `Pickaxe - Mines rocks. ${item.durability}/10 durability`,
    getImageKey: () => 'pickaxe',
    metadata: {
        defaultDurability: 10
    }
});
```

### Example: NPC That Spawns Based on Game Progress

```javascript
ContentRegistry.registerNPC('secret_merchant', {
    tileType: TILE_TYPES.SECRET_MERCHANT,
    action: 'barter',
    placement: {
        zone: 'surface',
        spawnWeight: 0.01,  // Very rare
        dimension: 0,
        // Custom logic can check game state in placement handler
    },
    metadata: {
        requiresQuestComplete: 'main_quest_1'
    }
});
```

### Example: Boss Enemy

```javascript
ContentRegistry.registerEnemy('dragon_boss', {
    weight: 10,  // Very expensive - limits other spawns
    spawnRules: {
        level1: 0,
        level2: 0,
        level3: 0,
        level4: 0.01  // 1% only at frontier
    },
    behaviorType: 'boss',
    stats: {
        health: 20,
        damage: 3,
        speed: 1.0
    },
    metadata: {
        isBoss: true,
        lootTable: ['magic_sword', 'health_potion', 'rare_item']
    }
});
```

---

## Spawn Rules Reference

### Item Spawn Rules

| Field | Type | Description |
|-------|------|-------------|
| `minLevel` | number | Minimum zone level (1-4) |
| `maxLevel` | number | Maximum zone level (1-4) |
| `dimension` | number\|'any' | 0=surface, 2=underground, 'any'=both |
| `isActivated` | boolean | If true, won't spawn on level 1 surface |

### Zone Levels

- **Level 1 (Home)**: Zones within 2 tiles of origin
- **Level 2 (Woods)**: Zones 3-8 tiles from origin
- **Level 3 (Wilds)**: Zones 9-16 tiles from origin
- **Level 4 (Frontier)**: Zones 17+ tiles from origin

### Spawn Weights

Spawn weights are probabilities (0.0 to 1.0):
- `0.01` = 1% chance
- `0.05` = 5% chance
- `0.10` = 10% chance

Underground zones apply a 1.5x multiplier to spawn weights.

---

## Testing Your Content

After adding new content:

1. **Clear browser cache** to ensure new code loads
2. **Check browser console** for registration errors
3. **Use console commands** to spawn test items
4. **Visit appropriate zones** to see natural spawning

### Console Commands for Testing

```javascript
// Check if content registered
console.log(ContentRegistry.getItem('magic_sword'));

// Check registry stats
console.log(ContentRegistry.getStats());

// Get all items
console.log(ContentRegistry.getAllItems());
```

---

## Common Patterns

### Making Non-Spawnable Items

Set `spawnWeight: 0` for items obtained through other means:

```javascript
ContentRegistry.registerItem('quest_item', {
    // ... config
    spawnWeight: 0  // Never spawns naturally
});
```

### Dimension-Specific Items

```javascript
spawnRules: {
    dimension: 0  // Surface only
}
// OR
spawnRules: {
    dimension: 2  // Underground only
}
```

### Home Zone Special Items

For items that only appear in home zones, add special logic in ItemGenerator or set very restrictive spawn rules.

---

## Quick Reference: Adding Gossip NPCs

| Step | File | What to Add |
|------|------|-------------|
| 1 | `src/characters/gossip/` | Create `your_npc.json` with dialogue |
| 2 | `src/core/constants/tiles.ts` | Add `YOUR_NPC: 88` to TILE_TYPES |
| 3 | `src/renderers/strategies/TileStrategyRegistry.js` | Add `'YOUR_NPC'` to gossipNPCs array |
| 4 | `src/core/constants/assets.ts` | Add sprite and portrait paths |
| 5 | `src/core/constants/tiles.ts` | Add fallback color (optional) |
| 6 | `static/assets/` | Place sprite and portrait PNG files |

**Auto-Discovery:** JSON files in `src/characters/` are automatically discovered by `vite-plugin-npc-discovery.js` and loaded by `NPCLoader.js`

---

## File Reference

| File | Purpose |
|------|---------|
| [`config/registrations/NPCRegistrations.js`](../config/registrations/NPCRegistrations.js) | Register merchant/tutorial NPCs |
| [`config/registrations/ItemRegistrations.js`](../config/registrations/ItemRegistrations.js) | Register items with ContentRegistry |
| [`src/characters/gossip/`](../src/characters/gossip/) | **JSON-based gossip NPCs** (auto-discovered) |
| [`src/characters/merchant/`](../src/characters/merchant/) | JSON-based merchant NPCs |
| [`src/characters/tutorial/`](../src/characters/tutorial/) | JSON-based tutorial NPCs |
| [`core/NPCLoader.js`](../core/NPCLoader.js) | Auto-loads NPCs from JSON files |
| [`vite-plugin-npc-discovery.js`](../vite-plugin-npc-discovery.js) | Discovers NPC JSON files at build time |
| [`core/ContentRegistry.js`](../core/ContentRegistry.js) | Registry implementation (don't edit) |
| [`core/constants/tiles.ts`](../core/constants/tiles.ts) | Define tile type constants and colors |
| [`core/constants/assets.ts`](../core/constants/assets.ts) | Register image assets for texture loading |
| [`renderers/strategies/TileStrategyRegistry.js`](../renderers/strategies/TileStrategyRegistry.js) | Register rendering strategies for NPCs |
| [`managers/inventory/effects/`](../managers/inventory/effects/) | Item effect classes |
| [`generators/ItemGenerator.js`](../generators/ItemGenerator.js) | Uses ContentRegistry for spawning |
| [`generators/EnemyGenerator.js`](../generators/EnemyGenerator.js) | Uses ContentRegistry for spawning |

---

## Migration from Old System

If you have old code that references the scattered item definitions:

**Before (7-8 files to edit):**
1. Add to `TILE_TYPES`
2. Add to `ItemMetadata.STACKABLE_ITEMS`
3. Add to `ItemMetadata.getTooltipText()`
4. Add to `ItemEffectStrategy.effects`
5. Add to `SPAWN_PROBABILITIES`
6. Add to `ItemGenerator.specialItems` array
7. Add render strategy
8. Add to `TileRegistry` if needed

**After (1 file to edit):**
1. Add to `ContentRegistrations.js`

That's it!

---

## Troubleshooting NPCs

### NPCs Display as Yellow Fallback Tiles

**Problem:** NPCs spawn but show as yellow squares instead of their sprites.

**Solution:** The sprite assets aren't registered in `assets.ts`. Add them to the `IMAGE_ASSETS` array:

```typescript
// src/core/constants/assets.ts
export const IMAGE_ASSETS = [
    // ... other assets ...
    'characters/npcs/gossip/your_npc.png',
    'characters/npcs/portraits/your_npcface.png',
] as const;
```

### NPCs Don't Spawn with "O" Key

**Checklist:**
1. ✓ JSON file exists in `src/characters/gossip/`
2. ✓ `metadata.category` is set to `"gossip"`
3. ✓ Tile type added to `TILE_TYPES` in `tiles.ts`
4. ✓ NPC name added to `gossipNPCs` array in `TileStrategyRegistry.js`
5. ✓ Dev server restarted after changes

**Debug:** Check browser console for NPCLoader errors.

### Portrait Shows But NPC Dialogue Doesn't Work

**Problem:** NPC portrait displays correctly but clicking them does nothing.

**Checklist:**
1. ✓ `interaction.type` is set to `"dialogue"` in JSON
2. ✓ `dialogueTree` array has at least one message
3. ✓ Each dialogue message has `id`, `text`, and `buttonText`

### NPC Doesn't Spawn Procedurally in Zones

**Problem:** NPCs spawn with "O" key but never appear naturally.

**Solution:** Check `placement.spawnWeight` in the JSON:
- `0.005` = 0.5% chance per zone (recommended for gossip NPCs)
- `0.01` = 1% chance per zone
- `0` = Never spawns procedurally

NPCs also need `placement.spawnLogic: "procedural"` to spawn naturally.

### Character Editor Can't Load NPC

The character editor (`tools/character-editor.html`) is a standalone tool that doesn't require any additional configuration. It works independently of the game's NPC system.

---

## Getting Help

If you encounter issues:

1. Check browser console for error messages
2. Verify all required fields are provided in JSON
3. Ensure tile types don't conflict (use unique IDs)
4. Restart dev server after adding new NPCs
5. Clear browser cache if sprites don't load

Happy content creation!
