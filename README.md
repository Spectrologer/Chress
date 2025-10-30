# Chress: Chess 2 - The Sequel to Chess

A browser-based RPG game with turn-based combat, zone exploration, and procedural generation.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-ISC-green)
![PWA](https://img.shields.io/badge/PWA-enabled-purple)

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

- **Turn-based Combat** - Strategic chess-inspired movement
- **Procedural Generation** - Infinite unique zones to explore
- **NPC Trading System** - Barter with various characters
- **Inventory Management** - Collect items, equipment, and consumables
- **Progressive Web App** - Install and play offline
- **Optimized Performance** - Code splitting and lazy loading

## 🚀 Recent Updates

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

### Getting Started
- **[Build & Deployment Guide](docs/BUILD.md)** - Complete build system documentation
- **[PWA & Lazy Loading Guide](docs/PWA-LAZY-LOADING.md)** - Progressive Web App features
- **[Project Overview](docs/PROJECT_OVERVIEW.md)** - Architecture and structure

### Development
- **[TypeScript Migration Guide](docs/TYPESCRIPT_MIGRATION.md)** - TypeScript adoption
- **[Type Checking Guide](docs/TYPE_CHECKING_MIGRATION_GUIDE.md)** - Runtime type validation
- **[Testing Guide](docs/TESTING.md)** - Testing strategies and examples
- **[Error Handling](docs/ERROR_HANDLING.md)** - Error management patterns

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
- **Language**: JavaScript (ES Modules) + TypeScript migration in progress
- **Testing**: Jest with JSDOM
- **Linting**: ESLint 9.x
- **PWA**: Workbox via vite-plugin-pwa

## 📦 Project Structure

```
chress/
├── assets/              # Public assets (images, UI, fonts)
│   ├── characters/
│   ├── environment/
│   ├── items/
│   └── ui/
├── boards/              # Custom zone definitions
├── docs/                # Documentation
├── src/
│   ├── core/           # Core game logic
│   ├── managers/       # Game systems (inventory, combat, zones)
│   ├── renderers/      # Rendering systems
│   ├── ui/             # UI components
│   ├── enemy/          # Enemy AI
│   ├── utils/          # Utilities (lazy loading, type checking)
│   └── state/          # State management
├── tools/              # Development tools (asset viewer)
└── tests/              # Test suites
```

## 🎨 Asset Organization

Assets are organized by category:
- `characters/` - Player, NPCs, enemies
- `environment/` - Floors, walls, doodads, effects
- `items/` - Equipment, consumables, misc items
- `ui/` - UI elements, icons

Use the **Asset Viewer** to browse all assets:
```bash
npm run asset-viewer
```

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

### GitHub Pages
```bash
# Build
npm run build

# Deploy (if gh-pages installed)
npx gh-pages -d dist
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
