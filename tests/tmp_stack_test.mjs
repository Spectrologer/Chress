import { ItemManager } from '../managers/ItemManager.js';
import { TILE_TYPES } from '../core/constants/index.js';
import { logger } from '../core/logger.js';

const mockGame = { soundManager: { playSound: () => {} } };
const im = new ItemManager(mockGame);

const player = { inventory: [], animations: {} };

logger.debug('Initial inventory:', JSON.stringify(player.inventory));

// Simulate picking up a primitive heart tile
let added1 = im.addItemToInventory(player, { type: 'heart' });
logger.debug('Added first heart:', added1, 'inventory:', JSON.stringify(player.inventory));

// Simulate picking up another heart
let added2 = im.addItemToInventory(player, { type: 'heart' });
logger.debug('Added second heart:', added2, 'inventory:', JSON.stringify(player.inventory));

// Simulate picking up heart when inventory has other items
player.inventory = [{ type: 'food', foodType: 'food/meat/beaf.png', quantity: 1 }, { type: 'heart', quantity: 1 }];
logger.debug('\nInventory before pickup:', JSON.stringify(player.inventory));
added2 = im.addItemToInventory(player, { type: 'heart' });
logger.debug('Added heart with existing heart stack present:', added2, 'inventory:', JSON.stringify(player.inventory));

// Test behavior when inventory has empty slots and heart present
player.inventory = [{ type: 'heart', quantity: 3 }];
added2 = im.addItemToInventory(player, { type: 'heart' });
logger.debug('Add to existing stack (quantity 3 -> 4):', added2, JSON.stringify(player.inventory));

// Fill inventory with non-heart items and attempt to pickup heart (should merge if stack exists)
player.inventory = [
  { type: 'food', foodType: 'food/meat/beaf.png', quantity: 1 },
  { type: 'water', quantity: 1 },
  { type: 'axe' },
  { type: 'bomb', quantity: 1 },
  { type: 'note', quantity: 1 },
  { type: 'heart', quantity: 2 }
];
logger.debug('\nFull inventory (has heart stack):', JSON.stringify(player.inventory));
added2 = im.addItemToInventory(player, { type: 'heart' });
logger.debug('Pickup while full but existing stack present - should merge:', added2, JSON.stringify(player.inventory));

// Full inventory without heart stack
player.inventory = [
  { type: 'food', foodType: 'food/meat/beaf.png', quantity: 1 },
  { type: 'water', quantity: 1 },
  { type: 'axe' },
  { type: 'bomb', quantity: 1 },
  { type: 'note', quantity: 1 },
  { type: 'book_of_time_travel', uses: 1 }
];
logger.debug('\nFull inventory (no heart):', JSON.stringify(player.inventory));
added2 = im.addItemToInventory(player, { type: 'heart' });
logger.debug('Pickup while full and no stack - should fail (return false):', added2, JSON.stringify(player.inventory));
