# Dependency Facade Pattern

## Problem: Manager Dependency Overload

Many managers in the codebase suffered from excessive constructor parameters (4-8+ dependencies), making them:
- Hard to instantiate and test
- Difficult to understand at a glance
- Prone to parameter ordering errors
- Challenging to maintain as the codebase grows

### Example: InteractionManager Before

```javascript
constructor(
    game,
    inputManager,           // 9 total parameters!
    npcManager,
    itemPickupManager,
    combatActionManager,
    bombManager,
    terrainManager,
    zoneManager,
    environmentManager
)
```

## Solution: Group Related Dependencies into Facades

The Facade Pattern groups related dependencies into cohesive interfaces, reducing constructor parameter counts and improving code organization.

### Key Benefits

1. **Reduced Complexity**: InteractionManager went from 9 parameters to 4
2. **Better Organization**: Related dependencies are grouped logically
3. **Easier Testing**: Mock a single facade instead of 8+ individual managers
4. **Improved Maintainability**: Changes to grouped dependencies are localized
5. **Clearer Intent**: Facade names communicate purpose (InteractionFacade, CombatFacade)

## Implementation

### Step 1: Identify Dependency Groups

Analyze constructor parameters and group by domain/responsibility:

**InteractionManager Dependencies Analysis:**
```
UI/Interaction Group:
- inputManager
- npcManager
- environmentManager

Combat Group:
- combatActionManager
- bombManager

World Group:
- terrainManager
- zoneManager
- itemPickupManager
```

### Step 2: Create Facade Classes

Create facade classes in `facades/` directory:

**facades/InteractionFacade.js**
```javascript
export class InteractionFacade {
    constructor(npcManager, environmentManager, inputManager) {
        this.npcManager = npcManager;
        this.environmentManager = environmentManager;
        this.inputManager = inputManager;
    }

    // Delegate methods to underlying managers
    interactWithPenne(coords) {
        return this.npcManager.interactWithPenne(coords);
    }

    handleSignTap(coords) {
        return this.environmentManager.handleSignTap(coords);
    }

    // ... other delegated methods
}
```

**facades/CombatFacade.js**
```javascript
export class CombatFacade {
    constructor(combatActionManager, bombManager) {
        this.combatActionManager = combatActionManager;
        this.bombManager = bombManager;
    }

    isValidBishopSpearCharge(gridCoords, playerPos) {
        return this.combatActionManager.isValidBishopSpearCharge(gridCoords, playerPos);
    }

    handleBombPlacement(gridCoords) {
        return this.bombManager.handleBombPlacement(gridCoords);
    }

    // ... other combat methods
}
```

**facades/WorldFacade.js**
```javascript
export class WorldFacade {
    constructor(terrainManager, zoneManager, itemPickupManager) {
        this.terrainManager = terrainManager;
        this.zoneManager = zoneManager;
        this.itemPickupManager = itemPickupManager;
    }

    canChopTree(x, y) {
        return this.terrainManager.canChopTree(x, y);
    }

    checkForZoneTransitionGesture(tapCoords, playerPos) {
        return this.zoneManager.checkForZoneTransitionGesture(tapCoords, playerPos);
    }

    // ... other world interaction methods
}
```

### Step 3: Refactor Manager Constructor

**Before (9 parameters):**
```javascript
constructor(
    game,
    inputManager,
    npcManager,
    itemPickupManager,
    combatActionManager,
    bombManager,
    terrainManager,
    zoneManager,
    environmentManager
)
```

**After (4 parameters):**
```javascript
constructor(game, interactionFacade, combatFacade, worldFacade) {
    this.game = game;

    // Store facades
    this.interactionFacade = interactionFacade;
    this.combatFacade = combatFacade;
    this.worldFacade = worldFacade;

    // Maintain backward compatibility if needed
    this.npcManager = interactionFacade.npcManager;
    this.bombManager = combatFacade.bombManager;
    // ... etc
}
```

### Step 4: Update ServiceContainer

Register facades in the service container:

```javascript
// In ServiceContainer._buildServiceRegistry():
{
    // Create facades
    interactionFacade: () => new InteractionFacade(
        this.get('npcInteractionManager'),
        this.get('environmentalInteractionManager'),
        this.get('inputManager')
    ),

    combatFacade: () => new CombatFacade(
        this.get('combatActionManager'),
        this.get('bombManager')
    ),

    worldFacade: () => new WorldFacade(
        this.get('terrainInteractionManager'),
        this.get('zoneTransitionManager'),
        this.get('itemPickupManager')
    ),

    // Use facades in manager construction
    interactionManager: () => new InteractionManager(
        this.game,
        this.get('interactionFacade'),
        this.get('combatFacade'),
        this.get('worldFacade')
    )
}
```

### Step 5: Update Tests

Mock facades instead of individual managers:

**Before:**
```javascript
new InteractionManager(
    mockGame,
    mockInputManager,
    mockNpcManager,
    mockItemPickupManager,
    mockCombatActionManager,
    mockBombManager,
    mockTerrainManager,
    mockZoneManager,
    mockEnvironmentManager
)
```

**After:**
```javascript
const mockInteractionFacade = {
    npcManager: {},
    environmentManager: {},
    inputManager: {}
};

const mockCombatFacade = {
    combatActionManager: {},
    bombManager: {}
};

const mockWorldFacade = {
    terrainManager: {},
    zoneManager: {},
    itemPickupManager: {}
};

new InteractionManager(
    mockGame,
    mockInteractionFacade,
    mockCombatFacade,
    mockWorldFacade
)
```

## When to Use This Pattern

Apply the facade pattern when a manager has:
- **4+ constructor parameters** (excluding game instance)
- **Related dependencies** that logically group together
- **Complex initialization** in tests or ServiceContainer
- **Clear domain boundaries** (UI, Combat, World, etc.)

## When NOT to Use

Don't create facades when:
- Manager has 3 or fewer dependencies
- Dependencies don't have clear groupings
- Dependencies are unrelated to each other
- It would add unnecessary indirection

## Candidate Managers for Refactoring

Other managers that could benefit from this pattern:

1. **CombatManager** (currently 4 params - borderline)
   - Could group: bombManager + defeatFlow into CombatSystemFacade

2. **ZoneTransitionManager** (currently 2 params - fine as is)

3. **Any future managers** that grow beyond 4 parameters

## Best Practices

1. **Name facades descriptively**: Use domain names (InteractionFacade, CombatFacade)
2. **Keep facades thin**: Facades should mostly delegate, not add logic
3. **Maintain backward compatibility**: Expose underlying managers if existing code depends on them
4. **Document facade purpose**: Clear JSDoc explaining what the facade groups
5. **Test facade delegation**: Ensure facade methods properly delegate to underlying managers

## Results

### InteractionManager Metrics

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Constructor params | 9 | 4 | 56% reduction |
| Test mock setup | 9 mocks | 3 mocks | 67% simpler |
| Lines in ServiceContainer | 10 | 4 | 60% cleaner |
| Cognitive load | High | Medium | Easier to understand |

## Related Patterns

- **Facade Pattern** (GoF): Provides simplified interface to complex subsystem
- **Dependency Injection**: All dependencies still injected, just grouped
- **Service Locator**: ServiceContainer manages facade lifecycle

## References

- [InteractionManager.js](../../managers/InteractionManager.js) - Refactored implementation
- [InteractionFacade.js](../../facades/InteractionFacade.js) - Interaction dependency facade
- [CombatFacade.js](../../facades/CombatFacade.js) - Combat dependency facade
- [WorldFacade.js](../../facades/WorldFacade.js) - World dependency facade
- [ServiceContainer.js](../ServiceContainer.js) - Facade registration and wiring
