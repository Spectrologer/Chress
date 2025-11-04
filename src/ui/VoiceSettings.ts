// VoiceSettings.ts
// Helpers for voice settings, audio context, and typing SFX for MessageManager
import { VOICE_CONSTANTS } from '@core/constants/audio';

interface VoiceSettings {
    name?: string;
    base?: number;
    wave1?: OscillatorType;
    wave2?: OscillatorType;
    bandMul?: number;
    peak?: number;
    harmonicRatio?: number;
    detuneRange?: number;
    pan?: number;
    attack?: number;
    decay?: number;
    masterGain?: number;
}

interface DerivedVoiceSettings {
    name: string;
    base: number;
    wave1: OscillatorType;
    wave2: OscillatorType;
    bandMul: number;
    peak: number;
    harmonicRatio: number;
    detuneRange: number;
    pan: number;
    attack: number;
    decay: number;
    masterGain: number;
}

interface MessageManager {
    typewriterSfxEnabled?: boolean;
    game?: any;
    _typingAudioContext?: AudioContext;
    _typingMasterGain?: GainNode;
    _voiceCache?: Map<string, DerivedVoiceSettings>;
}

// Generate deterministic voice/settings based on the character name.
export function getVoiceSettingsForName(name: string | null, customPitch?: number): VoiceSettings | null {
    if (!name) return null;
    const n = (name || '').toString();
    // simple hash: sum of char codes
    let hash = 0;
    for (let i = 0; i < n.length; i++) {
        hash = (hash * 31 + n.charCodeAt(i)) >>> 0;
    }
    const lower = n.trim().toLowerCase();

    // Use custom pitch if provided, otherwise use character-specific defaults
    if (lower === 'crayn' || lower.indexOf('crayn') !== -1) {
        return {
            name: 'Crayn',
            base: customPitch !== undefined ? customPitch : 120,
            wave1: 'sawtooth',
            wave2: 'sine',
            bandMul: 1.6,
            peak: 0.18
        };
    }
    if (lower.indexOf('merchant') !== -1 || lower.indexOf('shop') !== -1 || lower.indexOf('vendor') !== -1) {
        const base = customPitch !== undefined ? customPitch : (VOICE_CONSTANTS.MERCHANT_BASE_MIN + (hash % VOICE_CONSTANTS.MERCHANT_BASE_RANGE));
        return {
            name: n,
            base: base,
            wave1: (['sawtooth','triangle','square','sine'][hash % 4] as OscillatorType),
            wave2: (['sine','triangle','sawtooth','square'][(hash >> 2) % 4] as OscillatorType),
            bandMul: VOICE_CONSTANTS.MERCHANT_BAND_MUL_BASE + ((hash % 20) / 100),
            peak: VOICE_CONSTANTS.MERCHANT_PEAK_BASE + ((hash % 20) / 200)
        };
    }
    const base = customPitch !== undefined ? customPitch : (VOICE_CONSTANTS.GENERIC_BASE_MIN + (hash % VOICE_CONSTANTS.GENERIC_BASE_RANGE));
    const waveChoices: OscillatorType[] = ['sine','triangle','sawtooth','square'];
    const wave1 = waveChoices[hash % waveChoices.length];
    const wave2 = waveChoices[(hash >> 3) % waveChoices.length];
    const peak = VOICE_CONSTANTS.VOICE_PEAK_BASE + ( (hash % VOICE_CONSTANTS.VOICE_HASH_MODULO) / VOICE_CONSTANTS.VOICE_PEAK_DIVISOR );
    const bandMul = 1.4 + ((hash % 30) / 100);
    return {
        name: n,
        base: base,
        wave1: wave1,
        wave2: wave2,
        bandMul: bandMul,
        peak: peak
    };
}

// Ensure we have an AudioContext and a small master gain for typing blips.
export function ensureTypingAudio(manager: MessageManager): void {
    // Try to reuse existing audio context from sound manager
    if (!manager._typingAudioContext) {
        if (manager.game?.soundManager?.audioContext) {
            manager._typingAudioContext = manager.game.soundManager.audioContext;
        } else if (manager.game?.soundManager?.resumeAudioContext) {
            manager.game.soundManager.resumeAudioContext();
            if (manager.game.soundManager.audioContext) {
                manager._typingAudioContext = manager.game.soundManager.audioContext;
            }
        }
    }

    // Create new context if needed (browser compatibility - may fail in some contexts)
    if (!manager._typingAudioContext && typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) {
        try {
            manager._typingAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
            // Audio context creation can fail - ignore silently
        }
    }

    // Set up master gain node (may fail if context is invalid)
    if (manager._typingAudioContext && !manager._typingMasterGain) {
        try {
            manager._typingMasterGain = manager._typingAudioContext.createGain();
            manager._typingMasterGain.gain.value = 1.6;
            manager._typingMasterGain.connect(manager._typingAudioContext.destination);
        } catch (e) {
            manager._typingMasterGain = undefined;
        }
    }
}

// Play a short, characterful blip for per-letter typing sound.
// Accepts optional voiceSettings (from getVoiceSettingsForName) to tune pitch/timbre.
export function playTypingBlip(manager: MessageManager, voiceSettings?: VoiceSettings | null): void {
    if (!manager.typewriterSfxEnabled) {
        return;
    }
    if (manager.game?.soundManager?.sfxEnabled === false) {
        return;
    }

    ensureTypingAudio(manager);
    const ctx = manager._typingAudioContext;
    const master = manager._typingMasterGain;
    if (!ctx || !master) return;

    // Web Audio API operations can fail in various browser contexts
    try {
        const now = ctx.currentTime;
        const o1 = ctx.createOscillator();
        const o2 = ctx.createOscillator();
        const merger = ctx.createGain();
        const band = ctx.createBiquadFilter();
        const g = ctx.createGain();
        const vs = voiceSettings || {};
        let derived: DerivedVoiceSettings | null = null;

        // Try to retrieve cached voice settings
        if (vs?.name && manager._voiceCache?.has(vs.name)) {
            derived = manager._voiceCache.get(vs.name) || null;
        }
        if (!derived) {
            const seedStr = (vs && vs.name) ? vs.name : ('' + (vs.base || Math.floor(Math.random()*1000)));
            let seed = 0;
            for (let i = 0; i < seedStr.length; i++) seed = (seed * 131 + seedStr.charCodeAt(i)) >>> 0;
            const pick = (arr: OscillatorType[]): OscillatorType => arr[seed % arr.length];
            const rand = (min: number, max: number): number => {
                seed = (seed * 1664525 + 1013904223) >>> 0;
                const r = (seed % 1000) / 1000;
                return min + r * (max - min);
            };
            const waveChoices: OscillatorType[] = ['sine','triangle','sawtooth','square'];
            const base = (typeof vs.base === 'number') ? vs.base : Math.round(70 + (seed % 200));
            derived = {
                name: (vs && vs.name) ? vs.name : 'unknown',
                base: base,
                wave1: vs.wave1 || pick(waveChoices),
                wave2: vs.wave2 || pick(waveChoices),
                bandMul: (typeof vs.bandMul === 'number') ? vs.bandMul : (1.2 + rand(0, 1.2)),
                peak: (typeof vs.peak === 'number') ? vs.peak : (0.06 + rand(0, 0.26)),
                harmonicRatio: (typeof vs.harmonicRatio === 'number') ? vs.harmonicRatio : (1.7 + rand(-0.12, 0.4)),
                detuneRange: (typeof vs.detuneRange === 'number') ? vs.detuneRange : Math.max(6, Math.round(rand(6, 18))),
                pan: typeof vs.pan === 'number' ? vs.pan : (rand(-0.5, 0.5)),
                attack: (typeof vs.attack === 'number') ? vs.attack : (0.004 + rand(0, 0.008)),
                decay: (typeof vs.decay === 'number') ? vs.decay : (0.09 + rand(0, 0.06)),
                masterGain: (typeof vs.masterGain === 'number') ? vs.masterGain : (1.0 + rand(-0.25, 0.6))
            };
            // Cache the derived voice settings for reuse
            if (derived?.name && manager._voiceCache) {
                manager._voiceCache.set(derived.name, derived);
            }
        }

        const wave1 = derived.wave1;
        const wave2 = derived.wave2;
        const base = derived.base;
        const harmonicRatio = derived.harmonicRatio || 1.9;
        const detune = (Math.random() * derived.detuneRange) - (derived.detuneRange/2);
        const bandMul = derived.bandMul;
        const peak = derived.peak;

        // Configure oscillators
        o1.type = wave1;
        o2.type = wave2;
        o1.frequency.setValueAtTime(base, now);
        o2.frequency.setValueAtTime(base * 1.9 + detune, now);

        // Configure bandpass filter
        band.type = 'bandpass';
        band.frequency.setValueAtTime(base * bandMul + (Math.random() * 18 - 9), now);
        band.Q.setValueAtTime(3 + (Math.random() * 3), now);

        // Configure envelope
        g.gain.setValueAtTime(0.001 + (peak * 0.002), now);
        g.gain.linearRampToValueAtTime((peak) * derived.masterGain, now + derived.attack);
        g.gain.exponentialRampToValueAtTime(0.00005, now + derived.decay);

        // Connect audio graph
        o1.connect(merger);
        o2.connect(merger);
        merger.connect(band);
        band.connect(g);

        // Add stereo panning if supported
        let finalNode: AudioNode = g;
        if (ctx.createStereoPanner) {
            const p = ctx.createStereoPanner();
            p.pan.setValueAtTime(derived?.pan ?? 0, now);
            g.connect(p);
            finalNode = p;
        }
        finalNode.connect(master);

        // Start and stop oscillators
        o1.start(now);
        o2.start(now);
        o1.stop(now + Math.max(0.06, derived.decay * 0.8));
        o2.stop(now + Math.max(0.06, derived.decay * 0.8));

        // Occasional pitch variation
        if (Math.random() < 0.03) {
            o1.frequency.setValueAtTime(base * (0.85 + Math.random() * 0.3), now + 0.02);
        }
    } catch (e) {
        // Web Audio API can fail - silently ignore
    }
}
