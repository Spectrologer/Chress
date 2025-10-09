# Chress - Project Overview

## 1. Game Concept

Chress is a 2D, grid-based, top-down survival roguelike game. The player controls a character named "CHALK" who explores a procedurally generated world. The core gameplay revolves around managing health, hunger, and thirst while navigating through different zones, gathering resources, crafting pathways, and engaging in turn-based combat with enemies. The game features a distinctive parchment-and-ink aesthetic.

**Core Mechanics:**

- **World:** The world is an infinite grid of "zones." Each zone is a 9x9 grid of tiles.
- **Survival:** The player must manage Health, Hunger, and Thirst.
- **Exploration:** The player moves from zone to zone by reaching the edge of the grid. A minimap helps track visited zones.
- **Interaction:** The player can interact with the environment using items (e.g., an axe to chop shrubs, a hammer to break rocks, a bomb to destroy walls).
- **Combat:** Combat is turn-based. The player attacks enemies by moving into their tile. Enemies have unique movement and attack patterns inspired by chess pieces (Rook, Bishop, Knight).
- **Items & Inventory:** The player has a limited inventory to carry tools, weapons, consumables (food, water), and special items.
- **NPCs:** Non-player characters exist for bartering items (e.g., trading meat for water).
- **Progression:** The game state (player stats, inventory, visited zones) is saved automatically, allowing for persistent play sessions.

## 2. File Structure & Responsibilities

The project is structured into modules, each handling a specific domain of the game's logic. The `Game` class acts as the central orchestrator.

### Core & Entrypoint

- `index.html`: The main HTML file. It defines the structure of the UI, including the game canvas, the player stat card, inventory display, and various overlay elements for messages, game over, and bartering. It loads `game.js` as the main script.
- `styles.css`: The main stylesheet. It defines the entire visual identity of the game, focusing on a mobile-first, portrait-mode layout with a "frayed parchment" and medieval theme.
- `game.js`: The heart of the application.
  - The `Game` class initializes all manager classes and holds the primary game state (player, enemies, zones, etc.).
  - It contains the main `gameLoop`, which drives rendering and animations.
  - It acts as a central hub, delegating tasks to the appropriate managers (e.g., `game.render()` calls `renderManager.render()`).

### Initialization & State Management

- `GameInitializer.js`: Manages the game's startup sequence. It sets up the canvas, loads all visual assets via `TextureManager`, and either loads a saved game state or initializes a new game world. It also sets up global event listeners for saving the game.
- `GameStateManager.js`: Handles saving the game state to `localStorage` and loading it back. This includes the player's stats, inventory, position, and the state of all discovered zones.

### Gameplay & Logic Managers

- `InputManager.js`: Captures and interprets all player input from keyboard, mouse clicks, and touch gestures (taps and swipes). It translates these inputs into game actions, like single-tile movement or pathfinding to a tapped destination. It cancels other modes (like bomb placement) upon movement.
- `ActionManager.js`: Manages the logic for specific player actions, such as using special weapon abilities (Bishop Spear, Horse Icon) or placing and exploding bombs.
- `CombatManager.js`: Governs all combat-related logic. It handles enemy movement AI, processes player and enemy attacks, checks for collisions, and manages enemy death/removal.
- `InteractionManager.js`: Handles player interactions with world objects that are not simple movement, such as picking up items, reading signs, or initiating dialogue with NPCs.
- `InventoryManager.js`: Manages the player's inventory. It handles the logic for using, dropping, and organizing items. It is also responsible for rendering the inventory UI and handling its specific interactions (e.g., single-click to use, double-click to drop bomb).
- `ZoneManager.js`: Responsible for the procedural generation and management of world zones. It generates the grid layout, populates it with tiles (walls, shrubs), enemies, and treasures, and handles the logic for transitioning the player between zones.

### UI & Rendering

- `RenderManager.js`: The primary rendering engine. In each frame of the `gameLoop`, it draws everything onto the main game canvas: the grid tiles, the player, enemies, and any visual effects like explosions or attack animations.
- `UIManager.js`: Manages all UI elements outside of the main game canvas. This includes updating the player's health, hunger/thirst bars, inventory display, and coordinate information. It also controls the visibility and content of all overlays (messages, region notifications, game over screen).
- `MiniMap.js`: Specifically handles the rendering of the zone minimap in the player card, showing visited, unvisited, and the current player zone.
- `BarterWindow.js`: Controls the bartering UI. It displays the NPC, the required and offered items, and handles the trade confirmation or cancellation logic. It also re-uses the window to display informational text for statues.

### Game Entities & Data

- `Player.js`: (Implicitly referenced) Represents the player character. It holds state for position, health, hunger, thirst, inventory, and visited zones. It contains methods for movement, taking damage, and managing stats.
- `Enemy.js`: (Implicitly referenced) The base class for enemy entities. It defines common properties like position and health, and methods for movement AI, taking damage, and animations. Different enemy types extend this class.
- `Sign.js`: A utility class for managing the text content of signs found in the world. It contains predefined sets of messages for different regions and provides methods to retrieve a message.
- `constants.js`: (Implicitly referenced) A central file for defining game-wide constants, such as `GRID_SIZE`, `TILE_SIZE`, tile type enums (`TILE_TYPES`), and asset paths. This helps avoid "magic numbers" and makes configuration easier.

## 3. Core Interaction Flow (Example: Player Moves)

1.  **Input:** `InputManager` detects a keypress ('w') or a swipe-up gesture.
2.  **Interruption:** `InputManager` checks if a message overlay is open and hides it.
3.  **Action:** `InputManager` calls `player.move()` with the new target coordinates.
4.  **Player Logic:** `Player.js` checks if the target tile is walkable.
    - If it's a wall, movement fails.
    - If it's an enemy, `InputManager` initiates an attack via `CombatManager`.
    - If it's an open floor, the player's `x, y` coordinates are updated.
    - If it's an exit tile, `player.move()` triggers a callback to `game.transitionToZone()`.
5.  **Zone Transition:** `Game.js` calls `zoneManager.transitionToZone()`. `ZoneManager` generates or loads the new zone, updates the player's position to the corresponding entry point, and sets the new grid.
6.  **Enemy Turn:** After a successful player move, `Game.js` calls `combatManager.handleEnemyMovements()`, giving each enemy a chance to act.
7.  **State Update:** `Game.js` calls `uiManager.updatePlayerPosition()` and `uiManager.updatePlayerStats()` to refresh the UI with the new coordinates and any changes to hunger/thirst.
8.  **Render:** The `gameLoop` continues, and on the next frame, `RenderManager` draws the player, enemies, and grid in their new positions.
