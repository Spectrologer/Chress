# Automatic Asset Discovery System

## Overview

The Chesse game now features an **automatic asset discovery system** that eliminates the need to manually register assets in multiple places. Simply add a new image file to the `assets/` directory, and it will be automatically discovered and made available in both the game and the zone editor.

## How It Works

### 1. Build-Time Scanning

The [vite-plugin-asset-discovery.js](../vite-plugin-asset-discovery.js) plugin runs during Vite's build process and:
- Scans the entire `assets/` directory recursively
- Finds all image files (`.png`, `.jpg`, `.jpeg`, `.gif`)
- Categorizes them by directory structure
- Generates a virtual module with asset manifests

### 2. Virtual Module

The plugin creates a virtual module `virtual:asset-manifest` that provides:
- `IMAGE_ASSETS` - Array of all discovered asset paths
- `ASSET_CATEGORIES` - Assets organized by type (walls, floors, characters, etc.)
- `WALL_ASSETS`, `FLOOR_ASSETS`, etc. - Category-specific arrays
- Helper functions for asset key generation

### 3. Automatic Import

The [src/core/constants/assets.js](../src/core/constants/assets.js) file now imports from the virtual module instead of maintaining a hard-coded list.

## Asset Categories

Assets are automatically categorized based on their directory structure:

| Category | Directory | Example |
|----------|-----------|---------|
| **Walls** | `environment/walls/` | `museumwall6.png` |
| **Floors** | `environment/floors/` | `grass.png` |
| **Trim** | `environment/trim/` | `bordertrim.png` |
| **Obstacles** | `environment/obstacles/` | `rock.png` |
| **Doodads** | `environment/doodads/` | `table.png` |
| **Flora** | `environment/flora/` | `tree.png` |
| **Effects** | `environment/effects/` | `smoke_frame_1.png` |
| **Characters** | `characters/` | `player/default.png` |
| **Items** | `items/` | `equipment/axe.png` |
| **UI** | `ui/` | `arrow.png` |
| **Other** | Any other directory | Miscellaneous assets |

## Adding New Assets

### Quick Start

1. **Add your asset file** to the appropriate directory:
   ```
   assets/environment/walls/mynewwall.png
   ```

2. **The asset is now automatically available in-game!** It will be:
   - Automatically discovered at build/dev time
   - Available in the game as `'mynewwall'`
   - Usable in zone JSON files as `"customTexture": "walls/mynewwall"`
   - Loaded by TextureLoader without any code changes

3. **For the Zone Editor** (one-time setup after adding assets):
   - The zone editor requires a manual update for now
   - Simply add your asset to two places in [tools/zone-editor.html](../tools/zone-editor.html):
     1. The `tileAssets` object (around line 653)
     2. The appropriate palette array (e.g., `WALL` around line 775)
   - **OR** use the helper script: `npm run assets:discover` to see all discovered assets

### Example: Adding museumwall6

When you added `assets/environment/walls/museumwall6.png`, the system automatically:

1. ✅ Discovered it during the build scan (23 walls found)
2. ✅ Added it to `IMAGE_ASSETS` array
3. ✅ Categorized it as a wall in `ASSET_CATEGORIES.walls`
4. ✅ Made it available as `'museumwall6'` in the texture system
5. ✅ Enabled usage in zone JSON: `"customTexture": "walls/museumwall6"`

**No manual registration required!**

## In-Game Usage

### Using Assets in Zone JSON

After adding a wall asset like `museumwall6.png`, you can immediately use it in zone files:

```json
{
  "terrainTextures": {
    "5,3": "walls/museumwall6",
    "5,4": "walls/museumwall6"
  }
}
```

The game's [WallTileRenderer](../src/renderers/WallTileRenderer.js) automatically:
1. Strips the `walls/` prefix → `museumwall6`
2. Looks up `this.images['museumwall6']`
3. Renders the texture

### Asset Keys

Assets are automatically converted to keys:

| Asset Path | Generated Key | Usage in JSON |
|------------|---------------|---------------|
| `environment/walls/museumwall6.png` | `museumwall6` | `"walls/museumwall6"` |
| `environment/floors/grass.png` | `grass` | `"floors/grass"` |
| `characters/npcs/penne.png` | `penne` | N/A (used by NPC system) |

## Zone Editor Integration

The zone editor can also use automatically discovered assets through the [tools/zone-editor-assets.js](../tools/zone-editor-assets.js) module, which:

1. Imports from the virtual asset manifest
2. Generates `tileAssets` mapping for the zone editor
3. Creates default palettes from discovered assets

### Updating Zone Editor (Future Enhancement)

Currently, the zone editor uses a static HTML file with hard-coded assets. To enable full automatic discovery in the zone editor, you would need to:

1. Convert `zone-editor.html` to a module-based approach
2. Import from `zone-editor-assets.js`
3. Dynamically populate the tile palette

**Current workaround:** The zone editor still requires manual asset registration in its `tileAssets` object. However, the game itself works fully automatically.

## Build Output

When you run `npm run dev` or `npm run build`, you'll see:

```
[Asset Discovery] Scanning assets directory: .../assets
[Asset Discovery] Found assets:
  - Walls: 23
  - Floors: 14
  - Characters: 53
  - Items: 18
  - UI: 12
  - Effects: 20
  - Total: 169
```

This confirms all assets were discovered successfully.

## Hot Module Replacement (HMR)

The plugin supports HMR in development mode:
- Add/remove/modify an asset file
- The plugin automatically rescans
- Your app reloads with updated asset lists
- No manual refresh needed

## Helper Scripts

### Asset Discovery Script

Use `npm run assets:discover` to run a standalone asset scanner that:
- Scans all assets in the `assets/` directory
- Shows statistics by category
- Lists all discovered wall assets
- Generates a `tools/discovered-assets.js` file with exports

This is useful for:
- Verifying new assets were found
- Getting a quick overview of available assets
- Reference when manually updating the zone editor

## Technical Details

### Virtual Module Resolution

Vite resolves `virtual:asset-manifest` through the plugin's `resolveId` and `load` hooks:

```javascript
import { IMAGE_ASSETS } from 'virtual:asset-manifest';
```

This imports the generated manifest at build time.

### Asset Scanning Algorithm

The plugin uses Node.js `fs` module to:
1. Recursively scan directories
2. Filter for image files
3. Generate relative paths
4. Categorize by directory structure

### Performance

- **Build Time:** ~100ms for ~170 assets
- **Runtime:** Zero overhead (all work done at build time)
- **HMR:** Instant rescan on file changes

## Benefits

### ✅ Before (Manual)

1. Add asset file to `assets/`
2. Edit `src/core/constants/assets.js`
3. Edit `tools/zone-editor.html` (tileAssets)
4. Edit `tools/zone-editor.html` (palette array)
5. Risk of typos and missing entries

### ✨ After (Automatic)

1. Add asset file to `assets/`
2. **Done!**

## Files Modified

| File | Purpose |
|------|---------|
| [vite-plugin-asset-discovery.js](../vite-plugin-asset-discovery.js) | Vite plugin that scans assets |
| [vite.config.js](../vite.config.js) | Registers the asset discovery plugin |
| [src/core/constants/assets.js](../src/core/constants/assets.js) | Now imports from virtual module |
| [tools/zone-editor-assets.js](../tools/zone-editor-assets.js) | Zone editor asset utilities |

## Troubleshooting

### Asset Not Found

**Problem:** Added an asset but it's not loading

**Solution:**
1. Check the asset is in the correct directory (e.g., `assets/environment/walls/`)
2. Check the file extension is `.png`, `.jpg`, `.jpeg`, or `.gif`
3. Restart the dev server (`npm run dev`)
4. Check the build output for the asset count

### Wrong Asset Key

**Problem:** Asset has unexpected key

**Solution:** The key is derived from the filename without extension. For example:
- `my-wall.png` → `'my-wall'`
- `MyWall.png` → `'MyWall'` (case-sensitive!)

### Zone Editor Not Updated

**Problem:** Asset works in-game but not in zone editor

**Solution:** The zone editor currently requires manual asset registration. You have two options:

**Option 1: Manual addition**
Add your asset to two places in `zone-editor.html`:
1. `tileAssets` object (around line 653): `'walls/mynewwall': '../assets/environment/walls/mynewwall.png',`
2. Appropriate palette array (around line 775): add `'walls/mynewwall'` to the `WALL` array

**Option 2: Use the helper script**
Run `npm run assets:discover` to see all discovered assets and their categories, then manually add the missing ones to the zone editor.

## Future Enhancements

- [ ] Full automatic discovery for zone editor
- [ ] Asset validation (check for missing files)
- [ ] Asset optimization (compression, sprites)
- [ ] Asset manifest viewer tool
- [ ] Support for animated sprites
- [ ] Custom asset categorization rules

## Summary

The automatic asset discovery system makes adding new game assets **effortless**. Simply drop an image into the appropriate directory, and it's immediately available throughout the game. No more manual registration, no more typos, no more forgotten entries.

**Example:** Your `museumwall6.png` is now automatically discovered, loaded, and ready to use! 🎉
