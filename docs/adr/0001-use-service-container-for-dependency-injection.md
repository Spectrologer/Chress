# ADR-0001: Use ServiceContainer for Dependency Injection

## Status

Accepted

## Date

2024-10-15

## Context

As the Chesse codebase grew to include 30+ managers, renderers, and game systems, managing dependencies became increasingly complex. Key challenges included:

- **Circular Dependencies**: Direct instantiation often led to circular dependency issues between managers
- **Testing Difficulty**: Mocking dependencies required extensive setup and was error-prone
- **Tight Coupling**: Components were tightly coupled through direct instantiation
- **Initialization Order**: Managing the correct order of service initialization was becoming unmanageable
- **Code Duplication**: Many components repeated similar initialization patterns

Alternative approaches considered:
1. **Manual Dependency Injection**: Pass dependencies through constructors (too verbose for 30+ services)
2. **Global Singleton Pattern**: Use global instances (prevents testing and creates hidden dependencies)
3. **Factory Pattern**: Create factories for each service type (lots of boilerplate)
4. **Service Container with Lazy Loading**: Current choice

## Decision

We will implement a centralized `ServiceContainer` class with lazy initialization for all game services. The container will:

- Store service factory functions in a registry
- Instantiate services only when first accessed (lazy initialization)
- Allow manual service injection for testing
- Maintain a single source of truth for service dependencies

Key implementation at [src/core/ServiceContainer.js](../../src/core/ServiceContainer.js)

## Consequences

### Positive

- **Improved Testability**: Tests can easily mock individual services without initializing entire game
- **Reduced Startup Time**: Lazy initialization means only needed services are created
- **Clear Dependency Graph**: All dependencies explicitly registered in one place
- **Eliminated Circular Dependencies**: Services can reference each other through the container
- **Better Separation of Concerns**: Services don't need to know how to construct their dependencies
- **Simplified Testing**: `services.set('serviceName', mockService)` makes mocking trivial

### Negative

- **Indirection**: Accessing services requires `game.services.get('serviceName')` instead of direct property access
- **String-Based Keys**: Service names are strings, not type-safe (potential for typos)
- **Learning Curve**: New developers need to understand the container pattern
- **Service Locator Risk**: Could be misused as a service locator anti-pattern if not disciplined

### Neutral

- All new services must be registered in `_buildServiceRegistry()` method
- Services must be accessed via container, not stored as direct properties (enforces consistency)

## Implementation Notes

### Service Registration

```javascript
_buildServiceRegistry() {
    return {
        'textureManager': (container) => new TextureManager(),
        'combatManager': (container) => new CombatManager(
            container.game,
            container.get('eventBus')
        ),
        // ... 30+ more services
    };
}
```

### Service Access

```javascript
// Old approach (before ServiceContainer)
constructor(game) {
    this.combatManager = new CombatManager(game);
    this.renderManager = new RenderManager(game);
}

// New approach (with ServiceContainer)
constructor(game) {
    this.combatManager = game.services.get('combatManager');
    this.renderManager = game.services.get('renderManager');
}

// In tests
game.services.set('combatManager', mockCombatManager);
```

### Lazy Initialization

Services are only created when first accessed:

```javascript
get(serviceName) {
    if (!this._instances.has(serviceName)) {
        this._instances.set(serviceName, this._createService(serviceName));
    }
    return this._instances.get(serviceName);
}
```

## Related Decisions

- ADR-0002: Adopt Event-Driven Architecture with EventBus (uses container to access EventBus)

## References

- [Dependency Injection Pattern](https://martinfowler.com/articles/injection.html) by Martin Fowler
- [Service Locator vs Dependency Injection](https://blog.ploeh.dk/2010/02/03/ServiceLocatorisanAnti-Pattern/)
- Implementation: [src/core/ServiceContainer.js](../../src/core/ServiceContainer.js)
