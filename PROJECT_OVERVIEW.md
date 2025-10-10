# Chress - Project Overview

## 1. Game Concept

Chress is a mobile browser-based, 2D grid-based, top-down survival roguelike game designed for portrait orientation and touch-first interaction. Optimized primarily for smartphones and tablets, the game runs directly in web browsers without downloads. Players control a character named "CHALK" in a procedurally generated world, managing health, hunger, and thirst while navigating zones, gathering resources, and engaging in turn-based combat with chess-inspired enemies. Key design considerations include minimal UI for small screens, swipe/tap controls, and a distinctive parchment-and-ink aesthetic with sound effects and Sentry analytics integration.

**Core Mechanics:**

- **World:** The world is an infinite grid of "zones." Each zone is a 9x9 grid of tiles.
- **Survival:** The player must manage Health, Hunger, and Thirst.
- **Exploration:** The player moves from zone to zone by reaching the edge of the grid. A minimap helps track visited zones, with regions generated procedurally.
- **Interaction:** The player can interact with the environment using items (e.g., an axe to chop shrubs, a hammer to break rocks, a bomb to destroy walls).
- **Combat:** Combat is turn-based. The player attacks enemies by moving into their tile. Enemies have unique movement and attack patterns inspired by chess pieces (Rook, Bishop, Knight), with special actions and pathfinding.
- **Items & Inventory:** The player has a limited inventory to carry tools, weapons, consumables (food, water), and special items like map notes.
- **NPCs & Structures:** Non-player characters exist for bartering items (e.g., trading meat for water). Statues provide info on enemies, houses/wells add flavor.
- **Progression:** The game state (player stats, inventory, visited zones) is saved automatically, allowing for persistent play sessions. Console commands for debugging.
- **Audio & Tracking:** Basic sound management and user consent tracking for Sentry analytics.

## 2. File Structure & Responsibilities

The project is structured into modules, each handling a specific domain of the game's logic. The `Game` class acts as the central orchestrator. Key updates include modular rendering (split into specialized tile renderers), enhanced AI, sound integration, and connection management for consistent zone transitions.

### Core & Entrypoint

- `index.html`: The main HTML file. Defines UI structure, game canvas, stat card, inventory, overlays (messages, game over, bartering, stats panel).
- `styles.css`: Main stylesheet for "frayed parchment" medieval theme, mobile-first layout.
- `game.js`: Central `Game` class (extends base). Manages game loop, state, delegates to managers. Handles primary game logic like zone transitions, enemy turns, interactions.
- `consoleCommands.js`: Utility functions for debugging, e.g., finding spawn positions for testing.

### Initialization & State Management

- `GameInitializer.js`: Startup sequence: canvas setup, asset loading via `TextureManager`, resize handling, initialization of game or loaded state.
- `GameStateManager.js`: Persists game state in localStorage (player stats, inventory, zones).
- `ConsentManager.js`: Manages user consent for tracking with Sentry. Shows banner, handles opt-in/out.

### Gameplay & Logic Managers

- `InputManager.js`: Handles player input (keyboard, mouse, touch). Translates to movements, pathfinding via A\* algorithm.
- `ActionManager.js`: Special actions: charging spears/horses, bombing, explosion logic.
- `CombatManager.js`: Combat logic: enemy AI movements, attacks, collisions, point animations.
- `InteractionManager.js`: Non-movement interactions: signs, NPCs, statues, item pickups, zone gestures.
- `InventoryManager.js`: Inventory system: add/use/drop items, UI rendering (slots, tooltips).
- `ZoneManager.js`: Zone generation, transitions, treasure spawning.
- `ConnectionManager.js`: Manages deterministic connections between zones for consistent world traversal.
- `MultiTileHandler.js`: Utilities for multi-tile structures like houses, wells.

### UI & Rendering

- `RenderManager.js`: Main rendering engine: grid, player, enemies, effects (explosions, smoke, charges, points).
- `UIManager.js`: UI elements: stats bars, overlays (messages, regions, game over, barter, statue info, stats panel), minimap/inventory delegation.
- `MiniMap.js`: Expands/retracts zone map display.
- `BarterWindow.js`: Barter UI: offers, confirmations.
- `StatueInfoWindow.js`: Info windows for statue interactions.
- `PlayerStatsUI.js`: Detailed stats panel rendering.
- `RendererUtils.js`: Utilities for rotated/flipped images on canvas.

### Rendering Subsystem (Modular Tile Rendering)

- `BaseTileRenderer.js`: Base renderer with common methods (image checks, exits, floors, water, dirt textures).
- `ItemTileRenderer.js`: Renders items (food, axes, spears, bombs, etc.).
- `StructureTileRenderer.js`: Structures (houses, wells, statues, dead trees, enemy tiles).
- `WallTileRenderer.js`: Walls (rocks, grass, interior walls).
- `TileRenderer.js`: Inherits from BaseTileRenderer, configures canvas.
- `TextureDetector.js`: Determines appropriate textures based on grid neighbors.
- `TextureLoader.js` & `TextureManager.js`: Asset loading and management for images.

### Game Entities & Data

- `Player.js`: Player entity: position, stats (health/hunger/thirst), inventory, movements, animations.
- `Enemy.js`: Inherits from `BaseEnemy` in enemy/ folder. Defines enemy logic, attacks.
- `Sign.js`: Manages sign/NPC dialogues, procedural messages, statue data.
- `constants.js`: Game constants: grid size, tile types, asset paths.
- `logger.js`: Logging utilities.

### AI & Movement (enemy/ folder)

- `BaseEnemy.js`: Base enemy class with health, position, AI.
- `EnemyMovement.js`: Shared movement algorithms.
- `EnemyAttack.js`, `EnemyChargeBehaviors.js`, `EnemyLineOfSight.js`, `EnemyPathfinding.js`, `EnemySpecialActions.js`: Specialized enemy behaviors.

### Generators (generators/ folder)

- `ZoneGenerator.js`: Generates zone layouts, walls, exits, treasures.
- `ItemGenerator.js`: Item generation.
- `FeatureGenerator.js`, `PathGenerator.js`, `StructureGenerator.js`, `ZoneStateManager.js`: Procedural generators.

### Utilities

- `SoundManager.js`: Loads and plays sounds.
- `TextureDetector.js` (also in main): Texture logic for tiles.

### Tests (tests/ folder)

- `CombatManager.test.js`, `InventoryManager.test.js`, etc.: Jest tests for key modules.
- Babel and Jest config for testing.

## 3. Folder Structure Quick Reference

- **Root Files**: index.html, styles.css, game.js, constants.js, logger.js, package.json, babel.config.cjs, gitignore - Core setup and configs.
- **Main Modules**: GameInitializer.js, GameStateManager.js, InputManager.js, ActionManager.js, CombatManager.js, InteractionManager.js, InventoryManager.js, ZoneManager.js, ConnectionManager.js, RenderManager.js, UIManager.js, Player.js, Enemy.js, Sign.js, etc. - Business logic categorized.
- **Rendering**: BaseTileRenderer.js, ItemTileRenderer.js, StructureTileRenderer.js, WallTileRenderer.js, TileRenderer.js, RendererUtils.js, TextureLoader.js, TextureManager.js, TextureDetector.js - Modular rendering system.
- **UI**: MiniMap.js, BarterWindow.js, StatueInfoWindow.js, PlayerStatsUI.js - Overlay windows.
- **Enemy AI** (enemy/): BaseEnemy.js, EnemyMovement.js, EnemyAttack.js, EnemyChargeBehaviors.js, EnemyPathfinding.js, etc. - Enemy behaviors.
- **Generators** (generators/): ZoneGenerator.js, ItemGenerator.js, FeatureGenerator.js, StructureGenerator.js, etc. - Procedural content.
- **Tests** (tests/): \*.test.js files for Jest testing.
- **Assets** (images/, Sounds/, fonts/): Subdivided into fauna, items, floors, fx (effects), etc. Image assets for all visuals.
- **Config**: todo_example/ - Example todo, can be ignored.

Total Files: ~90+ including assets. Entry: game.js. Dependencies: Sentry for tracking, Rivescript for dialogues.

## 4. Core Interaction Flow (Example: Player Moves)

1. **Input:** `InputManager` detects keypress/tap, handles pathfinding.
2. **Action:** Calls `player.move()`; checks walkability/attacks.
3. **Transition:** If exit, `Game.js` calls `zoneManager.transitionToZone()` with `ConnectionManager` for consistent exits.
4. **Enemy Turn:** `combatManager.handleEnemyMovements()`; enemies use pathfinding/AI.
5. **UI Update:** `uiManager.updatePlayerStats()` for bars, positions.
6. **Render:** `RenderManager` draws grid/Player via specialized renderers.
