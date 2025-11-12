# State Management Testing Checklist

Use this checklist to verify the state management system works correctly.

## ✅ Installation & Setup

- [ ] Run `npm install` to install `lz-string` dependency
- [ ] Verify no installation errors
- [ ] Check that all files exist in `src/state/` directory
- [ ] Confirm `package.json` includes `"lz-string": "^1.5.0"`

## ✅ Basic Functionality

### Import Test
- [ ] Can import from `./src/state/index.js`
- [ ] `store` is accessible
- [ ] `StateActions` object has functions
- [ ] `StateSelectors` object has functions
- [ ] `persistence` is accessible
- [ ] `stateDebugger` is accessible

### State Store Test
```javascript
import { store, StateActions, StateSelectors } from './src/state/index.js';

// Write state
StateActions.movePlayer(5, 10);

// Read state
const pos = StateSelectors.getPlayerPosition();
console.assert(pos.x === 5 && pos.y === 10, 'Position updated');
```

- [ ] Can write state with `StateActions`
- [ ] Can read state with `StateSelectors`
- [ ] State updates are reflected immediately
- [ ] No console errors

### Debugger Test
- [ ] Press `Ctrl+Shift+D` to open debugger
- [ ] Debugger window appears
- [ ] Can see state tree
- [ ] Can switch tabs (State Tree, JSON, Mutations, Statistics)
- [ ] Can close debugger with X button
- [ ] `window.chesseStore` is accessible in console
- [ ] `window.chesseDebugger` is accessible in console

## ✅ Persistence

### Save Test
```javascript
import { persistence, StateActions } from './src/state/index.js';

// Make some changes
StateActions.movePlayer(99, 99);
StateActions.updatePlayerStats({ health: 50 });

// Save
await persistence.save();
```

- [ ] `persistence.save()` completes without errors
- [ ] Console shows compression stats
- [ ] Save succeeds (returns `true`)
- [ ] No browser errors about storage

### Load Test
```javascript
// Reload page, then:
import { persistence, StateSelectors } from './src/state/index.js';

// Load
await persistence.load();

// Check restored state
const pos = StateSelectors.getPlayerPosition();
const health = StateSelectors.getPlayerStats().health;

console.assert(pos.x === 99, 'Position restored');
console.assert(health === 50, 'Stats restored');
```

- [ ] `persistence.load()` completes without errors
- [ ] State is restored correctly
- [ ] Player position matches saved
- [ ] Player stats match saved
- [ ] Console shows "Loaded from IndexedDB" or "Loaded from localStorage"

### Clear Test
```javascript
// Clear saves
await persistence.clear();

// Verify cleared
const hasSave = await persistence.hasSavedState();
console.assert(!hasSave, 'Save cleared');
```

- [ ] `persistence.clear()` completes
- [ ] `hasSavedState()` returns `false`
- [ ] No errors in console

## ✅ Backward Compatibility

### Old Save Migration Test

1. Create an old-format save manually:
```javascript
const oldSave = {
  version: 2,
  state: {
    player: { x: 10, y: 20, stats: { health: 100 } },
    zones: [],
    grid: null
  }
};
localStorage.setItem('chesse_game_state', JSON.stringify(oldSave));
```

2. Load the old save:
```javascript
await persistence.load();
const player = StateSelectors.getPlayer();
console.log('Migrated player:', player);
```

- [ ] Old save loads without errors
- [ ] Console shows "Migrating old save format..."
- [ ] Console shows "Migration complete"
- [ ] Player data is preserved
- [ ] New state structure is applied

## ✅ Compression

### Compression Test
```javascript
// Check compression is working
import { persistence } from './src/state/index.js';

// Save should show compression stats in console
await persistence.save();
// Look for: "Compressed: 12345 -> 5678 (54% reduction)"
```

- [ ] Console shows compression message
- [ ] Reduction percentage is 40-60%
- [ ] No compression errors

## ✅ Zone Pruning

### Zone Pruning Test
```javascript
import { store, StateActions } from './src/state/index.js';

// Create 200 zones
for (let i = 0; i < 200; i++) {
  StateActions.cacheZone(i, 0, 'overworld', 0, {
    grid: [],
    enemies: []
  });
}

// Save (should trigger pruning)
await persistence.save();

// Reload and check
await persistence.load();
const zones = StateSelectors.getZones();
console.log('Zones after pruning:', zones.size);
console.assert(zones.size <= 100, 'Zones pruned');
```

- [ ] Console shows "Pruned zones: 200 -> 100"
- [ ] After reload, only ~100 zones remain
- [ ] No errors during pruning

## ✅ IndexedDB vs localStorage

### IndexedDB Test
1. Open browser DevTools → Application → IndexedDB
2. Look for database named "ChesseDB"
3. Check object store "gameState"

- [ ] IndexedDB database "ChesseDB" exists
- [ ] Object store "gameState" exists
- [ ] Save data is stored in IndexedDB
- [ ] Console shows "Saved to IndexedDB"

### localStorage Fallback Test
1. Simulate IndexedDB failure:
```javascript
// In browser console
indexedDB.deleteDatabase('ChesseDB');

// Then try to save
await persistence.save();
```

- [ ] Console shows warning about IndexedDB
- [ ] Console shows "Saved to localStorage"
- [ ] Save still succeeds
- [ ] Data in localStorage under 'chesse_game_state'

## ✅ State Slices

### Persistent State Test
```javascript
// Persistent state should survive reload
StateActions.addToInventory({ type: 'potion' });
await persistence.save();

// Reload page
await persistence.load();
const inventory = StateSelectors.getPlayerInventory();
console.assert(inventory.length > 0, 'Inventory persisted');
```

- [ ] Persistent state saved and restored
- [ ] Player data persists
- [ ] Inventory persists
- [ ] Zones persist

### Session State Test
```javascript
// Session state should reset on game over
StateActions.startGame();
StateActions.incrementZoneCounter();
const counter = StateSelectors.getZoneCounter();

// Reset session
StateActions.resetSession();
const newCounter = StateSelectors.getZoneCounter();

console.assert(newCounter === 0, 'Session state reset');
```

- [ ] Session state resets on `resetSession()`
- [ ] Game started flag resets
- [ ] Zone counter resets
- [ ] Current grid resets

### Transient State Test
```javascript
// Transient state should reset on zone transition
StateActions.setPlayerAttacked(true);
console.assert(StateSelectors.hasPlayerJustAttacked(), 'Attack flag set');

// Reset transient
StateActions.resetTransient();
console.assert(!StateSelectors.hasPlayerJustAttacked(), 'Attack flag reset');
```

- [ ] Transient state resets on `resetTransient()`
- [ ] Combat flags reset
- [ ] Interaction state resets
- [ ] Zone transition data resets

### UI State Test
```javascript
// UI state should never be persisted
StateActions.toggleStatsPanel(true);
await persistence.save();

// Reload
await persistence.load();
const isOpen = StateSelectors.isStatsPanelOpen();

console.assert(!isOpen, 'UI state not persisted');
```

- [ ] UI state doesn't persist
- [ ] Panel states reset on reload
- [ ] Settings reset on reload (or loaded separately)

## ✅ Selectors

Test a sample of selectors:

```javascript
import { StateSelectors, StateActions } from './src/state/index.js';

// Player selectors
StateActions.movePlayer(15, 25);
console.assert(StateSelectors.getPlayerPosition().x === 15, 'getPlayerPosition works');

StateActions.addAbility('axe');
console.assert(StateSelectors.hasAbility('axe'), 'hasAbility works');

StateActions.updatePlayerStats({ health: 75 });
console.assert(StateSelectors.getPlayerStats().health === 75, 'getPlayerStats works');

// Zone selectors
StateActions.changeZone(1, 2, 'overworld');
const zone = StateSelectors.getPlayerCurrentZone();
console.assert(zone.x === 1 && zone.y === 2, 'getPlayerCurrentZone works');

// UI selectors
StateActions.toggleStatsPanel(true);
console.assert(StateSelectors.isStatsPanelOpen(), 'isStatsPanelOpen works');
```

- [ ] All tested selectors return correct values
- [ ] No undefined or null errors
- [ ] Type-safe (check in IDE with JSDoc)

## ✅ Actions

Test a sample of actions:

```javascript
import { StateActions, StateSelectors } from './src/state/index.js';

// Player actions
StateActions.movePlayer(10, 20);
StateActions.addToInventory({ type: 'test' });
StateActions.addAbility('test_ability');
StateActions.updatePlayerStats({ health: 90 });

// Zone actions
StateActions.changeZone(5, 5, 'overworld');
StateActions.cacheZone(5, 5, 'overworld', 0, { grid: [] });

// Combat actions
StateActions.setPlayerAttacked(true);
StateActions.addDefeatedEnemy(10, 10);

// UI actions
StateActions.toggleStatsPanel(true);
StateActions.updateSettings({ musicEnabled: false });
```

- [ ] All actions execute without errors
- [ ] State is updated correctly
- [ ] No undefined errors

## ✅ Debugging Tools

### Mutation History Test
```javascript
// Make some changes
StateActions.movePlayer(1, 1);
StateActions.movePlayer(2, 2);
StateActions.movePlayer(3, 3);

// Check mutations
const mutations = store.getMutations(5);
console.log('Mutations:', mutations);
```

- [ ] Mutations are recorded
- [ ] Mutations show path, old value, new value
- [ ] Mutations include timestamp
- [ ] Can retrieve with `getMutations()`

### State Statistics Test
```javascript
const stats = store.getStats();
console.log('Statistics:', stats);
```

- [ ] Returns statistics object
- [ ] Shows node counts per slice
- [ ] Shows history and mutation counts
- [ ] Shows listener count

### Snapshot Test
```javascript
// Take snapshot
const snapshot = store.getSnapshot();

// Make changes
StateActions.movePlayer(99, 99);

// Restore
store.restoreSnapshot(snapshot);

// Verify restored
const pos = StateSelectors.getPlayerPosition();
console.assert(pos.x !== 99, 'Snapshot restored');
```

- [ ] Can take snapshots
- [ ] Can restore snapshots
- [ ] State reverts correctly

## ✅ Export/Import

### Export Test
```javascript
await persistence.exportSave();
```

- [ ] Downloads a JSON file
- [ ] File name includes timestamp
- [ ] File contains valid JSON
- [ ] JSON has state data

### Import Test
1. Export a save file
2. Make changes to state
3. Import the exported file
4. Verify state restored

- [ ] Import prompts file selection
- [ ] Imported state loads correctly
- [ ] Previous state is restored

## ✅ Console Access

Test console debugging:

```javascript
// In browser console
window.chesseStore.debugPrint();
window.chesseStore.get('persistent.player');
window.chesseStore.getMutations(10);
window.chesseStore.getStats();
window.chesseDebugger.toggle();
```

- [ ] `window.chesseStore` exists
- [ ] `debugPrint()` works
- [ ] `get()` returns state
- [ ] `getMutations()` returns array
- [ ] `getStats()` returns object
- [ ] `window.chesseDebugger` exists
- [ ] `toggle()` opens/closes debugger

## ✅ Error Handling

### Invalid Path Test
```javascript
// Should not crash
const invalid = store.get('invalid.path.that.does.not.exist');
console.log('Invalid:', invalid); // Should be undefined
```

- [ ] Invalid paths return `undefined`
- [ ] No console errors

### Save Failure Test
```javascript
// Simulate localStorage full
try {
  // Fill localStorage
  for (let i = 0; i < 1000; i++) {
    localStorage.setItem(`test_${i}`, 'x'.repeat(10000));
  }
  await persistence.save();
} catch (error) {
  console.log('Expected error:', error);
}
```

- [ ] Save gracefully handles storage errors
- [ ] Returns `false` on failure
- [ ] Tries to restore backup

## ✅ Performance

### Large State Test
```javascript
// Create large state
for (let i = 0; i < 100; i++) {
  StateActions.cacheZone(i, 0, 'overworld', 0, {
    grid: Array(16).fill(null).map(() => Array(16).fill({ type: 'grass' }))
  });
}

// Time save
console.time('save');
await persistence.save();
console.timeEnd('save');

// Time load
console.time('load');
await persistence.load();
console.timeEnd('load');
```

- [ ] Save completes in <2 seconds
- [ ] Load completes in <1 second
- [ ] No UI freezing
- [ ] Compression works on large states

### Subscription Performance Test
```javascript
// Add many subscriptions
for (let i = 0; i < 100; i++) {
  store.subscribe('persistent', () => {});
}

// Make changes
console.time('update');
StateActions.movePlayer(50, 50);
console.timeEnd('update');
```

- [ ] Updates complete in <50ms
- [ ] No noticeable lag
- [ ] Listeners are called

## 📝 Summary

Total checks: **~80**

| Category | Checks |
|----------|--------|
| Installation | 4 |
| Basic Functionality | 14 |
| Persistence | 16 |
| Backward Compatibility | 4 |
| Compression | 3 |
| Zone Pruning | 4 |
| Storage | 9 |
| State Slices | 16 |
| Selectors | 5 |
| Actions | 4 |
| Debugging Tools | 9 |
| Export/Import | 7 |
| Console Access | 7 |
| Error Handling | 4 |
| Performance | 8 |

---

## ✅ All Tests Passed?

If all tests pass:
- ✅ System is ready to use
- ✅ Safe to integrate into game
- ✅ Can migrate gradually

If tests fail:
- Check browser console for errors
- Open debugger (Ctrl+Shift+D) to inspect state
- Review documentation in [src/state/README.md](src/state/README.md)
- Check [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) for integration steps
