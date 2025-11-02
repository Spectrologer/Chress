import { SoundManager } from '@core/SoundManager.js';

describe('SoundManager music selection and continuity', () => {
    let sm;

    beforeEach(() => {
        // Minimal mock of Web Audio and HTMLAudio element behavior
        global.Audio = class {
            constructor() { this.loop = false; this.src = ''; this.volume = 1; this.crossOrigin = null; }
            play() { return Promise.resolve(); }
            pause() {}
        };

        class MockAudioContext {
            constructor() { this.currentTime = 0; this.destination = {}; }
            createMediaElementSource() { return { connect: () => ({ connect: () => {} }) }; }
            createGain() { return { gain: { value: 0, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, cancelScheduledValues: () => {} } }; }
        }
        global.AudioContext = MockAudioContext;
        global.window = global.window || {};

        sm = new SoundManager();
    });

    afterEach(() => {
        delete global.Audio;
        delete global.AudioContext;
        delete global.window;
    });

    test('setMusicForZone chooses tension for surface', () => {
        // Spy on playBackgroundContinuous
        sm.playBackgroundContinuous = jest.fn();
        sm.setMusicForZone({ dimension: 0 });
        expect(sm.playBackgroundContinuous).toHaveBeenCalledWith('sfx/music/tension.ogg', expect.any(Number), expect.any(Number));
        // Expect default volume to be the quieter value
        const vol = sm.playBackgroundContinuous.mock.calls[0][1];
        expect(vol).toBeCloseTo(0.0625);
    });

    test('setMusicForZone chooses peaceful for interior and cave for underground', () => {
        sm.playBackgroundContinuous = jest.fn();
        sm.setMusicForZone({ dimension: 1 });
        expect(sm.playBackgroundContinuous).toHaveBeenCalledWith('sfx/music/peaceful.ogg', expect.any(Number), expect.any(Number));

        sm.playBackgroundContinuous.mockClear();
        sm.setMusicForZone({ dimension: 2 });
        expect(sm.playBackgroundContinuous).toHaveBeenCalledWith('sfx/music/cave.ogg', expect.any(Number), expect.any(Number));
    });
});
