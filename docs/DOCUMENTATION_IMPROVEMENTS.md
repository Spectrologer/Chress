# Documentation Improvement Recommendations

This document outlines the current state of documentation in the Chesse project and provides actionable recommendations for improvement.

## Current State Analysis

### Strengths

1. **Excellent High-Level Documentation**
   - [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) is comprehensive (450 lines) covering architecture, systems, and file structure
   - [ADDING_CONTENT.md](ADDING_CONTENT.md) provides clear guide for adding items, NPCs, and enemies
   - Good specialized docs: ERROR_HANDLING.md, INVENTORY_ARCHITECTURE.md, MIGRATION_COMPLETE.md

2. **Well-Documented Files** (Examples of good documentation)
   - [src/core/ServiceContainer.js](../src/core/ServiceContainer.js) - Clear JSDoc comments on all public methods
   - [src/core/Position.js](../src/core/Position.js) - Comprehensive file header and method documentation
   - [src/enemy/EnemyPathfinding.js](../src/enemy/EnemyPathfinding.js) - Good inline comments explaining movement types

### Weaknesses

1. **Inconsistent JSDoc Usage**
   - Many files have no JSDoc comments at all
   - Method parameters often undocumented
   - Return types rarely specified
   - No `@throws` documentation for error cases

2. **Complex Algorithms Lack Explanatory Comments**
   - 9 files identified with complex algorithms needing better documentation (see below)
   - Mathematical calculations often unexplained
   - AI decision-making logic has minimal comments
   - Procedural generation algorithms lack high-level overviews

3. **Missing Architecture Decision Records (ADRs)**
   - No historical record of why architectural decisions were made
   - New developers can't understand reasoning behind patterns
   - Risk of undoing good decisions without understanding consequences

4. **No API Documentation**
   - No generated API docs (JSDoc, TypeDoc, etc.)
   - Developers must read source code to understand APIs
   - No quick reference for common operations

---

## Priority 1: Document Complex Algorithms

### Files Requiring Immediate Attention

These 9 files contain complex algorithms that are difficult to understand without comments:

#### 1. AI and Tactical Systems

**[src/enemy/TacticalAI.js](../src/enemy/TacticalAI.js)**
- Lines 22-54: `calculateDirectionDiversity()` needs algorithm overview
- Lines 82-124: `getDefensiveMoves()` needs explanation of distance thresholds
- **Action**: Add multi-line comments explaining quadrant mapping and cooperative behavior

**[src/enemy/MoveCalculators/tactics.js](../src/enemy/MoveCalculators/tactics.js)**
- Lines 4-35: `applyTacticalAdjustments()` needs weight explanation
- Lines 37-72: `applyDefensiveMoves()` needs decision criteria documentation
- **Action**: Add JSDoc and explain multi-factor evaluation algorithm

**[src/enemy/MoveCalculators/base.js](../src/enemy/MoveCalculators/base.js)**
- Lines 19-77: `findPathedMove()` needs step-by-step breakdown
- Lines 81-115: `performLizordBumpAttack()` needs knockback scoring explanation
- **Action**: Add algorithm overview comments at function start

#### 2. Pathfinding and Movement

**[src/enemy/EnemyPathfinding.js](../src/enemy/EnemyPathfinding.js)**
- Lines 5-44: `findPath()` BFS implementation needs better documentation
- Lines 47-115: `getMovementDirectionsForType()` is well-commented but could explain why each enemy has its movement pattern
- **Action**: Add comments explaining path reconstruction logic

#### 3. Procedural Generation

**[src/generators/FeatureGenerator.js](../src/generators/FeatureGenerator.js)**
- Lines 138-186: `carveMaze()` recursive algorithm needs explanation
- Lines 206-262: `blockExitsWithShrubbery()` probability logic needs documentation
- **Action**: Add algorithm overview and explain `dir.dx/2` usage

**[src/generators/PathGenerator.js](../src/generators/PathGenerator.js)**
- Lines 26-69: `clearPathToExit()` directional logic needs explanation
- Lines 71-122: `clearPathToCenter()` bidirectional clearing needs documentation
- **Action**: Explain path clearing strategy

#### 4. Combat Systems

**[src/managers/CombatManager.js](../src/managers/CombatManager.js)**
- Lines 113-224: `handleSingleEnemyMovement()` knight-move animation needs explanation
- Lines 231-310: `checkCollisions()` knockback calculation needs documentation
- **Action**: Document multi-layer tile validation logic

**[src/enemy/EnemyAttack.js](../src/enemy/EnemyAttack.js)**
- Lines 5-68: `performRamFromDistance()` animation step logic needs comments
- Lines 111-144: `performQueenCharge()` charge mechanics needs explanation
- **Action**: Add line-of-sight and knockback algorithm documentation

#### 5. Rendering Systems

**[src/renderers/RenderManager.js](../src/renderers/RenderManager.js)**
- Lines 63-127: `_drawTapFeedback()` marching ants animation math needs explanation
- Lines 132-229: `drawEnemyAttackRange()` ray-casting logic needs documentation
- **Action**: Explain animation calculations and rendering strategy

### Documentation Template for Complex Algorithms

```javascript
/**
 * Calculates optimal defensive moves for an enemy when threatened.
 *
 * Algorithm Overview:
 * 1. Identify all valid move candidates within movement range
 * 2. Filter moves that increase distance from player (defensive criterion)
 * 3. Score moves based on:
 *    - Distance gain from player (weight: 0.6)
 *    - Proximity to other enemies (weight: 0.3)
 *    - Terrain advantages (weight: 0.1)
 * 4. Return highest-scoring move
 *
 * Distance Threshold:
 * - Uses distance <= 2 as "threatened" threshold because this represents
 *   one turn before the player can attack (player move distance = 1)
 *
 * @param {Enemy} enemy - The enemy considering defensive action
 * @param {Position} playerPos - Current player position
 * @param {Array<Enemy>} allEnemies - All enemies for clustering calculation
 * @returns {Position|null} Best defensive position or null if none found
 */
function getDefensiveMoves(enemy, playerPos, allEnemies) {
    // Implementation with inline comments...
}
```

---

## Priority 2: Establish JSDoc Standards

### JSDoc Template for Functions

```javascript
/**
 * Brief description of what the function does.
 *
 * Longer description if needed, explaining:
 * - Why this function exists
 * - Important behavior or side effects
 * - Any non-obvious logic
 *
 * @param {Type} paramName - Description of parameter
 * @param {Type} [optionalParam] - Optional parameter (note brackets)
 * @param {Object} options - Options object
 * @param {boolean} options.flag - Flag option
 * @returns {Type} Description of return value
 * @throws {ErrorType} When this error occurs
 *
 * @example
 * const result = myFunction(5, { flag: true });
 * console.log(result); // Expected output
 */
function myFunction(paramName, optionalParam, options) {
    // Implementation
}
```

### JSDoc Template for Classes

```javascript
/**
 * Brief description of the class.
 *
 * Longer description explaining:
 * - Purpose and responsibilities
 * - Key design patterns used
 * - Important lifecycle considerations
 *
 * @example
 * const manager = new MyManager(game);
 * manager.doSomething();
 */
export class MyManager {
    /**
     * Creates a new MyManager instance.
     *
     * @param {Game} game - The main game instance
     * @param {Object} [options={}] - Configuration options
     * @param {boolean} [options.debug=false] - Enable debug mode
     */
    constructor(game, options = {}) {
        // Implementation
    }
}
```

### Files Needing JSDoc Comments

Priority files lacking documentation:

**Managers** (missing JSDoc):
- [src/managers/ActionManager.js](../src/managers/ActionManager.js)
- [src/managers/BombManager.js](../src/managers/BombManager.js)
- [src/managers/ItemManager.js](../src/managers/ItemManager.js)
- [src/managers/ZoneManager.js](../src/managers/ZoneManager.js)

**Generators** (missing JSDoc):
- [src/generators/ItemGenerator.js](../src/generators/ItemGenerator.js)
- [src/generators/EnemyGenerator.js](../src/generators/EnemyGenerator.js)
- [src/generators/StructureGenerator.js](../src/generators/StructureGenerator.js)

**Renderers** (missing JSDoc):
- [src/renderers/TileRenderer.js](../src/renderers/TileRenderer.js)
- [src/renderers/BaseTileRenderer.js](../src/renderers/BaseTileRenderer.js)

---

## Priority 3: Expand Architecture Documentation

### Add More ADRs

Create ADRs documenting these existing architectural decisions:

1. **ADR-0004: Use Strategy Pattern for Item Effects**
   - Why: Extensibility and separation of concerns
   - Context: 20+ different item types with unique behaviors
   - Location: [src/managers/inventory/effects/](../src/managers/inventory/effects/)

2. **ADR-0005: Implement Repository Pattern for Inventory**
   - Why: Separate data access from business logic
   - Context: ItemRepository, InventoryService, ItemEffectStrategy
   - Location: [src/managers/inventory/](../src/managers/inventory/)

3. **ADR-0006: Use Handler Pattern for Zone Generation**
   - Why: Different dimensions have vastly different generation logic
   - Context: SurfaceHandler, UndergroundHandler, InteriorHandler
   - Location: [src/core/handlers/](../src/core/handlers/)

4. **ADR-0007: Adopt Facade Pattern for Player Interactions**
   - Why: Simplify complex subsystem interactions
   - Context: PlayerFacade, CombatFacade, InteractionFacade
   - Location: [src/facades/](../src/facades/)

5. **ADR-0008: Use Procedural Generation with Seeded Randomness**
   - Why: Deterministic zone generation for save/load consistency
   - Context: Zone generation system
   - Decision: When/why to use seeding

### Enhance PROJECT_OVERVIEW.md

While comprehensive, add these sections:

1. **Development Workflow**
   - How to add new features
   - Testing strategy
   - Debugging tips

2. **Common Pitfalls**
   - Gotchas for new developers
   - Common mistakes and how to avoid them

3. **Performance Considerations**
   - Rendering optimization
   - Memory management
   - Mobile considerations

4. **Event System Reference**
   - Complete list of all events
   - When each event fires
   - What data each event carries

---

## Priority 4: Create Quick Reference Docs

### File: docs/API_QUICK_REFERENCE.md

Create quick reference for common operations:

```markdown
# API Quick Reference

## Position Operations
- Create: `new Position(x, y)` or `Position.from({x, y})`
- Distance: `pos1.distanceTo(pos2)`
- Move: `pos.move('arrowright', 2)`
- Neighbors: `pos.neighbors()`

## Service Container
- Get service: `game.services.get('serviceName')`
- Set mock: `game.services.set('serviceName', mockService)`

## Event Bus
- Emit: `eventBus.emit('eventName', data)`
- Subscribe: `eventBus.on('eventName', handler)`
- Unsubscribe: `eventBus.off('eventName', handler)`

// ... more common operations
```

### File: docs/EVENT_REFERENCE.md

Document all game events:

```markdown
# Event Reference

## Combat Events

### enemyDefeated
**Emitted when**: An enemy is defeated in combat
**Data**:
- `enemy` {Enemy} - The defeated enemy
- `position` {Position} - Where the defeat occurred
- `pointsAwarded` {number} - Points given to player

// ... all other events
```

---

## Implementation Roadmap

### Phase 1: Critical Documentation (1-2 weeks)

1. Document the 9 complex algorithm files identified above
2. Create ADR directory structure and initial 3 ADRs
3. Add JSDoc to all public methods in core systems (ServiceContainer, EventBus, Position)

### Phase 2: Comprehensive JSDoc (2-3 weeks)

1. Add JSDoc to all manager classes
2. Add JSDoc to all generator classes
3. Add JSDoc to all renderer classes
4. Create jsdoc.json configuration for API doc generation

### Phase 3: Architecture Documentation (1 week)

1. Create 4 additional ADRs (Strategy, Repository, Handler, Facade patterns)
2. Add Development Workflow section to PROJECT_OVERVIEW.md
3. Create Common Pitfalls section

### Phase 4: Reference Documentation (1 week)

1. Create API_QUICK_REFERENCE.md
2. Create EVENT_REFERENCE.md
3. Generate HTML API docs from JSDoc comments

---

## Tooling Recommendations

### 1. JSDoc Configuration

Create `jsdoc.json` to generate HTML docs:

```json
{
  "source": {
    "include": ["src"],
    "includePattern": ".+\\.js$"
  },
  "opts": {
    "destination": "./docs/api",
    "recurse": true,
    "readme": "./README.md"
  },
  "plugins": ["plugins/markdown"]
}
```

Run with: `npx jsdoc -c jsdoc.json`

### 2. Documentation Linting

Add to package.json scripts:

```json
{
  "scripts": {
    "docs:lint": "eslint --plugin jsdoc --rule 'jsdoc/require-jsdoc: warn' src/",
    "docs:generate": "jsdoc -c jsdoc.json"
  }
}
```

### 3. VS Code Extensions

Recommend to developers:
- **Document This**: Auto-generate JSDoc comments
- **Better Comments**: Highlight TODO, FIXME, NOTE comments
- **Markdown All in One**: Better markdown editing

---

## Metrics for Success

Track these metrics to measure documentation improvement:

1. **JSDoc Coverage**: % of public methods with JSDoc comments
   - Current: ~30%
   - Target: 80%+

2. **Complex Function Documentation**: % of 30+ line functions with overview comments
   - Current: ~20%
   - Target: 90%+

3. **ADR Coverage**: Number of major architectural patterns documented
   - Current: 0 (now 3 with this work)
   - Target: 8-10

4. **Developer Onboarding Time**: Time for new developer to make first contribution
   - Current: Unknown (likely 1-2 weeks)
   - Target: 2-3 days with good docs

---

## Maintenance Strategy

### Documentation Reviews

1. **PR Requirement**: All new features must include:
   - JSDoc for public methods
   - Inline comments for complex logic
   - Update to PROJECT_OVERVIEW.md if adding new system

2. **Quarterly Review**: Every 3 months:
   - Review ADRs for accuracy
   - Update PROJECT_OVERVIEW.md with recent changes
   - Identify newly complex files needing documentation

3. **Documentation Champion**: Assign rotating role:
   - Reviews PRs for documentation quality
   - Maintains ADR index
   - Advocates for documentation improvements

---

## Next Steps

1. **Immediate Actions** (This Week):
   - Review this document with team
   - Prioritize which files to document first
   - Set up ADR directory structure (DONE)

2. **Short Term** (Next 2 Weeks):
   - Document 3-4 of the most critical complex algorithm files
   - Add JSDoc to core systems (Game, ServiceContainer, EventBus)
   - Create 2 more ADRs

3. **Long Term** (Next Quarter):
   - Complete JSDoc coverage of all managers
   - Generate API documentation website
   - Create video tutorials for complex systems

---

## Resources

- [JSDoc Official Guide](https://jsdoc.app/)
- [ADR Best Practices](https://github.com/joelparkerhenderson/architecture-decision-record)
- [Google JavaScript Style Guide - Comments](https://google.github.io/styleguide/jsguide.html#jsdoc)
- [Clean Code: Comments Chapter](https://www.oreilly.com/library/view/clean-code-a/9780136083238/) by Robert C. Martin
