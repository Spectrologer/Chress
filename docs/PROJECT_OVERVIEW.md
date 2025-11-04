## Chress — Project Overview

**Chress** (a playful reference to "Chess 2: The Sequel to Chess") is a browser-based, 2D top-down, turn-based RPG with zone exploration, procedural generation, and chess-inspired enemy AI. It runs in modern browsers and is optimized for both mobile and desktop with a responsive, tile-based UI.

**Repository**: https://github.com/Spectrologer/Chress
**License**: ISC
**Platform**: Modern browsers (HTML5 Canvas) — no native build required
**Codebase**: ~28,000 lines of JavaScript organized in a modular architecture

This document summarizes the repository structure, how to run and test the project, key game systems, and where to look when making changes.

### Quick Start

```powershell
npm install      # Install dependencies
npm start        # Launch dev server (live-server) at http://localhost:8080
npm test         # Run Vitest tests
npm test:watch   # Run tests in watch mode
npm test:coverage # Generate test coverage report
```

### Core Gameplay Features

- **Turn-Based Combat**: Player moves, then all enemies move; strategic positioning matters
- **Procedural Zones**: Infinite exploration with randomly generated zones, structures, items, and enemies
- **Zone System**: Seamless world divided into interconnected zones with different dimensions and depths
  - **Surface** (dimension 0, depth 0) — Main overworld
  - **Underground** (dimension 0, depth 1+) — Progressive cave/dungeon depths
  - **Interior** (varying dimensions) — Buildings, shops, special locations
- **Inventory System**: 6-slot main inventory + radial quick-access inventory for consumables
- **Chess-Inspired Enemy AI**: 6 enemy types with tactical movement patterns (lizardy, lizardo, lizord, zard, lizardeaux, lazerd)
- **Points & Combos**: Score system (1-9 pts per enemy) with consecutive kill tracking
- **NPC System**: 10 NPCs with barter and dialogue interactions
- **Resource Management**: Hunger/thirst mechanics with consumable items
- **Save/Load**: Autosave every 750ms + periodic saves every 30s

### Technology Stack

**Frontend**:
- JavaScript (ES Modules)
- HTML5 Canvas 2D rendering
- Vanilla JavaScript with CSS Grid/Flexbox
- Web Audio API for sound

**Dependencies**:
- **Runtime**: Sentry (error tracking, currently disabled)
- **Dev**: Vitest, Babel, live-server

**Architecture Patterns**:
- Dependency Injection via `ServiceContainer`
- Event-driven architecture via `EventBus`
- Strategy pattern for item effects
- Repository pattern for data access
- Clean separation of concerns across 15+ specialized managers

### Directory Structure & Key Systems

#### Root Structure
```
Chress/
├── assets/              # All game assets (images, sounds)
│   ├── characters/     # Character sprites and portraits
│   │   ├── player/    # Player character animations
│   │   ├── enemies/   # Enemy sprites and portraits
│   │   └── npcs/      # NPC sprites and portraits
│   ├── environment/   # Environmental assets
│   │   ├── floors/    # Floor tiles
│   │   ├── walls/     # Wall tiles
│   │   ├── flora/     # Plants, vegetation
│   │   ├── doodads/   # Props, furniture, signs
│   │   └── effects/   # Visual effects (smoke, explosions)
│   ├── items/         # Item sprites
│   │   ├── equipment/ # Weapons and tools
│   │   ├── consumables/ # Food and drinks
│   │   └── misc/      # Other items
│   ├── ui/            # UI elements
│   └── hidden/        # Unused/easter egg assets
├── src/               # All JavaScript source code
│   ├── core/          # Core game systems
│   ├── managers/      # Game logic managers
│   ├── renderers/     # Rendering systems
│   ├── ui/            # UI components
│   ├── entities/      # Game entities
│   ├── controllers/   # Input/game controllers
│   ├── generators/    # Procedural generation
│   ├── state/         # State management
│   └── utils/         # Utility functions
├── boards/            # Pre-made board definitions
├── tests/             # Vitest unit tests
├── docs/              # Documentation
├── sfx/               # Sound effects
└── fonts/             # Web fonts
```

#### Root Files
- [index.html](index.html) — Main entry point with canvas and UI overlays
- [styles.css](styles.css) — Global styling
- [package.json](package.json) — Dependencies and scripts

#### Core Systems ([src/core/](src/core/))
- **[[GameInitializer.js](src/core/](src/core/GameInitializer.js)** — Bootstrap: canvas setup, assets, event listeners
- **[[Game.js](src/core/](src/core/game.js)** — Main Game class extending GameContext
- **[[GameStateManager.js](src/core/](src/core/GameStateManager.js)** — Save/load, zone caching, message logs
- **[[ServiceContainer.js](src/core/](src/core/ServiceContainer.js)** — Dependency injection with lazy initialization (30+ services)
- **[[EventBus.js](src/core/](src/core/EventBus.js)** — Centralized pub-sub event system
- **[[TurnManager.js](src/core/](src/core/TurnManager.js)** — Turn queue and combat turn execution
- **[[ZoneGenerator.js](src/core/](src/core/ZoneGenerator.js)** — Main zone generation orchestrator
- **[[SaveSerializer.js](src/core/SaveSerializer.js)** / **[SaveDeserializer.js](src/core/](src/core/SaveDeserializer.js)** — Save system
- **[[ErrorHandler.js](src/core/ErrorHandler.js)** / **[GlobalErrorHandler.js](src/core/](src/core/GlobalErrorHandler.js)** — Error handling with Sentry
- **Zone Handlers**: [[BaseZoneHandler.js](src/core/handlers/BaseZoneHandler.js), [surfaceHandler.js](src/core/handlers/surfaceHandler.js), [undergroundHandler.js](src/core/](src/core/handlers/undergroundHandler.js)
- **Spawn Commands**: [[BaseSpawnCommand.js](src/core/commands/spawn/BaseSpawnCommand.js), [EnemySpawnCommands.js](src/core/](src/core/commands/spawn/EnemySpawnCommands.js)

#### Managers ([[managers/](src/managers/](src/managers/)) — 15+ Specialized Managers

**Combat & Interaction**:
- **[[CombatManager.js](src/managers/](src/managers/CombatManager.js)** — Enemy movements, collisions, defeat flow
- **[[CombatActionManager.js](src/managers/](src/managers/CombatActionManager.js)** — Individual combat actions
- **[[EnemyDefeatFlow.js](src/managers/](src/managers/EnemyDefeatFlow.js)** — Defeat logic, rewards, combo tracking
- **[[InteractionManager.js](src/managers/](src/managers/InteractionManager.js)** — Player tile interactions
- **[[NPCInteractionManager.js](src/managers/](src/managers/NPCInteractionManager.js)** — NPC dialogue and barter
- **[[EnvironmentalInteractionManager.js](src/managers/](src/managers/EnvironmentalInteractionManager.js)** — Environmental tiles (pits, etc.)
- **[[TerrainInteractionManager.js](src/managers/](src/managers/TerrainInteractionManager.js)** — Terrain-specific interactions

**Inventory & Items**:
- **[[ItemManager.js](src/managers/](src/managers/ItemManager.js)** — Item pickup and placement
- **[[ItemPickupManager.js](src/managers/](src/managers/ItemPickupManager.js)** — Item collection mechanics
- **Inventory Architecture** ([[managers/inventory/](src/managers/](src/managers/inventory/)):
  - **[[ItemMetadata.js](src/managers/](src/managers/inventory/ItemMetadata.js)** — Static item data (tooltips, constants, type checks)
  - **[[ItemRepository.js](src/managers/](src/managers/inventory/ItemRepository.js)** — Data access layer (inventory CRUD)
  - **[[InventoryService.js](src/managers/](src/managers/inventory/InventoryService.js)** — Business logic orchestration
  - **[[ItemEffectStrategy.js](src/managers/](src/managers/inventory/ItemEffectStrategy.js)** — Effect routing (Strategy pattern)
  - **Effects** ([[managers/inventory/effects/](src/managers/](src/managers/inventory/effects/)):
    - [[BaseItemEffect.js](src/managers/](src/managers/inventory/effects/BaseItemEffect.js) — Abstract base class
    - [[ConsumableEffects.js](src/managers/](src/managers/inventory/effects/ConsumableEffects.js) — Food, Water, Heart
    - [[ToolEffects.js](src/managers/](src/managers/inventory/effects/ToolEffects.js) — Axe, Hammer
    - [[WeaponEffects.js](src/managers/](src/managers/inventory/effects/WeaponEffects.js) — Bomb, Bow, Bishop Spear, Horse Icon
    - [[SpecialEffects.js](src/managers/](src/managers/inventory/effects/SpecialEffects.js) — Shovel, Note, Book of Time Travel

**World & Zones**:
- **[[ZoneManager.js](src/managers/](src/managers/ZoneManager.js)** — Zone generation and caching
- **[[ZoneTransitionManager.js](src/managers/](src/managers/ZoneTransitionManager.js)** — Movement between zones
- **[[ConnectionManager.js](src/managers/](src/managers/ConnectionManager.js)** — Zone connections and exits
- **[[RadialPersistence.js](src/managers/](src/managers/RadialPersistence.js)** — Radial inventory save/load

**Input & Audio**:
- **[[InputManager.js](src/managers/](src/managers/InputManager.js)** — Input handling facade
- **[[ActionManager.js](src/managers/](src/managers/ActionManager.js)** — Player action execution
- **[[SoundManager.js](src/managers/](src/managers/SoundManager.js)** — Audio playback

#### Entities ([[entities/](src/entities/](src/entities/) & [enemy/](enemy/))
- **[[Player.js](src/entities/](src/entities/Player.js)** — Player character with Position class, stats, inventory, abilities
- **[BaseEnemy.js](enemy/BaseEnemy.js)** — Enemy base class with animations and attributes
- **[[Enemy.js](src/entities/](src/entities/Enemy.js)** — Enemy factory and type registry
- **Enemy AI**:
  - [EnemyMovement.js](enemy/EnemyMovement.js) — Movement planning
  - [EnemyPathfinding.js](enemy/EnemyPathfinding.js) — Pathfinding algorithms
  - [EnemyLineOfSight.js](enemy/EnemyLineOfSight.js) — Line of sight detection
  - [EnemyChargeBehaviors.js](enemy/EnemyChargeBehaviors.js) — Charging attacks
  - [TacticalAI.js](enemy/TacticalAI.js) — Unified tactical system
  - [MoveCalculators.js](enemy/MoveCalculators.js) — Move strategy factory

#### Generators ([[generators/](src/generators/](src/generators/))
- **[[ZoneGenerator.js](src/generators/](src/generators/ZoneGenerator.js)** — Main orchestrator
- **[[FeatureGenerator.js](src/generators/](src/generators/FeatureGenerator.js)** — Terrain features (grass, rocks, holes, pits)
- **[[StructureGenerator.js](src/generators/](src/generators/StructureGenerator.js)** — Building/structure placement
- **[[ItemGenerator.js](src/generators/](src/generators/ItemGenerator.js)** — Item spawning with weighted probabilities
- **[[EnemyGenerator.js](src/generators/](src/generators/EnemyGenerator.js)** — Enemy spawning with level-based scaling
- **[[PathGenerator.js](src/generators/](src/generators/PathGenerator.js)** — Pathfinding and roads
- **[[GeneratorUtils.js](src/generators/](src/generators/GeneratorUtils.js)** — Grid validation, position utilities
- **[[ZoneStateManager.js](src/generators/](src/generators/ZoneStateManager.js)** — Zone state persistence

#### Rendering ([[renderers/](src/renderers/](src/renderers/))
- **[[RenderManager.js](src/renderers/](src/renderers/RenderManager.js)** — Main render loop coordinator
- **[[TileRenderer.js](src/renderers/](src/renderers/TileRenderer.js)** — Base tile rendering
- **[[BaseTileRenderer.js](src/renderers/](src/renderers/BaseTileRenderer.js)** — Floor and wall tiles
- **[[ItemTileRenderer.js](src/renderers/](src/renderers/ItemTileRenderer.js)** — Item rendering
- **[[StructureTileRenderer.js](src/renderers/](src/renderers/StructureTileRenderer.js)** — Structures and buildings
- **[[PlayerRenderer.js](src/renderers/](src/renderers/PlayerRenderer.js)** — Player sprite and animation
- **[[EnemyRenderer.js](src/renderers/](src/renderers/EnemyRenderer.js)** — Enemy sprite and animation
- **[[AnimationRenderer.js](src/renderers/](src/renderers/AnimationRenderer.js)** — Animation frame handling
- **[[FogRenderer.js](src/renderers/](src/renderers/FogRenderer.js)** — Unexplored area fog
- **[[UIRenderer.js](src/renderers/](src/renderers/UIRenderer.js)** — UI overlay rendering
- **[[TextureManager.js](src/renderers/](src/renderers/TextureManager.js)** — Texture caching
- **[[TextureLoader.js](src/renderers/](src/renderers/TextureLoader.js)** — Asset loading
- **[[TextureDetector.js](src/renderers/](src/renderers/TextureDetector.js)** — Tile type to texture mapping

#### UI System ([[ui/](src/ui/](src/ui/)) — 30+ Components
**Core Managers**:
- **[[UIManager.js](src/ui/](src/ui/UIManager.js)** — Central UI orchestrator
- **[[OverlayManager.js](src/ui/](src/ui/OverlayManager.js)** — Modal overlay management
- **[[PanelManager.js](src/ui/](src/ui/PanelManager.js)** — Player card and panel management

**Components**:
- **Inventory**: [[InventoryUI.js](src/ui/InventoryUI.js), [RadialInventoryUI.js](src/ui/](src/ui/RadialInventoryUI.js)
- **Stats**: [[PlayerStatsUI.js](src/ui/PlayerStatsUI.js), [StatsPanelManager.js](src/ui/StatsPanelManager.js), [RecordsPanelManager.js](src/ui/](src/ui/RecordsPanelManager.js)
- **Config**: [[ConfigPanelManager.js](src/ui/ConfigPanelManager.js), [VoiceSettings.js](src/ui/](src/ui/VoiceSettings.js)
- **Dialogue**: [[DialogueManager.js](src/ui/DialogueManager.js), [TypewriterController.js](src/ui/TypewriterController.js), [TypewriterEffect.js](src/ui/](src/ui/TypewriterEffect.js)
- **Messaging**: [[MessageManager.js](src/ui/MessageManager.js), [MessageLog.js](src/ui/MessageLog.js), [OverlayMessageHandler.js](src/ui/OverlayMessageHandler.js), [NoteStack.js](src/ui/](src/ui/NoteStack.js)
- **Trading**: [[BarterWindow.js](src/ui/](src/ui/BarterWindow.js)
- **World**: [[MiniMap.js](src/ui/MiniMap.js), [RegionNotification.js](src/ui/RegionNotification.js), [Sign.js](src/ui/](src/ui/Sign.js)
- **Effects**: [[StatueInfoWindow.js](src/ui/StatueInfoWindow.js), [RadialMenu.js](src/ui/](src/ui/RadialMenu.js)

#### Input Controllers ([[controllers/](src/controllers/](src/controllers/))
- **[[InputController.js](src/controllers/](src/controllers/InputController.js)** — Main input coordinator (keyboard, mouse, touch, gestures)
- **[[KeyboardHandler.js](src/controllers/](src/controllers/KeyboardHandler.js)** — Keyboard events
- **[[PathfindingController.js](src/controllers/](src/controllers/PathfindingController.js)** — BFS pathfinding with Position class
- **[[InputCoordinator.js](src/controllers/](src/controllers/InputCoordinator.js)** — Tap handling and movement
- **[[GestureDetector.js](src/controllers/](src/controllers/GestureDetector.js)** — Mobile gesture recognition
- **[[ZoneTransitionController.js](src/controllers/](src/controllers/ZoneTransitionController.js)** — Zone transition input

#### Content & Configuration ([config/](config/))
- **[ContentRegistrations.js](config/ContentRegistrations.js)** — Unified registry for items, NPCs, enemies, zones
- **[NPCConfig.js](config/NPCConfig.js)** — NPC configuration (10 NPCs: penne, squig, rune, nib, mark, axelotl, gouge, crayn, felt, forge)

#### Utilities ([[utils/](src/utils/](src/utils/))
- **[[Position.js](src/utils/](src/utils/Position.js)** — Rich position abstraction (40+ methods, 99/99 tests passing)
  - Distance metrics (Chebyshev, Manhattan, Euclidean)
  - Neighbor generation, adjacency checks
  - Line drawing (Bresenham), rectangle/radius generation
  - Immutable operations, serialization
- **[[logger.js](src/utils/](src/utils/logger.js)** — Centralized logging
- **[[ZoneKeyUtils.js](src/utils/](src/utils/ZoneKeyUtils.js)** — Zone key generation
- **[[AudioManager.js](src/utils/](src/utils/AudioManager.js)** — Sound management
- **[[GridUtils.js](src/utils/](src/utils/GridUtils.js)** — Grid operations
- **[[TileUtils.js](src/utils/](src/utils/TileUtils.js)** — Tile type checking
- **[[GridIterator.js](src/utils/](src/utils/GridIterator.js)** — Grid position iteration
- **[[SafeServiceCall.js](src/utils/](src/utils/SafeServiceCall.js)** — Safe method invocation

#### Assets
- **[assets/](assets/)** — Game images, sprites, tiles
- **[Sounds/](Sounds/)** & **[sfx/](sfx/)** — Audio files
- **[fonts/](fonts/)** — Custom game fonts

#### Tests ([tests/](tests/))
- Vitest unit tests covering managers and generators
- **[Position.test.js](tests/Position.test.js)** — 99 tests for Position class

### Game Loop Flow

1. **Input Handling**: [[InputController.js](src/controllers/](src/controllers/InputController.js) processes keyboard, mouse, touch, and gestures
   - Delegates to specialized handlers ([[KeyboardHandler.js](src/controllers/KeyboardHandler.js), [GestureDetector.js](src/controllers/](src/controllers/GestureDetector.js))
   - [[InputManager.js](src/managers/](src/managers/InputManager.js) provides facade for game systems

2. **Action Execution**: [[ActionManager.js](src/managers/](src/managers/ActionManager.js) executes player actions
   - Movement validated and processed
   - Interactions handled by [[InteractionManager.js](src/managers/](src/managers/InteractionManager.js) and specialized interaction managers

3. **Turn System**: [[TurnManager.js](src/core/](src/core/TurnManager.js) manages turn order
   - Player moves first
   - Then all enemies move via [[CombatManager.js](src/managers/](src/managers/CombatManager.js)
   - Individual combat actions via [[CombatActionManager.js](src/managers/](src/managers/CombatActionManager.js)

4. **Enemy AI**: Chess-inspired tactical movement
   - Line of sight via [EnemyLineOfSight.js](enemy/EnemyLineOfSight.js)
   - Movement calculation via [MoveCalculators.js](enemy/MoveCalculators.js)
   - Tactical decisions via [TacticalAI.js](enemy/TacticalAI.js)

5. **Zone Management**:
   - [[ZoneManager.js](src/managers/](src/managers/ZoneManager.js) handles current zone
   - [[ZoneTransitionManager.js](src/managers/](src/managers/ZoneTransitionManager.js) handles movement between zones
   - [[ConnectionManager.js](src/managers/](src/managers/ConnectionManager.js) manages zone connections and exits
   - Procedural generation via [[ZoneGenerator.js](src/core/](src/core/ZoneGenerator.js)

6. **Rendering**: [[RenderManager.js](src/renderers/](src/renderers/RenderManager.js) orchestrates rendering
   - Tile rendering via specialized renderers ([[BaseTileRenderer.js](src/renderers/BaseTileRenderer.js), [ItemTileRenderer.js](src/renderers/](src/renderers/ItemTileRenderer.js), etc.)
   - Player via [[PlayerRenderer.js](src/renderers/](src/renderers/PlayerRenderer.js)
   - Enemies via [[EnemyRenderer.js](src/renderers/](src/renderers/EnemyRenderer.js)
   - UI overlays via [[UIManager.js](src/ui/](src/ui/UIManager.js)

7. **Events**: [[EventBus.js](src/core/](src/core/EventBus.js) coordinates cross-system communication
   - Decouples systems via publish-subscribe pattern
   - Event types: zone transitions, combat, UI updates, sound effects

8. **Persistence**: [[GameStateManager.js](src/core/](src/core/GameStateManager.js) handles saves
   - Autosave every 750ms (debounced)
   - Periodic save every 30s
   - Serialization via [[SaveSerializer.js](src/core/SaveSerializer.js) / [SaveDeserializer.js](src/core/](src/core/SaveDeserializer.js)

### Adding New Content

See [ADDING_CONTENT.md](docs/ADDING_CONTENT.md) for detailed guides on:
- Adding new items with custom effects
- Creating new NPCs with dialogue or barter
- Registering new enemy types
- Configuring new zone types

**Quick Example - Adding a New Item**:
1. Register in [ContentRegistrations.js](config/ContentRegistrations.js)
2. Create effect class in [[managers/inventory/effects/](src/managers/](src/managers/inventory/effects/)
3. Add texture to [assets/](assets/)

### Design Bible & Visual Style

**Color Palette - Muted Sonoran Desert Pastels**:
- **Primary Colors**:
  - Dusty Rose/Coral: `#D4A5A5`, `#C48B8B`
  - Muted Lavender/Purple: `#C4A8C4`, `#A88BA8`
  - Mauve/Dusty Pink: `#D4B5C4`, `#C49AB4`
  - Sandy Beige: `#F5E8E0`, `#EDD8CF`, `#E8D5D5`

- **Accent Colors**:
  - Deep Mauve: `#6B4858` (text)
  - Dusty Rose: `#8B6B7A` (secondary text)
  - Border Mauve: `#D4A8B8`

- **Background Gradients**:
  - Start Menu Overlay: Lavender → Coral Pink → Sandy Beige
  - Start Menu Box: `linear-gradient(135deg, #F5E8E0, #EDD8CF, #E8D5D5)`
  - Buttons: Individual Sonoran pastel gradients (see below)

**Button Color Scheme** ([styles.css:375-402](styles.css#L375-L402)):
- **New Game**: Dusty rose/coral (`#D4A5A5` → `#C48B8B`)
- **Continue**: Muted lavender/purple (`#C4A8C4` → `#A88BA8`)
- **Zone Editor**: Mauve/dusty pink (`#D4B5C4` → `#C49AB4`)

**Adobe Texture Effect** ([styles.css:108-126](styles.css#L108-L126), [styles.css:318-347](styles.css#L318-L347)):
- Cross-hatched diagonal patterns (45° and -45°) for stucco appearance
- Radial gradient overlays for organic adobe irregularities
- Subtle horizontal banding for surface roughness
- Mix-blend-mode: multiply for authentic earthen material look
- Applied to: Start menu background, all buttons

**Typography**:
- **Title Font**: MedievalSharp (serif) — Bold, fantasy style
- **Button Font**: Cinzel (serif) — Elegant, uppercase
- **Body Font**: Courier New (monospace) — Readable, retro
- **Text Colors**: Deep mauve (`#6B4858`) for titles, dusty rose (`#8B6B7A`) for subtitles
- **Text Shadow**: Soft white shadow (`rgba(255, 255, 255, 0.4)`) for legibility on textured backgrounds

**Material Effects**:
- **Border Radius**: 3-4px for buttons (angular, adobe-brick feel)
- **Box Shadows**: Layered with inset highlights for depth
- **Frayed Edges**: Clip-path polygons for irregular, hand-made adobe appearance
- **Z-index Layering**: Interactive elements above textures (z-index: 1)

**Responsive Design** ([styles.css:313-315](styles.css#L313-L315)):
- Buttons: `width: clamp(160px, 50%, 220px)` — Scales 160-220px
- Font sizes: `clamp(0.85em, 2.5vw, 1em)` — Mobile-optimized
- Max width: 90% for narrow screens

**Design Philosophy**:
- Sonoran desert aesthetic: purple, pink, sandy tones inspired by desert sunsets, prickly pear blooms, and twilight landscapes
- Adobe/stucco texture: Authentic earthen material feel throughout UI
- Muted pastels: Sophisticated, not oversaturated
- Mobile-first: Touch-friendly sizing, responsive scaling
- Consistent theming: All UI elements follow the same desert palette and texture system

### Architecture Principles

1. **Dependency Injection**: [[ServiceContainer.js](src/core/](src/core/ServiceContainer.js) provides loose coupling with lazy initialization
2. **Event-Driven**: [[EventBus.js](src/core/](src/core/EventBus.js) decouples game systems via pub-sub
3. **Backward Compatibility**: [[Position.js](src/utils/](src/utils/Position.js) maintains old `.x`/`.y` API while providing rich abstractions
4. **Immutability**: Position operations return new instances
5. **Clean Architecture**: Clear separation between data access, business logic, and presentation
6. **Strategy Pattern**: Item effects use strategy pattern for extensibility
7. **Repository Pattern**: Data access abstracted via repositories

### Testing

- **Framework**: Vitest with Babel transpilation
- **Coverage**: Unit tests for core utilities and managers
- **Position Class**: 99/99 passing tests covering all operations
- **Run Tests**:
  ```powershell
  npm test              # Run all tests
  npm test:watch        # Watch mode
  npm test:coverage     # Generate coverage report
  ```

### Documentation

- **[PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)** — This file (architecture and systems)
- **[ADDING_CONTENT.md](docs/ADDING_CONTENT.md)** — Guide to adding items, NPCs, enemies
- **[MIGRATION_COMPLETE.md](docs/MIGRATION_COMPLETE.md)** — Position class migration documentation
- **[ERROR_HANDLING.md](docs/ERROR_HANDLING.md)** — Error handling patterns
- **[INVENTORY_ARCHITECTURE.md](docs/INVENTORY_ARCHITECTURE.md)** — Inventory system design

### Recent Development Focus

Based on recent commits, the project has been actively refactored with focus on:
- **Modular Architecture**: Splitting responsibilities across specialized managers
- **ServiceContainer Improvements**: Better dependency injection
- **Event System Refactoring**: Loose coupling via EventBus
- **Enemy Freezing Mechanic**: Freeze enemies when player is on exit tile
- **Asset Viewer Tool**: Development tool for viewing game assets
- **Position Class Migration**: Complete migration to Position abstraction (100% complete, 99/99 tests)
- **Inventory System Refactoring**: Clean architecture with effect strategies
- **UI Component Consolidation**: Organized UI into dedicated directory

### Items & Abilities

**Consumables**:
- **Aguamelin** (Food) — Restores hunger
- **Water** — Restores thirst
- **Heart** — Restores health

**Tools**:
- **Axe** — Chop trees and wooden obstacles
- **Hammer** — Break rocks and stone obstacles
- **Shovel** — Dig holes and create terrain

**Weapons**:
- **Bomb** — Area damage
- **Bow** — Ranged attack
- **Bishop Spear** — Diagonal attack pattern
- **Horse Icon** — Special movement/attack

**Special Items**:
- **Note** — Mark locations on map
- **Book of Time Travel** — Special time manipulation
- Various quest items and collectibles

### Enemy Types

| Enemy | Points | Difficulty |
|-------|--------|------------|
| lizardy | 1 | Basic |
| lizardo | 3 | Medium |
| lizord | 3 | Medium |
| zard | 3 | Medium |
| lizardeaux | 5 | Strong |
| lazerd | 9 | Boss |

Each enemy type has unique tactical AI behaviors and movement patterns inspired by chess pieces.

### NPCs

**Barter NPCs** (Trading):
- Penne, Squig, Rune, Nib, Mark, Axelotl, Gouge

**Dialogue NPCs** (Conversation):
- Crayn, Felt, Forge

### Contribution & Reporting Issues

- **Issues**: https://github.com/Spectrologer/Chress/issues
- **License**: ISC (see [package.json](package.json))
- **Author**: Spectrologer

### Future Enhancements

- Add CI/CD pipeline (GitHub Actions) for automated testing
- Expand test coverage for managers and UI components
- Add more documentation for game mechanics
- Consider adding README.md with quick start guide and screenshots

---

**Last Updated**: October 26, 2025 — Comprehensive update reflecting current project structure, all game systems, recent refactoring work, and complete architecture documentation.
