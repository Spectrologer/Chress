/**
 * @jest-environment jsdom
 */
import { InventoryManager } from '../managers/InventoryManager.js';
import { TILE_TYPES } from '../core/constants.js';

describe('InventoryManager', () => {
  let inventoryManager;
  let mockGame;
  let mockPlayer;
  let mockUIManager;

  beforeEach(() => {
    mockPlayer = {
      inventory: [],
      isDead: jest.fn().mockReturnValue(false),
      x: 1,
      y: 1,
      getVisitedZones: jest.fn().mockReturnValue(new Set()),
      getCurrentZone: jest.fn().mockReturnValue({ x: 0, y: 0, dimension: 0 }),
      markZoneVisited: jest.fn(),
      setHealth: jest.fn(),
      getHealth: jest.fn().mockReturnValue(2),
      restoreHunger: jest.fn(),
      restoreThirst: jest.fn()
    };

    mockUIManager = {
      updatePlayerStats: jest.fn(),
      addMessageToLog: jest.fn(),
      renderZoneMap: jest.fn()
    };

    mockGame = {
      player: mockPlayer,
      grid: Array(9).fill().map(() => Array(9).fill(TILE_TYPES.FLOOR)),
      uiManager: mockUIManager,
      availableFoodAssets: ['food/meat/beaf.png'],
      specialZones: new Map(),
      hideOverlayMessage: jest.fn(),
      displayingMessageForSign: null,
      showSignMessage: jest.fn(),
      updatePlayerStats: jest.fn()
    };

    // Mock DOM elements
    document.getElementById = jest.fn().mockReturnValue({
      classList: { add: jest.fn(), remove: jest.fn() },
      textContent: '',
      style: {}
    });

    document.querySelector = jest.fn().mockReturnValue({
      innerHTML: '',
      appendChild: jest.fn(),
      getBoundingClientRect: jest.fn().mockReturnValue({}),
      closest: jest.fn().mockReturnValue({
        getBoundingClientRect: jest.fn().mockReturnValue({})
      })
    });

    inventoryManager = new InventoryManager(mockGame);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('getItemTooltipText returns correct text for food', () => {
    const foodItem = { type: 'food', foodType: 'food/meat/beaf.png' };
    expect(inventoryManager.getItemTooltipText(foodItem)).toBe('meat - Restores 10 hunger');
  });

  test('getItemTooltipText returns correct text for water', () => {
    const waterItem = { type: 'water' };
    expect(inventoryManager.getItemTooltipText(waterItem)).toBe('Water - Restores 10 thirst');
  });

  test('getItemTooltipText shows disabled state for bishop_spear', () => {
    const spearItem = { type: 'bishop_spear', uses: 3, disabled: true };
    expect(inventoryManager.getItemTooltipText(spearItem)).toBe('Bishop Spear (DISABLED) - Charge diagonally towards enemies, has 3 charges');
  });

  test('getItemTooltipText shows disabled state for horse_icon', () => {
    const horseItem = { type: 'horse_icon', uses: 2, disabled: true };
    expect(inventoryManager.getItemTooltipText(horseItem)).toBe('Horse Icon (DISABLED) - Charge in L-shape (knight moves) towards enemies, has 2 charges');
  });

  test('useInventoryItem handles food consumption', () => {
    const foodItem = { type: 'food', foodType: 'food/meat/beaf.png' };
    mockPlayer.inventory = [foodItem];

    inventoryManager.useInventoryItem(foodItem, 0);

    expect(mockPlayer.restoreHunger).toHaveBeenCalledWith(10);
    expect(mockPlayer.inventory).toHaveLength(0);
    expect(mockGame.updatePlayerStats).toHaveBeenCalled();
  });

  test('useInventoryItem handles water consumption', () => {
    const waterItem = { type: 'water' };
    mockPlayer.inventory = [waterItem];

    inventoryManager.useInventoryItem(waterItem, 0);

    expect(mockPlayer.restoreThirst).toHaveBeenCalledWith(10);
    expect(mockPlayer.inventory).toHaveLength(0);
  });

  test('useInventoryItem handles heart consumption', () => {
    const heartItem = { type: 'heart' };
    mockPlayer.inventory = [heartItem];

    inventoryManager.useInventoryItem(heartItem, 0);

    expect(mockPlayer.setHealth).toHaveBeenCalledWith(3); // 2 + 1
    expect(mockPlayer.inventory).toHaveLength(0);
  });

  test('useInventoryItem handles axe dropping', () => {
    const axeItem = { type: 'axe' };
    mockPlayer.inventory = [axeItem];

    inventoryManager.useInventoryItem(axeItem, 0);

    expect(mockGame.grid[1][1]).toBe(TILE_TYPES.AXE);
    expect(mockPlayer.inventory).toHaveLength(0);
  });

  test('useInventoryItem handles hammer dropping', () => {
    const hammerItem = { type: 'hammer' };
    mockPlayer.inventory = [hammerItem];

    inventoryManager.useInventoryItem(hammerItem, 0);

    expect(mockGame.grid[1][1]).toBe(TILE_TYPES.HAMMER);
    expect(mockPlayer.inventory).toHaveLength(0);
  });

  test('dropItem only drops on floor tiles', () => {
    mockGame.grid[1][1] = TILE_TYPES.WALL; // Not floor
    const axeItem = { type: 'axe' };
    mockPlayer.inventory = [axeItem];

    inventoryManager.useInventoryItem(axeItem, 0);

    expect(mockGame.grid[1][1]).toBe(TILE_TYPES.WALL); // Unchanged
    expect(mockPlayer.inventory).toHaveLength(1); // Still in inventory
  });

  test('toggleItemDisabled toggles disabled state', () => {
    const spearItem = { type: 'bishop_spear', uses: 3, disabled: false };
    mockPlayer.inventory = [spearItem];

    inventoryManager.toggleItemDisabled(spearItem, 0);

    expect(spearItem.disabled).toBe(true);
  });

  test('useMapNote reveals undiscovered location', () => {
    // Mock visited zones to not include candidate zones in range
    mockPlayer.getVisitedZones.mockReturnValue(new Set(['0,0']));
    mockPlayer.getCurrentZone.mockReturnValue({ x: 0, y: 0, dimension: 0 });

    // Mock random to select first candidate
    jest.spyOn(Math, 'random').mockReturnValue(0.1);

    inventoryManager.useMapNote();

    expect(mockPlayer.markZoneVisited).toHaveBeenCalled();
    expect(mockUIManager.addMessageToLog).toHaveBeenCalled();
    expect(mockUIManager.renderZoneMap).toHaveBeenCalled();
  });
});
