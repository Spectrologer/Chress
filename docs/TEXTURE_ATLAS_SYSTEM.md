# Texture Atlas System

## Overview

The game now uses **texture atlases** to significantly improve loading performance and reduce bandwidth usage. Instead of loading 325 individual PNG files, the game loads **6 atlas files** (200KB total in WebP format).

## What Changed

### Before
- **325 individual PNG files** scattered across directories
- Each file required a separate HTTP request
- Higher bandwidth usage
- Slower initial load times

### After
- **6 consolidated atlas files**:
  - `npcs.webp` (85KB) - 162 NPC sprites
  - `environment.webp` (51KB) - 97 environment sprites
  - `ui.webp` (41KB) - 17 UI elements
  - `items.webp` (6.1KB) - 26 item sprites
  - `enemies.webp` (3.2KB) - 7 enemy sprites
  - `player.webp` (1.3KB) - 4 player sprites
- **Total: ~200KB** (vs 241KB+ for individual files)
- **WebP format** for better compression (25-35% smaller than PNG)
- Square, power-of-2 dimensions for optimal GPU performance

## How It Works

### Atlas Generation
Run `npm run assets:atlas` to regenerate atlases from source images in `static/assets/`.

The script ([scripts/generate-atlases.js](../scripts/generate-atlases.js)):
1. Scans all images in `static/assets/` organized by category
2. Packs sprites efficiently using MaxRectsBin algorithm
3. Generates square atlases with power-of-2 dimensions
4. Converts to WebP format with 95% quality
5. Creates JSON metadata files describing sprite locations

### Runtime Loading
The [AtlasTextureLoader](../src/renderers/AtlasTextureLoader.ts):
1. Loads atlas JSON and image files at startup
2. Creates virtual `HTMLImageElement` objects for each sprite
3. Generates key aliases to match the original `TextureLoader` naming conventions
4. Provides the same API as `TextureLoader` for seamless integration

### Switching Between Modes
In [TextureManager.ts](../src/renderers/TextureManager.ts:12), set:
```typescript
const USE_ATLAS_LOADING = true;  // Use atlases (recommended)
const USE_ATLAS_LOADING = false; // Use individual files (for development)
```

## Benefits

### Performance
- **Fewer HTTP requests**: 6 requests instead of 325
- **Faster loading**: All textures load in parallel
- **Better caching**: Larger files cache more efficiently
- **GPU-friendly**: Power-of-2 square textures

### Bandwidth
- **~200KB total** for all textures (WebP format)
- **~25-35% smaller** than PNG equivalents
- Better for users on slow connections

### Maintainability
- Original asset files remain unchanged in `static/assets/`
- Easy to switch between atlas and individual file loading
- Automatic atlas regeneration with `npm run assets:atlas`

## File Structure

```
static/
├── assets/              # Original source images (unchanged)
│   ├── characters/
│   ├── environment/
│   ├── items/
│   └── ui/
└── atlases/            # Generated atlas files
    ├── npcs.json       # Sprite metadata
    ├── npcs.webp       # Packed sprite image
    ├── environment.json
    ├── environment.webp
    ├── items.json
    ├── items.webp
    ├── enemies.json
    ├── enemies.webp
    ├── player.json
    ├── player.webp
    ├── ui.json
    └── ui.webp
```

## Regenerating Atlases

When you add, remove, or update sprites in `static/assets/`:

```bash
npm run assets:atlas
```

This will:
1. Scan all images in `static/assets/`
2. Generate new atlas files in `static/atlases/`
3. Convert to WebP format
4. Show compression statistics

## Atlas Configuration

Edit [scripts/generate-atlases.js](../scripts/generate-atlases.js) to adjust:
- Starting atlas dimensions (default: 512-2048px)
- WebP quality (default: 95%)
- Packing algorithm settings
- Which directories to include

## Implementation Details

### Key Aliasing
The `AtlasTextureLoader` creates multiple key aliases for each sprite to match `TextureLoader` behavior:

- `walls/90s` → stored as both `walls/90s` and `90s`
- `portraits/axolotlface` → stored as `portraits/axolotlface` and `axolotlface`
- `trim/bordertrim` → stored with full `environment/trim/bordertrim` path

This ensures all existing texture lookups work without code changes.

### WebP Support
Modern browsers support WebP natively. The atlas JSON files reference `.webp` images:
```json
{
  "meta": {
    "image": "npcs.webp"
  }
}
```

## Development Workflow

### Adding New Sprites
1. Add PNG files to `static/assets/` in appropriate directory
2. Run `npm run assets:atlas` to regenerate
3. Rebuild the project: `npm run build`

### Debugging
- Set `USE_ATLAS_LOADING = false` to use individual files
- Check browser console for `[AtlasTextureLoader]` debug messages
- Verify sprite names in `static/atlases/*.json` files

## Dependencies

- **free-tex-packer-core**: Atlas generation
- **sharp**: Image processing and WebP conversion

Both are dev dependencies and only needed for atlas generation.
