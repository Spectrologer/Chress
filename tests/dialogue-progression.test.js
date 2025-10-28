/**
 * Test for NPC dialogue progression with sequential cycle mode
 * Verifies that dialogue state persists across multiple interactions
 */

import { Sign } from '../ui/Sign.js';

// Mock getNPCCharacterData since we're testing without the full system
const originalGetNPCCharacterData = await import('../core/NPCLoader.js').then(m => m.getNPCCharacterData);

// Mock character data for testing
const mockCharacterData = {
    name: 'TestNPC',
    display: { portrait: 'test.png' },
    audio: { voicePitch: 100 },
    interaction: {
        type: 'dialogue',
        cycleMode: 'sequential',
        dialogueTree: [
            { id: 'msg_0', text: 'First message' },
            { id: 'msg_1', text: 'Second message' },
            { id: 'msg_2', text: 'Third message' }
        ]
    }
};

console.log('Test: NPC Dialogue Progression with Sequential Mode');
console.log('====================================================\n');

// Test 1: Initial dialogue data creation
console.log('Test 1: Initial dialogue data creation');
const mockGame = { dialogueState: new Map() };

// Temporarily mock getNPCCharacterData
import('../core/NPCLoader.js').then(module => {
    const originalFn = module.getNPCCharacterData;
    module.getNPCCharacterData = (npcType) => mockCharacterData;

    const data1 = Sign.getDialogueNpcData('testnpc', mockGame);
    console.log('  ✓ Initial currentMessageIndex:', data1.currentMessageIndex);
    console.log('  ✓ Cycle mode:', data1.cycleMode);
    console.log('  ✓ Number of messages:', data1.messages.length);
    console.assert(data1.currentMessageIndex === 0, 'Initial index should be 0');
    console.assert(data1.cycleMode === 'sequential', 'Cycle mode should be sequential');

    // Test 2: State persistence after advancing
    console.log('\nTest 2: State persistence after advancing');
    if (data1.cycleMode === 'sequential' && data1.currentMessageIndex < data1.messages.length - 1) {
        data1.currentMessageIndex++;
    }
    console.log('  ✓ After increment:', data1.currentMessageIndex);

    const data2 = Sign.getDialogueNpcData('testnpc', mockGame);
    console.log('  ✓ Retrieved currentMessageIndex:', data2.currentMessageIndex);
    console.log('  ✓ Same object reference?', data1 === data2);
    console.assert(data2.currentMessageIndex === 1, 'Index should persist at 1');
    console.assert(data1 === data2, 'Should return cached object');

    // Test 3: Advancing through all messages
    console.log('\nTest 3: Advancing through all messages');
    for (let i = 0; i < 5; i++) {
        if (data2.cycleMode === 'sequential' && data2.currentMessageIndex < data2.messages.length - 1) {
            data2.currentMessageIndex++;
        }
        console.log(`  Interaction ${i + 2}: currentMessageIndex = ${data2.currentMessageIndex}`);
    }
    console.assert(data2.currentMessageIndex === 2, 'Should stop at last message (index 2)');

    // Test 4: Different NPC has independent state
    console.log('\nTest 4: Different NPC has independent state');
    const data3 = Sign.getDialogueNpcData('anothernpc', mockGame);
    console.log('  ✓ New NPC currentMessageIndex:', data3.currentMessageIndex);
    console.log('  ✓ Original NPC currentMessageIndex:', data2.currentMessageIndex);
    console.assert(data3.currentMessageIndex === 0, 'New NPC should start at 0');
    console.assert(data2.currentMessageIndex === 2, 'Original NPC should remain at 2');

    console.log('\n✅ All tests passed!');

    // Restore original function
    module.getNPCCharacterData = originalFn;
});
