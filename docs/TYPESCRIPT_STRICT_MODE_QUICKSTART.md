# TypeScript Strict Mode Migration - Quick Start Guide

## Overview

This project is incrementally migrating to TypeScript strict mode to improve type safety and catch more bugs at compile time.

**Current Status:** Planning Phase
**Estimated Duration:** 10-12 weeks
**Current Errors (Lenient Mode):** 619 errors
**Estimated Errors (Strict Mode):** ~2,000-2,500 errors

## Quick Commands

```bash
# Show current error summary and strict mode estimates
npm run ts:strict-errors

# Show migration progress
npm run ts:strict-progress

# Find good files to migrate next
npm run ts:strict-candidates

# Check current errors
npm run type-check

# Check what errors you'd get with full strict mode
npm run ts:check-strict

# Check what errors you'd get with just noImplicitAny
npm run ts:check-no-implicit-any

# Check what errors you'd get with just strictNullChecks
npm run ts:check-strict-null
```

## Migration Phases

### Phase 1: Fix Foundation (Current Phase)
**Goal:** Fix the 619 existing errors in lenient mode

**Top Priority Issues:**
1. GameContext vs GameInstance type incompatibility (~126 errors)
2. Property override conflicts in GameContextCore (~8 errors)
3. Missing property issues (~82 errors)

**Timeline:** 3-4 weeks

### Phase 2: Incremental File Migration
**Goal:** Migrate files one at a time to strict mode

**Order:**
1. Type definition files (`src/types/**/*.ts`)
2. Utility files (`src/utils/**/*.ts`)
3. Core domain logic (`src/core/**/*.ts`, `src/entities/**/*.ts`)
4. Managers and services (`src/managers/**/*.ts`)
5. UI and controllers (`src/ui/**/*.ts`, `src/controllers/**/*.ts`)

**Timeline:** 5-6 weeks

### Phase 3: Enable Global Strict Mode
**Goal:** Enable strict mode globally in tsconfig.json

**Order:**
1. `noImplicitAny`
2. `strictFunctionTypes`
3. `strictBindCallApply`
4. `strictNullChecks`
5. `strictPropertyInitialization`
6. Additional checks (`noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`)
7. `strict: true`

**Timeline:** 2-3 weeks

## How to Contribute to the Migration

### 1. Find a File to Migrate

```bash
npm run ts:strict-candidates
```

This will show you small, low-complexity files that are good candidates for migration.

### 2. Check the File

```bash
node scripts/typescript-migration-helper.js check-file src/utils/YourFile.ts
```

This shows you how many errors the file would have with different strict settings.

### 3. Fix the Errors

Common fixes needed:

#### Add explicit types (noImplicitAny)
```typescript
// Before
function processData(data) {
  return data.value;
}

// After
function processData(data: DataType): number {
  return data.value;
}
```

#### Handle null/undefined (strictNullChecks)
```typescript
// Before
function getName(user) {
  return user.name.toUpperCase();
}

// After
function getName(user: User | null): string {
  return user?.name?.toUpperCase() ?? 'Unknown';
}
```

#### Initialize class properties (strictPropertyInitialization)
```typescript
// Before
class Game {
  private player: Player;
}

// After
class Game {
  private player: Player | null = null;
  // or
  private player!: Player; // definite assignment assertion
}
```

### 4. Test Your Changes

```bash
# Run type check
npm run type-check

# Run tests
npm test

# Run the game
npm run dev
```

### 5. Commit Your Changes

```bash
git add .
git commit -m "refactor: migrate YourFile.ts to strict mode"
```

## Best Practices

### DO:
- ✅ Migrate small files first to build momentum
- ✅ Fix one file at a time
- ✅ Add tests when fixing reveals bugs
- ✅ Use type inference when obvious
- ✅ Use utility types (`Partial<T>`, `Required<T>`, `Pick<T>`)
- ✅ Use optional chaining (`?.`) and nullish coalescing (`??`)

### DON'T:
- ❌ Use `any` as an escape hatch (use `unknown` instead)
- ❌ Overuse `as` type assertions
- ❌ Overuse `!` non-null assertions
- ❌ Migrate too many files at once
- ❌ Use `@ts-ignore` without a comment explaining why

## Common Error Codes

| Code | Description | Common Fix |
|------|-------------|------------|
| TS7006 | Parameter implicitly has any | Add type annotation |
| TS7018 | Variable implicitly has any | Add type annotation |
| TS2345 | Argument type mismatch | Fix type or add type guard |
| TS2322 | Type assignment mismatch | Fix type or use type assertion |
| TS2339 | Property does not exist | Add property or use optional chaining |
| TS2532 | Object is possibly undefined | Add null check or use `?.` |
| TS2531 | Object is possibly null | Add null check or use `?.` |
| TS2564 | Property has no initializer | Initialize in constructor or use `!` |

## Resources

- [Full Migration Plan](./TYPESCRIPT_STRICT_MODE_MIGRATION.md)
- [Current Error Analysis](./TYPESCRIPT_ERROR_ANALYSIS.md)
- [TypeScript Handbook: Strict Mode](https://www.typescriptlang.org/docs/handbook/2/basic-types.html#strictness)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)

## Getting Help

- Read the [full migration plan](./TYPESCRIPT_STRICT_MODE_MIGRATION.md)
- Check the [error analysis](./TYPESCRIPT_ERROR_ANALYSIS.md)
- Use the helper script: `npm run ts:strict-errors`

## Progress Tracking

Check current progress:
```bash
npm run ts:strict-progress
```

## Next Steps

1. **Read the full migration plan**: [TYPESCRIPT_STRICT_MODE_MIGRATION.md](./TYPESCRIPT_STRICT_MODE_MIGRATION.md)
2. **Review error analysis**: [TYPESCRIPT_ERROR_ANALYSIS.md](./TYPESCRIPT_ERROR_ANALYSIS.md)
3. **Start fixing foundation errors**: Focus on the top issues in error analysis
4. **Begin file migration**: Use `npm run ts:strict-candidates` to find good starting points

---

**Last Updated:** 2025-11-07
**Status:** Ready to begin Phase 1
