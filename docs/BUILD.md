# Build & Deployment Guide

This project uses **Vite** as a modern build tool for optimal performance, code splitting, and production optimization.

## Quick Start

### Development
```bash
npm install
npm run dev
```

This starts the Vite development server at `http://localhost:3000` with hot module replacement (HMR).

### Production Build
```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

### Preview Production Build
```bash
npm run preview
```

This serves the production build locally at `http://localhost:4173` for testing.

## Build Features

### Code Optimization
- **Minification**: Uses Terser to minimize JavaScript bundle size
- **Tree Shaking**: Removes unused code automatically
- **Dead Code Elimination**: Removes unreachable code
- **Source Maps**: Included for debugging production issues

### Code Splitting Strategy
The build automatically splits code into optimized chunks:

- `game-core.js` - Core game logic and constants
- `managers.js` - Zone, Grid, Action, and Interaction managers
- `inventory.js` - Inventory system and item management
- `renderers.js` - All rendering components
- `enemy-ai.js` - Enemy behavior and pathfinding
- `utils.js` - Utility functions (lazy loaded)

### Asset Optimization
- **Automatic hashing**: Assets get content-based hashes for cache busting
- **Inline small assets**: Assets under 4KB are inlined as base64
- **Organized output**: Assets are automatically organized by type
  - Images: `dist/assets/images/`
  - Fonts: `dist/assets/fonts/`
  - Other: `dist/assets/`

### Performance Benefits

**Before (Direct ES Modules)**
- All code loads upfront
- No minification
- No tree-shaking
- Manual cache busting with `?v=` parameters
- Slower initial load

**After (Vite Build)**
- Code split into optimal chunks
- Minified and optimized
- Dead code removed
- Automatic cache busting via content hashes
- Faster initial load and better caching

## Build Scripts

### Available Commands
```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build
npm run build:analyze    # Build with bundle analyzer
npm run asset-viewer     # Run asset viewer tool
```

## Deployment

### GitHub Pages
The build is pre-configured for GitHub Pages deployment:

1. Build the project:
   ```bash
   npm run build
   ```

2. The `dist/` folder contains the complete production build

3. Deploy the `dist/` folder to GitHub Pages:
   ```bash
   # Using gh-pages (if installed)
   npx gh-pages -d dist

   # Or manually commit and push the dist folder to gh-pages branch
   ```

4. The base URL is automatically set to `/Chress/` for GitHub Pages

### Other Platforms

**Netlify / Vercel**
- Build command: `npm run build`
- Publish directory: `dist`

**Static Server**
- Simply serve the `dist/` directory
- Ensure SPA fallback is enabled (all routes → index.html)

## Configuration

### Vite Config ([vite.config.js](vite.config.js))

Key configuration options:

```javascript
{
  base: '/Chress/',           // Base URL for deployment
  build: {
    target: 'esnext',         // Target modern browsers
    minify: 'terser',         // Use Terser for minification
    sourcemap: true,          // Enable source maps
    chunkSizeWarningLimit: 1000 // Chunk size warning threshold
  }
}
```

### Path Aliases
Convenient import aliases are configured:

```javascript
import { foo } from '@/utils/foo.js'       // = src/utils/foo.js
import { bar } from '@core/bar.js'         // = src/core/bar.js
import { baz } from '@managers/baz.js'     // = src/managers/baz.js
```

## Build Analysis

To analyze your bundle size and composition:

```bash
npm run build:analyze
```

This generates a visual report showing:
- Bundle size breakdown
- Chunk composition
- Dependency sizes
- Import relationships

## Troubleshooting

### Issue: Module not found
**Solution**: Ensure all imports don't include `?v=` query parameters

### Issue: Assets not loading
**Solution**: Check that assets are in the `assets/` directory (Vite's public directory)

### Issue: Build size too large
**Solution**: Run `npm run build:analyze` to identify large dependencies

### Issue: Source maps missing
**Solution**: Ensure `sourcemap: true` in vite.config.js

## Migration from live-server

The old development setup used `live-server` with manual cache busting. This has been replaced with Vite:

**Old**:
```javascript
import foo from '/src/foo.js?v=5'  // Manual cache busting
```

**New**:
```javascript
import foo from '/src/foo.js'       // Automatic cache busting via content hashes
```

All `?v=` parameters have been removed as Vite handles cache busting automatically during builds.

## Performance Metrics

Expected improvements with Vite:

- **Initial Load**: 30-50% faster (code splitting + minification)
- **Cache Hit Rate**: 90%+ (content-based hashing)
- **Bundle Size**: 40-60% smaller (tree shaking + minification)
- **Development HMR**: < 100ms (hot module replacement)

## Progressive Web App (PWA)

Chress is now a fully-featured PWA with offline support!

### PWA Features

**Offline Support**
- Game assets are cached automatically
- Play without an internet connection
- Background sync for game saves

**Install to Device**
- Install on mobile/desktop as a native app
- Runs in standalone mode (no browser UI)
- App icon on home screen/desktop

**Auto Updates**
- Service worker checks for updates automatically
- Users are notified when updates are available
- Seamless update experience

### Caching Strategy

**Static Assets** (CacheFirst)
- Images, fonts, icons cached indefinitely
- 200 image limit, 30-day expiration
- Immediate load from cache

**JavaScript/CSS** (StaleWhileRevalidate)
- Serve from cache, update in background
- 60 file limit, 7-day expiration
- Always up-to-date

**External Resources** (CacheFirst)
- Google Fonts cached for 1 year
- 10 entry limit per cache

### Installing as PWA

**Desktop (Chrome/Edge)**
1. Visit the game URL
2. Click install icon in address bar
3. Or use "Install Chress" from menu

**Mobile (iOS/Android)**
1. Visit the game URL
2. Tap share button
3. Select "Add to Home Screen"

**Verification**
Check if running as PWA:
```javascript
window.matchMedia('(display-mode: standalone)').matches
```

## Lazy Loading

Critical performance optimization through code splitting and lazy loading.

### What Gets Lazy Loaded

**UI Components**
- Barter Window (loads on first NPC interaction)
- Statue Info Window (loads when viewing statues)
- Message Log (loads when opened)
- Radial Menu (preloaded during idle time)
- Config/Records Panels (loads on demand)

**Heavy Utilities**
- Enemy pathfinding (loads with first enemy)
- Line of sight calculations (loads when needed)

**Editor Tools**
- Zone Editor (loads only when opened)
- Character Editor (loads only when opened)

### How It Works

The `LazyLoader` utility provides:
```javascript
import { LazyUI } from '@/utils/LazyLoader.js';

// Lazy load a component
const { BarterWindow } = await LazyUI.loadBarterWindow();
```

### Preloading Strategy

Critical modules are preloaded during idle time:
- Uses `requestIdleCallback` when available
- Preloads commonly used UI components
- Doesn't block initial render

### Performance Impact

**Before Lazy Loading**
- All code loads upfront
- ~500 KB initial bundle

**After Lazy Loading**
- Only critical code loads initially
- ~300 KB initial bundle (40% reduction)
- Additional chunks load on demand
- Faster time to interactive

## Further Optimization

Additional optimizations available:

1. **Enable compression** on your server (gzip/brotli)
2. **Use a CDN** for static assets
3. **Enable HTTP/2** for parallel asset loading
4. **Implement route-based code splitting** (future enhancement)
5. **Add preload/prefetch hints** for critical resources

## Support

For issues or questions:
- [Vite Documentation](https://vite.dev)
- [Project Issues](https://github.com/Spectrologer/Chress/issues)
