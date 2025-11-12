# Chesse Codebase Architecture Guide

## Overview
This guide covers 5 key systems for your game development:
1. Custom board loading mechanism
2. Unit/character control systems  
3. Keyboard input handling
4. Lizard character definitions
5. Game mode logic

---

## 1. CUSTOM BOARD LOADING

### Main Files
- src/core/BoardLoader.ts (597 lines) - Core loading logic
- src/config/registrations/BoardRegistrations.ts - Registration system
- static/boards/custom/chess.json - The "chess" custom board

### How It Works

Boards are registered by zone coordinates, then loaded on demand:

registerBoard(zoneX, zoneY, dimension, boardName, type)
  -> Creates key: "0,0:0" for zone (0,0) dimension 0
  -> Maps to: boards/custom/boardName.json or boards/canon/boardName.json

### Chess Board Location
static/boards/custom/chess.json contains:
- 10x10 grid with wall borders
- 4 enemy placements (2 black_lizardo, 2 lizardo)
- Optional metadata with player spawn points

### To Add New Custom Board
1. Create JSON file in static/boards/custom/yourboard.json
2. Add to BoardRegistrations.ts:
   boardLoader.registerBoard(x, y, dimension, 'yourboard', 'custom');
3. Board loads automatically when zone is visited

---

## 2. UNIT/CHARACTER CONTROL

### Current Architecture
Game is PLAYER-CENTRIC - single controllable entity (the player)
No unit switching system exists yet

### Key Files
- src/entities/Player.ts - Single player entity
- src/facades/PlayerFacade.ts - Player control interface
- src/core/TurnManager.ts - Turn system management

### Control Flow
Player Input -> InputController -> KeyboardHandler -> PlayerFacade.move() 
-> TurnManager.handleTurnCompletion() -> Enemy turns

### Player Methods (PlayerFacade)
- move(x, y) - Move player
- attack(direction) - Attack enemy
- useAbility(type) - Use special ability
- getPosition() - Get location
- isDead() - Check alive status

### To Implement Unit Switching (Future)
Would need:
1. UnitManager class to track controllable units
2. currentUnit property to track active unit
3. selectUnit(unitId) method to switch
4. Modify TurnManager to handle multiple ally units
5. Track action points per unit

---

## 3. KEYBOARD INPUT HANDLING

### Main Files
- src/controllers/KeyboardHandler.ts (470 lines) - Main keyboard processor
- src/controllers/InputCoordinator.ts - Input coordination layer
- src/controllers/InputController.ts - Public wrapper

### How It Works

window.keydown -> KeyboardHandler._handleKeyDown() -> handleKeyPress()
-> Process movement/special actions -> Execute on game

### Current Key Map
- w/arrow-up = Move up
- s/arrow-down = Move down
- a/arrow-left = Move left
- d/arrow-right = Move right
- k = Start backflip
- 1-6 = Spawn lizards (debug)
- e = Spawn items (debug)
- p = Generate pitfall (debug)
- 7 = Spawn NPC
- escape = Reset game
- 0,8,9 = Debug features

### How to Add 'M' Key

Edit: src/controllers/KeyboardHandler.ts around line 220

In handleKeyPress() switch statement, add before 'default':

    case 'm':
        if (this.game.unitManager) {
            this.game.unitManager.switchToNextUnit();
            this.game.showOverlayMessage('Switched unit');
        }
        return null;

### Key Handler Method Details (line 121)

handleKeyPress checks:
1. If player's turn (isPlayerTurn)
2. If player is alive
3. Clears UI states (bomb mode, signs, charges)
4. Maps key to movement direction or special action
5. Returns movement info or null

---

## 4. LIZARD CHARACTER DEFINITIONS

### Lizard Types (Chess Pieces)

1. Lizardy (Pawn)
   - File: src/enemy/MoveCalculators/lizardy.ts
   - Moves: 1 square vertically only
   - Attack: Diagonal in movement direction
   - Special: Flips direction when blocked

2. Lizardo (Rook)
   - Moves: Straight lines (horizontal/vertical)
   - Attack: Any straight line distance

3. Lizardeaux (Bishop)
   - Moves: Diagonal only
   - Attack: Diagonal in any direction

4. Lizord (Knight)
   - Moves: L-shaped (2+1 squares)
   - Attack: Knight move pattern

5. Lazerd (Queen)
   - Moves: Any direction (rook + bishop)
   - Attack: Any direction/distance

6. Zard (King)
   - Moves: 1 square any direction
   - Attack: Adjacent squares only

### Lizardy Implementation Example

File: src/enemy/MoveCalculators/lizardy.ts (85 lines)

Key logic:
1. Maintains movementDirection (-1 for up, 1 for down)
2. Checks for diagonal attack opportunities first
3. Moves vertically in current direction
4. Flips direction if blocked
5. Sets flipAnimation when direction changes

### Enemy Registration

File: src/config/registrations/EnemyRegistrations.ts

Registers for each type:
- Sprite texture path
- Health/damage values
- Move calculator instance
- Display properties

### Using Enemies in Board JSON

In features object:
"4,4": "black_lizardo"
"5,6": "lizardo"

Supported types (case-insensitive):
- lizardy, lizardo, lizardeaux, zard, lizord, lazerd
- black_lizardy, black_lizardo, black_lizardeaux, black_zard, black_lizord, black_lazerd

---

## 5. GAME MODE LOGIC

### Current State
Game has NO mode switching system - single gameplay mode only

### What Exists: Game States (Not Modes)

1. isPlayerTurn (boolean)
   - Controls if player or enemies act
   - Set by TurnManager

2. Item-Based States
   - shovelMode (boolean) - Digging mode
   - activeShovel (Item) - Currently held shovel
   - Location: GameContextInterfaces.ts line 103

3. UI States
   - displayingMessageForSign - Showing text
   - bombPlacementMode - Placing bombs
   - Location: KeyboardHandler.ts line 137

### Shovel Mode Example

This is closest to "mode switching" - temporary item states:

    const transientState = this.game.transientGameState;
    if (transientState.isBombPlacementMode()) {
        transientState.exitBombPlacementMode();
        this.game.hideOverlayMessage();
    }

### To Implement Game Modes (Future)

Create:
1. Enum: GameMode (NORMAL, PUZZLE, TUTORIAL, CUSTOM)
2. Interface: IGameMode with rules
3. Add to GameContext: gameMode and gameModeRules
4. Implement: setGameMode(mode) method
5. Apply rules in various managers

---

## QUICK REFERENCE

### Add Keyboard Command
File: src/controllers/KeyboardHandler.ts line ~220
Add case in handleKeyPress() switch statement

### Add Custom Board
1. Create: static/boards/custom/yourboard.json
2. Register: BoardRegistrations.ts boardLoader.registerBoard()

### Add New Lizard
1. Create: src/enemy/MoveCalculators/new.ts
2. Register: EnemyRegistrations.ts
3. Use: In board JSON features

### Add Game Mode (Future)
1. Create GameModeManager class
2. Define mode interface with rules
3. Add to GameContext init
4. Implement rule enforcement in managers

