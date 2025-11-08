# TypeScript Error Analysis

**Generated:** 2025-11-07
**Total Errors (Lenient Mode):** 619

## Error Breakdown by Type

| Error Code | Count | Description | Priority |
|------------|-------|-------------|----------|
| TS2345 | 126 | Argument type mismatch | HIGH |
| TS2339 | 82 | Property does not exist | HIGH |
| TS2322 | 50 | Type assignment mismatch | HIGH |
| TS5097 | 19 | Import declaration conflicts | MEDIUM |
| TS2307 | 19 | Cannot find module | MEDIUM |
| TS2352 | 15 | Conversion may be a mistake | LOW |
| TS2341 | 13 | Property is private | MEDIUM |
| TS2740 | 11 | Type is missing properties | HIGH |
| TS2611 | 8 | Property override conflict | HIGH |
| TS2554 | 7 | Expected arguments count mismatch | MEDIUM |

## Critical Issues to Fix First

### 1. GameContext vs GameInstance Type Incompatibility (TS2345, TS2322)

**Affected Files:**
- `src/controllers/GestureDetector.ts`
- `src/controllers/InputController.ts`
- `src/controllers/InputCoordinator.ts`
- `src/controllers/KeyboardHandler.ts`
- `src/core/context/GameContextCore.ts`

**Root Cause:**
`GameContext` is not assignable to `GameInstance` due to:
- `zoneManager` type mismatch
- `zones` property incompatibility (ZoneFacade vs Map)

**Example Error:**
```
error TS2345: Argument of type 'GameContext' is not assignable to parameter of type 'IGame'.
  Types of property 'zones' are incompatible.
    Type 'ZoneFacade' is missing the following properties from type 'Map<string, any>': clear, delete, forEach, get, and 8 more.
```

**Recommended Fix:**
1. Unify `GameContext` and `GameInstance` type definitions
2. Make `zones` property consistent (use ZoneFacade everywhere or Map everywhere)
3. Update `IGame` interface to match actual implementation

### 2. Property Override Conflicts (TS2611)

**Affected Files:**
- `src/core/context/GameContextCore.ts` (8 occurrences)

**Properties Affected:**
- `renderManager`
- `combatManager`
- `interactionManager`
- `zoneManager`
- `actionManager`
- `turnManager`
- `gameStateManager`
- `gameInitializer`

**Root Cause:**
Properties defined in base class `GameContextCommands` are overridden as accessors (getters) in `GameContext`.

**Example Error:**
```
error TS2611: 'renderManager' is defined as a property in class 'GameContextCommands',
but is overridden here in 'GameContext' as an accessor.
```

**Recommended Fix:**
Choose one approach consistently:
- **Option A:** Make all properties in base class (remove getters in subclass)
- **Option B:** Make all getters in both classes
- **Option C:** Use protected properties in base, public getters in subclass

### 3. Private Property Access (TS2341)

**Affected Files:**
- `src/controllers/PathfindingController.ts`

**Root Cause:**
Attempting to access `AnimationSequence.id` which is private.

**Example Error:**
```
error TS2341: Property 'id' is private and only accessible within class 'AnimationSequence'.
```

**Recommended Fix:**
- Make `id` property `public` or `protected`
- Or add a public getter: `get id() { return this._id; }`

### 4. Missing TILE_SIZE Property (TS2339)

**Affected Files:**
- `src/controllers/GestureDetector.ts`

**Root Cause:**
`GameContext` doesn't have a `TILE_SIZE` property.

**Example Error:**
```
error TS2339: Property 'TILE_SIZE' does not exist on type 'GameContext'.
```

**Recommended Fix:**
- Add `TILE_SIZE` property to `GameContext`
- Or import from constants: `import { TILE_SIZE } from '@core/constants'`

### 5. Type Definition vs Implementation Mismatch

**Affected Files:**
- `src/core/context/GameFacades.ts`

**Root Cause:**
`Item` type not assignable to `InventoryItem` - type unions too narrow.

**Example Error:**
```
error TS2345: Argument of type 'Item' is not assignable to parameter of type 'InventoryItem'.
  Type 'Item' is not assignable to type 'ShovelItem'.
```

**Recommended Fix:**
- Make `InventoryItem` type more permissive
- Use proper type guards before passing items
- Refactor item type hierarchy

## Strict Mode Error Estimates

When strict mode is enabled:

| Strict Check | Estimated Errors | Impact |
|--------------|------------------|--------|
| `noImplicitAny` | ~1,358 | Very High |
| `strictNullChecks` | ~400-600 | High |
| `strictFunctionTypes` | ~50-100 | Medium |
| `strictBindCallApply` | ~20-40 | Low |
| `strictPropertyInitialization` | ~100-200 | Medium |

**Total estimated strict mode errors:** ~2,000-2,500

## Migration Strategy

### Phase 1: Fix Foundation (BEFORE enabling strict mode)

Fix these 619 errors in lenient mode first:

1. **Week 1: Type Compatibility Issues**
   - Fix GameContext/GameInstance incompatibility
   - Unify zone-related types
   - Fix property override conflicts

2. **Week 2: Type Definitions**
   - Fix Item/InventoryItem type hierarchy
   - Add missing properties (TILE_SIZE, etc.)
   - Fix private property access issues

3. **Week 3: Import and Module Issues**
   - Fix TS2307 (cannot find module) errors
   - Resolve TS5097 (import conflicts)
   - Clean up import statements

### Phase 2: Enable Strict Mode Incrementally

See [TYPESCRIPT_STRICT_MODE_MIGRATION.md](./TYPESCRIPT_STRICT_MODE_MIGRATION.md) for detailed plan.

## Quick Wins

These files have few/no errors and can be migrated to strict mode immediately:

```bash
# Run this to find good candidates:
node scripts/typescript-migration-helper.js candidates
```

Good starting points:
- Small utility files in `src/utils/`
- Type definition files in `src/types/`
- Constant files in `src/core/constants/`

## Helper Scripts

Use the migration helper script:

```bash
# Show current error summary
node scripts/typescript-migration-helper.js errors

# Show migration progress
node scripts/typescript-migration-helper.js progress

# Find good files to migrate next
node scripts/typescript-migration-helper.js candidates

# Check a specific file
node scripts/typescript-migration-helper.js check-file src/utils/GridIterator.ts
```

## Next Steps

1. ✅ **Created migration documentation**
2. ✅ **Created helper scripts**
3. ⏳ **Fix foundation errors (619 errors in lenient mode)**
4. ⏳ **Start incremental strict mode migration**
5. ⏳ **Enable global strict mode**

---

**Status:** Ready to begin Phase 1 (Foundation fixes)
**Estimated Timeline:** 10-12 weeks for full strict mode migration
