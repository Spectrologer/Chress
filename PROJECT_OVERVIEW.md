## Chress — Project Overview

Chress is a browser-based, 2D top-down, turn-based exploration/combat game with procedural zone generation and a modular codebase. It runs in modern browsers and is optimized for mobile and desktop; the UI is responsive and favors a compact, tile/grid-first presentation.

This document summarizes the repository layout, how to run and test the project locally, and where to look for key systems when making changes.

### Quick summary

- Gameplay: turn-based tile movement, zone-to-zone exploration, item interactions, and chess-inspired enemy behaviors.
- Platform: Browser (HTML5 canvas). Works on mobile and desktop; no native build required.
- How to run locally:

```powershell
npm install
npm start    # launches the dev server (live-server)
npm test     # runs Jest tests
```

Note: `npm start` is an alias for the dev server command (`live-server`) configured in `package.json`.

### What changed since older docs

- Project no longer assumes specific third-party runtime libraries (Sentry or RiveScript) as required dependencies — they were not present in runtime `dependencies` at the time of this update. Dev tooling (Jest, Babel, live-server) remains in `devDependencies`.
- The codebase is organized into clear service/manager modules and a `core/ServiceContainer.js` that helps wire services for easier testing.

### High-level file / folder map (where to look)

- Root: `index.html`, `styles.css`, `game.js`, `package.json`, `PROJECT_OVERVIEW.md` (this file).
- Core (`core/`): initialization, `ServiceContainer.js`, `GameInitializer.js`, `GameStateManager.js`, `Game.js`, and central wiring.
- Managers (`managers/`): `InputManager.js`, `ActionManager.js`, `CombatManager.js`, `InventoryManager.js`, `ZoneManager.js`, `ConnectionManager.js`, `RenderManager.js`, `UIManager.js`, etc. — each encapsulates gameplay responsibilities.
  - **Inventory System (`managers/inventory/`)**: Consolidated inventory management using clean architecture:
    - `ItemMetadata.js` - Static item data (tooltips, constants, type checks)
    - `ItemRepository.js` - Data access layer (inventory CRUD operations)
    - `InventoryService.js` - Business logic orchestration
    - `ItemEffectStrategy.js` - Effect routing (strategy pattern)
    - `effects/` - Individual effect implementations by category:
      - `BaseItemEffect.js` - Abstract base class
      - `ConsumableEffects.js` - Food, Water, Heart
      - `ToolEffects.js` - Axe, Hammer
      - `WeaponEffects.js` - Bomb, Bow, Bishop Spear, Horse Icon
      - `SpecialEffects.js` - Shovel, Note, Book of Time Travel
- Entities: `entities/` and `enemy/` contain `Player.js`, `Enemy.js`, `BaseEnemy.js`, and all specialized enemy behavior files.
- Rendering: `renderers/` plus tile renderer classes (`BaseTileRenderer.js`, `ItemTileRenderer.js`, `StructureTileRenderer.js`, `WallTileRenderer.js`, `RendererUtils.js`) and texture loading (`TextureLoader.js`, `TextureManager.js`).
- Generators: `generators/` (zone/item/feature/structure generators and helpers).
- Assets: `assets/`, `Sounds/`, `fonts/` — images, audio and font assets used by the game.
- Tests: `tests/` — Jest test files covering managers and generators.

### How the core loop typically flows

1. Input (player keyboard/tap) is handled by `InputManager` and translated to movement/actions.
2. Player movement/action triggers game logic in managers (`ActionManager`, `InteractionManager`, `CombatManager`).
3. Zone transitions are handled by `ZoneManager` and `ConnectionManager` for consistent world traversal.
4. Enemy AI runs via enemy-specific modules and `CombatManager`.
5. `RenderManager` and renderer modules draw the current state to the canvas; UI overlays are managed by `UIManager`.

### Tests & development

- Jest is configured for testing (`devDependencies` contain Jest + Babel transforms). Run `npm test` to execute Jest tests found in `tests/`.
- The repository contains automated unit-style tests for many managers and generators. If you add new ES module files that need testing, ensure Babel/Jest transforms cover them.

### Useful commands

```powershell
npm install      # install dev dependencies
npm start        # dev server (opens index.html)
npm test         # run Jest tests
```

### Contribution & reporting issues

- For bugs and feature requests, open an issue in the repository: https://github.com/Spectrologer/Chress/issues
- The project license is ISC (see `package.json`).

### Next steps / suggestions

- Add a minimal `README.md` showing the same run/test instructions and a short demo screenshot (helpful for contributors).
- Consider adding a lightweight CI (GitHub Actions) that installs devDependencies and runs `npm test` on PRs.
- If you plan to use external tracking or dialogue libraries (Sentry, RiveScript), add and document them explicitly in `package.json` and the README.

If you'd like, I can also add a short `README.md` with the run/test steps and a one-line contribution guide, or add a CI workflow to run tests automatically on PRs.

---

Last update: October 25, 2025 — updated to reflect inventory system refactoring and clean architecture implementation.
