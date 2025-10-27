import { GRID_SIZE, TILE_TYPES } from '../core/constants/index.js';
import { ItemGenerator } from '../generators/ItemGenerator.js';

// Mock dependencies
jest.mock('../generators/ZoneStateManager.js');
import { ZoneStateManager } from '../generators/ZoneStateManager.js';

describe('ItemGenerator', () => {
  let grid;
  let foodAssets;

  beforeEach(() => {
    // Create a 10x10 grid filled with FLOOR tiles
    grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(TILE_TYPES.FLOOR));
    foodAssets = ['food/meat/beaf.png', 'food/veg/nut.png'];

    // Mock ZoneStateManager
    ZoneStateManager.getZoneLevel.mockReturnValue(1);
    ZoneStateManager.hashCode.mockReturnValue(0);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('addLevelBasedFoodAndWater introduces variation', () => {
    // Mock Math.random to ensure probability success for level 1 (spawnChance 0.40)
    // Call position to avoid spikes - keep consistent
    jest.spyOn(Math, 'random').mockReturnValueOnce(0.3).mockReturnValueOnce(0.1);

    const generator = new ItemGenerator(grid, foodAssets, 0, 0);
    generator.addLevelBasedFoodAndWater();

    // Check that at least one tile is not FLOOR anymore
    const modifiedTiles = grid.flat().filter(cell => cell !== TILE_TYPES.FLOOR);
    expect(modifiedTiles.length).toBeGreaterThan(0);
  });

  test('addRandomItem places water when random < 0.5', () => {
    // Mock Math.random to choose water (<0.5)
    jest.spyOn(Math, 'random').mockReturnValue(0.2);

    const generator = new ItemGenerator(grid, foodAssets, 0, 0);
    generator.addRandomItem();

    // Check that water tile type is placed
    const placedItem = grid.flat().find(cell => cell !== TILE_TYPES.FLOOR);
    expect(placedItem).toBe(TILE_TYPES.WATER);
  });

  test('addRandomItem places food when random >= 0.5', () => {
    // Mock Math.random to choose food (>=0.5)
    jest.spyOn(Math, 'random').mockReturnValue(0.6);

    const generator = new ItemGenerator(grid, foodAssets, 0, 0);
    generator.addRandomItem();

    // Check that food object is placed
    const placedItem = grid.flat().find(cell => cell !== TILE_TYPES.FLOOR);
    expect(placedItem).toEqual({
      type: TILE_TYPES.FOOD,
      foodType: 'food/meat/beaf.png'
    });
  });
});
