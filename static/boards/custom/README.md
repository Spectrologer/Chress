# Custom Boards

This folder contains custom board JSON files that can be loaded in the game.

## Adding New Boards

1. **Create your board JSON** - Place it in this folder (`static/boards/custom/`)
2. **Regenerate the manifest** - Run `npm run boards:manifest`
3. **Rebuild the game** - Run `npm run build`

The board will now appear in the "Select Custom Board" dialog in-game!

## Board Format

```json
{
  "name": "my_board",
  "size": [10, 10],
  "terrain": [...],
  "features": {...},
  "metadata": {
    "description": "My Custom Board",
    "dimension": 0,
    "gameMode": "CHESS",
    "level": "home",
    "rarity": 5,
    "created": "2025-11-11T00:00:00.000Z"
  }
}
```

## Game Modes

- `"CHESSE"` - Standard Chesse gameplay (default)
- `"CHESS"` - Turn-based chess-like mode
- `"PUZZLE"` - Puzzle challenges (future)
- `"TUTORIAL"` - Tutorial mode (future)

## Existing Boards

- **chess.json** - Classic chess board with lizard pieces (CHESS mode)
- **classico.json** - Test board for player spawn feature (CHESSE mode)

## Manifest

The `manifest.json` file is automatically generated and should not be edited manually. It lists all available boards and their metadata for the game to load.
