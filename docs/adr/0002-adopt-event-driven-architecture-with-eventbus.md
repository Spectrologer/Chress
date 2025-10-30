# ADR-0002: Adopt Event-Driven Architecture with EventBus

## Status

Accepted

## Date

2024-10-15

## Context

The game's various systems (combat, UI, rendering, sound, zone transitions) needed to communicate with each other. Initial implementations used direct method calls between components, leading to:

- **Tight Coupling**: Components needed direct references to many other components
- **Circular Dependencies**: A calls B, B calls C, C calls A
- **Hard to Test**: Mocking required extensive setup of interconnected systems
- **Inflexible**: Adding new reactions to game events required modifying multiple files
- **Poor Separation of Concerns**: UI code knew about combat internals, combat knew about rendering, etc.

Alternatives considered:
1. **Direct Method Calls**: Current problematic approach
2. **Observer Pattern**: Each component maintains observer lists (lots of boilerplate)
3. **Event Bus/Pub-Sub**: Centralized event system (chosen)
4. **Redux-style State Management**: Too heavyweight for a vanilla JS game

## Decision

We will implement a centralized `EventBus` using the publish-subscribe pattern. All cross-system communication will flow through event emission and subscription rather than direct method calls.

Key principles:
- Systems emit events when state changes occur
- Other systems subscribe to relevant events
- No system directly calls methods on unrelated systems
- Events are fire-and-forget (no return values expected)

Implementation at [src/core/EventBus.js](../../src/core/EventBus.js)

## Consequences

### Positive

- **Loose Coupling**: Systems don't need direct references to each other
- **Easy to Extend**: New features can react to existing events without modifying existing code
- **Better Testing**: Can test event emission and handling independently
- **Clearer Data Flow**: Event names document what state changes occur in the system
- **Flexible Reactions**: Multiple systems can react to the same event independently
- **No Circular Dependencies**: Events flow one direction (emit → handle)

### Negative

- **Debugging Complexity**: Event flow can be harder to trace than direct method calls
- **String-Based Event Types**: Event names are strings (potential for typos, not type-safe)
- **Event Proliferation**: Can lead to many events if not carefully designed
- **Indirect Code Flow**: Understanding system behavior requires finding all subscribers

### Neutral

- Event types should be documented (currently scattered across code)
- Need discipline to avoid overusing events for simple local operations

## Implementation Notes

### Event Emission

```javascript
// Combat system emits enemy defeat event
this.eventBus.emit('enemyDefeated', {
    enemy: enemy,
    position: { x: enemy.x, y: enemy.y },
    pointsAwarded: points
});
```

### Event Subscription

```javascript
// UI system subscribes to enemy defeat events
this.eventBus.on('enemyDefeated', (data) => {
    this.updateScore(data.pointsAwarded);
    this.showDefeatAnimation(data.position);
});
```

### Common Event Categories

- **Combat Events**: `enemyDefeated`, `playerDamaged`, `combatResolved`
- **Zone Events**: `zoneTransition`, `zoneGenerated`
- **UI Events**: `inventoryChanged`, `dialogueStarted`, `menuOpened`
- **Audio Events**: `playSound`, `stopSound`
- **Item Events**: `itemPickedUp`, `itemUsed`, `itemDropped`

## Related Decisions

- ADR-0001: Use ServiceContainer for Dependency Injection (EventBus accessed through container)

## References

- [Publish-Subscribe Pattern](https://en.wikipedia.org/wiki/Publish%E2%80%93subscribe_pattern)
- Implementation: [src/core/EventBus.js](../../src/core/EventBus.js)
- Event usage examples: [src/managers/CombatManager.js](../../src/managers/CombatManager.js)
