/**
 * @jest-environment jsdom
 */
import { ItemService } from '../managers/ItemService.js';
import { ItemUsageHandler } from '../managers/ItemUsageHandler.js';
import { ItemUsageManager } from '../managers/ItemUsageManager.js';
import { BombInteractionManager } from '../managers/BombInteractionManager.js';
import { TILE_TYPES } from '../core/constants.js';

describe('Bomb and Shovel integration', () => {
  let mockGame, mockPlayer, mockUI, itemService, handler, usageManager, bombManager;

  beforeEach(() => {
    mockPlayer = {
      x: 1,
      y: 1,
      inventory: [],
      getPosition() { return { x: this.x, y: this.y }; },
      restoreHunger: jest.fn(),
      restoreThirst: jest.fn(),
      setHealth: jest.fn(),
      getHealth: jest.fn().mockReturnValue(2)
    };
    mockUI = { updatePlayerStats: jest.fn(), addMessageToLog: jest.fn(), renderZoneMap: jest.fn(), showOverlayMessage: jest.fn(), hideOverlayMessage: jest.fn() };
    mockGame = {
      player: mockPlayer,
      grid: Array(9).fill().map(() => Array(9).fill(TILE_TYPES.FLOOR)),
      uiManager: mockUI,
      specialZones: new Map(),
      availableFoodAssets: ['food/meat/beaf.png'],
      enemies: [],
      incrementBombActions: jest.fn(),
      startEnemyTurns: jest.fn(),
      explodeBomb: jest.fn(),
      hideOverlayMessage: jest.fn(),
      updatePlayerStats: jest.fn(),
    };

    handler = new ItemUsageHandler(mockGame);
    usageManager = new ItemUsageManager(mockGame);
    bombManager = new BombInteractionManager(mockGame);
    itemService = new ItemService(mockGame, handler);

    // wire pieces like ServiceContainer would
    mockGame.itemUsageHandler = handler;
    mockGame.itemUsageManager = usageManager;
    mockGame.itemService = itemService;
    mockGame.bombManager = bombManager;
  });

  test('double-click bomb drop consumes bomb from inventory', () => {
    // simulate bomb double-click: InventoryUI sets a bomb tile at player pos and calls useInventoryItem
    mockPlayer.inventory = [{ type: 'bomb', quantity: 1 }];

    // mimic InventoryUI double-click: place object bomb on player tile then notify handler
    mockGame.grid[mockPlayer.y][mockPlayer.x] = { type: TILE_TYPES.BOMB, actionsSincePlaced: 0, justPlaced: true };
    const bombItem = mockPlayer.inventory.find(i => i.type === 'bomb');
    itemService.useInventoryItem(bombItem, mockPlayer.inventory.indexOf(bombItem));

    // ItemUsageHandler should have decremented/removed the bomb
    expect(mockPlayer.inventory.length).toBe(0);
  });

  test('bomb placement mode places bomb and decrements stack', () => {
    // player has 2 bombs
    mockPlayer.inventory = [{ type: 'bomb', quantity: 2 }];
    // InventoryUI sets placement positions adjacent to player
    mockGame.bombPlacementMode = true;
    mockGame.bombPlacementPositions = [{ x: 2, y: 1 }];

    // call BombInteractionManager.handleBombPlacement with adjacent tile
    const placed = bombManager.handleBombPlacement({ x: 2, y: 1 });
    expect(placed).toBe(true);
    // grid should now contain a bomb object at (2,1)
    expect(mockGame.grid[1][2]).toEqual(expect.objectContaining({ type: TILE_TYPES.BOMB }));
    // inventory should decrement
    expect(mockPlayer.inventory[0].quantity).toBe(1);
  });

  test('shovel use digs adjacent tile and removes shovel uses', () => {
    // place a shovel in inventory with uses
    mockPlayer.inventory = [{ type: 'shovel', uses: 1 }];
    const shovel = mockPlayer.inventory[0];

    // simulate clicking an adjacent tile (2,1)
    const success = usageManager.useItem(shovel, 2, 1);
    expect(success).toBe(true);
    // grid[1][2] should be a PORT tile
    expect(mockGame.grid[1][2]).toBe(TILE_TYPES.PORT);
    // shovel removed from inventory
    expect(mockPlayer.inventory.length).toBe(0);
  });
});
