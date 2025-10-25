# Event System Documentation

## Overview

The Chress game now uses a centralized **EventBus** system to decouple managers and reduce tight coupling. Instead of managers calling each other directly, they communicate through events using a publish-subscribe (pub-sub) pattern.

## Architecture

### Before: Tightly Coupled
```javascript
// CombatManager directly calls UIManager and AnimationManager
this.game.animationManager.addPointAnimation(x, y, amount);
this.game.uiManager.updatePlayerStats();
```

### After: Event-Driven
```javascript
// CombatManager emits events
eventBus.emit(EventTypes.ANIMATION_REQUESTED, { type: 'point', x, y, data: { amount } });
eventBus.emit(EventTypes.PLAYER_STATS_CHANGED, { health, points, hunger, thirst });

// UIManager and AnimationManager listen to events
eventBus.on(EventTypes.PLAYER_STATS_CHANGED, () => this.updatePlayerStats());
eventBus.on(EventTypes.ANIMATION_REQUESTED, (data) => this.handleAnimation(data));
```

## Core Components

### EventBus ([core/EventBus.js](../core/EventBus.js))
The central event dispatcher that manages all event subscriptions and emissions.

**Key Methods:**
- `on(eventName, callback)` - Subscribe to an event
- `once(eventName, callback)` - Subscribe to an event that fires only once
- `off(eventName, callback)` - Unsubscribe from an event
- `emit(eventName, data)` - Emit an event with data
- `clear(eventName)` - Clear all listeners for an event

**Usage:**
```javascript
import { eventBus } from './core/EventBus.js';

// Subscribe to an event
const unsubscribe = eventBus.on('enemy:defeated', (data) => {
  console.log(`Enemy defeated at (${data.x}, ${data.y})`);
});

// Emit an event
eventBus.emit('enemy:defeated', { enemy, x: 5, y: 10, points: 100 });

// Unsubscribe
unsubscribe();
```

### EventTypes ([core/EventTypes.js](../core/EventTypes.js))
Centralized constant definitions for all event names to prevent typos and enable autocomplete.

**Event Categories:**

#### Combat Events
- `ENEMY_DEFEATED` - When an enemy is defeated
- `COMBO_ACHIEVED` - When a combo kill occurs
- `PLAYER_DAMAGED` - When the player takes damage
- `POINT_AWARDED` - When points are awarded
- `MULTIPLIER_CHANGED` - When the combo multiplier changes

#### Game State Events
- `GAME_RESET` - When the game is reset
- `GAME_INITIALIZED` - When the game is initialized
- `GAME_OVER` - When the game ends
- `GAME_STATE_LOADED` - When game state is loaded
- `GAME_STATE_SAVED` - When game state is saved

#### Zone Events
- `ZONE_CHANGED` - When the player changes zones
- `ZONE_INITIALIZED` - When a new zone is generated
- `REGION_CHANGED` - When the player enters a new region

#### Player Events
- `PLAYER_MOVED` - When the player moves
- `PLAYER_STATS_CHANGED` - When player stats change (health, points, etc.)
- `PLAYER_POSITION_CHANGED` - When player position changes

#### Treasure Events
- `TREASURE_FOUND` - When treasure is discovered
- `ITEM_ADDED` - When an item is added to inventory

#### UI Events
- `MESSAGE_LOGGED` - When a message is logged
- `PANEL_OPENED` - When a UI panel opens
- `PANEL_CLOSED` - When a UI panel closes

#### Animation Events
- `ANIMATION_REQUESTED` - When an animation is requested
- `ANIMATION_COMPLETED` - When an animation completes

#### Audio Events
- `SOUND_PLAY` - When a sound should play
- `MUSIC_CHANGE` - When background music should change

## Manager Integration

### Event Publishers (Emit Events)

#### CombatManager ([managers/CombatManager.js](../managers/CombatManager.js))
**Emits:**
- `ENEMY_DEFEATED` - After defeating an enemy
- `COMBO_ACHIEVED` - When a combo occurs
- `PLAYER_STATS_CHANGED` - After combat affects player stats
- `ANIMATION_REQUESTED` - For point and horse charge animations

**Example:**
```javascript
eventBus.emit(EventTypes.ENEMY_DEFEATED, {
    enemy,
    points: enemy.getPoints(),
    x: enemyX,
    y: enemyY,
    isComboKill: consecutive >= 2
});
```

#### GameStateManager ([core/GameStateManager.js](../core/GameStateManager.js))
**Emits:**
- `GAME_RESET` - When the game is reset
- `TREASURE_FOUND` - When treasure is added to inventory
- `PLAYER_STATS_CHANGED` - After inventory changes
- `MUSIC_CHANGE` - When music should change for a zone

**Example:**
```javascript
eventBus.emit(EventTypes.TREASURE_FOUND, {
    itemType: 'bomb',
    quantity: 1,
    message: 'Treasure Found: Bomb added to inventory.'
});
```

#### ZoneManager ([managers/ZoneManager.js](../managers/ZoneManager.js))
**Emits:**
- `ZONE_CHANGED` - When transitioning to a new zone
- `PLAYER_MOVED` - After zone transition positioning

**Example:**
```javascript
eventBus.emit(EventTypes.ZONE_CHANGED, {
    x: newZoneX,
    y: newZoneY,
    dimension,
    regionName: newRegion
});
```

### Event Subscribers (Listen to Events)

#### UIManager ([ui/UIManager.js](../ui/UIManager.js))
**Listens to:**
- `PLAYER_STATS_CHANGED` → `updatePlayerStats()`
- `ENEMY_DEFEATED` → `updatePlayerStats()`
- `TREASURE_FOUND` → `addMessageToLog()` and `updatePlayerStats()`
- `GAME_RESET` → Update all UI components
- `ZONE_CHANGED` → `updateZoneDisplay()`
- `PLAYER_MOVED` → `updatePlayerPosition()`

**Setup:**
```javascript
setupEventListeners() {
    eventBus.on(EventTypes.PLAYER_STATS_CHANGED, () => {
        this.updatePlayerStats();
    });

    eventBus.on(EventTypes.TREASURE_FOUND, (data) => {
        this.addMessageToLog(data.message);
        this.updatePlayerStats();
    });
}
```

#### SoundManager ([core/SoundManager.js](../core/SoundManager.js))
**Listens to:**
- `MUSIC_CHANGE` → `setMusicForZone()`
- `ZONE_CHANGED` → `setMusicForZone()`

**Setup:**
```javascript
setupEventListeners() {
    eventBus.on(EventTypes.MUSIC_CHANGE, (data) => {
        this.setMusicForZone({ dimension: data.dimension });
    });
}
```

#### AnimationManager ([core/DataContracts.js](../core/DataContracts.js))
**Listens to:**
- `ANIMATION_REQUESTED` → Routes to appropriate animation method
- `COMBO_ACHIEVED` → `addMultiplierAnimation()`

**Setup:**
```javascript
setupEventListeners() {
    eventBus.on(EventTypes.ANIMATION_REQUESTED, (data) => {
        switch (data.type) {
            case 'point':
                this.addPointAnimation(data.x, data.y, data.data.amount);
                break;
            case 'horseCharge':
                this.addHorseChargeAnimation(data.data);
                break;
        }
    });
}
```

## Benefits

### 1. Decoupling
Managers no longer need direct references to each other. CombatManager doesn't need to know about UIManager or AnimationManager.

### 2. Testability
Easier to test managers in isolation. You can subscribe to events in tests to verify behavior without mocking entire managers.

```javascript
// In tests
let capturedEvent;
eventBus.on(EventTypes.ENEMY_DEFEATED, (data) => {
    capturedEvent = data;
});

// Trigger combat
combatManager.defeatEnemy(enemy);

// Verify event was emitted
expect(capturedEvent).toBeDefined();
expect(capturedEvent.points).toBe(100);
```

### 3. Extensibility
Easy to add new features that react to existing events without modifying existing code.

```javascript
// New analytics system can listen to events
eventBus.on(EventTypes.ENEMY_DEFEATED, (data) => {
    analytics.track('enemy_defeated', { enemyType: data.enemy.enemyType });
});
```

### 4. Maintainability
Clear event definitions in EventTypes.js make it easy to see all possible events in the system.

### 5. Debugging
Can enable debug mode to log all events:

```javascript
eventBus.setDebug(true); // Logs all emitted events
```

## Best Practices

### 1. Always Use EventTypes Constants
```javascript
// Good
eventBus.emit(EventTypes.ENEMY_DEFEATED, data);

// Bad - prone to typos
eventBus.emit('enemy:defeated', data);
```

### 2. Document Event Data Structures
Add JSDoc comments in EventTypes.js for event data shapes.

```javascript
/**
 * @typedef {Object} EnemyDefeatedEvent
 * @property {Object} enemy - The defeated enemy
 * @property {number} points - Points awarded
 * @property {number} x - Enemy x position
 * @property {number} y - Enemy y position
 */
```

### 3. Unsubscribe When Needed
Store unsubscribe functions and call them when cleaning up:

```javascript
class MyManager {
    constructor() {
        this.unsubscribers = [];
    }

    setupListeners() {
        this.unsubscribers.push(
            eventBus.on(EventTypes.GAME_RESET, () => this.reset())
        );
    }

    cleanup() {
        this.unsubscribers.forEach(unsub => unsub());
    }
}
```

### 4. Error Handling
Event handlers are wrapped in try-catch blocks internally, but you should still handle errors in your listeners.

```javascript
eventBus.on(EventTypes.PLAYER_STATS_CHANGED, (data) => {
    try {
        this.updateUI(data);
    } catch (error) {
        console.error('Failed to update UI:', error);
    }
});
```

## Migration Guide

If you're updating existing code to use the event system:

1. **Identify Direct Manager Calls**
   Look for patterns like `this.game.uiManager.updateSomething()`

2. **Replace with Event Emissions**
   ```javascript
   // Before
   this.game.uiManager.updatePlayerStats();

   // After
   eventBus.emit(EventTypes.PLAYER_STATS_CHANGED, { health, points, hunger, thirst });
   ```

3. **Add Event Listeners**
   In the receiving manager, subscribe to the event:
   ```javascript
   setupEventListeners() {
       eventBus.on(EventTypes.PLAYER_STATS_CHANGED, () => {
           this.updatePlayerStats();
       });
   }
   ```

4. **Update Tests**
   Replace manager mocks with event subscriptions in tests.

## Event Flow Examples

### Example 1: Enemy Defeated
```
Player attacks enemy
    ↓
CombatManager.defeatEnemy()
    ↓
eventBus.emit(EventTypes.ENEMY_DEFEATED, { enemy, points, x, y })
    ↓
    ├→ UIManager: updatePlayerStats()
    ├→ AnimationManager: (already handled via ANIMATION_REQUESTED)
    └→ Analytics: track('enemy_defeated')
```

### Example 2: Zone Transition
```
Player moves to zone exit
    ↓
ZoneManager.transitionToZone()
    ↓
eventBus.emit(EventTypes.ZONE_CHANGED, { x, y, dimension, regionName })
    ↓
    ├→ UIManager: updateZoneDisplay()
    ├→ SoundManager: setMusicForZone()
    └→ MiniMap: renderZoneMap()
```

### Example 3: Treasure Found
```
GameStateManager.addTreasureToInventory()
    ↓
eventBus.emit(EventTypes.TREASURE_FOUND, { itemType, message })
    ↓
    ├→ UIManager: addMessageToLog() + updatePlayerStats()
    └→ AudioService: playSound('pickup')
```

## Troubleshooting

### Events Not Firing
1. Verify the event is being emitted: `eventBus.setDebug(true)`
2. Check that EventTypes constant matches
3. Ensure listener is set up before the event is emitted

### Multiple Listeners Triggering
1. Check if you're setting up listeners multiple times
2. Ensure you're not duplicating subscriptions in constructors that run multiple times

### Memory Leaks
1. Always unsubscribe when components are destroyed
2. Use `eventBus.once()` for one-time events
3. Clear listeners with `eventBus.clear(eventName)` when needed

## Future Enhancements

Potential improvements to the event system:

1. **Event Replay** - Record and replay events for debugging
2. **Event Middleware** - Transform events before they reach listeners
3. **Priority Listeners** - Control order of listener execution
4. **Async Events** - Support async event handlers with promises
5. **Event Batching** - Batch multiple events to reduce handler calls

## Conclusion

The EventBus system provides a clean, maintainable architecture for the Chress game by decoupling managers and enabling a reactive, event-driven design. All new features should use this pattern to maintain consistency and code quality.
