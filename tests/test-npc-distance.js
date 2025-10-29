// Test NPC distance checking logic
import { TransientGameState } from './state/TransientGameState.js';

console.log('=== Testing NPC Distance Logic ===\n');

const state = new TransientGameState();

// Test 1: Set NPC position
console.log('Test 1: Setting NPC position at (5, 5)');
state.setCurrentNPCPosition({ x: 5, y: 5 });
console.log('Current NPC position:', state.getCurrentNPCPosition());
console.log('✓ NPC position set\n');

// Test 2: Player adjacent (same position should be false)
console.log('Test 2: Player at same position (5, 5) - should return true (no distance check)');
let result = state.isPlayerAdjacentToNPC({ x: 5, y: 5 });
console.log('Result:', result, result ? '✓ PASS' : '✗ FAIL');
console.log();

// Test 3: Player adjacent orthogonally
console.log('Test 3: Player adjacent orthogonally (6, 5) - should return true');
result = state.isPlayerAdjacentToNPC({ x: 6, y: 5 });
console.log('Result:', result, result ? '✓ PASS' : '✗ FAIL');
console.log();

// Test 4: Player adjacent diagonally
console.log('Test 4: Player adjacent diagonally (6, 6) - should return true');
result = state.isPlayerAdjacentToNPC({ x: 6, y: 6 });
console.log('Result:', result, result ? '✓ PASS' : '✗ FAIL');
console.log();

// Test 5: Player 2 tiles away
console.log('Test 5: Player 2 tiles away (7, 5) - should return false');
result = state.isPlayerAdjacentToNPC({ x: 7, y: 5 });
console.log('Result:', result, !result ? '✓ PASS (correctly not adjacent)' : '✗ FAIL');
console.log();

// Test 6: Player far away
console.log('Test 6: Player far away (10, 10) - should return false');
result = state.isPlayerAdjacentToNPC({ x: 10, y: 10 });
console.log('Result:', result, !result ? '✓ PASS (correctly not adjacent)' : '✗ FAIL');
console.log();

// Test 7: Clear NPC position
console.log('Test 7: Clear NPC position');
state.clearCurrentNPCPosition();
console.log('Current NPC position:', state.getCurrentNPCPosition());
console.log('✓ NPC position cleared\n');

// Test 8: No NPC tracked (should always return true)
console.log('Test 8: Check adjacency with no NPC tracked - should return true');
result = state.isPlayerAdjacentToNPC({ x: 100, y: 100 });
console.log('Result:', result, result ? '✓ PASS (no NPC to check against)' : '✗ FAIL');
console.log();

console.log('=== All Tests Complete ===');
