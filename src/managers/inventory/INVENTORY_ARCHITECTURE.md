# Inventory Management Architecture

## Overview

The inventory management system has been refactored to follow a unified **Strategy Pattern** that eliminates duplicate logic across multiple files and provides a clean separation of concerns.

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    UI Layer (Presentation)                   │
│  ┌──────────────────────┐  ┌──────────────────────────────┐ │
│  │   InventoryUI.js     │  │   RadialInventoryUI.js       │ │
│  │  - Rendering         │  │   - Radial rendering         │ │
│  │  - Event handling    │  │   - Radial interactions      │ │
│  └──────────┬───────────┘  └──────────┬───────────────────┘ │
└─────────────┼──────────────────────────┼─────────────────────┘
              │                          │
              ▼                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Interaction Layer (Coordination)                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │       InventoryInteractionHandler.js                 │   │
│  │  - UI-to-service bridge                              │   │
│  │  - Bomb placement mode coordination                  │   │
│  │  - Item usage delegation                             │   │
│  └──────────┬──────────────────────┬────────────────────┘   │
└─────────────┼──────────────────────┼────────────────────────┘
              │                      │
              ▼                      ▼
┌─────────────────────────────────────────────────────────────┐
│               Service Layer (Business Logic)                 │
│  ┌──────────────────┐  ┌──────────────────────────────────┐ │
│  │ InventoryService │  │    ItemEffectStrategy.js         │ │
│  │  - Orchestration │  │    - Effect delegation           │ │
│  │  - Pickup/Drop   │  │    ┌──────────────────────────┐  │ │
│  │  - UI updates    │  │    │  Effect Implementations  │  │ │
│  └────────┬─────────┘  │    │  - BombEffect           │  │ │
│           │            │    │  - BowEffect            │  │ │
│           │            │    │  - ConsumableEffects    │  │ │
│           │            │    │  - ToolEffects          │  │ │
│           │            │    └──────────────────────────┘  │ │
│           │            └──────────────────────────────────┘ │
└───────────┼────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│              Domain Layer (Data & State)                     │
│  ┌──────────────────┐  ┌──────────────────────────────────┐ │
│  │ ItemRepository   │  │      BombManager.js              │ │
│  │  - Inventory ops │  │      - Bomb timer management     │ │
│  │  - Stack logic   │  │      - Placement logic           │ │
│  │  - Cleanup       │  │      - Explosion logic           │ │
│  └──────────────────┘  └──────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Key Components

### 1. InventoryInteractionHandler (NEW)
**Location:** `managers/inventory/InventoryInteractionHandler.js`

**Purpose:** Unified interaction layer that eliminates duplicate UI logic

**Responsibilities:**
- Handle item usage requests from both UI layers
- Coordinate bomb placement mode entry
- Delegate to appropriate services (InventoryService, BombManager)
- Provide consistent behavior across main and radial inventories

**Key Methods:**
- `handleItemUse(item, options)` - Main entry point for item usage
- `handleBombInteraction(item, options)` - Special bomb handling logic
- `executeBombPlacement(gridCoords)` - Execute bomb placement via BombManager

### 2. InventoryService
**Location:** `managers/inventory/InventoryService.js`

**Purpose:** Business logic orchestration for inventory management

**Responsibilities:**
- Orchestrate item pickup (repository + sound + animation)
- Orchestrate item usage (effect + repository cleanup)
- Orchestrate item drop (grid placement + repository removal)
- High-level inventory operations

### 3. ItemEffectStrategy
**Location:** `managers/inventory/ItemEffectStrategy.js`

**Purpose:** Strategy pattern for applying item effects

**Effect Types:**
- **ConsumableEffects:** Food, Water, Heart
- **ToolEffects:** Axe, Hammer
- **WeaponEffects:** Bomb, Bow, Bishop Spear, Horse Icon
- **SpecialEffects:** Shovel, Note, Book of Time Travel

### 4. BombManager
**Location:** `managers/BombManager.js`

**Purpose:** Centralized bomb state and behavior management

**Responsibilities:**
- Passive bomb timer management (tick and explode)
- Active bomb placement from inventory
- Bomb trigger/detonation from player interaction
- Inventory cleanup after placement

## Bomb Logic Consolidation

### Problem
Bomb placement logic was duplicated in 4 places:
1. [InventoryUI.js:317-330](../../ui/InventoryUI.js#L317-L330) - Manual double-click placement
2. [RadialInventoryUI.js:171-188](../../ui/RadialInventoryUI.js#L171-L188) - Radial menu placement
3. [BombManager.js:51-90](../BombManager.js#L51-L90) - Centralized handler
4. [WeaponEffects.js:8-40](effects/WeaponEffects.js#L8-L40) - BombEffect strategy

### Solution
**Single Source of Truth:** `InventoryInteractionHandler`

**Flow:**
```
InventoryUI (double-click)
    ↓
InventoryInteractionHandler.handleBombInteraction({ isDoubleClick: true })
    ↓
_placeImmediateBomb() → Place at player position
    ↓
InventoryService.useItem() → Consume from inventory
```

```
RadialInventoryUI (single-click)
    ↓
InventoryInteractionHandler.handleItemUse({ fromRadial: true })
    ↓
handleBombInteraction({ isDoubleClick: false })
    ↓
_enterBombPlacementMode() → Show adjacent tiles
    ↓
[User clicks tile]
    ↓
BombManager.handleBombPlacement() → Place + consume + enemy turn
```

## Integration Points

### Game Initialization
The game instance must initialize the interaction handler:

```javascript
// In GameInitializer.js or similar
this.inventoryInteractionHandler = new InventoryInteractionHandler(this);
```

### UI Components
UI components delegate to the handler instead of implementing logic:

```javascript
// InventoryUI.js
this.game.inventoryInteractionHandler.handleBombInteraction(item, {
    fromRadial: false,
    isDoubleClick: isDouble
});

// RadialInventoryUI.js
this.game.inventoryInteractionHandler.handleItemUse(item, {
    fromRadial: true,
    isDoubleClick: false
});
```

### Effect Strategies
Effect strategies check for the handler and delegate:

```javascript
// WeaponEffects.js - BombEffect
if (game.inventoryInteractionHandler) {
    const success = game.inventoryInteractionHandler.handleBombInteraction(item, {
        fromRadial,
        isDoubleClick
    });
    return { consumed: isDoubleClick, success };
}
```

## Benefits

### 1. **No More Duplication**
- Bomb placement logic exists in ONE place
- Inventory removal logic unified
- Consistent behavior across UI components

### 2. **Clear Separation of Concerns**
- **UI Layer:** Rendering and event handling only
- **Interaction Layer:** Coordination and delegation
- **Service Layer:** Business logic
- **Domain Layer:** Data and state management

### 3. **Easier Testing**
- Test interaction logic independently of UI
- Mock services cleanly
- Centralized behavior verification

### 4. **Maintainability**
- Single source of truth for each behavior
- Easy to trace logic flow
- Clear dependency chain

### 5. **Extensibility**
- Add new item types by creating new Effect classes
- Extend interaction patterns in one place
- No need to update multiple UI files

## Migration Notes

### Before (Scattered Logic)
```javascript
// Logic was spread across 6+ files:
- InventoryManager.js (delegates)
- InventoryService.js (business logic)
- InventoryUI.js (rendering + bomb logic)
- RadialInventoryUI.js (rendering + bomb logic)
- ActionManager.js (weapon charges + explosions)
- BombManager.js (partial consolidation)
```

### After (Unified Pattern)
```javascript
// Clear layered architecture:
UI → InventoryInteractionHandler → Services → Domain
```

## Future Improvements

1. **Remove Legacy Fallbacks:** Once fully integrated, remove the fallback logic in UI components
2. **Consolidate ActionManager:** Move weapon charge logic to WeaponEffects
3. **Event-Driven Updates:** Replace direct UI updates with event bus emissions
4. **Dependency Injection:** Pass dependencies via constructor instead of game instance
5. **Type Safety:** Add JSDoc types or migrate to TypeScript

## Testing Strategy

### Unit Tests
- Test `InventoryInteractionHandler` methods in isolation
- Mock dependencies (game, services)
- Verify correct delegation to services

### Integration Tests
- Test full flow from UI click to inventory update
- Verify bomb placement from both UIs works consistently
- Test edge cases (no bombs, full inventory, etc.)

### Regression Tests
- Ensure existing bomb placement behavior unchanged
- Verify all item types still work correctly
- Test radial inventory migration

## References

- [InventoryInteractionHandler.js](InventoryInteractionHandler.js)
- [InventoryService.js](InventoryService.js)
- [ItemEffectStrategy.js](ItemEffectStrategy.js)
- [BombManager.js](../BombManager.js)
- [InventoryUI.js](../../ui/InventoryUI.js)
- [RadialInventoryUI.js](../../ui/RadialInventoryUI.js)
