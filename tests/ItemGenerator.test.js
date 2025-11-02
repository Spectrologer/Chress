import { GRID_SIZE, TILE_TYPES } from '@core/constants/index.js';
import { ItemGenerator } from '../generators/ItemGenerator.js';
import * as ZoneStateManagerModule from '../generators/ZoneStateManager.js';

describe('ItemGenerator', () => {
  let grid;
  let gridManager;
  let foodAssets;
  let getZoneLevelSpy;
  let hashCodeSpy;

  beforeEach(() => {
    // Create a 10x10 grid filled with FLOOR tiles
    grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(TILE_TYPES.FLOOR));
    foodAssets = ['food/meat/beaf.png', 'food/veg/nut.png'];

    // Create mock gridManager
    gridManager = {
      getTile: vi.fn((x, y) => {
        if (x < 0 || y < 0 || x >= GRID_SIZE || y >= GRID_SIZE) {
          return undefined;
        }
        return grid[y][x];
      }),
      setTile: vi.fn((x, y, value) => {
        if (x >= 0 && y >= 0 && x < GRID_SIZE && y < GRID_SIZE) {
          grid[y][x] = value;
        }
      }),
      isWalkable: vi.fn().mockReturnValue(true),
    };

    // Mock ZoneStateManager methods using vi.spyOn
    getZoneLevelSpy = vi.spyOn(ZoneStateManagerModule.ZoneStateManager, 'getZoneLevel')
      .mockReturnValue(1);
    hashCodeSpy = vi.spyOn(ZoneStateManagerModule.ZoneStateManager, 'hashCode')
      .mockReturnValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('addLevelBasedFoodAndWater introduces variation', () => {
    // Mock Math.random to ensure probability success for level 1 (spawnChance 0.40)
    // Call position to avoid spikes - keep consistent
    vi.spyOn(Math, 'random').mockReturnValueOnce(0.3).mockReturnValueOnce(0.1);

    const generator = new ItemGenerator(gridManager, foodAssets, 0, 0);
    generator.addLevelBasedFoodAndWater();

    // Check that at least one tile is not FLOOR anymore
    const modifiedTiles = grid.flat().filter(cell => cell !== TILE_TYPES.FLOOR);
    expect(modifiedTiles.length).toBeGreaterThan(0);
  });

  test('addRandomItem places water when random < 0.5', () => {
    // Mock Math.random to choose water (<0.5)
    vi.spyOn(Math, 'random').mockReturnValue(0.2);

    const generator = new ItemGenerator(gridManager, foodAssets, 0, 0);
    generator.addRandomItem();

    // Check that water tile type is placed
    const placedItem = grid.flat().find(cell => cell !== TILE_TYPES.FLOOR);
    expect(placedItem).toBe(TILE_TYPES.WATER);
  });

  test('addRandomItem places food when random >= 0.5', () => {
    // Mock Math.random to choose food (>=0.5)
    vi.spyOn(Math, 'random').mockReturnValue(0.6);

    const generator = new ItemGenerator(gridManager, foodAssets, 0, 0);
    generator.addRandomItem();

    // Check that food object is placed
    const placedItem = grid.flat().find(cell => cell !== TILE_TYPES.FLOOR);
    expect(placedItem).toEqual({
      type: TILE_TYPES.FOOD,
      foodType: 'food/meat/beaf.png'
    });
  });
});
