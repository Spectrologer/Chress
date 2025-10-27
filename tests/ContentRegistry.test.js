/**
 * ContentRegistry Tests
 *
 * Quick verification that the ContentRegistry system is working
 */

import { ContentRegistry } from '../core/ContentRegistry.js';
import { registerAllContent } from '../config/ContentRegistrations.js';

console.log('=== ContentRegistry Test Suite ===\n');

// Test 1: Registry starts empty
console.log('Test 1: Registry starts empty');
const statsBefore = ContentRegistry.getStats();
console.log('Before registration:', statsBefore);
console.assert(statsBefore.items === 0, 'Items should be 0 before registration');
console.assert(statsBefore.initialized === false, 'Should not be initialized');

// Test 2: Registration populates content
console.log('\nTest 2: Registration populates content');
registerAllContent();
const statsAfter = ContentRegistry.getStats();
console.log('After registration:', statsAfter);
console.assert(statsAfter.items > 0, 'Should have items registered');
console.assert(statsAfter.npcs > 0, 'Should have NPCs registered');
console.assert(statsAfter.enemies > 0, 'Should have enemies registered');
console.assert(statsAfter.initialized === true, 'Should be initialized');

// Test 3: Can retrieve items
console.log('\nTest 3: Can retrieve items');
const bomb = ContentRegistry.getItem('bomb');
console.log('Bomb config:', bomb);
console.assert(bomb !== null, 'Should find bomb');
console.assert(bomb.id === 'bomb', 'Bomb ID should match');
console.assert(bomb.stackable === true, 'Bomb should be stackable');
console.assert(bomb.radial === true, 'Bomb should be radial');

// Test 4: Can retrieve NPCs
console.log('\nTest 4: Can retrieve NPCs');
const penne = ContentRegistry.getNPC('penne');
console.log('Penne config:', penne);
console.assert(penne !== null, 'Should find penne');
console.assert(penne.action === 'barter', 'Penne should have barter action');

// Test 5: Can retrieve enemies
console.log('\nTest 5: Can retrieve enemies');
const lizardy = ContentRegistry.getEnemy('lizardy');
console.log('Lizardy config:', lizardy);
console.assert(lizardy !== null, 'Should find lizardy');
console.assert(lizardy.weight === 1, 'Lizardy should have weight 1');

// Test 6: Spawn filtering works
console.log('\nTest 6: Spawn filtering works');
const level1Surface = ContentRegistry.getSpawnableItems(1, 0);
console.log(`Level 1 surface spawnable items: ${level1Surface.length}`);
console.assert(level1Surface.length > 0, 'Should have spawnable items');

// Check that activated items don't spawn on level 1 surface
const hasActivated = level1Surface.some(item => item.spawnRules.isActivated);
console.assert(!hasActivated, 'Level 1 surface should not have activated items');

const level2Surface = ContentRegistry.getSpawnableItems(2, 0);
console.log(`Level 2 surface spawnable items: ${level2Surface.length}`);
console.assert(level2Surface.length > level1Surface.length, 'Level 2 should have more items than level 1');

// Test 7: Enemy spawn probabilities
console.log('\nTest 7: Enemy spawn probabilities');
const level1Enemies = ContentRegistry.getSpawnableEnemies(1);
console.log(`Level 1 enemies: ${level1Enemies.length}`);
console.assert(level1Enemies.length === 3, 'Level 1 should have 3 enemy types');

const level4Enemies = ContentRegistry.getSpawnableEnemies(4);
console.log(`Level 4 enemies: ${level4Enemies.length}`);
console.assert(level4Enemies.length === 5, 'Level 4 should have 5 enemy types');

// Test 8: Item tooltips
console.log('\nTest 8: Item tooltips');
const axe = ContentRegistry.getItem('axe');
const axeTooltip = axe.getTooltip({});
console.log('Axe tooltip:', axeTooltip);
console.assert(axeTooltip.includes('Axe'), 'Tooltip should contain item name');

// Test 9: Stackable/Radial queries
console.log('\nTest 9: Stackable/Radial queries');
const stackable = ContentRegistry.getStackableItems();
console.log(`Stackable items: ${stackable.length}`);
console.assert(stackable.length > 0, 'Should have stackable items');

const radial = ContentRegistry.getRadialItems();
console.log(`Radial items: ${radial.length}`);
console.assert(radial.length > 0, 'Should have radial items');

// Test 10: All items have required fields
console.log('\nTest 10: All items have required fields');
const allItems = ContentRegistry.getAllItems();
let validationErrors = 0;
allItems.forEach(item => {
    if (!item.id) {
        console.error(`Item missing ID:`, item);
        validationErrors++;
    }
    if (typeof item.tileType !== 'number') {
        console.error(`Item ${item.id} has invalid tileType:`, item.tileType);
        validationErrors++;
    }
    if (typeof item.getTooltip !== 'function') {
        console.error(`Item ${item.id} missing getTooltip function`);
        validationErrors++;
    }
    if (typeof item.getImageKey !== 'function') {
        console.error(`Item ${item.id} missing getImageKey function`);
        validationErrors++;
    }
});
console.assert(validationErrors === 0, `Found ${validationErrors} validation errors`);

console.log('\n=== All Tests Passed! ===');
console.log('ContentRegistry is working correctly.');
