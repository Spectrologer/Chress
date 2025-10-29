// Voice/Audio generation constants
export const VOICE_CONSTANTS = {
    // Crayn voice settings
    CRAYN_BASE_FREQUENCY: 120,
    CRAYN_BAND_MUL: 1.6,
    CRAYN_PEAK: 0.18,

    // Merchant voice ranges
    MERCHANT_BASE_MIN: 90,
    MERCHANT_BASE_RANGE: 80, // 90 + (0-80) = 90-170
    MERCHANT_BAND_MUL_BASE: 1.5,
    MERCHANT_BAND_MUL_RANGE: 0.2, // 1.5 + (0-0.2) = 1.5-1.7
    MERCHANT_PEAK_BASE: 0.16,
    MERCHANT_PEAK_RANGE: 0.1, // 0.16 + (0-0.1) = 0.16-0.26

    // Generic voice ranges
    GENERIC_BASE_MIN: 80,
    GENERIC_BASE_RANGE: 160, // 80 + (0-160) = 80-240
    GENERIC_PEAK_BASE: 0.08,
    GENERIC_PEAK_RANGE: 0.2, // 0.08 + (0-0.2) = 0.08-0.28
    GENERIC_BAND_MUL_BASE: 1.4,
    GENERIC_BAND_MUL_RANGE: 0.3, // 1.4 + (0-0.3) = 1.4-1.7

    // VoiceSettings hash calculations
    VOICE_PEAK_BASE: 0.08, // Base value for peak calculation
    VOICE_HASH_MODULO: 80, // Modulo for hash calculation
    VOICE_PEAK_DIVISOR: 400, // Divisor for peak calculation (hash % 80 / 400)

    // Typing audio
    TYPING_MASTER_GAIN: 1.6
};

// Volume and mixing constants
export const VOLUME_CONSTANTS = {
    // Default volumes
    DEFAULT_MUSIC_VOLUME: 0.0625, // 1/16 volume (6.25%)
    DEFAULT_SFX_VOLUME: 0.2, // 20% volume for sound effects
    MAX_VOLUME: 1.0, // Maximum volume level

    // Crossfade
    DEFAULT_CROSSFADE_DURATION: 600 // Default music crossfade in milliseconds
};

// Procedural sound effect constants
export const SFX_CONSTANTS = {
    // Attack sound
    ATTACK_FREQ_START: 220, // Starting frequency (Hz)
    ATTACK_FREQ_END: 110, // Ending frequency (Hz)
    ATTACK_DURATION: 0.1, // Duration in seconds
    ATTACK_GAIN: 0.06, // Volume level
    ATTACK_DECAY: 0.008, // Decay rate
    ATTACK_TOTAL_DURATION: 0.2, // Total duration including decay

    // Tap enemy sound
    TAP_ENEMY_FREQ_START: 160,
    TAP_ENEMY_FREQ_END: 320,
    TAP_ENEMY_DURATION: 0.06,
    TAP_ENEMY_GAIN: 0.035,
    TAP_ENEMY_DECAY: 0.005,
    TAP_ENEMY_TOTAL_DURATION: 0.12,

    // Chop sound
    CHOP_FREQUENCY: 80,
    CHOP_GAIN: 0.08,
    CHOP_DECAY: 0.008,
    CHOP_TOTAL_DURATION: 0.15,

    // Smash sound
    SMASH_FREQUENCY: 60,
    SMASH_GAIN: 0.1,
    SMASH_DECAY: 0.008,
    SMASH_TOTAL_DURATION: 0.25,

    // Hurt sound
    HURT_FREQ_START: 200,
    HURT_FREQ_END: 80,
    HURT_DURATION: 0.15,
    HURT_GAIN: 0.12,
    HURT_DECAY: 0.008,

    // Move sound
    MOVE_FREQUENCY: 120,
    MOVE_GAIN: 0.01,
    MOVE_DECAY: 0.004,
    MOVE_STOP_TIME: 0.08,

    // Pickup sound
    PICKUP_FREQ_START: 220,
    PICKUP_FREQ_END: 440,
    PICKUP_DURATION: 0.08,
    PICKUP_GAIN: 0.04,
    PICKUP_DECAY: 0.008,

    // Bloop sound
    BLOOP_FREQ_START: 440,
    BLOOP_FREQ_END: 660,
    BLOOP_DURATION: 0.06,
    BLOOP_GAIN: 0.015,
    BLOOP_DECAY: 0.003,
    BLOOP_TOTAL_DURATION: 0.12,

    // Bow shot sound
    BOW_SHOT_FREQ_START: 300,
    BOW_SHOT_FREQ_END: 700,
    BOW_SHOT_DURATION: 0.05,
    BOW_SHOT_GAIN: 0.08,
    BOW_SHOT_DECAY: 0.004,
    BOW_SHOT_TOTAL_DURATION: 0.2,

    // Double tap sound
    DOUBLE_TAP_FREQ_START: 660,
    DOUBLE_TAP_FREQ_END: 880,
    DOUBLE_TAP_DURATION: 0.035,
    DOUBLE_TAP_GAIN: 0.02,
    DOUBLE_TAP_DECAY: 0.004,
    DOUBLE_TAP_TOTAL_DURATION: 0.07,

    // Default fallback values
    DEFAULT_GAIN: 0.1,
    DEFAULT_DECAY: 0.01
};
