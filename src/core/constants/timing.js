// Timing constants for UI interactions
export const TIMING_CONSTANTS = {
    // Item use debounce timings
    ITEM_USE_DEBOUNCE: 600, // Debounce time for item use (ms)
    ITEM_TOOLTIP_SUPPRESS: 300, // Time to suppress tooltip after use (ms)
    ITEM_CONTEXT_MENU_SUPPRESS: 1000, // Time to suppress context menu (ms)

    // Pointer/touch interactions
    POINTER_ACTION_DEBOUNCE: 500, // Debounce for pointer actions (ms)
    TOUCH_DEBOUNCE: 500, // Debounce for touch actions (ms)
    LONG_PRESS_TIMEOUT: 500, // Long press detection timeout (ms)
    POINTER_MOVE_THRESHOLD_SQUARED: 144, // Pointer move threshold (12px squared)

    // Bomb interactions
    BOMB_ACTION_DEBOUNCE: 250, // Debounce for bomb actions (ms)
    DOUBLE_CLICK_DETECTION: 300, // Double-click detection window (ms)

    // Radial menu
    RADIAL_MENU_OPEN_IGNORE_WINDOW: 300, // Ignore window after radial opens (ms)
    RADIAL_PULSE_ANIMATION_DURATION: '1.6s', // Pulse animation duration

    // Messages and typewriter
    TYPEWRITER_SPEED_DEFAULT: 28, // Default typewriter speed (ms per char)
    MESSAGE_AUTO_HIDE_TIMEOUT: 2000, // Auto-hide timeout for messages (ms)

    // Action delays
    SMOKE_SPAWN_DELAY: 40, // Delay between smoke spawn steps (ms)
    ARROW_FLIGHT_TIME: 300, // Arrow flight time (ms)

    // Animation frequency
    FLASH_ANIMATION_FREQUENCY: 0.01 // Sine wave frequency for flash animations
};
