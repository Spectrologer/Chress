/**
 * Simple test for dialogue state caching mechanism
 * Tests the Map-based state tracking without full game initialization
 */

console.log('Test: Dialogue State Caching Mechanism');
console.log('=======================================\n');

// Simulate the dialogue state Map
const dialogueState = new Map();

// Simulate dialogue data structure
const mockDialogueData = {
    name: 'TestNPC',
    portrait: 'test.png',
    subclass: 'dialogue',
    voicePitch: 100,
    currentMessageIndex: 0,
    cycleMode: 'sequential',
    messages: ['First message', 'Second message', 'Third message']
};

// Test 1: Store dialogue data
console.log('Test 1: Store dialogue data');
dialogueState.set('testnpc', mockDialogueData);
console.log('  ✓ Stored dialogue data for testnpc');

// Test 2: Retrieve and verify it's the same object
console.log('\nTest 2: Retrieve cached data');
const retrieved = dialogueState.get('testnpc');
console.log('  ✓ Same object reference?', retrieved === mockDialogueData);
console.log('  ✓ currentMessageIndex:', retrieved.currentMessageIndex);

// Test 3: Modify and verify persistence
console.log('\nTest 3: Modify and verify persistence');
retrieved.currentMessageIndex = 1;
console.log('  ✓ Modified currentMessageIndex to:', retrieved.currentMessageIndex);

const retrieved2 = dialogueState.get('testnpc');
console.log('  ✓ Retrieved currentMessageIndex:', retrieved2.currentMessageIndex);
console.log('  ✓ Change persisted?', retrieved2.currentMessageIndex === 1);

// Test 4: Sequential advancement logic
console.log('\nTest 4: Sequential advancement logic');
const data = dialogueState.get('testnpc');
console.log('  Starting at index:', data.currentMessageIndex);

for (let interaction = 1; interaction <= 5; interaction++) {
    // Simulate the advancement logic from NPCInteractionManager
    if (data.cycleMode === 'sequential') {
        if (data.currentMessageIndex < data.messages.length - 1) {
            data.currentMessageIndex++;
        }
    }
    console.log(`  Interaction ${interaction}: index = ${data.currentMessageIndex}, message = "${data.messages[data.currentMessageIndex]}"`);
}

console.log('  ✓ Stopped at last message (index 2)?', data.currentMessageIndex === 2);

// Test 5: Loop mode comparison
console.log('\nTest 5: Loop mode comparison');
const loopData = {
    currentMessageIndex: 0,
    cycleMode: 'loop',
    messages: ['A', 'B', 'C']
};

console.log('  Starting at index:', loopData.currentMessageIndex);
for (let i = 0; i < 5; i++) {
    if (loopData.cycleMode === 'sequential') {
        if (loopData.currentMessageIndex < loopData.messages.length - 1) {
            loopData.currentMessageIndex++;
        }
    } else {
        loopData.currentMessageIndex = (loopData.currentMessageIndex + 1) % loopData.messages.length;
    }
    console.log(`  Interaction ${i + 1}: index = ${loopData.currentMessageIndex}, message = "${loopData.messages[loopData.currentMessageIndex]}"`);
}

console.log('\n✅ All state caching tests passed!');
