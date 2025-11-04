import { InventoryService } from '@managers/inventory/InventoryService';
import { TILE_TYPES } from '@core/constants/index';

describe('InventoryService', () => {
  let inventoryService;
  let mockGame;
  let mockPlayer;

  beforeEach(() => {
    mockPlayer = {
      inventory: [],
      radialInventory: [],
      x: 1,
      y: 1,
      getVisitedZones: vi.fn().mockReturnValue(new Set()),
      getCurrentZone: vi.fn().mockReturnValue({ x: 0, y: 0 }),
      markZoneVisited: vi.fn(),
      setHealth: vi.fn(),
      getHealth: vi.fn().mockReturnValue(2),
      restoreHunger: vi.fn(),
      restoreThirst: vi.fn()
    };

    mockGame = {
      player: mockPlayer,
      grid: Array(9).fill().map(() => Array(9).fill(TILE_TYPES.FLOOR)),
      uiManager: { addMessageToLog: vi.fn(), renderZoneMap: vi.fn(), updatePlayerStats: vi.fn() },
      availableFoodAssets: ['food/meat/beaf.png'],
      specialZones: new Map(),
      hideOverlayMessage: vi.fn(),
      animationScheduler: { createSequence: () => ({ wait: () => ({ then: () => ({ start: () => {} }) }) }) },
      updatePlayerStats: vi.fn()
    };

    inventoryService = new InventoryService(mockGame);
  });

  test('useItem consumes food and restores hunger', () => {
    const foodItem = { type: 'food', foodType: 'food/meat/beaf.png' };
    mockPlayer.inventory = [foodItem];
    inventoryService.useItem(foodItem, { fromRadial: false });
    expect(mockPlayer.restoreHunger).toHaveBeenCalledWith(10);
    expect(mockPlayer.inventory.length).toBe(0);
  });

  test('useItem consumes water and restores thirst', () => {
    const waterItem = { type: 'water' };
    mockPlayer.inventory = [waterItem];
    inventoryService.useItem(waterItem, { fromRadial: false });
    expect(mockPlayer.restoreThirst).toHaveBeenCalledWith(10);
    expect(mockPlayer.inventory.length).toBe(0);
  });

  test('useItem drops axe only on floor', () => {
    const axeItem = { type: 'axe' };
    mockPlayer.inventory = [axeItem];
    inventoryService.useItem(axeItem, { fromRadial: false });
    expect(mockGame.grid[1][1]).toBe(TILE_TYPES.AXE);
    expect(mockPlayer.inventory.length).toBe(0);
  });

  test('useMapNote reveals location and registers special zone', () => {
    const noteItem = { type: 'note' };
    mockPlayer.inventory = [noteItem];
    vi.spyOn(Math, 'random').mockReturnValue(0.2);
    inventoryService.useItem(noteItem, { fromRadial: false });
    expect(mockPlayer.markZoneVisited).toHaveBeenCalled();
    expect(mockGame.uiManager.addMessageToLog).toHaveBeenCalled();
    expect(mockGame.uiManager.renderZoneMap).toHaveBeenCalled();
    Math.random.mockRestore();
  });
});
