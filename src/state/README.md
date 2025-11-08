# Centralized State Management System

## Overview

The Chress game now uses a **centralized state store** as the single source of truth for all application state. This solves the previous issues of scattered state, difficult debugging, and localStorage limitations.

## Architecture

```
StateStore (Single Source of Truth)
├── Persistent State    → Saved to storage, survives restarts
├── Session State       → Resets on game over
├── Transient State     → Resets on zone transitions
└── UI State            → Never persisted, visual/interaction only
```

### State Slices

#### 1. **Persistent State** (`persistent`)

Saved to IndexedDB/localStorage, survives app restarts.

- `player` - Position, inventory, abilities, stats, visited zones
- `zones` - Cached zone data (pruned to most recent 100)
- `defeatedEnemies` - Set of defeated enemy positions
- `specialZones` - Map of special zone types
- `messageLog` - Array of game messages (limited to 50)
- `dialogueState` - NPC dialogue progression
- `currentRegion` - Current region name

#### 2. **Session State** (`session`)

Resets on game over, persists during session.

- `gameStarted` - Boolean flag
- `zoneGeneration` - Counters and spawn flags
  - `zoneCounter` - Total zones generated
  - `enemyCounter` - Total enemies generated
  - `spawnFlags` - Items/NPCs/structures spawned
  - `spawnZones` - Pre-determined spawn locations
- `currentGrid` - Active zone grid
- `enemies` - Active enemies in current zone
- `signSpawnedMessages` - Set of spawnedtextbox messages

#### 3. **Transient State** (`transient`)

Resets on zone transitions or specific actions.

- `combat.playerJustAttacked` - Turn-based combat flag
- `interactions` -textbox messages, NPC positions
- `itemAbilities` - Charge pending, bomb placement
- `zoneTransition` - Exit side, port data, pitfall state
- `turn` - Turn queue, occupied tiles, turn flags
- `entrance` - Entrance animation state

#### 4. **UI State** (`ui`)

Never persisted, only affects visual/interaction state.

- `panels` - Stats/config panel open states, preview mode
- `radialMenu` - Open state and snapshot
- `input` - Highlighted tiles, shovel mode
- `confirmations` - Pending confirmation actions
- `settings` - Music, SFX, auto-path preferences

## Core Files

### [StateStore.js](./core/StateStore.js)

The central state store with:

- `get(path)` - Get state at dot-notation path
- `set(path, value)` - Set state (immutable)
- `batchSet(updates)` - Update multiple paths atomically
- `subscribe(slice, callback)` - Listen to slice changes
- `resetSlice(slice)` - Reset specific slice
- Event-based subscriptions
- Mutation history for debugging
- Time-travel capabilities

### [StatePersistence.js](./core/StatePersistence.js)

Handles saving/loading with:

- **IndexedDB** as primary storage (unlimited size)
- **localStorage** as fallback
- **LZ-string compression** (40-60% size reduction)
- **Zone pruning** (keeps only 100 most recent/special zones)
- **Backward compatibility** with old save format
- Export/import save files

### [StateSelectors.js](./core/StateSelectors.js)

Type-safe accessors for common queries:

```javascript
import { StateSelectors } from "./core/StateSelectors.js";

// Player queries
const player = StateSelectors.getPlayer();
const hasAxe = StateSelectors.hasAbility("axe");
const inventory = StateSelectors.getPlayerInventory();

// Zone queries
const currentZone = StateSelectors.getCurrentZone();
const isSpecial = StateSelectors.isSpecialZone(x, y, dimension);

// UI queries
const isPanelOpen = StateSelectors.isStatsPanelOpen();
const settings = StateSelectors.getSettings();
```

### [StateActions.js](./core/StateActions.js)

High-level action creators for common mutations:

```javascript
import { StateActions } from "./core/StateActions.js";

// Player actions
StateActions.movePlayer(5, 10);
StateActions.addToInventory(item);
StateActions.updatePlayerStats({ health: 90 });

// Zone actions
StateActions.changeZone(1, 0, "overworld");
StateActions.cacheZone(x, y, dimension, depth, zoneData);

// UI actions
StateActions.toggleStatsPanel(true);
StateActions.updateSettings({ musicEnabled: false });
```

### [StateDebugger.js](./core/StateDebugger.js)

Visual debugging tool (press **Ctrl+Shift+D**):

- Real-time state visualization
- Mutation history with diffs
- State statistics
- Export/import saves
- Time-travel debugging

## Usage Guide

### Reading State

```javascript
import { store } from "./state/core/StateStore.js";
import { StateSelectors } from "./state/core/StateSelectors.js";

// Direct access (use selectors when available)
const health = store.get("persistent.player.stats.health");
const enemies = store.get("session.enemies");

// Using selectors (preferred)
const health = StateSelectors.getPlayerStats().health;
const enemies = StateSelectors.getCurrentEnemies();
```

### Writing State

```javascript
import { StateActions } from "./state/core/StateActions.js";

// Using actions (preferred - semantic and type-safe)
StateActions.movePlayer(x, y);
StateActions.addToInventory(item);

// Direct mutations (when no action exists)
import { store } from "./state/core/StateStore.js";
store.set("persistent.player.stats.health", 80);
store.batchSet({
  "persistent.player.stats.health": 80,
  "persistent.player.stats.hunger": 70,
});
```

### Subscribing to Changes

```javascript
import { store } from "./state/core/StateStore.js";

// Subscribe to entire slice
const unsubscribe = store.subscribe("persistent", (state, path) => {
  console.log("Persistent state changed:", path);
});

// Unsubscribe when done
unsubscribe();
```

### Saving and Loading

```javascript
import { persistence } from "./state/core/StatePersistence.js";

// Save current state
await persistence.save();

// Load saved state
await persistence.load();

// Check if save exists
const hasSave = await persistence.hasSave();

// Clear all saves
await persistence.clear();

// Export save file
await persistence.exportSave();
```

## Migration from Old System

The state store includes **automatic migration** from the old save format:

1. Old saves are detected and migrated on load
2. Player data, zones, enemies all transferred
3. Settings extracted from `player.stats` to `ui.settings`
4. Session state rebuilt from old format
5. New state structure applied

### Migrating Existing Code

**Before:**

```javascript
// Scattered across game object and managers
game.player.x = 5;
game.grid = newGrid;
game.enemies = [...];
GameStateManager.save();
```

**After:**

```javascript
// Centralized state
StateActions.movePlayer(5, 10);
StateActions.setCurrentGrid(newGrid);
StateActions.setEnemies([...]);
await persistence.save();
```

## Benefits

### ✅ Single Source of Truth

- All state in one place (`StateStore`)
- No duplication across managers
- Clear ownership and access patterns

### ✅ Improved Debugging

- Visual debugger (Ctrl+Shift+D)
- Mutation history with diffs
- State snapshots and time-travel
- Console access: `window.chressStore`

### ✅ Unlimited Storage

- **IndexedDB** primary storage (no 5-10MB limit)
- Compression reduces size 40-60%
- Zone pruning prevents unbounded growth
- localStorage fallback for compatibility

### ✅ Better Performance

- Immutable updates enable optimization
- Batched mutations reduce re-renders
- Selective subscriptions (slice-level)
- Lazy loading of zones

### ✅ Easier Testing

- Predictable state mutations
- Snapshot/restore for tests
- No static properties
- Clear action boundaries

### ✅ Type Safety (with JSDoc)

- Full TypeScript-style comments
- IDE autocomplete
- Compile-time checking (if using TypeScript)

## Best Practices

### 1. Always Use Selectors for Reads

```javascript
// ❌ Bad
const health = store.get("persistent.player.stats.health");

// ✅ Good
const health = StateSelectors.getPlayerStats().health;
```

### 2. Always Use Actions for Writes

```javascript
// ❌ Bad
store.set("persistent.player.inventory", [...inventory, item]);

// ✅ Good
StateActions.addToInventory(item);
```

### 3. Batch Related Mutations

```javascript
// ❌ Bad
store.set("persistent.player.stats.health", 80);
store.set("persistent.player.stats.hunger", 70);
store.set("persistent.player.stats.thirst", 60);

// ✅ Good
StateActions.updatePlayerStats({
  health: 80,
  hunger: 70,
  thirst: 60,
});
```

### 4. Never Mutate State Directly

```javascript
// ❌ Bad - mutates state!
const player = store.get("persistent.player");
player.x = 5;

// ✅ Good - immutable update
StateActions.movePlayer(5, 10);
```

### 5. Use Subscriptions Sparingly

```javascript
// Only subscribe when you need reactive updates
// Most components can just query state when needed
const unsubscribe = store.subscribe("ui", (state) => {
  updateUI(state);
});

// Always cleanup
component.onDestroy = () => unsubscribe();
```

## Debugging

### Open State Debugger

Press **Ctrl+Shift+D** or:

```javascript
window.chressDebugger.toggle();
```

### Console Access

```javascript
// Access store
window.chressStore.get("persistent.player");
window.chressStore.debugPrint();

// View mutations
window.chressStore.getMutations(20);

// View history
window.chressStore.getHistory(10);

// Get stats
window.chressStore.getStats();
```

### Export Save for Analysis

```javascript
await persistence.exportSave();
// Downloads JSON file with full save data
```

## Performance

### Storage Optimization

- **Zone Pruning**: Keeps only 100 most recent/special zones
- **Message Log**: Limited to 50 recent messages
- **Compression**: 40-60% size reduction with LZ-string
- **IndexedDB**: No 5-10MB localStorage limit

### Runtime Optimization

- **Immutable Updates**: Enables React-style optimization
- **Slice Subscriptions**: Only notified of relevant changes
- **Lazy Loading**: Zones loaded on-demand
- **Debounced Autosave**: Saves batched, not on every mutation

## Testing

```javascript
import { store } from "./state/core/StateStore.js";

// Take snapshot before test
const snapshot = store.getSnapshot();

// Run test
StateActions.movePlayer(5, 10);
assert(store.get("persistent.player.position.x") === 5);

// Restore state after test
store.restoreSnapshot(snapshot);
```

## Future Enhancements

- [ ] React/Preact integration with hooks
- [ ] Undo/redo functionality
- [ ] State validation schemas
- [ ] Performance profiling tools
- [ ] Remote state inspection
- [ ] Cloud save sync

## Support

For issues or questions:

1. Check the [State Debugger](#debugging) (Ctrl+Shift+D)
2. Review [mutation history](#console-access)
3. Export save file for analysis
4. File issue with save file and steps to reproduce
