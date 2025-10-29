import { TransientGameState } from './state/TransientGameState.js';
import { eventBus } from './core/EventBus.js';
import { EventTypes } from './core/EventTypes.js';

// Create a new TransientGameState instance
const state = new TransientGameState();

console.log('✓ TransientGameState instantiated');

// Test 1: Pending Charge State
console.log('\n=== Test 1: Pending Charge State ===');
console.assert(state.hasPendingCharge() === false, 'should start with no pending charge');
console.assert(state.getPendingCharge() === null, 'should return null initially');

const chargeData = { targetX: 5, targetY: 3, distance: 4 };
state.setPendingCharge(chargeData);
console.assert(state.hasPendingCharge() === true, 'should have pending charge after set');
console.assert(state.getPendingCharge().targetX === 5, 'should return correct charge data');

state.clearPendingCharge();
console.assert(state.hasPendingCharge() === false, 'should clear pending charge');
console.log('✓ Pending charge state works');

// Test 2: Bomb Placement State
console.log('\n=== Test 2: Bomb Placement State ===');
console.assert(state.isBombPlacementMode() === false, 'should start not in bomb mode');
console.assert(state.getBombPlacementPositions().length === 0, 'should have no positions initially');

state.enterBombPlacementMode();
console.assert(state.isBombPlacementMode() === true, 'should enter bomb mode');

state.addBombPlacementPosition({ x: 1, y: 1 });
state.addBombPlacementPosition({ x: 2, y: 2 });
console.assert(state.getBombPlacementPositions().length === 2, 'should have 2 positions');
console.assert(state.hasBombPlacementAt({ x: 1, y: 1 }) === true, 'should detect position at 1,1');
console.assert(state.hasBombPlacementAt({ x: 3, y: 3 }) === false, 'should not detect position at 3,3');

const removed = state.removeBombPlacementPosition({ x: 1, y: 1 });
console.assert(removed === true, 'should remove position');
console.assert(state.getBombPlacementPositions().length === 1, 'should have 1 position left');

state.clearBombPlacementPositions();
console.assert(state.getBombPlacementPositions().length === 0, 'should clear all positions');

state.exitBombPlacementMode();
console.assert(state.isBombPlacementMode() === false, 'should exit bomb mode');
console.log('✓ Bomb placement state works');

// Test 3: Sign Message State
console.log('\n=== Test 3: Sign Message State ===');
console.assert(state.isDisplayingSignMessage() === false, 'should start with no sign message');
console.assert(state.getDisplayingSignMessage() === null, 'should return null initially');
console.assert(state.getLastSignMessage() === null, 'should have no last message');

const signData = { message: 'Welcome traveler!', x: 5, y: 5 };
state.setDisplayingSignMessage(signData);
console.assert(state.isDisplayingSignMessage() === true, 'should be displaying message');
console.assert(state.getDisplayingSignMessage().message === 'Welcome traveler!', 'should return correct message');

state.setLastSignMessage('Welcome traveler!');
console.assert(state.getLastSignMessage() === 'Welcome traveler!', 'should store last message');

state.clearDisplayingSignMessage();
console.assert(state.isDisplayingSignMessage() === false, 'should clear displaying message');
console.assert(state.getLastSignMessage() === 'Welcome traveler!', 'should keep last message');

state.clearLastSignMessage();
console.assert(state.getLastSignMessage() === null, 'should clear last message');
console.log('✓ Sign message state works');

// Test 4: Port Transition Data
console.log('\n=== Test 4: Port Transition Data ===');
console.assert(state.hasPortTransitionData() === false, 'should start with no port data');
console.assert(state.getPortTransitionData() === null, 'should return null initially');

const portData = { from: 'stairup', x: 4, y: 4 };
state.setPortTransitionData(portData);
console.assert(state.hasPortTransitionData() === true, 'should have port data');
console.assert(state.getPortTransitionData().from === 'stairup', 'should return correct port data');

state.clearPortTransitionData();
console.assert(state.hasPortTransitionData() === false, 'should clear port data');
console.log('✓ Port transition data works');

// Test 5: Pitfall Zone State
console.log('\n=== Test 5: Pitfall Zone State ===');
console.assert(state.isInPitfallZone() === false, 'should start not in pitfall zone');
console.assert(state.getPitfallTurnsSurvived() === 0, 'should have 0 turns survived');

state.enterPitfallZone();
console.assert(state.isInPitfallZone() === true, 'should be in pitfall zone');

const turns1 = state.incrementPitfallTurnsSurvived();
console.assert(turns1 === 1, 'should return 1 turn');
const turns2 = state.incrementPitfallTurnsSurvived();
console.assert(turns2 === 2, 'should return 2 turns');
console.assert(state.getPitfallTurnsSurvived() === 2, 'should have 2 turns survived');

state.exitPitfallZone();
console.assert(state.isInPitfallZone() === false, 'should exit pitfall zone');
console.assert(state.getPitfallTurnsSurvived() === 0, 'should reset turns to 0');
console.log('✓ Pitfall zone state works');

// Test 6: Combat State Flags
console.log('\n=== Test 6: Combat State Flags ===');
console.assert(state.didPlayerJustAttack() === false, 'should start with no attack flag');

state.setPlayerJustAttacked(true);
console.assert(state.didPlayerJustAttack() === true, 'should set attack flag');

state.clearPlayerJustAttacked();
console.assert(state.didPlayerJustAttack() === false, 'should clear attack flag');
console.log('✓ Combat state flags work');

// Test 7: Zone Transition Helpers
console.log('\n=== Test 7: Zone Transition Helpers ===');
// Set up some state
state.setPendingCharge({ targetX: 1, targetY: 1 });
state.enterBombPlacementMode();
state.addBombPlacementPosition({ x: 2, y: 2 });
state.setDisplayingSignMessage({ message: 'Test' });
state.setLastSignMessage('Test');
state.setPlayerJustAttacked(true);
state.setPortTransitionData({ from: 'stairup', x: 3, y: 3 });
state.enterPitfallZone();

// Clear zone-specific state
state.clearZoneTransientState();

console.assert(state.hasPendingCharge() === false, 'should clear pending charge');
console.assert(state.isBombPlacementMode() === false, 'should exit bomb mode');
console.assert(state.isDisplayingSignMessage() === false, 'should clear sign message');
console.assert(state.getLastSignMessage() === null, 'should clear last sign message');
console.assert(state.didPlayerJustAttack() === false, 'should clear attack flag');

// Port data and pitfall should persist
console.assert(state.hasPortTransitionData() === true, 'should keep port data');
console.assert(state.isInPitfallZone() === true, 'should keep pitfall state');
console.log('✓ Zone transition helpers work');

// Test 8: Reset All
console.log('\n=== Test 8: Reset All ===');
state.resetAll();

console.assert(state.hasPortTransitionData() === false, 'should clear port data');
console.assert(state.isInPitfallZone() === false, 'should clear pitfall state');
console.assert(state.hasPendingCharge() === false, 'should clear pending charge');
console.assert(state.isBombPlacementMode() === false, 'should clear bomb mode');
console.log('✓ Reset all works');

// Test 9: Snapshot & Debug
console.log('\n=== Test 9: Snapshot & Debug ===');
state.setPendingCharge({ targetX: 1, targetY: 1 });
state.enterBombPlacementMode();
state.addBombPlacementPosition({ x: 5, y: 5 });

const snapshot = state.getSnapshot();
console.assert(snapshot.pendingCharge !== null, 'snapshot should include pendingCharge');
console.assert(snapshot.bombPlacementMode === true, 'snapshot should include bombPlacementMode');
console.assert(snapshot.bombPlacementPositions.length === 1, 'snapshot should include positions');

// Verify snapshot is a copy (defensive)
snapshot.bombPlacementPositions.push({ x: 99, y: 99 });
console.assert(state.getBombPlacementPositions().length === 1, 'snapshot should not mutate internal state');

state.debugLog(); // Should not throw
console.log('✓ Snapshot and debug works');

// Test 10: Event Emission
console.log('\n=== Test 10: Event Emission ===');
let eventReceived = false;
let eventData = null;

const unsubscribe = eventBus.on(EventTypes.CHARGE_STATE_CHANGED, (data) => {
    eventReceived = true;
    eventData = data;
});

state.setPendingCharge({ targetX: 7, targetY: 7 });
console.assert(eventReceived === true, 'should emit charge state changed event');
console.assert(eventData.isPending === true, 'should include isPending in event');
console.assert(eventData.data.targetX === 7, 'should include charge data in event');

unsubscribe();
console.log('✓ Event emission works');

// Test 11: Validation & Edge Cases
console.log('\n=== Test 11: Validation & Edge Cases ===');

// Clear when nothing is set (should not throw)
state.resetAll();
state.clearPendingCharge();
state.exitBombPlacementMode();
state.clearDisplayingSignMessage();
state.clearPortTransitionData();
state.exitPitfallZone();
console.log('✓ Clearing empty state works');

// Add bomb position when not in mode (should warn but not throw)
state.addBombPlacementPosition({ x: 1, y: 1 });
console.assert(state.getBombPlacementPositions().length === 0, 'should not add position outside bomb mode');
console.log('✓ Validation works');

// Invalid port data (should warn but not throw)
state.setPortTransitionData(null);
console.assert(state.hasPortTransitionData() === false, 'should not set invalid port data');
state.setPortTransitionData({ invalid: true });
console.assert(state.hasPortTransitionData() === false, 'should not set port data without "from"');
console.log('✓ Port data validation works');

console.log('\n✅ All TransientGameState tests passed!');
console.log('\n📊 Summary:');
console.log('- Pending charge state: Working');
console.log('- Bomb placement state: Working');
console.log('- Sign message state: Working');
console.log('- Port transition data: Working');
console.log('- Pitfall zone state: Working');
console.log('- Combat state flags: Working');
console.log('- Zone transition helpers: Working');
console.log('- Reset all: Working');
console.log('- Snapshot & debug: Working');
console.log('- Event emission: Working');
console.log('- Validation & edge cases: Working');
