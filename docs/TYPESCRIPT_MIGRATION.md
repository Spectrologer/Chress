# TypeScript Migration Guide

This document outlines the incremental approach to migrating the Chress codebase from JavaScript to TypeScript.

## Overview

The migration strategy is designed to be **incremental and non-disruptive**, allowing you to:
- Continue developing features while migration is in progress
- Add type safety gradually without breaking existing code
- Get immediate benefits from TypeScript's type checking in JavaScript files
- Migrate files one at a time at your own pace

## Setup Complete

The following has been configured:

### 1. TypeScript Installation
- TypeScript and `@types/node` installed as dev dependencies
- Version: TypeScript 5.9.3

### 2. Configuration (`tsconfig.json`)
The configuration is intentionally **lenient** to start with:
- `allowJs: true` - JavaScript files are allowed
- `checkJs: false` - JS files aren't checked by default (opt-in per file)
- `noEmit: true` - Only type checking, no compilation
- `strict: false` - Strict mode disabled initially
- All strict options can be enabled gradually

### 3. NPM Scripts Added
```bash
npm run type-check         # Check types once
npm run type-check:watch   # Check types in watch mode
```

## Migration Approach

### Phase 1: JSDoc Type Annotations (Current)

Start by adding JSDoc comments to existing JavaScript files. This provides:
- IntelliSense/autocomplete in VS Code
- Type checking when `// @ts-check` is added
- Documentation for other developers
- Zero runtime overhead

#### Example: `tools/asset-scanner.js`

This file has been migrated as a template:

```javascript
// @ts-check  <-- Enables TypeScript checking for this file

/**
 * @typedef {Object} AssetCategory
 * @property {string} asset - The asset path
 * @property {string} name - The display name
 * @property {string} path - The full path to the asset
 */

export class AssetScanner {
    constructor() {
        /** @type {AssetCategories} */
        this.categories = { /* ... */ };

        /** @type {Record<string, NPCInfo>} */
        this.npcData = {};
    }

    /**
     * Scan and categorize all game assets
     * @param {string} path - The asset path
     * @returns {Promise<AssetCategories>} The categorized assets
     */
    async scanAssets(path) {
        // ...
    }
}
```

#### Benefits of JSDoc Phase:
- ✅ Immediate type checking in IDE
- ✅ Better autocomplete
- ✅ Catches type errors before runtime
- ✅ No build process changes needed
- ✅ Works with existing tooling
- ✅ Can be done file-by-file

### Phase 2: Gradual `.ts` Migration (Future)

When ready, convert individual files to TypeScript:

1. **Start with utility files** - Pure functions with no dependencies
   - `src/utils/*.js` → `src/utils/*.ts`

2. **Move to core modules** - Foundational classes
   - Type definitions for game entities
   - Configuration files

3. **Convert managers and services**
   - State management
   - Business logic

4. **Migrate UI and rendering** - Last, as they're most complex
   - Renderers
   - UI components

### Phase 3: Enable Strict Mode (Future)

Gradually enable TypeScript's strict options in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,              // Enable all strict checks
    "noImplicitAny": true,       // Disallow implicit 'any'
    "strictNullChecks": true,    // Strict null checking
    "noUnusedLocals": true,      // Error on unused variables
    "noUnusedParameters": true,  // Error on unused parameters
    // ... etc
  }
}
```

## How to Migrate a File

### Step 1: Add `@ts-check`
```javascript
// @ts-check
// Your existing code...
```

### Step 2: Run Type Check
```bash
npm run type-check
```

### Step 3: Add Type Annotations
Add JSDoc comments for function parameters and return types:

```javascript
/**
 * Calculate damage for an attack
 * @param {number} attackPower - The attacker's power
 * @param {number} defense - The defender's defense
 * @param {boolean} [isCritical=false] - Whether it's a critical hit
 * @returns {number} The calculated damage
 */
function calculateDamage(attackPower, defense, isCritical = false) {
    // ...
}
```

### Step 4: Define Complex Types
Use `@typedef` for object shapes:

```javascript
/**
 * @typedef {Object} Enemy
 * @property {string} id - Unique identifier
 * @property {string} name - Enemy name
 * @property {number} hp - Current hit points
 * @property {number} maxHp - Maximum hit points
 * @property {{x: number, y: number}} position - Grid position
 */

/**
 * @param {Enemy} enemy - The enemy to update
 * @returns {void}
 */
function updateEnemy(enemy) {
    // TypeScript now knows the shape of 'enemy'
}
```

### Step 5: Handle Type Errors
Fix any type errors that appear, or use escape hatches:

```javascript
// Temporary escape hatch (use sparingly)
// @ts-ignore
const value = someComplexLegacyCode();

// Better: Cast to 'any' with a TODO comment
/** @type {any} */ // TODO: Add proper types
const value = someComplexLegacyCode();
```

## Common JSDoc Patterns

### Arrays
```javascript
/** @type {string[]} */
const names = [];

/** @type {Array<{id: number, name: string}>} */
const items = [];
```

### Union Types
```javascript
/**
 * @param {string | number} id - Can be string or number
 * @returns {boolean}
 */
function exists(id) { /* ... */ }
```

### Optional Parameters
```javascript
/**
 * @param {string} name - Required name
 * @param {number} [age] - Optional age
 * @param {boolean} [isActive=true] - Optional with default
 */
function createUser(name, age, isActive = true) { /* ... */ }
```

### Callbacks
```javascript
/**
 * @callback UpdateCallback
 * @param {number} progress - Progress from 0 to 1
 * @returns {void}
 */

/**
 * @param {UpdateCallback} onUpdate - Called with progress
 */
function processData(onUpdate) { /* ... */ }
```

### Importing Types
```javascript
/**
 * @typedef {import('./types.js').GameState} GameState
 */

/**
 * @param {GameState} state
 */
function updateState(state) { /* ... */ }
```

## Recommended Migration Order

Based on the codebase structure:

### Priority 1: High-value, low-risk
- ✅ `tools/asset-scanner.js` (DONE - use as template)
- `src/utils/TypeChecks.js`
- `src/utils/GridUtils.js`
- `src/utils/TileUtils.js`
- `src/utils/ZoneKeyUtils.js`

### Priority 2: Core domain logic
- `src/enemy/MoveCalculators/*.js`
- `src/managers/inventory/effects/*.js`
- `src/facades/*.js`

### Priority 3: Complex systems
- `src/managers/*.js`
- `src/renderers/strategies/*.js`
- `src/renderers/*.js`

## Tips and Best Practices

### DO:
- ✅ Start with files that have clear inputs/outputs
- ✅ Add types to public APIs first (exported functions/classes)
- ✅ Use `@typedef` for reusable type definitions
- ✅ Document as you type - good JSDoc is good documentation
- ✅ Run `npm run type-check` frequently
- ✅ Commit files as you migrate them (one file per commit is fine)

### DON'T:
- ❌ Try to migrate everything at once
- ❌ Add types just for the sake of it - focus on value
- ❌ Use `any` everywhere (defeats the purpose)
- ❌ Let perfect be the enemy of good - incremental progress is great
- ❌ Break working code to add types

## VS Code Integration

VS Code will automatically:
- Show type errors inline for files with `@ts-check`
- Provide IntelliSense based on JSDoc comments
- Show parameter hints and documentation
- Offer quick fixes for common type errors

### Enable Type Checking for a Workspace

Add to `.vscode/settings.json`:
```json
{
  "js/ts.implicitProjectConfig.checkJs": true
}
```

This enables `@ts-check` behavior for ALL JavaScript files by default.

## Measuring Progress

Track your migration progress:

```bash
# Count files with @ts-check
grep -r "// @ts-check" src/ | wc -l

# Count total JS files
find src/ -name "*.js" | wc -l

# Count TS files
find src/ -name "*.ts" | wc -l
```

## Rollback Strategy

If issues arise:
1. Remove `// @ts-check` from problematic files
2. Disable type checking temporarily: `"checkJs": false` in tsconfig
3. Files can always stay as JavaScript - no pressure to convert

## Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [JSDoc Reference](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html)
- [TypeScript Migration Guide](https://www.typescriptlang.org/docs/handbook/migrating-from-javascript.html)

## Next Steps

1. **Try it out**: Add `@ts-check` to a utility file and see what errors appear
2. **Fix low-hanging fruit**: Add simple type annotations to fix obvious issues
3. **Iterate**: Do a little bit each week - no rush
4. **Share learnings**: Update this doc with patterns you discover

---

**Remember**: The goal is better code, not perfect types. Even partial typing provides value!
