# File Organization Guide

This document explains the file organization structure of the Chress project.

## 📁 Directory Structure

```
chress/
├── .claude/              # Claude Code configuration
├── .git/                 # Git repository data
├── assets/               # PUBLIC DIRECTORY - Game assets (copied to dist)
│   ├── characters/       # Character sprites (player, NPCs, enemies)
│   ├── environment/      # Environment assets (floors, walls, effects)
│   ├── items/            # Item sprites (equipment, consumables)
│   └── ui/               # UI elements, icons, PWA assets
├── boards/               # Custom zone definitions (JSON)
├── coverage/             # Test coverage reports (generated)
├── dist/                 # Production build output (generated)
├── docs/                 # 📚 ALL DOCUMENTATION FILES
│   ├── adr/              # Architecture Decision Records
│   ├── refactoring/      # Refactoring documentation
│   ├── BUILD.md          # Build system & deployment guide
│   ├── PWA-LAZY-LOADING.md # PWA & lazy loading documentation
│   ├── TESTING.md        # Testing guide
│   ├── ADDING_CONTENT.md # Content creation guide
│   └── ...               # Other technical docs
├── eslint-rules/         # Custom ESLint rules
├── fonts/                # Font files (MedievalSharp)
├── node_modules/         # NPM dependencies (generated)
├── scripts/              # Build and utility scripts
├── sfx/                  # Sound effects
├── Sounds/               # Music files
├── src/                  # 🎮 SOURCE CODE
│   ├── config/           # Game configuration
│   ├── controllers/      # Input controllers
│   ├── core/             # Core game engine
│   ├── enemy/            # Enemy AI system
│   ├── entities/         # Game entities (Player, Enemy, NPC)
│   ├── facades/          # API facades
│   ├── generators/       # Procedural generation
│   ├── loaders/          # Asset loaders
│   ├── managers/         # Game systems
│   │   └── inventory/    # Inventory subsystem
│   ├── npc/              # NPC system
│   ├── renderers/        # Rendering systems
│   │   └── strategies/   # Render strategies
│   ├── state/            # State management
│   ├── ui/               # UI components
│   └── utils/            # Utilities
│       ├── LazyLoader.js       # Lazy loading system
│       └── pwa-register.js     # PWA registration
├── tests/                # Test suites
├── tools/                # Development tools
│   ├── asset-scanner.js  # Asset scanning utility
│   └── asset-viewer.html # Asset browser
├── .babelrc              # Babel configuration
├── .gitignore            # Git ignore rules
├── babel.config.cjs      # Babel config (CJS)
├── eslint.config.js      # ESLint 9.x config
├── index.html            # Main HTML entry point
├── vitest.config.js      # Vitest testing config
├── LICENSE.txt           # License file
├── manifest.json         # 📝 PWA manifest (reference)
├── package.json          # NPM package config
├── package-lock.json     # NPM lock file
├── PROJECT_OVERVIEW.md   # Project architecture overview
├── README.md             # 📖 MAIN README (start here!)
├── STATE_MANAGEMENT_SUMMARY.md # State management docs
├── styles.css            # Main stylesheet
├── sw.js                 # 📝 Service worker (reference)
├── tsconfig.json         # TypeScript config
└── vite.config.js        # Vite build configuration
```

## 📚 Documentation Organization

### Main Entry Points
- **[README.md](README.md)** - Start here! Quick start and overview
- **[PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)** - Architecture and design

### Technical Documentation (in `docs/`)
- **[BUILD.md](docs/BUILD.md)** - Build system, deployment, optimization
- **[PWA-LAZY-LOADING.md](docs/PWA-LAZY-LOADING.md)** - PWA features, lazy loading
- **[TESTING.md](docs/TESTING.md)** - Testing strategies
- **[ADDING_CONTENT.md](docs/ADDING_CONTENT.md)** - How to add game content
- **[ERROR_HANDLING.md](docs/ERROR_HANDLING.md)** - Error management
- **[TYPESCRIPT_MIGRATION.md](docs/TYPESCRIPT_MIGRATION.md)** - TypeScript adoption

### Architecture Docs
- **[STATE_MANAGEMENT_SUMMARY.md](STATE_MANAGEMENT_SUMMARY.md)** - State architecture
- **[docs/adr/](docs/adr/)** - Architecture decisions

## 🔧 Configuration Files

### Build & Bundling
- `vite.config.js` - Vite build configuration (PWA, code splitting)
- `package.json` - NPM scripts and dependencies

### Code Quality
- `eslint.config.js` - ESLint 9.x flat config
- `tsconfig.json` - TypeScript compiler options
- `.babelrc` - Babel transpilation

### Testing
- `vitest.config.js` - Vitest test configuration
- `babel.config.cjs` - Babel config for Vitest

## 📝 Reference Files

### PWA Reference Files (Root)
These files are **reference implementations** for documentation:

- **`manifest.json`** - PWA manifest reference
  - Actual manifest: Auto-generated to `dist/manifest.webmanifest`
  - Configuration: See [vite.config.js](vite.config.js:141-165)

- **`sw.js`** - Service worker reference
  - Actual service worker: Auto-generated to `dist/sw.js`
  - Configuration: See [vite.config.js](vite.config.js:167-229)

These files show the structure and logic but are NOT used in production.
The Vite PWA plugin generates optimized versions during build.

## 🎨 Assets Directory

The `assets/` directory is Vite's **publicDir** - all contents are copied to `dist/` during build.

### Asset Categories
```
assets/
├── characters/
│   ├── npcs/          # NPC sprites and portraits
│   ├── enemies/       # Enemy sprites
│   └── player/        # Player character assets
├── environment/
│   ├── floors/        # Floor tiles
│   ├── walls/         # Wall sprites
│   ├── doodads/       # Decorative objects
│   ├── flora/         # Plants and vegetation
│   └── effects/       # Visual effects (smoke, explosions)
├── items/
│   ├── equipment/     # Weapons, tools
│   ├── consumables/   # Food, potions
│   └── misc/          # Other items
└── ui/
    ├── icon-192.png   # PWA icon 192x192
    ├── icon-512.png   # PWA icon 512x512
    └── ...            # UI elements
```

### Asset Organization Best Practices
1. **PNG format** for all game sprites
2. **Consistent naming** - lowercase, descriptive
3. **Organized by type** - characters, environment, items, UI
4. **Size conventions**:
   - Sprites: 16x16 or 32x32
   - Portraits: 32x32
   - Icons: 192x192, 512x512

## 🏗️ Source Code Organization

### Core Systems
```
src/
├── core/              # Game engine core
│   ├── game.js        # Main game class & initialization
│   ├── GameContext.js # Game state context
│   ├── ServiceContainer.js # Dependency injection
│   └── ...
├── managers/          # Game system managers
│   ├── ZoneManager.js
│   ├── CombatManager.js
│   ├── ItemManager.js
│   └── inventory/     # Inventory subsystem
└── ...
```

### Rendering Pipeline
```
src/renderers/
├── RenderManager.js   # Main renderer
├── TileRenderer.js    # Tile rendering
├── PlayerRenderer.js  # Player rendering
└── strategies/        # Render strategies per tile type
```

### UI Components
```
src/ui/
├── UIManager.js       # Main UI coordinator
├── BarterWindow.js    # NPC trading (lazy loaded)
├── InventoryUI.js     # Inventory display
├── RadialMenu.js      # Radial menu (lazy loaded)
└── ...
```

## 🚀 Generated Directories

These directories are auto-generated and should be in `.gitignore`:

- **`dist/`** - Production build output
  ```
  dist/
  ├── index.html
  ├── manifest.webmanifest  # Auto-generated PWA manifest
  ├── sw.js                 # Auto-generated service worker
  ├── registerSW.js         # SW registration script
  ├── assets/               # Optimized assets
  └── js/                   # Bundled JS chunks
  ```

- **`coverage/`** - Vitest coverage reports
- **`node_modules/`** - NPM dependencies

## 📦 Build Output Organization

After running `npm run build`, the `dist/` directory contains:

### Generated Files
- `index.html` - Processed HTML with asset hashes
- `manifest.webmanifest` - PWA manifest (auto-generated)
- `sw.js` - Service worker with Workbox (auto-generated)
- `registerSW.js` - SW registration helper
- `workbox-*.js` - Workbox runtime

### Optimized Assets
- `assets/` - CSS, fonts with content hashes
- `js/` - Code-split JavaScript bundles
- All public assets (characters, environment, items, ui)

### Asset Handling
- **Small assets (< 4KB)**: Inlined as base64
- **Images**: Kept as separate files with hashes
- **Fonts**: Extracted to `assets/fonts/`

## 🔍 Finding Things

### Looking for...

**Documentation?**
→ Check [README.md](README.md) first, then [docs/](docs/) directory

**Build configuration?**
→ See [vite.config.js](vite.config.js)

**PWA setup?**
→ See [docs/PWA-LAZY-LOADING.md](docs/PWA-LAZY-LOADING.md)

**Game assets?**
→ Browse [assets/](assets/) or use `npm run asset-viewer`

**Source code?**
→ Start at [src/core/game.js](src/core/game.js)

**Tests?**
→ See [tests/](tests/) directory

**Custom zones?**
→ Check [boards/](boards/) directory

## 🎯 Best Practices

### Adding New Files

**Documentation**
→ Add to [docs/](docs/) directory

**Assets**
→ Add to appropriate [assets/](assets/) subdirectory

**Source Code**
→ Add to [src/](src/) with appropriate organization

**Tests**
→ Add to [tests/](tests/) matching source structure

**Tools**
→ Add to [tools/](tools/) directory

### Naming Conventions

**Files**: `PascalCase.js` for classes, `camelCase.js` for utilities
**Directories**: `lowercase-with-dashes/` or `camelCase/`
**Assets**: `lowercase-descriptive.png`
**Tests**: `*.test.js` or `*.spec.js`

## 🧹 Cleanup Commands

```bash
# Remove generated files
rm -rf dist/ coverage/

# Remove dependencies
rm -rf node_modules/

# Clean install
rm -rf node_modules/ package-lock.json && npm install

# Clean build
rm -rf dist/ && npm run build
```

## 📋 File Count Summary

- **Source Files**: ~150 JS files
- **Test Files**: ~50 test suites
- **Assets**: ~200 image assets
- **Documentation**: ~20 markdown files
- **Total Lines**: ~25,000 LOC

## 🔗 Related Documentation

- [README.md](README.md) - Main readme
- [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) - Architecture overview
- [docs/BUILD.md](docs/BUILD.md) - Build and deployment
- [docs/PWA-LAZY-LOADING.md](docs/PWA-LAZY-LOADING.md) - PWA features
- [STATE_MANAGEMENT_SUMMARY.md](STATE_MANAGEMENT_SUMMARY.md) - State management

---

**Last Updated**: 2025-01-29
**Version**: 1.0.0
