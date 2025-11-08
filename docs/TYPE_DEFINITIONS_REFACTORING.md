# Type Definitions Refactoring - Eliminating Index Signatures

## Problem Statement

The codebase suffered from severe type safety issues due to excessive use of `[key: string]: unknown` and `[key: string]: any` index signatures. This undermined TypeScript's type checking and made it impossible to catch errors at compile time.

### Key Issues Identified

1. **Promiscuous Index Signatures** - Multiple critical interfaces had `[key: string]: unknown`:
   - `TileObject` ([game.ts:23](src/types/game.ts#L23))
   - `ZoneData` ([game.ts:31](src/types/game.ts#L31))
   - `NPC` ([game.ts:40](src/types/game.ts#L40))
   - `BaseItem` and `Item` ([game.ts:135,155](src/types/game.ts#L135))
   - `GameInstance` ([game.ts:175](src/types/game.ts#L175))
   - `BaseEnemy` class ([BaseEnemy.ts:17](src/enemy/BaseEnemy.ts#L17))

2. **Multiple Conflicting Type Definitions** - Same types defined in multiple files:
   - `TileObject` in [game.ts](src/types/game.ts), [core.ts](src/types/core.ts), [SharedTypes.ts](src/core/SharedTypes.ts), [TypeChecks.ts](src/utils/TypeChecks.ts)
   - `Enemy` types scattered across multiple files without proper discriminated unions
   - No single source of truth

3. **Type Conversion Errors** - The type system couldn't prevent invalid conversions:
   ```
   error TS2352: Conversion of type '{ [key: string]: unknown; type: number; }'
   to type 'BombTile' may be a mistake
   ```

## Solution: Discriminated Unions and Strict Types

### 1. Created New Strict Types ([StrictTypes.ts](src/types/StrictTypes.ts))

This new file provides:

#### Enemy Discriminated Unions
```typescript
type StrictEnemy =
    | LizardyEnemy    // enemyType: 'lizardy'
    | LizardoEnemy    // enemyType: 'lizardo'
    | LizardeauxEnemy // enemyType: 'lizardeaux'
    | LizordEnemy     // enemyType: 'lizord'
    | LazerdEnemy     // enemyType: 'lazerd'
    | ZardEnemy       // enemyType: 'zard'
    | GenericEnemy;   // enemyType: string (fallback)
```

**Benefits:**
- TypeScript can narrow types based on `enemyType` property
- Autocomplete works properly
- Impossible to assign wrong properties to wrong enemy types

#### Tile Discriminated Unions
```typescript
type StrictTileObject =
    | BombTile           // Has actionsSincePlaced, justPlaced
    | FoodTile           // Has foodType
    | ToolTile           // Has uses
    | SignTile           // Has message
    | EnemyTile          // Has enemyType
    | NPCTile            // Has npcType
    | ExitTile           // Has direction
    | GenericTileObject; // Basic tiles
```

**Benefits:**
- Each tile type has only the properties it needs
- Type guards (`isBombTile`, `isFoodTile`, etc.) enable safe narrowing
- Prevents assigning bomb properties to food tiles, etc.

### 2. Removed Index Signatures

#### Files Modified:

1. **[game.ts](src/types/game.ts)**
   - ✅ Removed `[key: string]: unknown` from `TileObject`
   - ✅ Removed `[key: string]: unknown` from `ZoneData`
   - ✅ Removed `[key: string]: unknown` from `NPC`
   - ✅ Removed `[key: string]: unknown` from `BaseItem` and `Item`
   - ✅ Removed `[key: string]: unknown` from `GameInstance`
   - ✅ Added explicit properties that were previously dynamic

2. **[core.ts](src/types/core.ts)**
   - ✅ Removed `[key: string]: unknown` from `SignData`
   - ✅ Removed `[key: string]: unknown` from `ItemWithIndex`
   - ✅ Removed `[key: string]: unknown` from `TileCompat`
   - ✅ Removed `[key: string]: unknown` from `EnemyCompat`

3. **[SharedTypes.ts](src/core/SharedTypes.ts)**
   - ✅ Removed `[key: string]: any` from `TileObject`
   - ✅ Replaced `any` with proper types in `SaveGameData`
   - ✅ Made `sprite` property properly typed as `string | null`

4. **[DataContracts.ts](src/core/DataContracts.ts)**
   - ✅ Removed `[key: string]: any` from `TileBase`
   - ✅ Removed `[key: string]: any` from `AnimationData`
   - ✅ Added explicit properties

5. **[BaseEnemy.ts](src/enemy/BaseEnemy.ts)**
   - ✅ Removed `[key: string]: unknown` from class
   - ✅ All properties now explicit

6. **[TypeChecks.ts](src/utils/TypeChecks.ts)**
   - ✅ Removed `[key: string]: unknown` from `Tile` type
   - ✅ Added explicit tile properties

### 3. Migration Strategy

#### For New Code
Use strict types from [StrictTypes.ts](src/types/StrictTypes.ts):
```typescript
import { StrictEnemy, StrictTileObject, StrictZoneData } from '@types/StrictTypes';

// Example: Type-safe enemy handling
function handleEnemy(enemy: StrictEnemy) {
    if (enemy.enemyType === 'lizardy') {
        // TypeScript knows this enemy has 'scale' property
        console.log(enemy.scale);
    } else if (enemy.enemyType === 'lizardeaux') {
        // TypeScript knows this enemy has 'healCooldown' property
        console.log(enemy.healCooldown);
    }
}
```

#### For Legacy Code
Legacy types remain in [game.ts](src/types/game.ts) for backward compatibility, but:
- No index signatures
- All properties are explicit
- Comments guide developers to use strict types for new code

## Results

### Before
- **Index signatures everywhere**: `[key: string]: unknown` in 7+ critical interfaces
- **Type checking broken**: TypeScript couldn't catch property mismatches
- **No type narrowing**: Discriminated unions not used
- **Multiple definitions**: Same types defined in 4+ files

### After
- ✅ **Zero index signatures** in critical types
- ✅ **Discriminated unions** for Enemy and Tile types
- ✅ **Single source of truth** for strict types ([StrictTypes.ts](src/types/StrictTypes.ts))
- ✅ **Type guards** provided for safe narrowing
- ✅ **Explicit properties** - all required properties documented

### Type Error Impact
- Previous errors related to index signature conflicts: **Eliminated**
- Remaining errors: More specific and actionable (225 total)
- Many remaining errors are unrelated to type definitions (imports, method signatures, etc.)

## Next Steps

### Immediate
1. **Gradually migrate code to use StrictTypes**
   - Start with new code
   - Refactor existing code module by module
   - Use type guards for safe narrowing

2. **Fix remaining type errors**
   - Address missing properties (`portKind` on TileObject)
   - Fix type mismatches in method signatures
   - Resolve import issues

### Long-term
1. **Complete migration to discriminated unions**
   - Replace all uses of old `TileObject` with `StrictTileObject`
   - Replace all uses of loose enemy types with `StrictEnemy`

2. **Enable stricter TypeScript settings**
   - Once discriminated unions are fully adopted
   - Enable `strictNullChecks`
   - Enable `noImplicitAny`

## Example Usage

### Before (Unsafe)
```typescript
const tile: TileObject = getTile(x, y);
// TypeScript allows ANY property access
tile.anyPropertyAtAll; // No error!
```

### After (Type-safe)
```typescript
const tile: StrictTileObject = getTile(x, y);

if (isBombTile(tile)) {
    // TypeScript knows tile has these properties
    console.log(tile.actionsSincePlaced);
    console.log(tile.justPlaced);
} else if (isFoodTile(tile)) {
    // TypeScript knows tile has foodType
    console.log(tile.foodType);
}
```

## Files Created
- ✅ [src/types/StrictTypes.ts](src/types/StrictTypes.ts) - New discriminated union types

## Files Modified
- ✅ [src/types/game.ts](src/types/game.ts)
- ✅ [src/types/core.ts](src/types/core.ts)
- ✅ [src/core/SharedTypes.ts](src/core/SharedTypes.ts)
- ✅ [src/core/DataContracts.ts](src/core/DataContracts.ts)
- ✅ [src/enemy/BaseEnemy.ts](src/enemy/BaseEnemy.ts)
- ✅ [src/utils/TypeChecks.ts](src/utils/TypeChecks.ts)

## References

### TypeScript Best Practices
- [Discriminated Unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)
- [Type Guards](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates)
- [Avoiding Index Signatures](https://www.typescriptlang.org/docs/handbook/2/objects.html#index-signatures)

### Related Documentation
- [TYPESCRIPT_STRICT_MODE_PROGRESS.md](TYPESCRIPT_STRICT_MODE_PROGRESS.md)
- [CODE_QUALITY_ANALYSIS.md](CODE_QUALITY_ANALYSIS.md)
