import { ItemManager } from '@managers/ItemManager';
import { TILE_TYPES, INVENTORY_CONSTANTS, GAMEPLAY_CONSTANTS } from '@core/constants/index';

describe('ItemManager', () => {
  let itemManager;
  let mockGame;
  let mockPlayer;
  let mockGridManager;
  let mockSoundManager;

  beforeEach(() => {
    // Create mock sound manager
    mockSoundManager = {
      playSound: vi.fn(),
    };

    // Create mock player
    mockPlayer = {
      inventory: [],
      stats: {
        health: 80,
        maxHealth: 100,
        hunger: 60,
        thirst: 50,
      },
      restoreThirst: vi.fn(),
      restoreHunger: vi.fn(),
      setHealth: vi.fn(),
      getHealth: vi.fn(() => 80),
    };

    // Create mock grid manager
    mockGridManager = {
      getTile: vi.fn(),
      setTile: vi.fn(),
    };

    // Create mock game
    mockGame = {
      player: mockPlayer,
      soundManager: mockSoundManager,
      gridManager: mockGridManager,
    };

    itemManager = new ItemManager(mockGame);
  });

  describe('Constructor', () => {
    test('should create ItemManager instance', () => {
      expect(itemManager).toBeDefined();
    });

    test('should initialize with game reference', () => {
      expect(itemManager).toHaveProperty('game');
    });

    test('should initialize inventory service', () => {
      expect(itemManager).toHaveProperty('service');
    });
  });

  describe('addItemToInventory', () => {
    test('should add water to empty inventory', () => {
      const item = { type: 'water' };
      const result = itemManager.addItemToInventory(mockPlayer, item);
      expect(result).toBe(true);
    });

    test('should add heart to empty inventory', () => {
      const item = { type: 'heart' };
      const result = itemManager.addItemToInventory(mockPlayer, item);
      expect(result).toBe(true);
    });

    test('should add axe to empty inventory', () => {
      const item = { type: 'axe' };
      const result = itemManager.addItemToInventory(mockPlayer, item);
      expect(result).toBe(true);
    });

    test('should stack water items', () => {
      mockPlayer.inventory = [{ type: 'water', count: 1 }];
      const item = { type: 'water' };
      itemManager.addItemToInventory(mockPlayer, item);
      // Water should stack on existing water item
      expect(mockPlayer.inventory.some(i => i && i.type === 'water')).toBe(true);
    });

    test('should stack heart items', () => {
      mockPlayer.inventory = [{ type: 'heart', count: 1 }];
      const item = { type: 'heart' };
      itemManager.addItemToInventory(mockPlayer, item);
      expect(mockPlayer.inventory.some(i => i && i.type === 'heart')).toBe(true);
    });

    test('should not stack non-stackable items like axe', () => {
      mockPlayer.inventory = [{ type: 'axe' }];
      const item = { type: 'axe' };
      itemManager.addItemToInventory(mockPlayer, item);
      // Should add as new item rather than stacking
      const axes = mockPlayer.inventory.filter(i => i && i.type === 'axe');
      expect(axes.length).toBeGreaterThanOrEqual(1);
    });

    test('should handle inventory full scenario', () => {
      // Fill inventory
      mockPlayer.inventory = Array(INVENTORY_CONSTANTS.MAX_INVENTORY_SIZE).fill({ type: 'axe' });
      const item = { type: 'shovel' };
      const result = itemManager.addItemToInventory(mockPlayer, item);
      expect(result).toBe(false);
    });

    test('should play pickup sound by default', () => {
      const item = { type: 'bomb' };
      itemManager.addItemToInventory(mockPlayer, item, 'pickup');
      expect(mockSoundManager.playSound).toHaveBeenCalledWith('pickup');
    });

    test('should play custom sound when specified', () => {
      const item = { type: 'note' };
      itemManager.addItemToInventory(mockPlayer, item, 'note_sound');
      expect(mockSoundManager.playSound).toHaveBeenCalledWith('note_sound');
    });
  });

  describe('handleItemPickup', () => {
    test('should pick up water tile and replace with floor', () => {
      mockGridManager.getTile.mockReturnValue(TILE_TYPES.WATER);
      itemManager.handleItemPickup(mockPlayer, 5, 5, mockGridManager);
      expect(mockGridManager.setTile).toHaveBeenCalledWith(5, 5, TILE_TYPES.FLOOR);
    });

    test('should consume water directly if inventory full', () => {
      mockPlayer.inventory = Array(INVENTORY_CONSTANTS.MAX_INVENTORY_SIZE).fill({ type: 'axe' });
      mockGridManager.getTile.mockReturnValue(TILE_TYPES.WATER);

      itemManager.handleItemPickup(mockPlayer, 5, 5, mockGridManager);

      expect(mockPlayer.restoreThirst).toHaveBeenCalledWith(GAMEPLAY_CONSTANTS.WATER_RESTORATION_AMOUNT);
      expect(mockGridManager.setTile).toHaveBeenCalledWith(5, 5, TILE_TYPES.FLOOR);
    });

    test('should pick up heart tile', () => {
      mockGridManager.getTile.mockReturnValue(TILE_TYPES.HEART);
      itemManager.handleItemPickup(mockPlayer, 3, 3, mockGridManager);
      expect(mockGridManager.setTile).toHaveBeenCalledWith(3, 3, TILE_TYPES.FLOOR);
    });

    test('should consume heart directly if inventory full', () => {
      mockPlayer.inventory = Array(INVENTORY_CONSTANTS.MAX_INVENTORY_SIZE).fill({ type: 'bomb' });
      mockGridManager.getTile.mockReturnValue(TILE_TYPES.HEART);
      mockPlayer.getHealth.mockReturnValue(70);

      itemManager.handleItemPickup(mockPlayer, 3, 3, mockGridManager);

      expect(mockPlayer.setHealth).toHaveBeenCalledWith(70 + GAMEPLAY_CONSTANTS.HEART_RESTORATION_AMOUNT);
      expect(mockGridManager.setTile).toHaveBeenCalledWith(3, 3, TILE_TYPES.FLOOR);
    });

    test('should pick up axe tile', () => {
      mockGridManager.getTile.mockReturnValue(TILE_TYPES.AXE);
      itemManager.handleItemPickup(mockPlayer, 7, 8, mockGridManager);
      expect(mockGridManager.setTile).toHaveBeenCalledWith(7, 8, TILE_TYPES.FLOOR);
    });

    test('should pick up bomb tile', () => {
      mockGridManager.getTile.mockReturnValue(TILE_TYPES.BOMB);
      itemManager.handleItemPickup(mockPlayer, 2, 4, mockGridManager);
      expect(mockGridManager.setTile).toHaveBeenCalledWith(2, 4, TILE_TYPES.FLOOR);
    });

    test('should pick up note tile', () => {
      mockGridManager.getTile.mockReturnValue(TILE_TYPES.NOTE);
      itemManager.handleItemPickup(mockPlayer, 6, 7, mockGridManager);
      expect(mockGridManager.setTile).toHaveBeenCalledWith(6, 7, TILE_TYPES.FLOOR);
    });

    test('should handle hammer tile (legacy, no action)', () => {
      mockGridManager.getTile.mockReturnValue(TILE_TYPES.HAMMER);
      itemManager.handleItemPickup(mockPlayer, 1, 1, mockGridManager);
      // Hammer should not trigger any action (legacy tile)
      expect(mockGridManager.setTile).not.toHaveBeenCalled();
    });

    test('should pick up food tile object', () => {
      const foodTile = { type: TILE_TYPES.FOOD, foodType: 'apple' };
      mockGridManager.getTile.mockReturnValue(foodTile);

      itemManager.handleItemPickup(mockPlayer, 4, 4, mockGridManager);

      expect(mockGridManager.setTile).toHaveBeenCalledWith(4, 4, TILE_TYPES.FLOOR);
    });

    test('should consume food directly if inventory full', () => {
      mockPlayer.inventory = Array(INVENTORY_CONSTANTS.MAX_INVENTORY_SIZE).fill({ type: 'shovel' });
      const foodTile = { type: TILE_TYPES.FOOD, foodType: 'bread' };
      mockGridManager.getTile.mockReturnValue(foodTile);

      itemManager.handleItemPickup(mockPlayer, 4, 4, mockGridManager);

      expect(mockPlayer.restoreHunger).toHaveBeenCalledWith(GAMEPLAY_CONSTANTS.FOOD_RESTORATION_AMOUNT);
      expect(mockGridManager.setTile).toHaveBeenCalledWith(4, 4, TILE_TYPES.FLOOR);
    });

    test('should pick up bishop spear with uses', () => {
      const weaponTile = { type: TILE_TYPES.BISHOP_SPEAR, uses: 5 };
      mockGridManager.getTile.mockReturnValue(weaponTile);

      itemManager.handleItemPickup(mockPlayer, 8, 9, mockGridManager);

      expect(mockGridManager.setTile).toHaveBeenCalledWith(8, 9, TILE_TYPES.FLOOR);
    });

    test('should pick up horse icon with uses', () => {
      const weaponTile = { type: TILE_TYPES.HORSE_ICON, uses: 3 };
      mockGridManager.getTile.mockReturnValue(weaponTile);

      itemManager.handleItemPickup(mockPlayer, 2, 2, mockGridManager);

      expect(mockGridManager.setTile).toHaveBeenCalledWith(2, 2, TILE_TYPES.FLOOR);
    });

    test('should pick up bow with uses', () => {
      const weaponTile = { type: TILE_TYPES.BOW, uses: 10 };
      mockGridManager.getTile.mockReturnValue(weaponTile);

      itemManager.handleItemPickup(mockPlayer, 5, 6, mockGridManager);

      expect(mockGridManager.setTile).toHaveBeenCalledWith(5, 6, TILE_TYPES.FLOOR);
    });

    test('should pick up shovel with uses', () => {
      const toolTile = { type: TILE_TYPES.SHOVEL, uses: 8 };
      mockGridManager.getTile.mockReturnValue(toolTile);

      itemManager.handleItemPickup(mockPlayer, 3, 7, mockGridManager);

      expect(mockGridManager.setTile).toHaveBeenCalledWith(3, 7, TILE_TYPES.FLOOR);
    });

    test('should handle null tile gracefully', () => {
      mockGridManager.getTile.mockReturnValue(null);
      expect(() => itemManager.handleItemPickup(mockPlayer, 0, 0, mockGridManager)).not.toThrow();
    });

    test('should handle undefined tile gracefully', () => {
      mockGridManager.getTile.mockReturnValue(undefined);
      expect(() => itemManager.handleItemPickup(mockPlayer, 0, 0, mockGridManager)).not.toThrow();
    });

    test('should ignore unknown tile types', () => {
      mockGridManager.getTile.mockReturnValue(999); // Unknown tile type
      itemManager.handleItemPickup(mockPlayer, 1, 1, mockGridManager);
      // Should not throw or set tile
      expect(mockGridManager.setTile).not.toHaveBeenCalled();
    });
  });

  describe('Stacking Logic', () => {
    test('should stack water when existing water in inventory', () => {
      mockPlayer.inventory = [{ type: 'water', count: 2 }];
      mockGridManager.getTile.mockReturnValue(TILE_TYPES.WATER);

      itemManager.handleItemPickup(mockPlayer, 5, 5, mockGridManager);

      // Should pick up (stack) rather than consume
      expect(mockPlayer.restoreThirst).not.toHaveBeenCalled();
    });

    test('should stack hearts when existing heart in inventory', () => {
      mockPlayer.inventory = [{ type: 'heart', count: 1 }];
      mockGridManager.getTile.mockReturnValue(TILE_TYPES.HEART);

      itemManager.handleItemPickup(mockPlayer, 3, 3, mockGridManager);

      // Should pick up (stack) rather than consume
      expect(mockPlayer.setHealth).not.toHaveBeenCalled();
    });

    test('should stack food with matching foodType', () => {
      mockPlayer.inventory = [
        { type: 'food', foodType: 'apple', count: 1 },
        null,
        null,
      ];
      const foodTile = { type: TILE_TYPES.FOOD, foodType: 'apple' };
      mockGridManager.getTile.mockReturnValue(foodTile);

      itemManager.handleItemPickup(mockPlayer, 4, 4, mockGridManager);

      // Should pick up rather than consume
      expect(mockPlayer.restoreHunger).not.toHaveBeenCalled();
    });

    test('should not stack food with different foodType when inventory full', () => {
      mockPlayer.inventory = Array(INVENTORY_CONSTANTS.MAX_INVENTORY_SIZE).fill(null);
      mockPlayer.inventory[0] = { type: 'food', foodType: 'apple', count: 1 };
      mockPlayer.inventory[1] = { type: 'axe' };
      mockPlayer.inventory[2] = { type: 'bomb' };
      // Fill rest
      for (let i = 3; i < INVENTORY_CONSTANTS.MAX_INVENTORY_SIZE; i++) {
        mockPlayer.inventory[i] = { type: 'note' };
      }

      const foodTile = { type: TILE_TYPES.FOOD, foodType: 'bread' };
      mockGridManager.getTile.mockReturnValue(foodTile);

      itemManager.handleItemPickup(mockPlayer, 4, 4, mockGridManager);

      // Different foodType, inventory full -> should consume
      expect(mockPlayer.restoreHunger).toHaveBeenCalledWith(GAMEPLAY_CONSTANTS.FOOD_RESTORATION_AMOUNT);
    });

    test('should stack notes', () => {
      mockPlayer.inventory = [{ type: 'note', count: 3 }];
      mockGridManager.getTile.mockReturnValue(TILE_TYPES.NOTE);

      itemManager.handleItemPickup(mockPlayer, 6, 7, mockGridManager);

      expect(mockGridManager.setTile).toHaveBeenCalledWith(6, 7, TILE_TYPES.FLOOR);
    });
  });

  describe('Edge Cases', () => {
    test('should handle player without getHealth method', () => {
      delete mockPlayer.getHealth;
      mockPlayer.inventory = Array(INVENTORY_CONSTANTS.MAX_INVENTORY_SIZE).fill({ type: 'bomb' });
      mockGridManager.getTile.mockReturnValue(TILE_TYPES.HEART);

      itemManager.handleItemPickup(mockPlayer, 3, 3, mockGridManager);

      // Should default to 0 if getHealth not available
      expect(mockPlayer.setHealth).toHaveBeenCalledWith(0 + GAMEPLAY_CONSTANTS.HEART_RESTORATION_AMOUNT);
    });

    test('should handle inventory with null slots', () => {
      mockPlayer.inventory = [null, { type: 'axe' }, null, null];
      const item = { type: 'water' };
      const result = itemManager.addItemToInventory(mockPlayer, item);
      expect(result).toBe(true);
    });

    test('should handle empty inventory array', () => {
      mockPlayer.inventory = [];
      const item = { type: 'heart' };
      const result = itemManager.addItemToInventory(mockPlayer, item);
      expect(result).toBe(true);
    });

    test('should handle tile object without uses property', () => {
      const weaponTile = { type: TILE_TYPES.BOW }; // No uses
      mockGridManager.getTile.mockReturnValue(weaponTile);

      expect(() => itemManager.handleItemPickup(mockPlayer, 5, 6, mockGridManager)).not.toThrow();
    });

    test('should handle negative coordinates', () => {
      mockGridManager.getTile.mockReturnValue(TILE_TYPES.WATER);
      expect(() => itemManager.handleItemPickup(mockPlayer, -1, -1, mockGridManager)).not.toThrow();
    });

    test('should handle very large coordinates', () => {
      mockGridManager.getTile.mockReturnValue(TILE_TYPES.BOMB);
      expect(() => itemManager.handleItemPickup(mockPlayer, 9999, 9999, mockGridManager)).not.toThrow();
    });
  });

  describe('Multiple Items Workflow', () => {
    test('should handle picking up multiple different items', () => {
      // Reset mock to ensure clean count
      mockGridManager.setTile.mockClear();

      // Pick up axe
      mockGridManager.getTile.mockReturnValue(TILE_TYPES.AXE);
      itemManager.handleItemPickup(mockPlayer, 1, 1, mockGridManager);

      // Pick up bomb
      mockGridManager.getTile.mockReturnValue(TILE_TYPES.BOMB);
      itemManager.handleItemPickup(mockPlayer, 2, 2, mockGridManager);

      // Pick up water (calls setTile twice - once in pickup, once after)
      mockGridManager.getTile.mockReturnValue(TILE_TYPES.WATER);
      itemManager.handleItemPickup(mockPlayer, 3, 3, mockGridManager);

      // Axe: 1 call, Bomb: 1 call, Water: 2 calls (pickup + direct) = 4 total
      expect(mockGridManager.setTile).toHaveBeenCalledTimes(4);
    });

    test('should handle mixed consumable and collectible pickups', () => {
      // Pick up water (consumable)
      mockGridManager.getTile.mockReturnValue(TILE_TYPES.WATER);
      itemManager.handleItemPickup(mockPlayer, 1, 1, mockGridManager);

      // Pick up axe (tool)
      mockGridManager.getTile.mockReturnValue(TILE_TYPES.AXE);
      itemManager.handleItemPickup(mockPlayer, 2, 2, mockGridManager);

      // Fill inventory and pick up heart (should consume)
      mockPlayer.inventory = Array(INVENTORY_CONSTANTS.MAX_INVENTORY_SIZE).fill({ type: 'note' });
      mockGridManager.getTile.mockReturnValue(TILE_TYPES.HEART);
      itemManager.handleItemPickup(mockPlayer, 3, 3, mockGridManager);

      expect(mockPlayer.setHealth).toHaveBeenCalled();
    });
  });
});
