# Strict Types Quick Reference

## Import the Types

```typescript
import {
    // Enemy types
    StrictEnemy,
    LizardyEnemy,
    LizardoEnemy,
    LizardeauxEnemy,
    isStrictEnemy,

    // Tile types
    StrictTile,
    StrictTileObject,
    BombTile,
    FoodTile,
    ToolTile,
    SignTile,
    isTileObject,
    isBombTile,
    isFoodTile,
    isToolTile,
    isSignTile,

    // Other types
    StrictZoneData,
    StrictNPC,
    StrictInventoryItem
} from '@types/StrictTypes';
```

## Enemy Type Patterns

### ✅ Correct: Using Discriminated Unions

```typescript
function processEnemy(enemy: StrictEnemy) {
    // TypeScript narrows the type based on enemyType
    switch (enemy.enemyType) {
        case 'lizardy':
            // TypeScript knows enemy is LizardyEnemy
            if (enemy.scale) {
                console.log('Scaled lizardy:', enemy.scale);
            }
            break;

        case 'lizardeaux':
            // TypeScript knows enemy is LizardeauxEnemy
            if (enemy.healCooldown !== undefined) {
                console.log('Heal cooldown:', enemy.healCooldown);
            }
            break;

        case 'lizord':
        case 'lazerd':
        case 'zard':
            // Handle other enemy types
            break;
    }
}
```

### ✅ Correct: Type Guards

```typescript
function validateEnemy(data: unknown): StrictEnemy {
    if (!isStrictEnemy(data)) {
        throw new Error('Invalid enemy data');
    }
    return data; // TypeScript knows this is StrictEnemy
}
```

### ❌ Wrong: Using Loose Types

```typescript
// Don't do this:
function processEnemy(enemy: any) {
    enemy.anyProperty; // No type safety!
}

// Or this:
function processEnemy(enemy: { [key: string]: unknown }) {
    enemy.health; // TypeScript doesn't know this exists!
}
```

## Tile Type Patterns

### ✅ Correct: Type Narrowing with Guards

```typescript
function handleTile(tile: StrictTile, x: number, y: number) {
    // Check if it's an object tile
    if (!isTileObject(tile)) {
        // It's a number (primitive tile type)
        console.log('Primitive tile type:', tile);
        return;
    }

    // Now TypeScript knows it's a StrictTileObject
    if (isBombTile(tile)) {
        // TypeScript knows tile has actionsSincePlaced and justPlaced
        console.log('Bomb placed', tile.actionsSincePlaced, 'actions ago');
        if (!tile.justPlaced) {
            // Can trigger bomb
        }
    } else if (isFoodTile(tile)) {
        // TypeScript knows tile has foodType
        console.log('Food type:', tile.foodType);
    } else if (isToolTile(tile)) {
        // TypeScript knows tile has uses
        console.log('Tool uses remaining:', tile.uses);
    } else if (isSignTile(tile)) {
        // TypeScript knows tile has message
        console.log('Sign message:', tile.message);
    }
}
```

### ✅ Correct: Creating Typed Tiles

```typescript
import { TILE_TYPES } from '@core/constants';

// Create a bomb tile
const bombTile: BombTile = {
    type: TILE_TYPES.BOMB,
    actionsSincePlaced: 0,
    justPlaced: true
};

// Create a food tile
const foodTile: FoodTile = {
    type: TILE_TYPES.FOOD,
    foodType: 'apple',
    name: 'Apple',
    icon: 'apple.png'
};

// Create a tool tile
const toolTile: ToolTile = {
    type: TILE_TYPES.BISHOP_SPEAR,
    uses: 3,
    name: 'Bishop Spear'
};
```

### ❌ Wrong: Untyped Object Creation

```typescript
// Don't do this:
const tile = {
    type: TILE_TYPES.BOMB,
    // Missing required properties!
};

// Or this:
const tile: any = {
    type: TILE_TYPES.BOMB,
    actionsSincePlaced: 0
    // TypeScript won't catch missing justPlaced!
};
```

## Zone Data Patterns

### ✅ Correct: Strict Zone Data

```typescript
import { StrictZoneData, StrictGrid } from '@types/StrictTypes';

function saveZone(zoneData: StrictZoneData) {
    // TypeScript knows exact structure
    const grid: StrictGrid = zoneData.grid;
    const enemies = zoneData.enemies; // Array of SavedEnemyData
    const discovered = zoneData.discovered; // boolean

    // TypeScript prevents assigning unknown properties
    // zoneData.unknownProp = 123; // Error!
}

function loadZone(): StrictZoneData {
    return {
        grid: [], // StrictGrid
        enemies: [
            {
                x: 5,
                y: 10,
                enemyType: 'lizardy',
                health: 10,
                id: 'enemy-1'
            }
        ],
        discovered: false
    };
}
```

## Common Patterns

### Pattern 1: Array Operations with Type Safety

```typescript
const enemies: StrictEnemy[] = getEnemies();

// Filter by type with autocomplete
const lizardies = enemies.filter(e => e.enemyType === 'lizardy') as LizardyEnemy[];

// TypeScript knows lizardies[0] has scale property
if (lizardies.length > 0) {
    console.log(lizardies[0].scale);
}
```

### Pattern 2: Grid Iteration

```typescript
function processGrid(grid: StrictGrid) {
    for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[y].length; x++) {
            const tile: StrictTile = grid[y][x];

            if (isBombTile(tile)) {
                handleBomb(tile, x, y);
            }
        }
    }
}
```

### Pattern 3: Converting Legacy Types

```typescript
import { assertStrictEnemy } from '@types/StrictTypes';

function convertLegacyEnemy(legacyEnemy: any): StrictEnemy {
    // Validates and throws if invalid
    return assertStrictEnemy(legacyEnemy);
}
```

## Helper Functions Available

### Enemy Helpers
- `isStrictEnemy(obj: unknown): obj is StrictEnemy` - Type guard
- `getEnemyPoints(enemyType: string): number` - Get points for enemy type
- `assertStrictEnemy(enemy: any): StrictEnemy` - Validate and convert

### Tile Helpers
- `isTileObject(tile: StrictTile): tile is StrictTileObject` - Check if tile is object
- `isBombTile(tile: StrictTile): tile is BombTile` - Check if bomb
- `isFoodTile(tile: StrictTile): tile is FoodTile` - Check if food
- `isToolTile(tile: StrictTile): tile is ToolTile` - Check if tool
- `isSignTile(tile: StrictTile): tile is SignTile` - Check if sign

## Migration from Legacy Types

### Step 1: Change Import
```typescript
// Before
import { TileObject } from '@types/game';

// After
import { StrictTileObject } from '@types/StrictTypes';
```

### Step 2: Add Type Guards
```typescript
// Before
function handleTile(tile: TileObject) {
    if (tile.actionsSincePlaced !== undefined) {
        // Handle bomb
    }
}

// After
function handleTile(tile: StrictTileObject) {
    if (isBombTile(tile)) {
        // TypeScript knows tile is BombTile
        console.log(tile.actionsSincePlaced);
    }
}
```

### Step 3: Use Discriminated Unions
```typescript
// Before
function getEnemyHealth(enemy: any): number {
    return enemy.health || 0;
}

// After
function getEnemyHealth(enemy: StrictEnemy): number {
    return enemy.health; // TypeScript knows this exists
}
```

## Common Mistakes to Avoid

### ❌ Mistake 1: Forgetting Type Guards
```typescript
// Wrong - TypeScript doesn't know if tile is an object
function process(tile: StrictTile) {
    console.log(tile.type); // Error: Property 'type' does not exist
}

// Right - Use type guard
function process(tile: StrictTile) {
    if (isTileObject(tile)) {
        console.log(tile.type); // OK
    }
}
```

### ❌ Mistake 2: Using 'any' for Convenience
```typescript
// Wrong - defeats the purpose of strict types
function process(data: any) {
    // Lost all type safety!
}

// Right - use unknown and narrow
function process(data: unknown) {
    if (isStrictEnemy(data)) {
        // Now we have type safety
    }
}
```

### ❌ Mistake 3: Not Handling All Cases
```typescript
// Wrong - doesn't handle all tile types
function process(tile: StrictTileObject) {
    if (isBombTile(tile)) {
        handleBomb(tile);
    }
    // What about other tile types?
}

// Right - handle all cases or use default
function process(tile: StrictTileObject) {
    if (isBombTile(tile)) {
        handleBomb(tile);
    } else if (isFoodTile(tile)) {
        handleFood(tile);
    } else {
        handleGeneric(tile);
    }
}
```

## Benefits Summary

✅ **Autocomplete**: IDE shows only valid properties
✅ **Type Safety**: Compile-time error checking
✅ **Refactoring**: Rename/move properties safely
✅ **Documentation**: Types serve as documentation
✅ **Debugging**: Catch errors before runtime

## See Also

- [TYPE_DEFINITIONS_REFACTORING.md](TYPE_DEFINITIONS_REFACTORING.md) - Full refactoring details
- [StrictTypes.ts](../src/types/StrictTypes.ts) - Type definitions source
