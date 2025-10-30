# ADR-XXXX: [Short Title of Decision]

## Status

[Proposed | Accepted | Deprecated | Superseded by ADR-YYYY]

## Date

YYYY-MM-DD

## Context

[Describe the issue or problem that motivated this decision. Include:
- What forces are at play (technical, business, social, political)?
- What constraints exist?
- What are the current pain points?
- What alternatives were considered?]

Example:
> As the codebase grew to 30+ managers and services, managing dependencies became increasingly complex. Direct instantiation and circular dependencies made testing difficult and coupling was high between components.

## Decision

[State the decision that was made. Use full sentences and active voice:
"We will use X" rather than "X should be used"]

Example:
> We will use a centralized ServiceContainer for dependency injection with lazy initialization. All game systems will access dependencies through the container rather than direct instantiation.

## Consequences

### Positive

- [List positive outcomes and benefits]
- [Include improvements to code quality, maintainability, performance, etc.]

Example:
- Improved testability through easy mocking and dependency injection
- Reduced circular dependencies
- Lazy initialization reduces startup time
- Clear dependency graph

### Negative

- [List drawbacks, costs, or limitations]
- [Be honest about trade-offs]

Example:
- Additional indirection when accessing services
- Requires discipline to avoid service locator anti-pattern
- Initial setup overhead for new services

### Neutral

- [List other effects that are neither clearly positive nor negative]

Example:
- All services must be registered in ServiceContainer
- Developers need to learn the container API

## Implementation Notes

[Optional: Include specific implementation details, code examples, or migration steps]

Example:
```javascript
// Old way (direct instantiation)
this.combatManager = new CombatManager(game);

// New way (through container)
this.combatManager = game.services.get('combatManager');
```

## Related Decisions

- [Link to related ADRs]
- ADR-YYYY: [Related decision title]

## References

- [Links to relevant documentation, discussions, or external resources]
- [Links to related PRs or commits]
