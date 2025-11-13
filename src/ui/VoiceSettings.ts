// VoiceSettings.ts
// Helpers for voice settings, audio context, and typing SFX for MessageManager
import { VOICE_CONSTANTS } from '@core/constants/audio';
import { getVoicePatternForCharacter, type VoicePatternConfig } from '@core/sound/VoicePatterns';
import { getNPCCharacterData } from '@core/NPCLoader';

export interface StrudelPatternConfig {
    enabled: boolean;
    type: 'melodic' | 'percussive';
    notes: string[]; // Strudel note names like "e5", "g5", "c6"
    sound: string; // Strudel sound name like "gm_flute", "gm_glockenspiel"
    gain?: number;
    room?: number;
    lpf?: number;
    attack?: number;
    decay?: number;
    rhythmVariation?: number[];
}

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
    // New: Melodic pattern support
    melodicPattern?: VoicePatternConfig;
    patternIndex?: number; // Current position in pattern
    // New: Strudel pattern support
    strudelPattern?: StrudelPatternConfig;
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
    // New: Melodic pattern support
    melodicPattern?: VoicePatternConfig;
    patternIndex: number; // Current position in pattern
    // New: Strudel pattern support
    strudelPattern?: StrudelPatternConfig;
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
    const lower = n.trim().toLowerCase();

    // First, check if character JSON has a voice pattern
    // Try with original name, then with normalized version (remove special chars for display names)
    let characterData = getNPCCharacterData(lower);
    if (!characterData) {
        // Try normalized version (e.g., "axe-o-lot'l" -> "axelotl")
        const normalized = lower.replace(/[^a-z]/g, '');
        characterData = getNPCCharacterData(normalized);
    }

    // Check for Strudel pattern first (highest priority)
    if (characterData?.audio?.strudelPattern?.enabled) {
        const strudelPattern = characterData.audio.strudelPattern;
        return {
            name: n,
            strudelPattern: strudelPattern,
            patternIndex: 0
        };
    }

    if (characterData?.audio?.voicePattern) {
        const jsonPattern = characterData.audio.voicePattern;
        // Convert JSON pattern to VoicePatternConfig
        const pattern: VoicePatternConfig = {
            id: lower,
            name: n,
            description: `Voice pattern for ${n}`,
            notes: jsonPattern.notes,
            wave1: (jsonPattern.wave1 || 'triangle') as OscillatorType,
            wave2: (jsonPattern.wave2 || 'sine') as OscillatorType,
            rhythmVariation: jsonPattern.rhythmVariation,
            gain: jsonPattern.gain,
            attack: jsonPattern.attack,
            decay: jsonPattern.decay
        };
        return {
            name: n,
            melodicPattern: pattern,
            patternIndex: 0
        };
    }

    // Second, check if character has a hardcoded melodic pattern
    const melodicPattern = getVoicePatternForCharacter(lower);
    if (melodicPattern) {
        // Return settings that indicate this character uses a melodic pattern
        return {
            name: n,
            melodicPattern: melodicPattern,
            patternIndex: 0
        };
    }

    // simple hash: sum of char codes (for non-melodic characters)
    let hash = 0;
    for (let i = 0; i < n.length; i++) {
        hash = (hash * 31 + n.charCodeAt(i)) >>> 0;
    }

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

// Play a Strudel-based blip - fallback to Web Audio API with note-based synthesis
function playStrudelBlip(vs: VoiceSettings, manager: MessageManager): void {
    const pattern = vs.strudelPattern;
    if (!pattern || !pattern.enabled) return;

    // For now, convert Strudel pattern notes to frequencies and use Web Audio API
    // This avoids the complexity of manual Strudel hap triggering
    ensureTypingAudio(manager);
    const ctx = manager._typingAudioContext;
    const master = manager._typingMasterGain;
    if (!ctx || !master) return;

    try {
        // Get or initialize cached voice settings for pattern tracking
        let derived: DerivedVoiceSettings | null = null;
        if (vs.name && manager._voiceCache?.has(vs.name)) {
            derived = manager._voiceCache.get(vs.name) || null;
        }

        if (!derived) {
            // Initialize pattern index
            derived = {
                name: vs.name || 'unknown',
                base: 440,
                wave1: 'sine',
                wave2: 'sine',
                bandMul: 1.0,
                peak: 0.2,
                harmonicRatio: 1.0,
                detuneRange: 0,
                pan: 0,
                attack: pattern.attack || 0.005,
                decay: pattern.decay || 0.08,
                masterGain: 1.0,
                strudelPattern: pattern,
                patternIndex: 0
            };
            if (derived.name && manager._voiceCache) {
                manager._voiceCache.set(derived.name, derived);
            }
        }

        const now = ctx.currentTime;
        const patternIndex = derived.patternIndex;

        // Convert note string to frequency (simple mapping for common notes)
        const currentNote = pattern.notes[patternIndex % pattern.notes.length];
        const freq = noteToFrequency(currentNote);
        const rhythmMult = pattern.rhythmVariation
            ? pattern.rhythmVariation[patternIndex % pattern.rhythmVariation.length]
            : 1.0;

        // Create a simple synth voice based on the pattern type
        const o1 = ctx.createOscillator();
        const g = ctx.createGain();

        // Use triangle wave for flute-like sounds, sine for others
        o1.type = pattern.type === 'melodic' ? 'triangle' : 'sine';
        o1.frequency.setValueAtTime(freq, now);

        // Configure envelope with rhythm variation
        const attack = (pattern.attack || 0.005) * rhythmMult;
        const decay = (pattern.decay || 0.08) * rhythmMult;
        const gain = (pattern.gain || 0.4) * rhythmMult;

        g.gain.setValueAtTime(0.001, now);
        g.gain.linearRampToValueAtTime(gain, now + attack);
        g.gain.exponentialRampToValueAtTime(0.00005, now + decay);

        // Connect audio graph
        o1.connect(g);
        g.connect(master);

        // Start and stop oscillator
        o1.start(now);
        o1.stop(now + Math.max(0.06, decay * 0.9));

        // Advance pattern index for next blip
        derived.patternIndex = (patternIndex + 1) % pattern.notes.length;
        if (manager._voiceCache && derived.name) {
            manager._voiceCache.set(derived.name, derived);
        }
    } catch (e) {
        // Web Audio API can fail - silently ignore
    }
}

// Helper function to convert note strings like "e5", "g5" to frequencies
function noteToFrequency(note: string): number {
    const noteMap: { [key: string]: number } = {
        'c': 0, 'd': 2, 'e': 4, 'f': 5, 'g': 7, 'a': 9, 'b': 11
    };

    // Parse note string (e.g., "e5", "c#4", "bb3")
    const match = note.toLowerCase().match(/^([a-g])(#|b)?(\d+)$/);
    if (!match) return 440; // Default to A4

    const [, noteName, accidental, octaveStr] = match;
    const octave = parseInt(octaveStr, 10);

    let semitone = noteMap[noteName];
    if (accidental === '#') semitone++;
    if (accidental === 'b') semitone--;

    // Calculate frequency using A4 = 440 Hz as reference
    // Formula: f = 440 * 2^((semitone - 9 + 12 * (octave - 4)) / 12)
    const semitonesFromA4 = semitone - 9 + 12 * (octave - 4);
    return 440 * Math.pow(2, semitonesFromA4 / 12);
}

// Play a melodic blip using a character's voice pattern
function playMelodicBlip(ctx: AudioContext, master: GainNode, vs: VoiceSettings, manager: MessageManager): void {
    const pattern = vs.melodicPattern;
    if (!pattern) return;

    // Get or initialize cached voice settings for this character
    let derived: DerivedVoiceSettings | null = null;
    if (vs.name && manager._voiceCache?.has(vs.name)) {
        derived = manager._voiceCache.get(vs.name) || null;
    }

    if (!derived) {
        // Initialize pattern index
        derived = {
            name: vs.name || 'unknown',
            base: pattern.notes[0],
            wave1: pattern.wave1,
            wave2: pattern.wave2 || 'sine',
            bandMul: 1.8,
            peak: pattern.gain || 0.20,
            harmonicRatio: 1.5,
            detuneRange: 8,
            pan: 0,
            attack: pattern.attack || 0.002,
            decay: pattern.decay || 0.06,
            masterGain: 1.2,
            melodicPattern: pattern,
            patternIndex: 0
        };
        if (derived.name && manager._voiceCache) {
            manager._voiceCache.set(derived.name, derived);
        }
    }

    const now = ctx.currentTime;
    const patternIndex = derived.patternIndex;
    const base = pattern.notes[patternIndex % pattern.notes.length];
    const rhythmMult = pattern.rhythmVariation ? pattern.rhythmVariation[patternIndex % pattern.rhythmVariation.length] : 1.0;

    // Create oscillators
    const o1 = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    const merger = ctx.createGain();
    const band = ctx.createBiquadFilter();
    const g = ctx.createGain();

    // Configure oscillators with melodic frequencies
    o1.type = pattern.wave1;
    o2.type = pattern.wave2 || 'sine';
    o1.frequency.setValueAtTime(base, now);
    o2.frequency.setValueAtTime(base * 1.5, now); // Perfect fifth harmony

    // Configure filter - brighter for melodic patterns
    band.type = 'bandpass';
    band.frequency.setValueAtTime(base * 2.0, now);
    band.Q.setValueAtTime(2.5, now);

    // Configure envelope with rhythm variation
    const attack = (pattern.attack || 0.002) * rhythmMult;
    const decay = (pattern.decay || 0.06) * rhythmMult;
    const gain = pattern.gain || 0.20;

    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(gain, now + attack);
    g.gain.exponentialRampToValueAtTime(0.00005, now + decay);

    // Connect audio graph
    o1.connect(merger);
    o2.connect(merger);
    merger.connect(band);
    band.connect(g);
    g.connect(master);

    // Start and stop oscillators
    o1.start(now);
    o2.start(now);
    o1.stop(now + Math.max(0.06, decay * 0.9));
    o2.stop(now + Math.max(0.06, decay * 0.9));

    // Advance pattern index for next blip
    derived.patternIndex = (patternIndex + 1) % pattern.notes.length;
    if (manager._voiceCache && derived.name) {
        manager._voiceCache.set(derived.name, derived);
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

    const vs = voiceSettings || {};

    // ===== PRIORITY 1: Check for Strudel pattern =====
    if (vs.strudelPattern?.enabled) {
        playStrudelBlip(vs, manager);
        return;
    }

    ensureTypingAudio(manager);
    const ctx = manager._typingAudioContext;
    const master = manager._typingMasterGain;
    if (!ctx || !master) return;

    // Web Audio API operations can fail in various browser contexts
    try {
        const now = ctx.currentTime;

        // ===== PRIORITY 2: Check if this character uses a melodic pattern =====
        if (vs.melodicPattern) {
            playMelodicBlip(ctx, master, vs, manager);
            return;
        }

        // ===== EXISTING: Standard procedural voice =====
        const o1 = ctx.createOscillator();
        const o2 = ctx.createOscillator();
        const merger = ctx.createGain();
        const band = ctx.createBiquadFilter();
        const g = ctx.createGain();
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
                masterGain: (typeof vs.masterGain === 'number') ? vs.masterGain : (1.0 + rand(-0.25, 0.6)),
                patternIndex: 0
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
