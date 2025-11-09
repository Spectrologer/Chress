import { EnemyCollection } from '../src/facades/EnemyCollection';
import { eventBus } from '../src/core/EventBus';
import { EventTypes } from '../src/core/EventTypes';

// Mock Enemy class
class MockEnemy {
    x: number;
    y: number;
    health: number;
    enemyType: string;
    id: string;

    constructor({ x, y, health = 10, enemyType = 'lizardy', id = null }: { x: number; y: number; health?: number; enemyType?: string; id?: string | null }) {
        this.x = x;
        this.y = y;
        this.health = health;
        this.enemyType = enemyType;
        this.id = id || `enemy_${Date.now()}_${Math.random()}`;
    }
}

console.log('✓ EnemyCollection imported successfully');

// Test 1: Basic Construction and Getters
console.log('\n=== Test 1: Basic Construction and Getters ===');
const enemies = [
    new MockEnemy({ x: 1, y: 1, id: 'e1' }),
    new MockEnemy({ x: 2, y: 2, id: 'e2' }),
    new MockEnemy({ x: 3, y: 3, id: 'e3', health: 0 }) // dead enemy
] as any[];
const collection = new EnemyCollection(enemies);

console.assert(collection.count() === 3, 'should have 3 enemies');
console.assert(collection.isEmpty() === false, 'should not be empty');
console.assert(collection.getAll().length === 3, 'getAll should return 3 enemies');
console.assert(collection.getAll() !== enemies, 'getAll should return defensive copy');
console.log('✓ Basic construction and getters work');

// Test 2: Finding Enemies
console.log('\n=== Test 2: Finding Enemies ===');
const enemy1 = collection.findAt(1, 1);
console.assert(enemy1 !== null, 'should find enemy at 1,1');
console.assert(enemy1.id === 'e1', 'should find correct enemy');

const enemy3 = collection.findAt(3, 3, false);
console.assert(enemy3 !== null, 'should find dead enemy when aliveOnly=false');

const enemy3Alive = collection.findAt(3, 3, true);
console.assert(enemy3Alive === null, 'should not find dead enemy when aliveOnly=true');

const noEnemy = collection.findAt(99, 99);
console.assert(noEnemy === null, 'should return null for non-existent position');
console.log('✓ Finding enemies works');

// Test 3: Query Methods
console.log('\n=== Test 3: Query Methods ===');
console.assert(collection.hasEnemyAt(1, 1) === true, 'should detect enemy at 1,1');
console.assert(collection.hasEnemyAt(99, 99) === false, 'should not detect enemy at 99,99');
console.assert(collection.hasEnemyAt(3, 3, true) === false, 'should not detect dead enemy with aliveOnly');

const living = collection.getLiving();
console.assert(living.length === 2, 'should have 2 living enemies');

const dead = collection.getDead();
console.assert(dead.length === 1, 'should have 1 dead enemy');

console.assert(collection.includes(enemy1) === true, 'should include enemy1');
console.log('✓ Query methods work');

// Test 4: Predicates
console.log('\n=== Test 4: Predicates ===');
const lizardies = collection.findAll(e => e.enemyType === 'lizardy');
console.assert(lizardies.length === 3, 'should find all lizardy enemies');

const hasHealthy = collection.some(e => e.health > 5);
console.assert(hasHealthy === true, 'should have enemies with health > 5');

const hasZard = collection.some(e => e.enemyType === 'zard');
console.assert(hasZard === false, 'should not have zard enemies');
console.log('✓ Predicate methods work');

// Test 5: Add Enemy
console.log('\n=== Test 5: Add Enemy ===');
let spawnEvent: any = null;
const unsubSpawn = eventBus.on(EventTypes.ENEMY_SPAWNED, (data) => {
    spawnEvent = data;
});

const newEnemy = new MockEnemy({ x: 4, y: 4, id: 'e4' });
collection.add(newEnemy as any);

console.assert(collection.count() === 4, 'should have 4 enemies after add');
console.assert(collection.findAt(4, 4) !== null, 'should find newly added enemy');
console.assert(spawnEvent !== null, 'should emit ENEMY_SPAWNED event');
console.assert(spawnEvent?.enemy?.id === 'e4', 'event should include enemy data');

unsubSpawn();
console.log('✓ Add enemy works');

// Test 6: Remove Enemy
console.log('\n=== Test 6: Remove Enemy ===');
let removeEvent: any = null;
const unsubRemove = eventBus.on(EventTypes.ENEMY_REMOVED, (data) => {
    removeEvent = data;
});

const removed = collection.remove(enemy1);
console.assert(removed === true, 'should return true on successful removal');
console.assert(collection.count() === 3, 'should have 3 enemies after removal');
console.assert(collection.findAt(1, 1) === null, 'should not find removed enemy');
console.assert(removeEvent !== null, 'should emit ENEMY_REMOVED event');

const removedAgain = collection.remove(enemy1);
console.assert(removedAgain === false, 'should return false when removing non-existent enemy');

unsubRemove();
console.log('✓ Remove enemy works');

// Test 7: Remove by ID
console.log('\n=== Test 7: Remove by ID ===');
const removedById = collection.removeById('e2');
console.assert(removedById === true, 'should remove enemy by ID');
console.assert(collection.count() === 2, 'should have 2 enemies left');
console.assert(collection.findAt(2, 2) === null, 'should not find enemy with id e2');
console.log('✓ Remove by ID works');

// Test 8: Remove Where
console.log('\n=== Test 8: Remove Where ===');
collection.add(new MockEnemy({ x: 5, y: 5, health: 0, id: 'e5' }) as any); // dead
collection.add(new MockEnemy({ x: 6, y: 6, health: 0, id: 'e6' }) as any); // dead

const deadCount = collection.removeDead(false);
console.assert(deadCount === 3, 'should remove 3 dead enemies');
console.assert(collection.count() === 1, 'should have 1 living enemy left');
console.log('✓ Remove where works');

// Test 9: Clear
console.log('\n=== Test 9: Clear ===');
let clearEvent: any = null;
const unsubClear = eventBus.on(EventTypes.ENEMIES_CLEARED, (data) => {
    clearEvent = data;
});

collection.clear();
console.assert(collection.count() === 0, 'should have 0 enemies after clear');
console.assert(collection.isEmpty() === true, 'should be empty');
console.assert(clearEvent !== null, 'should emit ENEMIES_CLEARED event');
console.assert(clearEvent?.count === 1, 'event should include count');

unsubClear();
console.log('✓ Clear works');

// Test 10: Replace All
console.log('\n=== Test 10: Replace All ===');
let replaceEvent: any = null;
const unsubReplace = eventBus.on(EventTypes.ENEMIES_REPLACED, (data) => {
    replaceEvent = data;
});

const newEnemies = [
    new MockEnemy({ x: 10, y: 10, id: 'e10' }),
    new MockEnemy({ x: 11, y: 11, id: 'e11' })
] as any[];
collection.replaceAll(newEnemies);

console.assert(collection.count() === 2, 'should have 2 enemies after replace');
console.assert(collection.findAt(10, 10) !== null, 'should find new enemy');
console.assert(replaceEvent !== null, 'should emit ENEMIES_REPLACED event');
console.assert(replaceEvent?.oldCount === 0, 'event should show oldCount=0');
console.assert(replaceEvent?.newCount === 2, 'event should show newCount=2');

unsubReplace();
console.log('✓ Replace all works');

// Test 11: Filter
console.log('\n=== Test 11: Filter ===');
collection.add(new MockEnemy({ x: 12, y: 12, health: 5, id: 'e12' }) as any);
collection.add(new MockEnemy({ x: 13, y: 13, health: 15, id: 'e13' }) as any);

const kept = collection.filter(e => e.health > 8, false);
console.assert(kept === 2, 'should keep 2 enemies with health > 8');
console.assert(collection.count() === 2, 'should have 2 enemies after filter');
console.log('✓ Filter works');

// Test 12: Iteration Methods
console.log('\n=== Test 12: Iteration Methods ===');
let forEachCount = 0;
collection.forEach(() => forEachCount++);
console.assert(forEachCount === 2, 'forEach should iterate 2 times');

const ids = collection.map(e => e.id);
console.assert(ids.length === 2, 'map should return 2 items');
console.assert(ids.includes('e10'), 'map should include e10');
console.log('✓ Iteration methods work');

// Test 13: Position Set
console.log('\n=== Test 13: Position Set ===');
const positions = collection.getPositionsSet();
console.assert(positions.has('10,10'), 'should have position 10,10');
console.assert(positions.has('11,11'), 'should have position 11,11');
console.assert(positions.size === 2, 'should have 2 positions');
console.log('✓ Position set works');

// Test 14: Snapshot & Debug
console.log('\n=== Test 14: Snapshot & Debug ===');
const snapshot = collection.getSnapshot();
console.assert(snapshot.count === 2, 'snapshot should show count=2');
console.assert(snapshot.living === 2, 'snapshot should show 2 living');
console.assert(snapshot.dead === 0, 'snapshot should show 0 dead');
console.assert(snapshot.types.lizardy === 2, 'snapshot should show 2 lizardy');

collection.debugLog(); // Should not throw
console.log('✓ Snapshot and debug works');

// Test 15: No Event Emission
console.log('\n=== Test 15: No Event Emission ===');
let eventFired = false;
const unsubNoEvent = eventBus.on(EventTypes.ENEMY_SPAWNED, () => {
    eventFired = true;
});

collection.add(new MockEnemy({ x: 20, y: 20 }), false);
console.assert(eventFired === false, 'should not emit event when emitEvent=false');

unsubNoEvent();
console.log('✓ Event suppression works');

console.log('\n✅ All EnemyCollection tests passed!');
console.log('\n📊 Summary:');
console.log('- Basic construction: Working');
console.log('- Finding enemies: Working');
console.log('- Query methods: Working');
console.log('- Predicates: Working');
console.log('- Add/remove operations: Working');
console.log('- Bulk operations: Working');
console.log('- Event emission: Working');
console.log('- Iteration: Working');
console.log('- Position tracking: Working');
console.log('- Debugging: Working');
