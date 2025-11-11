# Custom Boards System

The custom boards system allows you to create hand-crafted zones with specific layouts, enemies, and game modes.

## Quick Start

1. **Create a board JSON** in `static/boards/custom/`
2. **Regenerate manifest**: `npm run boards:manifest`
3. **Build the game**: `npm run build`
4. **Play**: Load the board from the "Select Custom Board" sign in-game

## Automatic Board Detection

The game automatically detects all board files in `static/boards/custom/` via a manifest system:

### How It Works

1. **Manifest Generation** - Run `npm run boards:manifest` to scan the custom boards folder and generate `manifest.json`
2. **Automatic Loading** - The game reads `manifest.json` at runtime to populate the board selection dialog
3. **No Code Changes** - Add new boards without modifying any source code!

### Workflow

```bash
# 1. Add your board
echo '{"name": "my_board", ...}' > static/boards/custom/my_board.json

# 2. Regenerate manifest
npm run boards:manifest

# 3. Build
npm run build

# 4. Your board now appears in-game!
```

## Board Format

```json
{
  "name": "board_name",
  "size": [10, 10],
  "terrain": [
    null,
    "walls/wall",
    "floors/grass",
    ...
  ],
  "features": {
    "x,y": "enemy_type",
    "x,y": "sign",
    ...
  },
  "overlays": {
    "x,y": "overlay_texture_path"
  },
  "rotations": {
    "x,y": 90
  },
  "overlayRotations": {
    "x,y": 180
  },
  "signMessages": {
    "x,y": "Message text"
  },
  "metadata": {
    "description": "Board description shown in selector",
    "dimension": 0,
    "gameMode": "CHESS",
    "level": "home",
    "rarity": 5,
    "created": "2025-11-11T00:00:00.000Z",
    "playerSpawn": { "x": 5, "y": 5 }
  }
}
```

## Game Modes

Set the `gameMode` in metadata to control gameplay:

- **`"CHRESS"`** (default) - Standard Chress gameplay with real-time movement
- **`"CHESS"`** - Turn-based chess-like mode with team-based units
- **`"PUZZLE"`** - Future: Puzzle challenges
- **`"TUTORIAL"`** - Future: Tutorial mode

### Chess Mode Example

```json
{
  "name": "chess",
  "metadata": {
    "gameMode": "CHESS"
  },
  "features": {
    "1,1": "black_lazerd",
    "2,1": "black_lizardo",
    "1,8": "lazerd",
    "2,8": "lizardo"
  }
}
```

In CHESS mode:
- Green lizards (no prefix) = player team
- Black lizards (`black_` prefix) = enemy team
- Turn-based gameplay
- King capture = checkmate

## Terrain Format

The `terrain` array is a flat list read left-to-right, top-to-bottom:

```
[
  0,  1,  2,  3,  4,  ...  // Row 0
  10, 11, 12, 13, 14, ...  // Row 1
  20, 21, 22, 23, 24, ...  // Row 2
  ...
]
```

For a 10x10 board, index = `y * 10 + x`

### Terrain Values

- `null` - Floor tile (walkable)
- `"walls/wall"` - Wall texture (non-walkable)
- `"floors/grass"` - Custom floor texture
- `"terrain/water"` - Custom terrain texture

## Features Format

The `features` object maps coordinates to entities:

```json
{
  "2,3": "lizardo",      // Enemy at (2, 3)
  "5,5": "sign",         // Sign at (5, 5)
  "8,8": "treasure"      // Treasure at (8, 8)
}
```

## Overlays & Rotations

Add visual variety with overlays and rotations:

```json
{
  "overlays": {
    "3,3": "decorations/flowers",
    "4,4": "props/crate"
  },
  "rotations": {
    "3,3": 90,    // Rotate terrain 90 degrees
    "4,4": 180    // Rotate terrain 180 degrees
  },
  "overlayRotations": {
    "3,3": 45     // Rotate overlay 45 degrees
  }
}
```

## Manifest Structure

`manifest.json` is auto-generated with board metadata:

```json
{
  "version": "1.0.0",
  "generated": "2025-11-11T04:42:03.162Z",
  "boards": [
    {
      "name": "chess",
      "displayName": "Classic Chess",
      "gameMode": "CHESS",
      "size": [10, 10],
      "created": "2025-11-11T04:39:00.368Z"
    }
  ]
}
```

## In-Game Loading

There are two ways to load custom boards:

### 1. Board Selection Dialog

- Interact with the "Select Custom Board" sign
- Choose from the list of available boards
- Automatically teleports you to the board

### 2. File Explorer

- Click "Load Custom File..." in the board selector
- Browse and select any `.json` board file from your computer
- Useful for testing boards before adding them to the folder

## Tools

### Zone Editor

Use the zone editor (`/tools/zone-editor.html`) to create boards visually:

1. Design your board layout
2. Place enemies and objects
3. Set game mode in metadata
4. Export as JSON
5. Save to `static/boards/custom/`
6. Run `npm run boards:manifest`

## Return to Origin

When loading a custom board (especially CHESS mode), the game remembers where you came from:

1. Player at museum (0,0 interior)
2. Loads chess board from sign
3. Plays chess game
4. After checkmate → Returns to museum

This ensures a seamless gameplay experience.

## Example Boards

### Minimal Board

```json
{
  "name": "minimal",
  "size": [5, 5],
  "terrain": [
    null, null, null, null, null,
    null, null, null, null, null,
    null, null, null, null, null,
    null, null, null, null, null,
    null, null, null, null, null
  ],
  "features": {
    "2,2": "lizardo"
  }
}
```

### Chess Board

See `static/boards/custom/chess.json` for a complete chess board implementation with proper team assignment and piece placement.

## Troubleshooting

**Board doesn't appear in selector**
- Run `npm run boards:manifest` to regenerate the manifest
- Check that the JSON is valid
- Ensure the file is in `static/boards/custom/`

**Game mode not working**
- Verify `metadata.gameMode` is set correctly
- Check that enemy teams are assigned (green vs black_ prefix for chess)

**Board loads but looks wrong**
- Verify terrain array length matches size[0] * size[1]
- Check coordinate format in features (should be "x,y" strings)
- Ensure texture paths are valid
