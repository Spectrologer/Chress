# State Management Quick Start

Get started with the new centralized state management system in **5 minutes**.

## 1. Install Dependencies

```bash
npm install
```

This installs `lz-string` for compression (added to [package.json](package.json)).

## 2. Try the Debugger

Open your game in the browser and press:

**Ctrl+Shift+D**

You'll see a visual debugger showing:
- 📊 State tree (all game state)
- 🔍 Recent mutations (what changed)
- 📈 Statistics (zones, enemies, items)
- 💾 Export/import saves

## 3. Basic Usage

### Import the System

```javascript
import { store, StateActions, StateSelectors, persistence } from './src/state/index.js';
```

### Read State

```javascript
// Get player info
const player = StateSelectors.getPlayer();
const health = StateSelectors.getPlayerStats().health;
const inventory = StateSelectors.getPlayerInventory();

// Get zone info
const currentZone = StateSelectors.getCurrentZone();
const enemies = StateSelectors.getCurrentEnemies();

// Check abilities
const hasAxe = StateSelectors.hasAbility('axe');
const hasShovel = StateSelectors.hasAbility('shovel');

// Get UI state
const isStatsOpen = StateSelectors.isStatsPanelOpen();
const settings = StateSelectors.getSettings();
```

### Write State

```javascript
// Move player
StateActions.movePlayer(5, 10);

// Update stats
StateActions.updatePlayerStats({
  health: 90,
  hunger: 80,
  thirst: 70
});

// Add item to inventory
StateActions.addToInventory({ type: 'potion', name: 'Health Potion' });

// Change zone
StateActions.changeZone(1, 0, 'overworld');

// Toggle UI
StateActions.toggleStatsPanel(true);

// Update settings
StateActions.updateSettings({
  musicEnabled: false,
  sfxEnabled: true
});
```

### Save and Load

```javascript
// Save game
await persistence.save();

// Load game
const hasSave = await persistence.hasSavedState();
if (hasSave) {
  await persistence.load();
}

// Clear all saves
await persistence.clear();

// Export save file
await persistence.exportSave();
```

## 4. Console Debugging

Open browser console and try:

```javascript
// Access the store
window.chesseStore

// Print entire state
window.chesseStore.debugPrint()

// Get specific state
window.chesseStore.get('persistent.player')
window.chesseStore.get('session.enemies')

// View mutations
window.chesseStore.getMutations(10)

// Get statistics
window.chesseStore.getStats()

// Toggle debugger
window.chesseDebugger.toggle()
```

## 5. Integration Example

Here's a complete example for your game initialization:

```javascript
// game.js or main.js
import { store, StateActions, StateSelectors, persistence } from './src/state/index.js';

// Game initialization
async function initGame() {
  console.log('🎮 Initializing game...');

  // Try to load saved game
  const hasSave = await persistence.hasSavedState();

  if (hasSave) {
    console.log('📦 Loading saved game...');
    await persistence.load();

    // Restore from loaded state
    const player = StateSelectors.getPlayer();
    const zone = StateSelectors.getPlayerCurrentZone();

    console.log(`Player at (${player.position.x}, ${player.position.y})`);
    console.log(`Zone: (${zone.x}, ${zone.y}, ${zone.dimension})`);
  } else {
    console.log('🆕 New game!');

    // Initialize new game
    StateActions.startGame();
    StateActions.movePlayer(0, 0);
    StateActions.changeZone(0, 0, 'overworld', 0);
  }

  // Setup autosave
  setupAutosave();

  // Enable debugger in development
  console.log('Press Ctrl+Shift+D to open state debugger');
}

// Autosave setup
let autosaveTimeout;
function setupAutosave() {
  // Subscribe to persistent state changes
  store.subscribe('persistent', () => {
    // Debounce saves to avoid blocking
    clearTimeout(autosaveTimeout);
    autosaveTimeout = setTimeout(() => {
      persistence.save();
    }, 2000);
  });

  // Periodic autosave every 30 seconds
  setInterval(() => {
    persistence.save();
  }, 30000);
}

// Game loop
function gameLoop() {
  // Read state for rendering
  const player = StateSelectors.getPlayer();
  const grid = StateSelectors.getCurrentGrid();
  const enemies = StateSelectors.getCurrentEnemies();

  // Render game...
}

// Start game
initGame().then(() => {
  gameLoop();
});
```

## 6. State Slices

The state is organized into 4 slices:

### Persistent (Saved to Storage)
```javascript
store.get('persistent.player')          // Player data
store.get('persistent.zones')           // Cached zones
store.get('persistent.defeatedEnemies') // Defeated enemies
store.get('persistent.messageLog')      // Message log
```

### Session (Resets on Game Over)
```javascript
store.get('session.gameStarted')        // Game started flag
store.get('session.currentGrid')        // Active zone grid
store.get('session.enemies')            // Active enemies
store.get('session.zoneGeneration')     // Zone generation state
```

### Transient (Resets on Zone Change)
```javascript
store.get('transient.combat')           // Combat state
store.get('transient.interactions')     // Sign/NPC interactions
store.get('transient.itemAbilities')    // Charge/bomb state
store.get('transient.zoneTransition')   // Zone transition data
```

### UI (Never Persisted)
```javascript
store.get('ui.panels')                  // Panel open states
store.get('ui.radialMenu')              // Radial menu state
store.get('ui.settings')                // Game settings
store.get('ui.input')                   // Input state
```

## 7. Features

✅ **Unlimited Storage** - IndexedDB (no 5-10MB limit)
✅ **Compression** - 40-60% size reduction
✅ **Zone Pruning** - Keeps only 100 recent zones
✅ **Backward Compatible** - Old saves work
✅ **Visual Debugger** - Press Ctrl+Shift+D
✅ **Mutation History** - Track all changes
✅ **Type Safe** - Full JSDoc annotations
✅ **Easy Testing** - Snapshots and restore

## 8. Learn More

- 📖 [Full Documentation](src/state/README.md)
- 🔧 [Migration Guide](MIGRATION_GUIDE.md)
- 💻 [Integration Examples](src/state/examples/IntegrationExample.js)
- 📊 [Summary](STATE_MANAGEMENT_SUMMARY.md)

## 9. Troubleshooting

### Old saves not loading?
The system automatically migrates old saves. Check console for migration messages.

### Save too large?
Enable compression (enabled by default). Zone pruning keeps only 100 recent zones.

### Can't find state?
Press Ctrl+Shift+D and check the state tree view.

### Need to debug?
```javascript
window.chesseStore.debugPrint()
window.chesseStore.getMutations(20)
```

### Want to export save?
```javascript
await persistence.exportSave()
```

---

**That's it!** You're ready to use the centralized state management system. Press **Ctrl+Shift+D** to explore your game state visually.
