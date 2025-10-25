/**
 * @jest-environment jsdom
 */
import { InventoryService } from '../managers/inventory/InventoryService.js';
import { ItemMetadata } from '../managers/inventory/ItemMetadata.js';
import { TILE_TYPES } from '../core/constants.js';

describe('InventoryService', () => {
  let inventoryService;
  let mockGame;
  let mockPlayer;
  let mockUIManager;

  beforeEach(() => {
    mockPlayer = {
      inventory: [],
      radialInventory: [],
      isDead: jest.fn().mockReturnValue(false),
      x: 1,
      y: 1,
      getVisitedZones: jest.fn().mockReturnValue(new Set()),
      getCurrentZone: jest.fn().mockReturnValue({ x: 0, y: 0, dimension: 0 }),
      markZoneVisited: jest.fn(),
      setHealth: jest.fn(),
      getHealth: jest.fn().mockReturnValue(2),
      restoreHunger: jest.fn(),
      restoreThirst: jest.fn(),
      getPosition: function() { return { x: this.x, y: this.y }; }
    };

    mockUIManager = {
      updatePlayerStats: jest.fn(),
      addMessageToLog: jest.fn(),
      renderZoneMap: jest.fn(),
      showOverlayMessage: jest.fn()
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
      updatePlayerStats: jest.fn(),
      enemies: []
    };

    document.getElementById = jest.fn().mockReturnValue({ classList: { add: jest.fn(), remove: jest.fn() }, textContent: '', style: {} });
    document.querySelector = jest.fn().mockReturnValue({ innerHTML: '', appendChild: jest.fn(), getBoundingClientRect: jest.fn().mockReturnValue({}), closest: jest.fn().mockReturnValue({ getBoundingClientRect: jest.fn().mockReturnValue({}) }) });

    inventoryService = new InventoryService(mockGame);
    mockGame.inventoryService = inventoryService;
  });

  afterEach(() => jest.clearAllMocks());

  test('ItemMetadata.getTooltipText returns correct text for food', () => {
    const foodItem = { type: 'food', foodType: 'food/meat/beaf.png' };
    expect(ItemMetadata.getTooltipText(foodItem)).toBe('meat - Restores 10 hunger');
  });

  test('ItemMetadata.getTooltipText returns correct text for water', () => {
    const waterItem = { type: 'water' };
    expect(ItemMetadata.getTooltipText(waterItem)).toBe('Water - Restores 10 thirst');
  });

  test('ItemMetadata.getTooltipText shows disabled state for bishop_spear', () => {
    const spearItem = { type: 'bishop_spear', uses: 3, disabled: true };
    expect(ItemMetadata.getTooltipText(spearItem)).toBe('Bishop Spear (DISABLED) - Charge diagonally towards enemies, has 3 charges');
  });

  test('ItemMetadata.getTooltipText shows disabled state for horse_icon', () => {
    const horseItem = { type: 'horse_icon', uses: 2, disabled: true };
    expect(ItemMetadata.getTooltipText(horseItem)).toBe('Horse Icon (DISABLED) - Charge in L-shape (knight moves) towards enemies, has 2 charges');
  });

  test('useItem handles food consumption', () => {
    const foodItem = { type: 'food', foodType: 'food/meat/beaf.png' };
    mockPlayer.inventory = [foodItem];

    inventoryService.useItem(foodItem, { fromRadial: false });

    expect(mockPlayer.restoreHunger).toHaveBeenCalledWith(10);
    expect(mockPlayer.inventory).toHaveLength(0);
    expect(mockGame.updatePlayerStats).toHaveBeenCalled();
  });

  test('useItem handles water consumption', () => {
    const waterItem = { type: 'water' };
    mockPlayer.inventory = [waterItem];

    inventoryService.useItem(waterItem, { fromRadial: false });

    expect(mockPlayer.restoreThirst).toHaveBeenCalledWith(10);
    expect(mockPlayer.inventory).toHaveLength(0);
  });

  test('useItem handles heart consumption', () => {
    const heartItem = { type: 'heart' };
    mockPlayer.inventory = [heartItem];

    inventoryService.useItem(heartItem, { fromRadial: false });

    expect(mockPlayer.setHealth).toHaveBeenCalledWith(3); // 2 + 1
    expect(mockPlayer.inventory).toHaveLength(0);
  });

  test('useItem handles axe dropping', () => {
    const axeItem = { type: 'axe' };
    mockPlayer.inventory = [axeItem];

    inventoryService.useItem(axeItem, { fromRadial: false });

    expect(mockGame.grid[1][1]).toBe(TILE_TYPES.AXE);
    expect(mockPlayer.inventory).toHaveLength(0);
  });

  test('axe drop only works on floor tiles', () => {
    mockGame.grid[1][1] = TILE_TYPES.WALL; // Not floor
    const axeItem = { type: 'axe' };
    mockPlayer.inventory = [axeItem];

    inventoryService.useItem(axeItem, { fromRadial: false });

    expect(mockGame.grid[1][1]).toBe(TILE_TYPES.WALL); // Unchanged
    expect(mockPlayer.inventory).toHaveLength(1); // Still in inventory
  });

  test('toggleItemDisabled toggles disabled state', () => {
    const spearItem = { type: 'bishop_spear', uses: 3, disabled: false };
    mockPlayer.inventory = [spearItem];

    inventoryService.toggleItemDisabled(spearItem);

    expect(spearItem.disabled).toBe(true);
  });

  test('map note reveals undiscovered location', () => {
    const noteItem = { type: 'note' };
    mockPlayer.inventory = [noteItem];
    mockPlayer.getVisitedZones.mockReturnValue(new Set(['0,0']));
    mockPlayer.getCurrentZone.mockReturnValue({ x: 0, y: 0, dimension: 0 });

    jest.spyOn(Math, 'random').mockReturnValue(0.1);

    inventoryService.useItem(noteItem, { fromRadial: false });

    expect(mockPlayer.markZoneVisited).toHaveBeenCalled();
    expect(mockUIManager.addMessageToLog).toHaveBeenCalled();
    expect(mockUIManager.renderZoneMap).toHaveBeenCalled();
  });
});
