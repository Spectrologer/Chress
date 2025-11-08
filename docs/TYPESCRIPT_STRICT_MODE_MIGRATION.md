# TypeScript Strict Mode Migration Strategy

## Current State

- **Total TypeScript files**: 298 files in `src/`
- **Current errors** (lenient mode): 619 errors
- **`noImplicitAny` errors**: 1,358 errors
- **All strict flags**: Currently disabled

## Migration Strategy

We'll use a **gradual, incremental approach** to enable strict mode without blocking development.

### Approach: Per-File Strict Mode Migration

Instead of enabling strict mode globally (which would create 1,358+ errors), we'll:

1. **Keep global strict mode disabled** in `tsconfig.json`
2. **Enable strict mode per-file** using `// @ts-check` comments
3. **Migrate files incrementally** starting with:
   - New files (should be strict by default)
   - Recently refactored files
   - Core type definition files
   - High-impact utility files

4. **Once 80%+ of files are migrated**, flip the global switch and fix remaining files

### Phase 1: Foundation (Week 1-2)

#### 1.1 Fix Existing Type Errors
Before enabling any strict checks, fix the current 619 errors in lenient mode.

**Priority areas:**
- Type inconsistencies (GameContext vs GameInstance)
- Property accessor conflicts (renderManager, combatManager, etc.)
- Index signature issues (ZoneManager)

#### 1.2 Set Up Strict Mode Infrastructure
- Create helper scripts for migration
- Document common patterns and fixes
- Set up ESLint rules to prevent regression

### Phase 2: Incremental File Migration (Week 3-8)

Migrate files in this order:

#### 2.1 Type Definition Files (Week 3)
Migrate all `.d.ts` and type-only files first:
- `src/types/**/*.ts`
- Core type definitions

**Why first:** These files have fewer implementation details and set the foundation.

#### 2.2 Utility Files (Week 4)
- `src/utils/**/*.ts`
- `src/core/constants/**/*.ts`
- Pure functions with clear inputs/outputs

**Why second:** Small, focused files with clear contracts.

#### 2.3 Core Domain Logic (Week 5-6)
- `src/core/**/*.ts` (excluding managers)
- `src/entities/**/*.ts`
- `src/enemy/**/*.ts`

**Why third:** Core business logic should be type-safe.

#### 2.4 Managers and Services (Week 7)
- `src/managers/**/*.ts`
- `src/services/**/*.ts`
- More complex files with dependencies

#### 2.5 UI and Controllers (Week 8)
- `src/ui/**/*.ts`
- `src/controllers/**/*.ts`
- `src/renderers/**/*.ts`
- Often the most complex due to DOM/event handling

### Phase 3: Global Strict Mode (Week 9-10)

#### 3.1 Enable Global Flags Incrementally

Enable one flag at a time, fix all errors, then move to the next:

1. **`noImplicitAny`** (Usually 40-60% of strict errors)
   - Add explicit types to all function parameters
   - Type all variables without initializers
   - Add return types to functions

2. **`strictFunctionTypes`** (Usually 5-10% of errors)
   - Fix contravariant parameter types
   - Usually minimal impact

3. **`strictBindCallApply`** (Usually <5% of errors)
   - Type-safe `.bind()`, `.call()`, `.apply()`
   - Usually minimal impact

4. **`strictNullChecks`** (Usually 30-40% of errors, most impactful)
   - Handle `null` and `undefined` explicitly
   - Add null checks before accessing properties
   - Use optional chaining (`?.`) and nullish coalescing (`??`)
   - Use non-null assertions (`!`) sparingly

5. **`strictPropertyInitialization`** (Usually 10-15% of errors)
   - Initialize all class properties
   - Use definite assignment assertions (`!`) when necessary
   - Prefer constructor initialization

6. **Additional Checks**
   - `noUnusedLocals`: Remove unused variables
   - `noUnusedParameters`: Remove unused parameters or prefix with `_`
   - `noImplicitReturns`: Ensure all code paths return a value

7. **Enable `strict: true`**
   - Remove individual flags
   - All strict checks now enabled

#### 3.2 Final Cleanup
- Remove per-file strict comments
- Update documentation
- Set up pre-commit hooks to prevent regression

## Per-File Migration Process

### Adding Strict Mode to a File

Add this comment at the top of the file:

```typescript
// @ts-strict
```

Or for more granular control:

```typescript
// Enable specific strict checks
"use strict";
```

### Common Fixes

#### 1. noImplicitAny

**Before:**
```typescript
function processData(data) {
  return data.map(item => item.value);
}
```

**After:**
```typescript
function processData(data: Array<{value: number}>): number[] {
  return data.map((item: {value: number}) => item.value);
}
```

#### 2. strictNullChecks

**Before:**
```typescript
function getName(user) {
  return user.name.toUpperCase();
}
```

**After:**
```typescript
function getName(user: User | null): string {
  return user?.name?.toUpperCase() ?? 'Unknown';
}
```

#### 3. strictPropertyInitialization

**Before:**
```typescript
class Game {
  private player: Player;

  init() {
    this.player = new Player();
  }
}
```

**After:**
```typescript
class Game {
  private player!: Player; // Definite assignment assertion

  init() {
    this.player = new Player();
  }
}
```

Or better:

```typescript
class Game {
  private player: Player;

  constructor() {
    this.player = new Player();
  }
}
```

## Automation Scripts

### Script 1: Count Errors Per Flag

```bash
# Check errors for each strict flag
echo "noImplicitAny errors:"
npx tsc --noEmit --noImplicitAny 2>&1 | grep -c "error TS7"

echo "strictNullChecks errors:"
npx tsc --noEmit --strictNullChecks 2>&1 | grep -c "error TS2"
```

### Script 2: Find Easiest Files to Migrate

```bash
# Find small utility files (good candidates for early migration)
find src/utils -name "*.ts" -exec wc -l {} \; | sort -n | head -20
```

### Script 3: Check Migration Progress

```bash
# Count files with strict mode enabled
grep -r "@ts-strict" src/ | wc -l
```

## Metrics and Goals

### Success Metrics

- **Week 4**: 25% of files strict-mode compliant
- **Week 6**: 50% of files strict-mode compliant
- **Week 8**: 75% of files strict-mode compliant
- **Week 10**: 100% of files strict-mode compliant, global strict mode enabled

### Quality Gates

Before enabling global strict mode:
- All tests passing
- No regression in functionality
- Code review for major type changes
- Documentation updated

## Best Practices During Migration

### DO:
- ✅ Migrate files in small, focused PRs
- ✅ Add tests when fixing type errors reveals bugs
- ✅ Use type inference when obvious
- ✅ Use utility types (`Partial<T>`, `Required<T>`, `Pick<T>`, etc.)
- ✅ Document complex type decisions
- ✅ Use type guards for runtime checks

### DON'T:
- ❌ Use `any` as an escape hatch (use `unknown` if necessary)
- ❌ Overuse `as` type assertions
- ❌ Overuse `!` non-null assertions
- ❌ Migrate too many files at once
- ❌ Ignore type errors with `@ts-ignore` without comments

## Common Patterns in This Codebase

Based on initial analysis, expect to fix:

### 1. Game Context Type Issues
The `GameContext` vs `GameInstance` type incompatibility affects many files.

**Solution:** Unify these types or create proper type hierarchies.

### 2. Manager Property Overrides
Property/accessor conflicts in manager classes.

**Solution:** Use consistent pattern (all properties or all getters).

### 3. Zone Manager Index Signatures
Missing index signatures in ZoneManager.

**Solution:** Add proper index signature or use Map instead.

### 4. Animation Sequence Privacy
Private property access in AnimationSequence.

**Solution:** Add public accessor or make property protected.

## Resources

- [TypeScript Handbook: Strict Mode](https://www.typescriptlang.org/docs/handbook/2/basic-types.html#strictness)
- [TypeScript Deep Dive: Migrating from JS](https://basarat.gitbook.io/typescript/type-system)
- [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)

## Migration Log

Track progress here:

- [ ] Phase 1: Foundation (Fix existing 619 errors)
- [ ] Phase 2.1: Type definition files
- [ ] Phase 2.2: Utility files
- [ ] Phase 2.3: Core domain logic
- [ ] Phase 2.4: Managers and services
- [ ] Phase 2.5: UI and controllers
- [ ] Phase 3.1: Enable noImplicitAny globally
- [ ] Phase 3.2: Enable strictFunctionTypes globally
- [ ] Phase 3.3: Enable strictBindCallApply globally
- [ ] Phase 3.4: Enable strictNullChecks globally
- [ ] Phase 3.5: Enable strictPropertyInitialization globally
- [ ] Phase 3.6: Enable additional checks
- [ ] Phase 3.7: Enable strict: true

---

**Last Updated:** 2025-11-07
**Status:** Planning Phase
