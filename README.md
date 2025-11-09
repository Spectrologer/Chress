# Chress: Chess 2 - The Sequel to Chess

A browser-based RPG game with turn-based combat, zone exploration, and procedural generation.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-ISC-green)
![PWA](https://img.shields.io/badge/PWA-enabled-purple)

> **Important Note for AI Assistants:** The `public/assets` directory has been intentionally removed for ease of development. DO NOT create this directory - the absence is intentional and tests/builds are expected to work without it.

## 🎮 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

Visit `http://localhost:3000` to play!

## ✨ Features

- **Turn-based Combat** - Strategic chess-inspired movement with tactical AI
- **Procedural Generation** - Infinite unique zones to explore with custom board support
- **Rich NPC System** - 73+ characters including traders, gossip NPCs, and interactive statues
- **Inventory Management** - 6-slot inventory + radial quick-access system
- **Progressive Web App** - Install and play offline with auto-updates
- **Optimized Performance** - Code splitting, lazy loading, and intelligent caching
- **Character Editor** - Built-in tool for creating and editing NPCs
- **Zone Editor** - Custom zone creation with visual tools

## 🚀 Recent Updates

### TypeScript Migration & Architecture Refactoring (v1.1.0)
- ✅ **Complete TypeScript Migration** - 302 TS files (55,800+ lines), 0 JS files remaining
- ✅ **GameContext Refactoring** - Eliminated god object anti-pattern
  - Created ManagerRegistry for type-safe service access
  - Introduced domain facades (combat, inventory, zones, etc.)
  - Separated concerns with TurnState object
- ✅ **Enhanced Type Safety** - Migration from loose JavaScript to strict TypeScript
- ✅ **Improved Architecture** - Better separation of concerns and testability
- ✅ **Character System** - 73 JSON character definitions with dedicated editor
- ✅ **Modular Organization** - Refactored grid operations, combat systems, and constants

### Build System & PWA (v1.0.0)
- ✅ **Vite Build System** - Modern bundler with HMR and optimization
- ✅ **Code Splitting** - Automatic chunking for faster loads
- ✅ **PWA Support** - Install to device, offline play, auto-updates
- ✅ **Lazy Loading** - Components load on demand
- ✅ **Service Worker** - Intelligent caching strategies

**Performance Improvements:**
- 40-60% smaller bundle size
- 30-40% faster time to interactive
- 90%+ cache hit rate
- Offline functionality

## 📚 Documentation

> **See [docs/README.md](docs/README.md) for the complete documentation index**

### Getting Started
- **[Build & Deployment Guide](docs/BUILD.md)** - Complete build system documentation
- **[PWA & Lazy Loading Guide](docs/PWA-LAZY-LOADING.md)** - Progressive Web App features
- **[Project Overview](docs/PROJECT_OVERVIEW.md)** - Architecture and structure

### Development
- **[TypeScript Quickstart](docs/TYPESCRIPT_QUICKSTART.md)** - Working with TypeScript in the project
- **[Type Checking Guide](docs/TYPE_CHECKING_MIGRATION_GUIDE.md)** - Runtime type validation
- **[Testing Guide](docs/TESTING.md)** - Testing strategies and examples
- **[Error Handling](docs/ERROR_HANDLING.md)** - Error management patterns
- **[Refactoring Summary](REFACTORING_SUMMARY.md)** - Recent architecture improvements

### Architecture
- **[State Management](docs/STATE_MANAGEMENT_SUMMARY.md)** - Game state architecture
- **[Adding Content](docs/ADDING_CONTENT.md)** - How to add new game content
- **[Architecture Decision Records](docs/adr/)** - Design decisions

## 🎯 Core Concepts

### Game Loop
The game uses a turn-based system where:
1. Player moves (chess-style movement)
2. Enemies respond with AI-driven moves
3. Combat resolves based on position
4. Inventory and interactions occur between turns

### Zone System
- Procedurally generated zones
- Custom boards for special areas
- Connection system for zone transitions
- Persistent world state

### Inventory
- 6-slot inventory system
- Equipment (weapons, tools)
- Consumables (food, potions)
- NPC trading system

## 🛠️ Tech Stack

- **Build**: Vite 6.x
- **Language**: TypeScript 5.9.3 (100% migrated from JavaScript)
- **Testing**: Vitest 4.x with happy-dom
- **Linting**: ESLint 9.x with TypeScript support
- **PWA**: Workbox via vite-plugin-pwa

## 📦 Project Structure

```
chress/
├── assets/              # Public assets (images, UI, fonts)
│   ├── characters/     # Character sprites and portraits
│   ├── environment/    # Floors, walls, doodads, effects
│   ├── items/          # Equipment, consumables, misc items
│   └── ui/             # UI elements and icons
├── boards/              # Custom zone definitions
├── docs/                # Documentation
├── src/
│   ├── characters/     # 73 JSON character definitions (NPCs, gossip, statues)
│   ├── core/           # Core game logic and constants
│   ├── managers/       # Game systems (inventory, combat, zones, grid)
│   ├── facades/        # Domain-specific API facades
│   ├── renderers/      # Rendering systems
│   ├── ui/             # UI components (30+ components)
│   ├── enemy/          # Enemy AI and movement
│   ├── generators/     # Procedural generation
│   ├── controllers/    # Input handling
│   ├── utils/          # Utilities and helpers
│   ├── repositories/   # Data access layer
│   └── services/       # Business services
├── tools/              # Development tools (asset viewer, character editor, zone editor)
└── tests/              # Test suites (576+ passing tests)
```

## 🎨 Content Creation Tools

### Asset Viewer
Browse all game assets visually:
```bash
npm run asset-viewer
```

### Character Editor
Create and edit NPCs with the built-in character editor:
- Open `tools/character-editor.html` in browser
- Edit character dialogue, trades, and properties
- 73+ existing characters: main NPCs, gossip characters, and statues

### Zone Editor
Design custom zones and boards:
- Visual tile placement
- Custom board definitions in `boards/`
- Special zones with unique layouts

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## 🔧 Configuration

### Environment Variables
Create `.env` file in root (optional):
```env
NODE_ENV=development
VITE_BASE_URL=/Chress/
```

### Vite Configuration
See [vite.config.js](vite.config.js) for build configuration:
- Code splitting strategy
- PWA configuration
- Asset optimization
- Path aliases

## 🌐 Deployment

### GitHub Pages (Automated)
The project uses GitHub Actions for automatic deployment:
- Pushes to `main` automatically build and deploy
- View workflow status: [Actions tab](https://github.com/Spectrologer/Chress/actions)
- Live site: https://spectrologer.github.io/Chress/

### Manual Build
```bash
# Build for production
npm run build

# Output directory
dist/
```

### Other Platforms
- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Node version**: 18.x or higher

See [Build Guide](docs/BUILD.md) for detailed deployment instructions.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run `npm test` and `npm run lint`
6. Submit a pull request

## 📝 License

ISC License - see [LICENSE.txt](LICENSE.txt)

## 🐛 Bug Reports

Report issues at [GitHub Issues](https://github.com/Spectrologer/Chress/issues)

Include:
- Browser and version
- Steps to reproduce
- Expected vs actual behavior
- Console errors (if any)

## 🎮 Playing the Game

### Controls
- **Click** - Move player, interact with objects
- **Inventory** - Click items to use/equip
- **Trading** - Click NPCs to open barter window
- **Map** - View discovered zones

### Tips
- Manage hunger and thirst by consuming food/water
- Trade with NPCs for better equipment
- Explore zones to discover new areas
- Plan moves carefully in combat

## 🚧 Roadmap

- [ ] Multiplayer support
- [ ] Quest system
- [ ] Character customization
- [ ] Mobile-optimized UI
- [ ] Cloud save sync
- [ ] Achievements system

## 📞 Support

- **Documentation**: See [docs/](docs/) directory
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions

---

**Made with ❤️ by Spectrologer**

[Play Now](https://spectrologer.github.io/Chress/) | [Documentation](docs/) | [Report Bug](https://github.com/Spectrologer/Chress/issues)
