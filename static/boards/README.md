# Board Files

This directory contains the source board files for custom zones in Chress.

## Directory Structure

```
boards/
├── canon/          # Canon boards (official game boards)
│   ├── museum.json
│   ├── well.json
│   └── ...
└── custom/         # Custom boards (user-created)
    └── ...
```

## Board File Format

Board files are JSON files with the following structure:

```json
{
  "name": "custom_zone_1",
  "size": [10, 10],
  "terrain": [...],
  "overlays": {...},
  "features": {...},
  "rotations": {...},
  "overlayRotations": {...},
  "metadata": {...}
}
```

### Fields

- **name**: Unique identifier for the board
- **size**: `[width, height]` - Grid dimensions (typically 10x10)
- **terrain**: Flat array of terrain tiles in row-major order
  - Index formula: `index = y * width + x`
  - Example: For a 10x10 grid, position (4,2) is at index 24
- **overlays**: Object mapping coordinates to overlay textures
  - Format: `"x,y": "trim/bordertrim"`
- **features**: Object mapping coordinates to game features
  - Format: `"x,y": "feature_name"`
- **rotations**: Terrain tile rotations in degrees (0, 90, 180, 270)
  - Format: `"x,y": 180`
- **overlayRotations**: Overlay tile rotations in degrees
  - Format: `"x,y": 270`
- **metadata**: Additional board information (dimension, level, rarity, etc.)

## Workflow

### Creating/Editing Boards

1. Open the zone editor at `/tools/zone-editor.html`
2. Design your board using the visual editor
3. Export the board (downloads as JSON file)
4. Save the JSON file to `boards/canon/` or `boards/custom/`
5. Run `npm run boards:sync` to copy to `public/boards/`
6. Reload the game to see your changes

### Syncing Boards

The game loads boards from `public/boards/`, but you should edit boards in `boards/` (the source directory).

**Manual sync:**
```bash
npm run boards:sync
```

**Automatic sync:**
- Boards are automatically synced when running `npm run build`
- During development, run `npm run boards:sync` after editing boards

### Registering Boards

Boards must be registered in `src/config/registrations/BoardRegistrations.js`:

```javascript
// Register a canon board for the museum (interior at 0,0)
boardLoader.registerBoard(0, 0, 1, 'museum', 'canon');
```

Parameters:
- `zoneX`: Zone X coordinate
- `zoneY`: Zone Y coordinate
- `dimension`: 0=surface, 1=interior, 2=underground
- `boardName`: Board file name (without .json)
- `type`: 'canon' or 'custom'

## Coordinate System

- **Origin**: Top-left corner (0,0)
- **X-axis**: Increases to the right (0-9 for 10x10 grid)
- **Y-axis**: Increases downward (0-9 for 10x10 grid)
- **Terrain array**: Row-major order (row 0, then row 1, etc.)

### Corner Positions
- Top-left: (0,0)
- Top-right: (9,0)
- Bottom-left: (0,9)
- Bottom-right: (9,9)

## Rotation

Rotations are in degrees, clockwise:
- 0°: Original orientation (→)
- 90°: Rotated 90° clockwise (↓)
- 180°: Rotated 180° (←)
- 270°: Rotated 270° clockwise (↑)

### Corner Pieces
- `clubwall5`: Designed for top-left corner
- `clubwall6`: Designed for top-right corner

When placed in other corners, they should be rotated:
- Top-left → Top-right: 90°
- Top-left → Bottom-right: 180°
- Top-left → Bottom-left: 270°

## Tips

- Always sync boards after editing: `npm run boards:sync`
- Use descriptive names for custom boards
- Test boards in-game after editing
- Keep metadata up to date (dimension, level, rarity)
- Use overlays for decorative elements that don't block movement
- Use features for interactive elements (items, NPCs, ports, etc.)
