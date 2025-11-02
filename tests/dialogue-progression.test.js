/**
 * Test for NPC dialogue progression with sequential cycle mode
 * Verifies that dialogue state persists across multiple interactions
 */

import { Sign } from '../ui/Sign.js';
import * as NPCLoader from '@core/NPCLoader.js';

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

describe('NPC Dialogue Progression with Sequential Mode', () => {
    let mockGame;
    let getNPCCharacterDataSpy;

    beforeEach(() => {
        mockGame = { dialogueState: new Map() };

        // Mock getNPCCharacterData using vi.spyOn for Vitest compatibility
        getNPCCharacterDataSpy = vi.spyOn(NPCLoader, 'getNPCCharacterData')
            .mockReturnValue(mockCharacterData);
    });

    afterEach(() => {
        // Restore original function
        getNPCCharacterDataSpy.mockRestore();
    });

    test('Initial dialogue data creation', () => {
        const data1 = Sign.getDialogueNpcData('testnpc', mockGame);

        expect(data1.currentMessageIndex).toBe(0);
        expect(data1.cycleMode).toBe('sequential');
        expect(data1.messages.length).toBe(3);
    });

    test('State persistence after advancing', () => {
        const data1 = Sign.getDialogueNpcData('testnpc', mockGame);

        // Advance the dialogue
        if (data1.cycleMode === 'sequential' && data1.currentMessageIndex < data1.messages.length - 1) {
            data1.currentMessageIndex++;
        }

        expect(data1.currentMessageIndex).toBe(1);

        // Get the dialogue data again
        const data2 = Sign.getDialogueNpcData('testnpc', mockGame);

        expect(data2.currentMessageIndex).toBe(1);
        expect(data1).toBe(data2); // Same object reference
    });

    test('Advancing through all messages', () => {
        const data = Sign.getDialogueNpcData('testnpc', mockGame);

        // Advance through all messages (5 times)
        for (let i = 0; i < 5; i++) {
            if (data.cycleMode === 'sequential' && data.currentMessageIndex < data.messages.length - 1) {
                data.currentMessageIndex++;
            }
        }

        // Should stop at last message (index 2)
        expect(data.currentMessageIndex).toBe(2);
    });

    test('Different NPC has independent state', () => {
        const data1 = Sign.getDialogueNpcData('testnpc', mockGame);

        // Advance testnpc to index 2
        data1.currentMessageIndex = 2;

        // Create another NPC
        const data2 = Sign.getDialogueNpcData('anothernpc', mockGame);

        expect(data2.currentMessageIndex).toBe(0); // New NPC starts at 0
        expect(data1.currentMessageIndex).toBe(2); // Original NPC remains at 2
    });
});
