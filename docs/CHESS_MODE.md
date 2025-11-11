# Chess Mode - Type-Safe Game Mode System

Chess mode is a turn-based strategic game mode that serves as the foundation for future game modes in Chress.

## Board JSON Game Mode Metadata

Custom boards can specify their game mode in the metadata field:

```json
{
  "name": "chess",
  "size": [10, 10],
  "terrain": [...],
  "features": {...},
  "metadata": {
    "dimension": 0,
    "level": "home",
    "rarity": 5,
    "gameMode": "CHESS"
  }
}
```

Supported game modes:
- `"CHRESS"` (default) - Standard Chress gameplay
- `"CHESS"` - Turn-based chess-like mode
- `"PUZZLE"` - Future: Puzzle challenges
- `"TUTORIAL"` - Future: Tutorial mode

When a board is loaded (via file loader or board teleport), the game automatically applies the specified game mode from the metadata.

## Architecture

### Type System

Chess mode uses a type-safe game mode system defined in `src/core/GameMode.ts`:

```typescript
enum GameMode {
    NORMAL = 'normal',      // Standard Chress gameplay
    CHESS = 'chess',        // Turn-based chess-like mode
    PUZZLE = 'puzzle',      // Future: Puzzle challenges
    TUTORIAL = 'tutorial'   // Future: Tutorial mode
}
```

### Game Mode Configuration

The game context contains a `gameMode` object with type-safe configuration:

```typescript
interface GameModeConfig {
    currentMode: GameMode;
    chess: ChessModeConfig;
}

interface ChessModeConfig {
    selectedUnit: Enemy | null;
    turnBased: boolean;
    showMoveIndicators: boolean;
    aiDelayMs: number;
}
```

## Usage

### Entering Chess Mode

Press `m` to teleport to the chess board and activate chess mode:

```typescript
// Programmatically enable chess mode
import { setGameMode, GameMode } from '@core/GameModeManager';
setGameMode(game, GameMode.CHESS);
```

### Checking Current Mode

```typescript
import { isInChessMode } from '@core/GameModeManager';

if (isInChessMode(game)) {
    // Chess mode specific logic
}
```

### Accessing Chess Configuration

```typescript
import { getChessConfig } from '@core/GameModeManager';

const config = getChessConfig(game);
console.log(config.aiDelayMs); // 500
```

## Chess Piece Movement

All pieces follow their Chress movement patterns:

| Piece | Chess Equivalent | Movement Pattern |
|-------|------------------|------------------|
| `lizardo` | King | 1 square in any direction (8 adjacent) |
| `lizardeaux` | Rook | Any distance in straight lines |
| `zard` | Bishop | Any distance diagonally |
| `lazerd` | Queen | Combines rook + bishop movement |
| `lizord` | Knight | L-shaped (2+1) |
| `lizardy` | Pawn | 1 square forward (empty), captures diagonally forward (enemy) |

### Pawn Movement Details

The pawn (`lizardy`) follows proper chess rules:
- **Movement**: Can move 1 square forward only if the target square is empty
  - Player pawns (green) move UP (toward enemy)
  - Enemy pawns (black_) move DOWN (toward player)
  - **First Move**: Can move 2 squares forward if on starting row (row 7 for player, row 2 for enemy) and both squares are empty
- **Capture**: Can capture 1 square diagonally forward (left or right) only if an enemy piece is present
- Pawns cannot move sideways, backward, or diagonally without capturing

## Team System

Units are assigned to teams:

```typescript
type Team = 'player' | 'enemy';

// In chess mode:
- Green lizards (no prefix) → team: 'player'
- Grayscale lizards (black_ prefix) → team: 'enemy'
```

## Turn-Based Gameplay

1. **Player Turn**: Select and move one unit
2. **AI Turn**: Enemy selects a random unit that has valid moves (prioritizes attacks)
3. **Alternates**: Continues until checkmate

### AI Behavior

- The AI finds all enemy units with valid moves
- Randomly selects one unit from those that can move
- Prioritizes attacking moves over regular moves
- If no units can move, the game ends in stalemate

**Note**: The current AI is intentionally simple (random moves with attack priority). Future improvements could include:
- Minimax algorithm for optimal moves
- Position evaluation (control center, protect king)
- Opening book for first moves
- Endgame strategies

## Winning Condition

**Checkmate**: The game ends when a king (`lizardo` or `black_lizardo`) is captured:
- If player captures the enemy king (`black_lizardo`) → **Player wins!**
- If enemy captures the player king (`lizardo`) → **Enemy wins!**

After checkmate:
1. A victory/defeat message is displayed
2. The game returns to normal CHRESS mode
3. The player is teleported back to where they loaded the chess board (e.g., the museum sign at 0,0 interior)

## Files

### Core System
- `src/core/GameMode.ts` - Type definitions and enums
- `src/core/GameModeManager.ts` - Mode switching utilities
- `src/core/context/GameContextInterfaces.ts` - Game context types

### Chess Logic
- `src/controllers/InputCoordinator.ts` - Movement and turn handling
- `src/renderers/EnemyRenderer.ts` - Visual rendering
- `src/renderers/RenderManager.ts` - Valid move indicators

### Board
- `static/boards/custom/chess.json` - Chess board definition
- `src/config/registrations/BoardRegistrations.ts` - Board registration

## Known Limitations

The following chess features are **not implemented** (intentionally simplified):

- ❌ **Castling** - Not supported (requires move history and check detection)
- ❌ **En Passant Capture** - Not supported (special pawn capture rule)
- ❌ **Pawn Promotion** - Pawns don't promote to other pieces when reaching the end
- ❌ **Check Detection** - Game doesn't detect or prevent moving into check
- ❌ **Stalemate Detection** - Only basic "no moves available" detection
- ❌ **Draw by Repetition** - Not tracked
- ❌ **50-Move Rule** - Not tracked

These simplifications keep the implementation maintainable while still providing fun, playable chess-like gameplay.

## Extending Chess Mode

To add new features to chess mode:

1. Update `ChessModeConfig` in `GameMode.ts`
2. Update `DEFAULT_MODE_CONFIG` with defaults
3. Add logic in `GameModeManager.enterMode()` for setup
4. Add cleanup in `GameModeManager.exitMode()`

## Legacy Compatibility

The old `chessMode` boolean flag is deprecated but maintained for backward compatibility:

```typescript
// ✅ Preferred (type-safe)
if (game.gameMode.currentMode === GameMode.CHESS) { }

// ⚠️ Deprecated (still works)
if (game.chessMode) { }
```

## Future Modes

The game mode system is designed to support additional modes:

- **Puzzle Mode**: Solve chess-like puzzles with specific objectives
- **Tutorial Mode**: Step-by-step guided gameplay
- **Custom Modes**: Community-created game modes via JSON config

## Implementation Notes

- All piece movements are calculated in `_getValidMovesForUnit()`
- Pieces can capture enemies and move onto their square (proper chess rules)
- Movement stops at walls and when blocked by other pieces
- Visual indicators (green overlay) show valid moves
- AI uses simple random selection with attack prioritization
