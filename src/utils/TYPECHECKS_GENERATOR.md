# TypeChecks.js Code Generator

## Overview

The `TypeChecks.js` file (666 lines) contains repetitive type-checking methods. Instead of manually maintaining these, we use **code generation** to automatically create all type checkers from a simple configuration.

## Benefits

### Before (Manual Maintenance)
```javascript
// Had to write ~40 nearly identical methods like this:
static isFloor(tile) {
    return TileTypeChecker.isTileType(tile, TILE_TYPES.FLOOR);
}

static isWall(tile) {
    return TileTypeChecker.isTileType(tile, TILE_TYPES.WALL);
}
// ... 38 more similar methods

// Plus ~70 lines of backward compatibility exports:
export const isFloor = TileTypeChecker.isFloor.bind(TileTypeChecker);
export const isWall = TileTypeChecker.isWall.bind(TileTypeChecker);
// ... 68 more
```

### After (Generated)
```javascript
// Just add one line to the configuration:
const TILE_TYPE_CHECKERS = {
    isFloor: 'FLOOR',
    isWall: 'WALL',
    // ... simple key-value pairs
};

// Run: node utils/generateTypeChecks.js
// All methods and exports are generated automatically!
```

## How to Use

### Adding a New Tile Type

1. Open `utils/generateTypeChecks.js`
2. Add your type to the appropriate configuration object:

```javascript
const TILE_TYPE_CHECKERS = {
    // ... existing types
    isNewTileType: 'NEW_TILE_TYPE',  // Add this line
};
```

3. Run the generator:
```bash
node utils/generateTypeChecks.js
```

4. Test the generated code:
```bash
node utils/test-typechecks.js
```

### Adding a New Entity Type

```javascript
const ENTITY_TYPE_CHECKERS = {
    // ... existing entities
    isNewNPC: 'NEW_NPC',  // Add this line
};
```

### Adding a New Category Checker

For tile categories:
```javascript
const TILE_CATEGORY_CHECKERS = {
    // ... existing categories
    isCraftable: {
        description: 'Checks if a tile can be crafted.',
        types: ['WOOD', 'STONE', 'METAL']
    },
};
```

For entity categories:
```javascript
const ENTITY_CATEGORY_CHECKERS = {
    // ... existing categories
    isBoss: {
        description: 'Checks if an entity is a boss.',
        types: ['DRAGON', 'DEMON_LORD']
    },
};
```

### Adding Combined Checkers

```javascript
const COMBINED_CHECKERS = {
    isInteractive: {
        description: 'Checks if a tile can be interacted with.',
        types: ['SIGN', 'DOOR', 'CHEST', 'NPC']
    }
};
```

## Generated Code Structure

The generator produces:

1. **Simple type checkers** (33 tile + 17 entity = 50 methods)
   - One-liner methods like `static isFloor(tile)`

2. **Category checkers** (3 tile + 2 entity = 5 methods)
   - Methods that check multiple types with OR logic

3. **Combined checkers** (1 function)
   - Standalone functions for cross-category checks

4. **Backward compatibility exports** (~75 lines)
   - Function exports for all class methods

## Statistics

Current generation produces:
- **655 lines** of code from **~130 lines** of configuration
- **50 type checkers** + **5 category checkers** + **1 combined checker**
- **~80% reduction** in manual code maintenance

## Testing

Run tests after generation:
```bash
node utils/test-typechecks.js
```

Tests verify:
- ✅ Simple type checkers work with primitives and objects
- ✅ Category checkers correctly group types
- ✅ Object property helpers work correctly
- ✅ Backward compatibility exports work
- ✅ Edge cases (null, undefined) handled properly

## File Locations

```
utils/
├── generateTypeChecks.js    # The generator script (configuration + logic)
├── TypeChecks.js            # AUTO-GENERATED - DO NOT EDIT DIRECTLY
├── test-typechecks.js       # Test suite for generated code
└── TYPECHECKS_GENERATOR.md  # This documentation
```

## Best Practices

### ✅ DO
- Edit `generateTypeChecks.js` to add new types
- Run the generator after changes
- Run tests to verify correctness
- Commit both the generator and generated file

### ❌ DON'T
- Edit `TypeChecks.js` directly (it will be overwritten)
- Forget to run the generator after config changes
- Skip running tests after generation

## Migration Example

### Before: Manual Addition
```javascript
// Had to edit TypeChecks.js and add:

// 1. The type checker method (line ~200)
static isNewType(tile) {
    return TileTypeChecker.isTileType(tile, TILE_TYPES.NEW_TYPE);
}

// 2. The backward compatibility export (line ~580)
export const isNewType = TileTypeChecker.isNewType.bind(TileTypeChecker);

// 3. Update category checkers if needed (line ~300)
static isItem(tile) {
    const type = TileTypeChecker.getTileType(tile);
    return type === TILE_TYPES.AXE ||
           type === TILE_TYPES.HAMMER ||
           // ... many lines
           type === TILE_TYPES.NEW_TYPE;  // Add here
}
```

### After: Configuration-Based
```javascript
// Edit generateTypeChecks.js:

const TILE_TYPE_CHECKERS = {
    isNewType: 'NEW_TYPE',  // Just add this
};

const TILE_CATEGORY_CHECKERS = {
    isItem: {
        types: [..., 'NEW_TYPE']  // Add to array
    }
};

// Run: node utils/generateTypeChecks.js
// Done! All code generated automatically.
```

## Advanced Usage

### Custom Method Generation

If you need more complex logic than the standard patterns, you can:

1. Add custom generation functions to `generateTypeChecks.js`:
```javascript
function generateComplexChecker(methodName, config) {
    return `    static ${methodName}(tile, context) {
        // Custom logic here
        return customCondition(tile, context);
    }`;
}
```

2. Use them in the main generation:
```javascript
const complexCheckers = COMPLEX_CONFIGS.map(([name, config]) =>
    generateComplexChecker(name, config)
);
sections.push(complexCheckers.join('\n\n'));
```

### Conditional Generation

You can add conditional logic to skip generation for certain environments:
```javascript
if (process.env.INCLUDE_DEBUG_CHECKERS) {
    const debugCheckers = Object.entries(DEBUG_TYPE_CHECKERS).map(...);
    sections.push(debugCheckers.join('\n\n'));
}
```

## Troubleshooting

### Problem: Generated code has syntax errors
**Solution**: Check your configuration for typos or missing commas

### Problem: Tests fail after generation
**Solution**: Verify your TILE_TYPES constants match the configuration

### Problem: Import errors in generated file
**Solution**: Ensure the import path to constants is correct

### Problem: Method not generated
**Solution**: Check that you added it to the correct configuration object and re-ran the generator

## Future Enhancements

Potential improvements:
- [ ] Generate TypeScript type definitions
- [ ] Auto-detect tile types from constants file
- [ ] Generate documentation from configurations
- [ ] Add performance benchmarks to test suite
- [ ] Create VS Code snippets for common patterns
