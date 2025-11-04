import { InventoryService } from '@managers/inventory/InventoryService';
import { BombManager } from '@managers/BombManager';
import { TILE_TYPES } from '@core/constants/index';

describe('Bomb and Shovel integration', () => {
  let mockGame, mockPlayer, mockUI, inventoryService, bombManager;

  beforeEach(() => {
    mockPlayer = {
      x: 1,
      y: 1,
      inventory: [],
      radialInventory: [],
      getPosition() { return { x: this.x, y: this.y }; },
      restoreHunger: vi.fn(),
      restoreThirst: vi.fn(),
      setHealth: vi.fn(),
      getHealth: vi.fn().mockReturnValue(2)
    };
    mockUI = { updatePlayerStats: vi.fn(), addMessageToLog: vi.fn(), renderZoneMap: vi.fn(), showOverlayMessage: vi.fn(), hideOverlayMessage: vi.fn() };
    mockGame = {
      player: mockPlayer,
      grid: Array(9).fill().map(() => Array(9).fill(TILE_TYPES.FLOOR)),
      uiManager: mockUI,
      specialZones: new Map(),
      availableFoodAssets: ['food/meat/beaf.png'],
      enemies: [],
      incrementBombActions: vi.fn(),
      startEnemyTurns: vi.fn(),
      explodeBomb: vi.fn(),
      hideOverlayMessage: vi.fn(),
      updatePlayerStats: vi.fn(),
    };

    inventoryService = new InventoryService(mockGame);
    bombManager = new BombManager(mockGame);

    // wire pieces like ServiceContainer would
    mockGame.inventoryService = inventoryService;
    mockGame.itemService = inventoryService; // backward compat
    mockGame.bombManager = bombManager;
  });

  test('double-click bomb drop consumes bomb from inventory', () => {
    // simulate bomb double-click: InventoryUI sets a bomb tile at player pos and calls useItem
    mockPlayer.inventory = [{ type: 'bomb', quantity: 1 }];

    // mimic InventoryUI double-click: place object bomb on player tile then notify service
    mockGame.grid[mockPlayer.y][mockPlayer.x] = { type: TILE_TYPES.BOMB, actionsSincePlaced: 0, justPlaced: true };
    const bombItem = mockPlayer.inventory.find(i => i.type === 'bomb');
    inventoryService.useItem(bombItem, { fromRadial: false });

    // InventoryService should have decremented/removed the bomb
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
    inventoryService.useItem(shovel, { fromRadial: false, targetX: 2, targetY: 1 });
    // grid[1][2] should be a PORT tile
    expect(mockGame.grid[1][2]).toBe(TILE_TYPES.PORT);
    // shovel removed from inventory
    expect(mockPlayer.inventory.length).toBe(0);
  });
});
