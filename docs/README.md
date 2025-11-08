# Chress Documentation

Complete documentation for the Chress game project.

## 📋 Quick Navigation

### Getting Started
- [Project Overview](PROJECT_OVERVIEW.md) - Complete architecture and system overview
- [Build & Deployment](BUILD.md) - Building and deploying the game
- [TypeScript Quickstart](TYPESCRIPT_QUICKSTART.md) - Working with TypeScript in the project

### Development Guides
- [Adding Content](ADDING_CONTENT.md) - How to add items, NPCs, enemies, and zones
- [Testing Guide](TESTING.md) - Testing strategies and running tests
- [Error Handling](ERROR_HANDLING.md) - Error management patterns
- [Type Checking Migration Guide](TYPE_CHECKING_MIGRATION_GUIDE.md) - Runtime type validation
- [TypeScript Strict Mode Migration](TYPESCRIPT_STRICT_MODE_QUICKSTART.md) - ⚡ NEW: Incremental strict mode enablement

### Architecture
- [State Management](STATE_MANAGEMENT_SUMMARY.md) - Game state architecture
- [PWA & Lazy Loading](PWA-LAZY-LOADING.md) - Progressive Web App features
- [File Organization](FILE_ORGANIZATION.md) - Codebase structure
- [Architecture Decision Records](adr/README.md) - Design decisions and rationale

### Recent Changes
- [Refactoring Summary](../REFACTORING_SUMMARY.md) - GameContext god object refactoring
- [Code Quality Analysis](../CODE_QUALITY_ANALYSIS.md) - Current code quality metrics
- [TypeScript Migration Progress](TYPESCRIPT_MIGRATION_PROGRESS.md) - Migration history
- [Migration Complete](MIGRATION_COMPLETE.md) - Position class migration

## 🎯 By Task

### I want to...

#### Add New Content
- **Add a new item** → [Adding Content Guide](ADDING_CONTENT.md#adding-items)
- **Create an NPC** → [Adding Content Guide](ADDING_CONTENT.md#adding-npcs)
- **Add an enemy type** → [Adding Content Guide](ADDING_CONTENT.md#adding-enemies)
- **Create a custom zone** → [Adding Content Guide](ADDING_CONTENT.md#adding-zones)

#### Understand the Codebase
- **Overall architecture** → [Project Overview](PROJECT_OVERVIEW.md)
- **How state works** → [State Management Summary](STATE_MANAGEMENT_SUMMARY.md)
- **How to find files** → [File Organization](FILE_ORGANIZATION.md)
- **Design patterns used** → [Architecture Decision Records](adr/README.md)

#### Build & Deploy
- **Build the project** → [Build Guide](BUILD.md#building)
- **Deploy to production** → [Build Guide](BUILD.md#deployment)
- **Configure PWA** → [PWA & Lazy Loading Guide](PWA-LAZY-LOADING.md)

#### Test & Debug
- **Run tests** → [Testing Guide](TESTING.md#running-tests)
- **Write new tests** → [Testing Guide](TESTING.md#writing-tests)
- **Handle errors** → [Error Handling Guide](ERROR_HANDLING.md)

#### Contribute
- **Understand recent changes** → [Refactoring Summary](../REFACTORING_SUMMARY.md)
- **Code quality standards** → [Code Quality Analysis](../CODE_QUALITY_ANALYSIS.md)
- **TypeScript conventions** → [TypeScript Quickstart](TYPESCRIPT_QUICKSTART.md)
- **Help with strict mode migration** → [TypeScript Strict Mode Migration](TYPESCRIPT_STRICT_MODE_QUICKSTART.md)

## 📊 Project Status

**Current Version**: 1.1.0
**Codebase**: 51.5k lines TypeScript (298 files)
**Test Coverage**: 576 passing tests
**Migration Status**: ✅ 100% TypeScript (0 JavaScript files remaining)
**Strict Mode Status**: 🔄 In Progress (0% complete - see [migration guide](TYPESCRIPT_STRICT_MODE_QUICKSTART.md))
**Architecture**: ✅ GameContext refactored (god object eliminated)
**Code Quality Score**: 8.0/10

## 🏗️ Architecture Overview

### Core Systems
- **GameContext** - Central game state (refactored with ManagerRegistry, Facades, TurnState)
- **ServiceContainer** - Dependency injection with 30+ services
- **EventBus** - Event-driven architecture for loose coupling
- **Managers** - 30+ specialized managers for game logic
- **Renderers** - Strategy pattern for rendering different tile types
- **Generators** - Procedural zone, item, and enemy generation

### Design Patterns
- Dependency Injection (ServiceContainer)
- Event-Driven Architecture (EventBus)
- Facade Pattern (Domain-specific APIs)
- Strategy Pattern (Item effects, rendering)
- Repository Pattern (Data access)
- Composition over Inheritance (ManagerRegistry, TurnState)

## 📚 Documentation Categories

### System Documentation
- [EventListenerManager](EventListenerManager.md) - Event listener management
- [State Testing Checklist](STATE_TESTING_CHECKLIST.md) - State system testing

### Migration History
- [TypeScript Migration Progress](TYPESCRIPT_MIGRATION_PROGRESS.md)
- [Migration Complete](MIGRATION_COMPLETE.md)
- [Migration Guide](MIGRATION_GUIDE.md)
- [Phase 1 & 2 Completion](PHASE_1_2_COMPLETION.md)
- [Storage Migration Complete](STORAGE_MIGRATION_COMPLETE.md)

### Implementation Notes
- [Implementation Complete](IMPLEMENTATION_COMPLETE.md)
- [UI Testing Complete](UI_TESTING_COMPLETE.md)
- [Documentation Improvements](DOCUMENTATION_IMPROVEMENTS.md)

### Reference
- [ESLint Event Types Rule](ESLINT_EVENT_TYPES_RULE.md)
- [Magic Numbers Refactor](MAGIC_NUMBERS_REFACTOR.md)
- [Asset Discovery](ASSET_DISCOVERY.md)

## 🔗 External Resources

- **Repository**: https://github.com/Spectrologer/Chress
- **Live Game**: https://spectrologer.github.io/Chress/
- **Issues**: https://github.com/Spectrologer/Chress/issues

## 🤝 Contributing

See the main [README.md](../README.md) for contribution guidelines.

---

**Last Updated**: November 7, 2025
**Documentation Version**: 1.1.0
