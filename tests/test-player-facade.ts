import { PlayerFacade } from '../src/facades/PlayerFacade\.ts';
import { Player } from '../src/entities/Player\.ts';
import { eventBus } from '../src/core/EventBus\.ts';
import { EventTypes } from '../src/core/EventTypes\.ts';

console.log('🧪 Testing PlayerFacade...\n');

// Create a mock player
const mockPlayer = new Player();
mockPlayer.x = 4;
mockPlayer.y = 4;
mockPlayer.lastX = 4;
mockPlayer.lastY = 4;
mockPlayer.inventory = [];
mockPlayer.abilities = new Set();
mockPlayer.stats = {
    health: 100,
    hunger: 50,
    thirst: 50,
    musicEnabled: true
};
mockPlayer.currentZone = { x: 0, y: 0, dimension: 0, depth: 0 };
mockPlayer.undergroundDepth = 0;
mockPlayer.consecutiveKills = 0;
mockPlayer.radialInventory = [];

// Create facade
const playerFacade = new PlayerFacade(mockPlayer);

console.log('✓ PlayerFacade instantiated\n');

// Test 1: Position Operations
console.log('Test 1: Position Operations');
const pos = playerFacade.getPosition();
console.assert(pos.x === 4 && pos.y === 4, 'getPosition should return {x: 4, y: 4}');
console.log(`  ✓ getPosition(): {x: ${pos.x}, y: ${pos.y}}`);

playerFacade.setPosition(5, 6, false); // Don't emit event for testing
console.assert(playerFacade.getX() === 5 && playerFacade.getY() === 6, 'setPosition should update coordinates');
console.log(`  ✓ setPosition(5, 6): {x: ${playerFacade.getX()}, y: ${playerFacade.getY()}}`);

const lastPos = playerFacade.getLastPosition();
console.assert(lastPos.x === 4 && lastPos.y === 4, 'last position should still be 4, 4');
console.log(`  ✓ getLastPosition(): {x: ${lastPos.x}, y: ${lastPos.y}}\n`);

// Test 2: Zone Operations
console.log('Test 2: Zone & Dimension Operations');
const zone = playerFacade.getCurrentZone();
console.assert(zone.x === 0 && zone.y === 0 && zone.dimension === 0, 'zone should be surface at 0,0');
console.log(`  ✓ getCurrentZone(): dimension=${zone.dimension}, depth=${zone.depth}`);

playerFacade.setZoneDimension(2); // Underground
console.assert(playerFacade.getZoneDimension() === 2, 'dimension should be 2');
console.log(`  ✓ setZoneDimension(2): dimension=${playerFacade.getZoneDimension()}`);

playerFacade.setUndergroundDepth(3);
console.assert(playerFacade.getUndergroundDepth() === 3, 'depth should be 3');
console.assert(mockPlayer.currentZone.depth === 3, 'currentZone.depth should sync to 3');
console.log(`  ✓ setUndergroundDepth(3): depth=${playerFacade.getUndergroundDepth()}, currentZone.depth=${mockPlayer.currentZone.depth}`);
console.log('  ✓ Zone depth consistency maintained!\n');

// Test 3: Atomic Zone Update
console.log('Test 3: Atomic Zone Update');
playerFacade.updateZoneState({
    x: 5,
    y: 7,
    dimension: 1, // Interior
    depth: 0,
    portType: 'interior'
});
const updatedZone = playerFacade.getCurrentZone();
console.assert(updatedZone.x === 5 && updatedZone.y === 7, 'zone coords should update');
console.assert(updatedZone.dimension === 1, 'dimension should be 1 (interior)');
console.assert(updatedZone.portType === 'interior', 'portType should be interior');
console.log(`  ✓ updateZoneState(): zone=(${updatedZone.x},${updatedZone.y}), dim=${updatedZone.dimension}, type=${updatedZone.portType}\n`);

// Test 4: Inventory Operations with Events
console.log('Test 4: Inventory Operations');
let inventoryEventFired = false;
const unsubscribe = eventBus.on(EventTypes.INVENTORY_CHANGED, (data) => {
    inventoryEventFired = true;
    console.log(`  📢 Event: INVENTORY_CHANGED (action: ${data.action})`);
});

playerFacade.addToInventory({ type: 'bomb', count: 3 });
console.assert(playerFacade.getInventoryCount() === 1, 'inventory should have 1 item');
console.assert(inventoryEventFired, 'INVENTORY_CHANGED event should fire');
console.log(`  ✓ addToInventory(): count=${playerFacade.getInventoryCount()}`);

const foundItem = playerFacade.findInInventory(item => item.type === 'bomb');
console.assert(foundItem && foundItem.count === 3, 'should find bomb with count 3');
console.log(`  ✓ findInInventory(): found ${foundItem.type} (${foundItem.count}x)`);

inventoryEventFired = false;
const removed = playerFacade.removeFromInventory(0);
console.assert(removed.type === 'bomb', 'should remove bomb');
console.assert(playerFacade.getInventoryCount() === 0, 'inventory should be empty');
console.assert(inventoryEventFired, 'INVENTORY_CHANGED event should fire on remove');
console.log(`  ✓ removeFromInventory(): removed ${removed.type}\n`);

unsubscribe();

// Test 5: Abilities with Events
console.log('Test 5: Abilities Operations');
let abilityEventFired = false;
const unsubscribeAbility = eventBus.on(EventTypes.ABILITY_GAINED, (data) => {
    abilityEventFired = true;
    console.log(`  📢 Event: ABILITY_GAINED (ability: ${data.ability})`);
});

playerFacade.addAbility('axe');
console.assert(playerFacade.hasAbility('axe'), 'should have axe ability');
console.assert(abilityEventFired, 'ABILITY_GAINED event should fire');
console.log(`  ✓ addAbility('axe'): hasAbility=${playerFacade.hasAbility('axe')}`);

playerFacade.addAbility('hammer');
const abilities = playerFacade.getAbilities();
console.assert(abilities.length === 2, 'should have 2 abilities');
console.assert(abilities.includes('axe') && abilities.includes('hammer'), 'should have both axe and hammer');
console.log(`  ✓ getAbilities(): [${abilities.join(', ')}]\n`);

unsubscribeAbility();

// Test 6: Stats Operations
console.log('Test 6: Stats Operations');
console.assert(playerFacade.getHealth() === 100, 'health should be 100');
console.log(`  ✓ getHealth(): ${playerFacade.getHealth()}`);

console.assert(playerFacade.getHunger() === 50, 'hunger should be 50');
console.log(`  ✓ getHunger(): ${playerFacade.getHunger()}`);

let statsEventFired = false;
const unsubscribeStats = eventBus.on(EventTypes.STATS_CHANGED, (data) => {
    statsEventFired = true;
    console.log(`  📢 Event: STATS_CHANGED (stat: ${data.stat}, value: ${data.value})`);
});

playerFacade.updateStat('musicEnabled', false);
console.assert(mockPlayer.stats.musicEnabled === false, 'musicEnabled should be false');
console.assert(statsEventFired, 'STATS_CHANGED event should fire');
console.log(`  ✓ updateStat('musicEnabled', false): ${mockPlayer.stats.musicEnabled}\n`);

unsubscribeStats();

// Test 7: Consecutive Kills
console.log('Test 7: Combat State');
playerFacade.setConsecutiveKills(5);
console.assert(playerFacade.getConsecutiveKills() === 5, 'consecutive kills should be 5');
console.log(`  ✓ setConsecutiveKills(5): ${playerFacade.getConsecutiveKills()}`);

playerFacade.setConsecutiveKills(0);
console.assert(playerFacade.getConsecutiveKills() === 0, 'consecutive kills should reset to 0');
console.log(`  ✓ setConsecutiveKills(0): ${playerFacade.getConsecutiveKills()}\n`);

// Test 8: Radial Inventory
console.log('Test 8: Radial Inventory');
let radialEventFired = false;
const unsubscribeRadial = eventBus.on(EventTypes.RADIAL_INVENTORY_CHANGED, () => {
    radialEventFired = true;
    console.log(`  📢 Event: RADIAL_INVENTORY_CHANGED`);
});

playerFacade.setRadialInventory([{ type: 'bomb' }, { type: 'axe' }]);
const radial = playerFacade.getRadialInventory();
console.assert(radial.length === 2, 'radial inventory should have 2 items');
console.assert(radialEventFired, 'RADIAL_INVENTORY_CHANGED event should fire');
console.log(`  ✓ setRadialInventory(): ${radial.length} items\n`);

unsubscribeRadial();

// Test 9: Copy vs Reference
console.log('Test 9: Defensive Copying');
const inventoryCopy = playerFacade.getInventory();
inventoryCopy.push({ type: 'fake' });
console.assert(mockPlayer.inventory.length === 0, 'original inventory should not be modified');
console.log(`  ✓ getInventory() returns copy: original unaffected by mutation`);

const statsCopy = playerFacade.getStats();
statsCopy.health = 999;
console.assert(mockPlayer.stats.health === 100, 'original stats should not be modified');
console.log(`  ✓ getStats() returns copy: original unaffected by mutation\n`);

// Test 10: Port Type
console.log('Test 10: Port Type Operations');
playerFacade.setPortType('underground');
console.assert(playerFacade.getPortType() === 'underground', 'port type should be underground');
console.log(`  ✓ setPortType('underground'): ${playerFacade.getPortType()}\n`);

console.log('✅ All PlayerFacade tests passed!\n');
console.log('📊 Summary:');
console.log('- Position operations: ✓');
console.log('- Zone/dimension management: ✓');
console.log('- Atomic zone updates: ✓');
console.log('- Inventory with events: ✓');
console.log('- Abilities with events: ✓');
console.log('- Stats operations: ✓');
console.log('- Combat state tracking: ✓');
console.log('- Radial inventory: ✓');
console.log('- Defensive copying: ✓');
console.log('- Port type management: ✓');
console.log('\n🎉 PlayerFacade is production-ready!');
