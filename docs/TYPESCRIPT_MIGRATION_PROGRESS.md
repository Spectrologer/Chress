# TypeScript Migration Progress

Track the incremental migration of JavaScript files to TypeScript (via JSDoc + @ts-check).

## ✅ Completed Files (29 files)

### Tools
- ✅ [tools/asset-scanner.js](../tools/asset-scanner.js) - Asset scanning and categorization

### State Management
- ✅ [src/state/core/StateStore.js](../src/state/core/StateStore.js) - Centralized state store with comprehensive type definitions

### Utilities
- ✅ [src/utils/TypeChecks.js](../src/utils/TypeChecks.js) - Tile type checking utilities
- ✅ [src/utils/TileUtils.js](../src/utils/TileUtils.js) - Tile utilities and helpers
- ✅ [src/utils/GridUtils.js](../src/utils/GridUtils.js) - Grid coordinate utilities
- ✅ [src/utils/ZoneKeyUtils.js](../src/utils/ZoneKeyUtils.js) - Zone key manipulation and parsing
- ✅ [src/utils/LineOfSightUtils.js](../src/utils/LineOfSightUtils.js) - Line of sight calculations
- ✅ [src/utils/SafeServiceCall.js](../src/utils/SafeServiceCall.js) - Error handling wrapper utilities

### Facades
- ✅ [src/facades/PlayerPositionFacade.js](../src/facades/PlayerPositionFacade.js) - Player position and zone management
- ✅ [src/facades/PlayerStatsFacade.js](../src/facades/PlayerStatsFacade.js) - Player stats and animations
- ✅ [src/facades/PlayerInventoryFacade.js](../src/facades/PlayerInventoryFacade.js) - Inventory and abilities management

### Enemy AI
- ✅ [src/enemy/BaseEnemy.js](../src/enemy/BaseEnemy.js) - Base enemy class with position tracking and animations
- ✅ [src/enemy/MoveCalculators/base.js](../src/enemy/MoveCalculators/base.js) - Base move calculator with layered AI pipeline
- ✅ [src/enemy/MoveCalculators/neighbors.js](../src/enemy/MoveCalculators/neighbors.js) - Neighbor tile utilities
- ✅ [src/enemy/MoveCalculators/tactics.js](../src/enemy/MoveCalculators/tactics.js) - Tactical AI adjustments and defensive moves
- ✅ [src/enemy/MoveCalculators/aggressive.js](../src/enemy/MoveCalculators/aggressive.js) - Aggressive multi-tile charging movement

### Managers
- ✅ [src/managers/inventory/effects/BaseItemEffect.js](../src/managers/inventory/effects/BaseItemEffect.js) - Base class for item effects
- ✅ [src/managers/BombManager.js](../src/managers/BombManager.js) - Bomb placement, timing, and explosion system
- ✅ [src/managers/ActionManager.js](../src/managers/ActionManager.js) - Action execution and special weapon attacks
- ✅ [src/managers/CombatManager.js](../src/managers/CombatManager.js) - Combat management, enemy movement, and collision detection
- ✅ [src/managers/GridManager.js](../src/managers/GridManager.js) - Grid abstraction layer for safe tile operations
- ✅ [src/managers/ZoneManager.js](../src/managers/ZoneManager.js) - Zone transitions, generation, and persistence

### Renderers
- ✅ [src/renderers/strategies/TileRenderStrategy.js](../src/renderers/strategies/TileRenderStrategy.js) - Base tile rendering strategy interface
- ✅ [src/renderers/RendererUtils.js](../src/renderers/RendererUtils.js) - Shared rendering utilities and helpers

### Entities
- ✅ [src/entities/Enemy.js](../src/entities/Enemy.js) - Enemy entity with mixins for movement and attack
- ✅ [src/entities/Player.js](../src/entities/Player.js) - Player entity with movement, combat, stats, and inventory

### UI
- ✅ [src/ui/Sign.js](../src/ui/Sign.js) - Static utility class for sign and NPC message handling

### Core
- ✅ [src/core/Position.js](../src/core/Position.js) - Position abstraction with distance calculations and grid utilities

## 🎯 Next Priority Files

These files are recommended for migration next based on:
- High impact (frequently used)
- Low complexity (easier to type)
- Foundation for other files

### Priority 1: Core Game Logic & Entity Systems
- [ ] `src/core/game.js` - Main game class and loop

## 📊 Progress Statistics

- **Files migrated**: 29
- **Type definitions created**: ~97 comprehensive typedefs
- **Type checking**: ✅ All migrated files pass `npm run type-check`
- **Categories covered**: Tools (1), State Management (1), Utilities (6), Facades (3), Enemy AI (5), Managers (6), Renderers (2), Entities (1), UI (1)

## 🚀 How to Contribute to Migration

1. Pick a file from the "Next Priority" list above
2. Add `// @ts-check` at the top
3. Add JSDoc type annotations:
   - Function parameters and return types
   - Class properties
   - Complex object shapes via `@typedef`
4. Run `npm run type-check` to verify
5. Fix any type errors
6. Update this file to mark it as completed
7. Commit with message: `chore: add TypeScript types to <filename>`

## 📝 Migration Templates

### Simple Utility Function
```javascript
// @ts-check

/**
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {string} Zone key
 */
export function createZoneKey(x, y) {
    return `${x},${y}`;
}
```

### Class with Properties
```javascript
// @ts-check

/**
 * @typedef {Object} Config
 * @property {string} name
 * @property {number} value
 */

export class MyManager {
    constructor() {
        /** @type {Config[]} */
        this.configs = [];

        /** @type {boolean} */
        this.isActive = false;
    }

    /**
     * @param {Config} config
     * @returns {void}
     */
    addConfig(config) {
        this.configs.push(config);
    }
}
```

### Complex Object Type
```javascript
// @ts-check

/**
 * @typedef {Object} Enemy
 * @property {string} id
 * @property {string} type
 * @property {{x: number, y: number}} position
 * @property {number} hp
 * @property {number} maxHp
 */

/**
 * @param {Enemy[]} enemies
 * @returns {Enemy|null}
 */
export function findWeakestEnemy(enemies) {
    // ...
}
```

## 🎓 Resources

- [Full Migration Guide](./TYPESCRIPT_MIGRATION.md)
- [Quick Start Guide](./TYPESCRIPT_QUICKSTART.md)
- [JSDoc Reference](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html)

## 📌 Notes

- Files are being migrated incrementally - no rush!
- Even partial typing provides value
- Focus on public APIs and exported functions first
- Use `any` sparingly with TODO comments
- Type errors in other files (like StateDebugger.js) are tracked separately

---

**Recent migrations (2025-10-29):**

**Batch 2:**
- Added 6 new files: ZoneKeyUtils, LineOfSightUtils, SafeServiceCall, and all 3 Player facades
- Created comprehensive type definitions for Position, ZoneInfo, PlayerStats, InventoryItem, and more
- All utilities and facades now have full type safety

**Batch 3:**
- Added 3 new files: Enemy AI (base, neighbors) and BaseItemEffect
- Created detailed type definitions for Enemy, Player, Game, Item, ItemEffectContext, ItemEffectResult
- Enemy AI system now fully typed with comprehensive documentation
- Total progress: 15 files migrated (25% increase from batch 2)

**Batch 4:**
- Added 3 new files: Enemy AI (tactics, aggressive) and BombManager
- Completed the Enemy AI MoveCalculators subsystem (4 files fully typed)
- Added comprehensive types for TacticalAI, Direction, Position, GridCoords, BombManager
- BombManager includes extensive documentation of bomb lifecycle and chain reactions
- Total progress: 18 files migrated (20% increase from batch 3)

**Batch 5:**
- Added ActionManager.js - Complete action execution system
- Added comprehensive types for Item, Enemy, Game (extended)
- Covers all special weapon attacks (Bishop Spear, Horse Icon, Bow)
- Bomb timer management and explosion logic fully typed
- Total progress: 19 files migrated

**Batch 6:**
- Added CombatManager.js - Complete combat management system
- Added comprehensive types for ZoneInfo, DefeatResult, Enemy (13 properties), PlayerPos, Game
- Covers enemy movement, pitfall traps, lizord charge animations, player attacks, combat flow
- Fixed several type errors in previously migrated files:
  - StateDebugger: Renamed `debugger` export to `stateDebugger` (reserved keyword)
  - StateStore: Fixed EventBus imports (class vs instance)
  - LineOfSightUtils: Made `isWalkable` optional in LineOfSightOptions
  - neighbors.js: Added type casts for function overload parameters
  - base.js: Added type casts for Game type conflicts and window.soundManager
- Total progress: 20 files migrated

**Batch 7:**
- Added 2 renderer files: TileRenderStrategy.js and RendererUtils.js
- Created type definitions:
  - ImageCache: Typed image cache with HTMLImageElement values
  - BaseRenderer: Renderer interface with drawing methods
  - ScaledDimensions: Width/height for scaled images
- Covers all rendering utilities:
  - Rotated and flipped image drawing
  - Canvas pixel-perfect configuration
  - Image loading state checking
  - Aspect ratio scaling calculations
  - Multi-tile structure slicing
  - Fallback tile rendering with colors/emojis
- Fixed vendor-prefixed canvas properties with type casts
- Total progress: 22 files migrated (10% increase from batch 6)

**Batch 8:**
- Added GridManager.js - Complete grid abstraction layer
- Created 7 comprehensive type definitions:
  - Tile: Union type for number or object tiles
  - Grid: 2D array of tiles
  - TileWithPosition: Tile with x/y coordinates
  - NeighborTile: Tile with position and direction
  - GridIteratorOptions: Options for grid iteration (startX, endX, startY, endY, skipBorders)
  - TilePredicate: Callback for tile testing
  - TileCallback: Callback for tile iteration
- Fully typed all 27 methods:
  - Safe tile access (getTile, setTile, cloneTile, clearTile)
  - Boundary checking (isWithinBounds, isWalkable, isTileType)
  - Grid queries (findTiles, findFirst, findTilesOfType, count)
  - Iteration (forEach, some, every, toArray)
  - Region operations (fillRegion, canPlaceRegion, forEachInRegion)
  - Neighbor access (getNeighbors with optional diagonals)
  - Grid management (swapTiles, setGrid, cloneGrid, getRawGrid)
  - Debugging (debugLog)
- Total progress: 23 files migrated (~4% increase from batch 7)

**Batch 9:**
- Added ZoneManager.js - Complete zone orchestration system (449 lines)
- Created 6 comprehensive type definitions:
  - Game: Main game instance with all managers and state
  - ZoneData: Zone structure (grid, enemies, spawn, return coords)
  - EnemyData: Enemy serialization (position, type, health, id)
  - PlayerSpawn: Spawn coordinates
  - ReturnCoords: Coordinates for port/pitfall returns
  - Treasure: Treasure spawn definition
- Fully typed all 4 major methods:
  - transitionToZone(): Complete transition sequence (9 steps)
  - generateZone(): Zone generation/loading lifecycle
  - spawnTreasuresOnGrid(): Treasure placement delegation
  - saveCurrentZoneState(): Zone state persistence
- Covers complete zone system:
  - Zone transitions (north/south/east/west/port/pitfall)
  - Zone generation (surface/interior/underground with depth)
  - Player positioning at entrances/exits
  - State persistence and loading
  - Treasure spawning
  - Enemy filtering (defeated enemies)
  - Port transition handling (stairdown/stairup/cistern/hole)
  - Emergence tile patching
- Total progress: 24 files migrated (~4% increase from batch 8)

**Batch 10:**
- Added Enemy.js - Enemy entity class with mixin composition
- Created 1 type definition:
  - EnemyData: Enemy initialization data (x, y, enemyType, id, health)
- Simple but important file - composes BaseEnemy with movement and attack mixins
- Foundation for enemy system used throughout the game
- Total progress: 25 files migrated (~4% increase from batch 9)

**Batch 11:**
- Added Sign.js - Complete sign and NPC message system (348 lines)
- Created 6 comprehensive type definitions:
  - SignData: Sign message data with coordinates
  - StatueData: Statue dialogue data
  - BarterNpcData: NPC barter/merchant data with trades
  - Trade: Individual trade definition (required/received items)
  - DialogueNpcData: NPC dialogue data with cycling
  - GameInstance: Game instance reference with managers
- Fully typed all 10 static methods:
  - Message retrieval: getProceduralMessage(), getMessageByIndex(), getCanyonMessage()
  - Statue/NPC data: getStatueData(), getBarterNpcData(), getDialogueNpcData(), getNPCCharacterData()
  - Interaction handling: handleClick(), displayMessageForSign(), hideMessageForSign()
  - Special behaviors: makeAxolotlLeave() (animated NPC exit)
- Covers complete sign system:
  - Procedural message generation with used message tracking
  - Area-based message sets (home, woods, wilds, frontier, canyon)
  - Statue descriptions for enemies and items
  - NPC barter system with trade definitions
  - NPC dialogue system with persistent state
  - Axolotl post-trade animation
- Total progress: 26 files migrated (~4% increase from batch 10)

**Batch 12:**
- Added BaseEnemy.js - Core enemy class (169 lines)
- Created 2 type definitions:
  - EnemyData: Enemy initialization data (x, y, enemyType, id, health)
  - SmokeAnimation: Smoke effect animation data (x, y, frame)
- Fully typed all 10 methods:
  - Position: setPosition(), getPosition(), getPositionObject()
  - Combat: getPoints(), takeDamage(), isDead()
  - Animation: startDeathAnimation(), startBump(), updateAnimations()
  - Movement: isWalkable()
- Typed all 17 class properties with Position tracking and animation states
- Foundation class extended by Enemy with movement/attack mixins
- Covers complete enemy lifecycle:
  - Position tracking with Position class integration
  - Point values for all enemy types (lizardy→1, lizardo/lizord/zard→3, lizardeaux→5, lazerd→9)
  - Damage system with animation cleanup on death
  - Animation system (death, bump, attack, lift, smoke)
  - Walkability checking for enemy movement
- Total progress: 27 files migrated (~4% increase from batch 11)

**Batch 13:**
- Added Position.js - Core position abstraction class (512 lines)
- Created 6 comprehensive type definitions:
  - Coordinates: Basic {x, y} coordinate object
  - Delta: {dx, dy} for position differences
  - Offset: {x, y} for position offsets
  - PositionPredicate: Callback for position validation
  - Grid: 2D array type for grids
  - GridManager: Interface for grid manager objects
- Fully typed all 40+ methods across 7 categories:
  - Static Factory Methods: from(), of(), center(), zero(), one(), fromKey()
  - Equality and Comparison: equals(), isZero()
  - Distance Calculations: chebyshevDistance(), manhattanDistance(), euclideanDistance(), distanceTo()
  - Direction and Delta: delta(), absDelta(), directionTo(), move(), add(), subtract()
  - Adjacency and Neighbors: isAdjacentTo(), getNeighbors(), getValidNeighbors()
  - Grid Bounds Validation: isInBounds(), isInInnerBounds(), clampToBounds()
  - Grid Access Helpers: getTile(), setTile(), isValidTile()
  - Serialization: toObject(), toKey(), toString(), toJSON()
  - Utility Methods: clone(), isSameRow(), isSameColumn(), isOrthogonalTo(), isDiagonalTo(), lineTo(), rectangleTo(), positionsWithinRadius()
- Supports both raw grid arrays and GridManager interface
- Delegates to PositionCalculator and PositionValidator for logic
- Foundation class used throughout the game for position handling
- Total progress: 28 files migrated (~4% increase from batch 12)

**Batch 14:**
- Added Player.js - Main player entity class (683 lines)
- Created 3 comprehensive type definitions:
  - ZoneCoords: Zone coordinates with dimension and depth
  - Grid: 2D array type for game grids
  - ItemManager: Interface for item manager
- Fully typed all 40+ methods across multiple categories:
  - Movement: move(), isWalkable(), setPosition(), getPosition(), getPositionObject(), ensureValidPosition()
  - Zone Management: getCurrentZone(), setCurrentZone(), markZoneVisited(), hasVisitedZone(), getVisitedZones()
  - Stats Management: getThirst(), setThirst(), getHunger(), setHunger(), getHealth(), setHealth()
  - Combat: takeDamage(), isDead(), setDead()
  - Resources: decreaseThirst(), decreaseHunger(), restoreThirst(), restoreHunger()
  - Scoring: getPoints(), addPoints(), setPoints(), getSpentDiscoveries(), setSpentDiscoveries()
  - Animations: startBump(), startBackflip(), startAttackAnimation(), startActionAnimation(), startSmokeAnimation(), startSplodeAnimation(), updateAnimations()
  - Lifecycle: reset(), onZoneTransition()
  - Utilities: getValidSpawnPosition(), setInteractOnReach(), clearInteractOnReach(), setAction()
- All 14 class properties fully typed with JSDoc comments
- Uses Position class for internal position tracking with backward-compatible x/y properties
- Delegates stats management to PlayerStats and animations to PlayerAnimations
- Fixed type errors with window.gameInstance and ErrorSeverity enum casts
- Foundation entity class for player character used throughout the game
- Total progress: 29 files migrated (~4% increase from batch 13)

Last updated: 2025-10-29
