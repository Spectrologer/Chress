import { SoundManager } from '../core/SoundManager.js';

describe('SoundManager SFX playback', () => {
    let sm;

    beforeEach(() => {
        global.Audio = class {
            constructor() { this.src = ''; this.volume = 1; }
            cloneNode() { return new global.Audio(); }
            play() { return Promise.resolve(); }
        };
        global.window = global.window || {};
        sm = new SoundManager();
    });

    afterEach(() => {
        delete global.Audio;
        delete global.window;
    });

    test('playSound uses file-backed audio when registered', () => {
        // Add a mock sound asset and verify playSound attempts to clone/play it
        sm.addSound('test-sfx', 'sfx/noises/test.wav');
        // The stored audio instance should exist
        expect(sm.sounds['test-sfx']).toBeDefined();
        // Spy on cloneNode of the stored audio instance
        const stored = sm.sounds['test-sfx'];
        stored.cloneNode = jest.fn(() => ({ play: () => Promise.resolve(), volume: stored.volume }));
        sm.playSound('test-sfx');
        expect(stored.cloneNode).toHaveBeenCalled();
    });

    test('playSound falls back to procedural when unknown', () => {
        // Spy on playProceduralSound
        sm.playProceduralSound = jest.fn();
        sm.playSound('nonexistent_sound');
        expect(sm.playProceduralSound).toHaveBeenCalledWith('nonexistent_sound');
    });
});
