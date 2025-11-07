import { describe, test, expect, beforeEach, vi } from 'vitest';
import { InventoryService } from '@managers/inventory/InventoryService';
import { ItemEffectStrategy } from '@managers/inventory/ItemEffectStrategy';
import { TILE_TYPES, GRID_SIZE } from '@core/constants/index';
import audioManager from '@utils/AudioManager';
import { eventBus } from '@core/EventBus';

describe('InventoryService', () => {
  let inventoryService: any;
  let mockGame: any;

  beforeEach(() => {
    const mockPlayer = {
      x: 5,
      y: 5,
      inventory: [],
      radialInventory: [],
      maxInventorySize: 10,
      maxRadialSize: 8,
      animations: {},
    };
    mockGame = {
      player: mockPlayer,
      grid: Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(TILE_TYPES.FLOOR)),
    };
    inventoryService = new InventoryService(mockGame);
    vi.spyOn(audioManager, 'playSound').mockImplementation(() => {});
    vi.spyOn(eventBus, 'emit').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('pickupItem succeeds', () => {
    const item = { type: 'food_apple', quantity: 1 };
    vi.spyOn(inventoryService.repository, 'addToInventory').mockReturnValue(true);
    expect(inventoryService.pickupItem(item)).toBe(true);
  });

  test('useItem succeeds', () => {
    const item = { type: 'food_apple', quantity: 3 };
    vi.spyOn(ItemEffectStrategy, 'applyEffect').mockReturnValue({ success: true, consumed: true, quantity: 1 });
    vi.spyOn(inventoryService.repository, 'decrementAndCleanup').mockImplementation(() => {});
    vi.spyOn(inventoryService.repository, 'pruneEmptyItems').mockImplementation(() => {});
    expect(inventoryService.useItem(item)).toBe(true);
  });

  test('dropItem succeeds', () => {
    const item = { type: 'bomb', quantity: 1 };
    mockGame.player.inventory.push(item);
    vi.spyOn(inventoryService.repository, 'removeItem').mockImplementation(() => {});
    expect(inventoryService.dropItem('bomb', TILE_TYPES.BOMB)).toBe(true);
  });
});
