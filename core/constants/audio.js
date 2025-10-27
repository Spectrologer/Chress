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

    // Typing audio
    TYPING_MASTER_GAIN: 1.6
};
