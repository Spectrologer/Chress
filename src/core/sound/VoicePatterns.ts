/**
 * Voice Patterns - Melodic personality patterns for NPC typewriter sounds
 *
 * Each NPC can have a unique melodic/rhythmic signature that plays during dialogue typewriter effect.
 * Instead of using full Strudel patterns, we define note sequences that get played through Web Audio API.
 */

export interface VoicePatternConfig {
    id: string;
    name: string;
    description: string;
    notes: number[]; // Frequencies in Hz
    wave1: OscillatorType;
    wave2?: OscillatorType;
    rhythmVariation?: number[]; // Optional timing multipliers
    gain?: number;
    attack?: number;
    decay?: number;
}

// Note: Musical note to frequency conversion
// E5=659.25, G5=783.99, A5=880, C6=1046.50, B5=987.77
// E4=329.63, G4=392.00, A4=440.00, C5=523.25
// C3=130.81, E3=164.81, G3=196.00, C4=261.63
// C2=65.41, G2=98.00
// F2=87.31, Ab2=103.83, Eb3=155.56
// F1=43.65

/**
 * FELT - Cheerful, sing-songy, admires Crayn
 * High-pitched (170Hz base), bright and bouncy melody
 * Ascending scale pattern with rhythmic bounce
 */
export const FELT_PATTERN: VoicePatternConfig = {
    id: 'felt',
    name: 'Felt',
    description: 'Cheerful, sing-songy, high-pitched and bouncy',
    notes: [659.25, 783.99, 880, 1046.50, 987.77, 880, 783.99, 659.25], // E5, G5, A5, C6, B5, A5, G5, E5
    wave1: 'triangle',
    wave2: 'sine',
    rhythmVariation: [1.0, 0.9, 1.1, 1.0, 0.95, 1.05, 1.0, 0.9], // Slight timing variations for bounce
    gain: 0.62,
    attack: 0.002,
    decay: 0.06
};

/**
 * CRAYN - Low, authoritative, smart (120Hz base)
 * Deeper tones with measured rhythm
 */
export const CRAYN_PATTERN: VoicePatternConfig = {
    id: 'crayn',
    name: 'Crayn',
    description: 'Authoritative, measured, smart',
    notes: [130.81, 164.81, 196.00, 261.63], // C3, E3, G3, C4
    wave1: 'sawtooth',
    wave2: 'sine',
    rhythmVariation: [1.0, 1.0, 1.0, 1.0], // Steady, no variation
    gain: 0.64,
    attack: 0.004,
    decay: 0.09
};

/**
 * FORGE - Very low, lies with authority (85Hz base)
 * Dark, ominous tones with slight dissonance
 */
export const FORGE_PATTERN: VoicePatternConfig = {
    id: 'forge',
    name: 'Forge',
    description: 'Dark, ominous, deceptive',
    notes: [87.31, 103.83, 130.81, 155.56], // F2, Ab2, C3, Eb3
    wave1: 'sawtooth',
    wave2: 'square',
    rhythmVariation: [1.0, 1.05, 0.95, 1.0], // Slight unsettling variation
    gain: 0.66,
    attack: 0.006,
    decay: 0.12
};

/**
 * Generic cheerful pattern for upbeat NPCs
 */
export const CHEERFUL_PATTERN: VoicePatternConfig = {
    id: 'cheerful',
    name: 'Cheerful',
    description: 'Generic upbeat personality',
    notes: [523.25, 659.25, 783.99, 1046.50], // C5, E5, G5, C6
    wave1: 'triangle',
    wave2: 'sine',
    rhythmVariation: [1.0, 0.95, 1.05, 1.0],
    gain: 0.20,
    attack: 0.002,
    decay: 0.07
};

/**
 * Generic mysterious pattern for enigmatic NPCs
 */
export const MYSTERIOUS_PATTERN: VoicePatternConfig = {
    id: 'mysterious',
    name: 'Mysterious',
    description: 'Generic enigmatic personality',
    notes: [293.66, 349.23, 392.00, 466.16, 440.00, 392.00], // D4, F4, G4, Bb4, A4, G4
    wave1: 'triangle',
    wave2: 'sine',
    rhythmVariation: [1.0, 1.1, 0.9, 1.05, 0.95, 1.0],
    gain: 0.18,
    attack: 0.005,
    decay: 0.10
};

/**
 * Generic friendly pattern for merchants and helpful NPCs
 */
export const FRIENDLY_PATTERN: VoicePatternConfig = {
    id: 'friendly',
    name: 'Friendly',
    description: 'Generic helpful personality',
    notes: [392.00, 440.00, 523.25, 587.33, 523.25, 440.00], // G4, A4, C5, D5, C5, A4
    wave1: 'triangle',
    wave2: 'sine',
    rhythmVariation: [1.0, 0.95, 1.0, 1.05, 1.0, 0.95],
    gain: 0.21,
    attack: 0.003,
    decay: 0.08
};

/**
 * Generic nervous/anxious pattern for worried, jittery NPCs
 */
export const NERVOUS_PATTERN: VoicePatternConfig = {
    id: 'nervous',
    name: 'Nervous',
    description: 'Anxious, worried, jittery personality',
    notes: [493.88, 554.37, 523.25, 587.33, 554.37, 493.88], // B4, C#5, C5, D5, C#5, B4
    wave1: 'triangle',
    wave2: 'sine',
    rhythmVariation: [0.9, 1.1, 0.85, 1.15, 0.95, 1.05], // Erratic timing
    gain: 0.19,
    attack: 0.001,
    decay: 0.05
};

/**
 * Generic grumpy/angry pattern for frustrated, harsh NPCs
 */
export const GRUMPY_PATTERN: VoicePatternConfig = {
    id: 'grumpy',
    name: 'Grumpy',
    description: 'Frustrated, angry, harsh personality',
    notes: [220.00, 246.94, 261.63, 293.66], // A3, B3, C4, D4
    wave1: 'sawtooth',
    wave2: 'square',
    rhythmVariation: [1.0, 1.0, 1.0, 1.0], // Blunt, consistent
    gain: 0.22,
    attack: 0.005,
    decay: 0.11
};

/**
 * Generic sophisticated pattern for refined, cultured NPCs
 */
export const SOPHISTICATED_PATTERN: VoicePatternConfig = {
    id: 'sophisticated',
    name: 'Sophisticated',
    description: 'Refined, elegant, cultured personality',
    notes: [349.23, 392.00, 440.00, 493.88, 523.25], // F4, G4, A4, B4, C5
    wave1: 'sine',
    wave2: 'triangle',
    rhythmVariation: [1.0, 1.0, 1.0, 1.0, 1.0], // Smooth, even
    gain: 0.17,
    attack: 0.008,
    decay: 0.12
};

/**
 * Generic quirky/odd pattern for eccentric, weird NPCs
 */
export const QUIRKY_PATTERN: VoicePatternConfig = {
    id: 'quirky',
    name: 'Quirky',
    description: 'Eccentric, weird, unusual personality',
    notes: [369.99, 415.30, 466.16, 554.37, 493.88, 415.30], // F#4, G#4, Bb4, C#5, B4, G#4
    wave1: 'square',
    wave2: 'triangle',
    rhythmVariation: [1.0, 0.8, 1.2, 0.9, 1.1, 1.0], // Unpredictable timing
    gain: 0.20,
    attack: 0.003,
    decay: 0.07
};

/**
 * Get voice pattern by character ID or personality type
 */
export function getVoicePatternForCharacter(characterId: string, personalityType?: string): VoicePatternConfig | null {
    const id = characterId.toLowerCase();

    // Character-specific patterns
    if (id === 'felt') return FELT_PATTERN;
    if (id === 'crayn' || id.includes('crayn')) return CRAYN_PATTERN;
    if (id === 'forge') return FORGE_PATTERN;

    // Personality-based patterns
    if (personalityType) {
        const type = personalityType.toLowerCase();
        if (type === 'cheerful' || type === 'happy' || type === 'excited') {
            return CHEERFUL_PATTERN;
        }
        if (type === 'mysterious' || type === 'enigmatic' || type === 'cryptic') {
            return MYSTERIOUS_PATTERN;
        }
        if (type === 'friendly' || type === 'merchant' || type === 'helpful') {
            return FRIENDLY_PATTERN;
        }
        if (type === 'nervous' || type === 'anxious' || type === 'worried' || type === 'jittery') {
            return NERVOUS_PATTERN;
        }
        if (type === 'grumpy' || type === 'angry' || type === 'frustrated' || type === 'harsh') {
            return GRUMPY_PATTERN;
        }
        if (type === 'sophisticated' || type === 'refined' || type === 'elegant' || type === 'cultured') {
            return SOPHISTICATED_PATTERN;
        }
        if (type === 'quirky' || type === 'odd' || type === 'eccentric' || type === 'weird') {
            return QUIRKY_PATTERN;
        }
    }

    // No melodic pattern - fall back to traditional Web Audio API
    return null;
}

/**
 * Registry of all available voice patterns
 */
export const VOICE_PATTERNS: Record<string, VoicePatternConfig> = {
    felt: FELT_PATTERN,
    crayn: CRAYN_PATTERN,
    forge: FORGE_PATTERN,
    cheerful: CHEERFUL_PATTERN,
    mysterious: MYSTERIOUS_PATTERN,
    friendly: FRIENDLY_PATTERN,
    nervous: NERVOUS_PATTERN,
    grumpy: GRUMPY_PATTERN,
    sophisticated: SOPHISTICATED_PATTERN,
    quirky: QUIRKY_PATTERN
};
