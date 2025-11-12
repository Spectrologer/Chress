# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records (ADRs) for the Chesse project. ADRs document important architectural decisions made during development, including the context, decision, and consequences.

## What is an ADR?

An Architecture Decision Record captures a single architecture decision and its rationale. Each ADR describes:

- **Status**: Whether this decision is proposed, accepted, deprecated, or superseded
- **Context**: The circumstances and factors that influenced the decision
- **Decision**: What was decided and why
- **Consequences**: The positive and negative outcomes of the decision

## Why Use ADRs?

- **Knowledge Preservation**: Captures the "why" behind design decisions for future developers
- **Onboarding**: Helps new team members understand architectural choices
- **Preventing Regression**: Documents why certain approaches were rejected
- **Historical Record**: Provides a timeline of architectural evolution

## ADR Naming Convention

ADRs are numbered sequentially and use kebab-case:

```
0001-use-service-container-for-dependency-injection.md
0002-adopt-event-driven-architecture-with-eventbus.md
0003-implement-position-class-abstraction.md
```

## Creating a New ADR

1. Copy [TEMPLATE.md](TEMPLATE.md) to a new file
2. Number it sequentially (next available number)
3. Give it a descriptive kebab-case name
4. Fill in all sections
5. Set status to "Proposed" initially
6. Update status to "Accepted" when implemented

## ADR Index

| Number | Title | Status | Date |
|--------|-------|--------|------|
| [0001](0001-use-service-container-for-dependency-injection.md) | Use ServiceContainer for Dependency Injection | Accepted | 2024-10 |
| [0002](0002-adopt-event-driven-architecture-with-eventbus.md) | Adopt Event-Driven Architecture with EventBus | Accepted | 2024-10 |
| [0003](0003-implement-position-class-abstraction.md) | Implement Position Class Abstraction | Accepted | 2024-10 |

## Modifying Existing ADRs

- **Never delete** an ADR
- To reverse a decision, create a new ADR that supersedes the old one
- Update the old ADR's status to "Superseded by ADR-XXXX"
- Link between related ADRs

## Status Definitions

- **Proposed**: Under consideration, not yet implemented
- **Accepted**: Decision made and implemented
- **Deprecated**: No longer recommended but still in use
- **Superseded**: Replaced by a newer decision (link to new ADR)

## References

- [Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) by Michael Nygard
- [ADR GitHub Organization](https://adr.github.io/)
