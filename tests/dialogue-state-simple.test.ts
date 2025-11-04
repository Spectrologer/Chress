/**
 * Test for dialogue state caching mechanism
 * Tests the Map-based state tracking without full game initialization
 */

describe('Dialogue State Caching', () => {
    let dialogueState: Map<string, any>;
    let mockDialogueData: any;

    beforeEach(() => {
        // Simulate the dialogue state Map
        dialogueState = new Map();

        // Simulate dialogue data structure
        mockDialogueData = {
            name: 'TestNPC',
            portrait: 'test.png',
            subclass: 'dialogue',
            voicePitch: 100,
            currentMessageIndex: 0,
            cycleMode: 'sequential',
            messages: ['First message', 'Second message', 'Third message']
        };
    });

    test('stores dialogue data', () => {
        dialogueState.set('testnpc', mockDialogueData);
        expect(dialogueState.has('testnpc')).toBe(true);
    });

    test('retrieves cached data with same object reference', () => {
        dialogueState.set('testnpc', mockDialogueData);
        const retrieved = dialogueState.get('testnpc');

        expect(retrieved).toBe(mockDialogueData);
        expect(retrieved.currentMessageIndex).toBe(0);
    });

    test('modifies and persists changes', () => {
        dialogueState.set('testnpc', mockDialogueData);
        const retrieved = dialogueState.get('testnpc');

        retrieved.currentMessageIndex = 1;

        const retrieved2 = dialogueState.get('testnpc');
        expect(retrieved2.currentMessageIndex).toBe(1);
    });

    test('sequential advancement logic stops at last message', () => {
        dialogueState.set('testnpc', mockDialogueData);
        const data = dialogueState.get('testnpc');

        // Start at index 0, advance through interactions
        for (let interaction = 1; interaction <= 5; interaction++) {
            if (data.cycleMode === 'sequential') {
                if (data.currentMessageIndex < data.messages.length - 1) {
                    data.currentMessageIndex++;
                }
            }
        }

        // Should stop at index 2 (last message)
        expect(data.currentMessageIndex).toBe(2);
        expect(data.messages[data.currentMessageIndex]).toBe('Third message');
    });

    test('sequential mode advances through messages correctly', () => {
        dialogueState.set('testnpc', mockDialogueData);
        const data = dialogueState.get('testnpc');

        expect(data.currentMessageIndex).toBe(0);
        expect(data.messages[data.currentMessageIndex]).toBe('First message');

        // First advancement
        if (data.currentMessageIndex < data.messages.length - 1) {
            data.currentMessageIndex++;
        }
        expect(data.currentMessageIndex).toBe(1);
        expect(data.messages[data.currentMessageIndex]).toBe('Second message');

        // Second advancement
        if (data.currentMessageIndex < data.messages.length - 1) {
            data.currentMessageIndex++;
        }
        expect(data.currentMessageIndex).toBe(2);
        expect(data.messages[data.currentMessageIndex]).toBe('Third message');
    });

    test('loop mode cycles through messages', () => {
        const loopData = {
            currentMessageIndex: 0,
            cycleMode: 'loop',
            messages: ['A', 'B', 'C']
        };

        const expectedSequence = [
            { index: 1, message: 'B' },
            { index: 2, message: 'C' },
            { index: 0, message: 'A' },
            { index: 1, message: 'B' },
            { index: 2, message: 'C' }
        ];

        for (let i = 0; i < 5; i++) {
            loopData.currentMessageIndex = (loopData.currentMessageIndex + 1) % loopData.messages.length;
            expect(loopData.currentMessageIndex).toBe(expectedSequence[i].index);
            expect(loopData.messages[loopData.currentMessageIndex]).toBe(expectedSequence[i].message);
        }
    });
});
