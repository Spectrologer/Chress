// UI Constants
export const UI_CONSTANTS = {
    AXE_ICON_SIZE_RELATIVE: 0.7, // Axe icon size relative to map
    CHARACTER_NAME_FONT_SIZE: '1.5em', // Font size for character names

    // Spacing and padding
    PADDING_SMALL: '4px', // Small padding
    PADDING_MEDIUM: '8px', // Medium padding
    PADDING_LARGE: '10px', // Large padding
    IMAGE_SIZE_LARGE: '128px', // Large image size

    // Opacity values
    OPACITY_DIM: 0.3, // Dimmed opacity (e.g. for lost hearts)
    OPACITY_SEMI_TRANSPARENT: 0.7, // Semi-transparent opacity
    OPACITY_INDICATOR_FLASH_BASE: 0.5, // Base opacity for flashing indicators
    OPACITY_INDICATOR_FLASH_VARIANCE: 0.3, // Variance in flash opacity

    // Transition durations
    CSS_TRANSITION_DURATION: 260, // Duration (ms) for CSS transitions (e.g., fade-out)

    // Z-index values
    Z_INDEX_RADIAL_OVERLAY: 1000, // Z-index for radial inventory overlay

    // Radial inventory
    RADIAL_INVENTORY_MAX_SIZE: 8 // Maximum number of items in radial inventory
};

// Input constants
export const INPUT_CONSTANTS = {
    // Touch detection
    MIN_SWIPE_DISTANCE: 30,
    MAX_TAP_TIME: 300, // Maximum time for a tap (milliseconds)
    // Time window for double-tap detection (ms). Kept reasonably short to
    // avoid perceived input lag while still being forgiving on mobile.
    DOUBLE_TAP_TIME: 250,
    // Delay before executing single tap action (waiting for potential double-tap)
    DOUBLE_TAP_DELAY: 300,
    // Pixel tolerance for double-tap detection. Sometimes subsequent
    // taps fall on slightly different client coordinates due to
    // devicePixelRatio / rounding; allow small movement to still count.
    DOUBLE_TAP_PIXEL_TOLERANCE: 20,

    // Animation timing
    PATH_STEP_DELAY: 150, // ms between path steps
    LEGACY_PATH_DELAY: 150, // ms for legacy pathing

    // Debug points
    DEBUG_POINT_AMOUNT: 999
};

// UI timing and interaction constants
export const UI_TIMING_CONSTANTS = {
    // Typewriter effect
    TYPEWRITER_SPEED: 28, // Milliseconds per character

    // Message/note display
    NOTE_DEFAULT_TIMEOUT: 2000, // Default timeout for notes in milliseconds
    NOTE_TRANSITION_DURATION: 260, // CSS transition duration for notes

    // Panel interactions
    PANEL_CAPTURE_BLOCKER_DURATION: 300, // Duration to block captures after panel interaction

    // Game state
    SAVE_DEBOUNCE_MS: 750, // Debounce delay for autosave
    SAVE_INTERVAL_MS: 30000, // Periodic save interval (30 seconds)

    // Death animation
    PLAYER_DEATH_TIMER: 60, // Frames for player death animation
};

export const GENERATOR_CONSTANTS = {
    // Connection/spawn calculations
    SEED_MULTIPLIER_X: 73, // Seed multiplier for zone X coordinate
    SEED_MULTIPLIER_Y: 97, // Seed multiplier for zone Y coordinate
    SEED_MULTIPLIER_ALT_1: 137, // Alternative seed multiplier
    SEED_MULTIPLIER_ALT_2: 149, // Alternative seed multiplier
    SEED_MODULO: 1000, // Modulo for seed range
    POSITION_MODULO: 4, // Modulo for position selection

    // Connection thresholds
    HOME_ZONE_NULL_THRESHOLD: 5, // Threshold for null connections in home zone
    OTHER_ZONE_NULL_THRESHOLD: 30, // Threshold for null connections in other zones
    POSITION_OFFSET: 3, // Offset for position calculations
    POSITION_VARIATION_RANGE: 31, // Random range for position variation

    // Feature generation
    FEATURE_EXTRA_MULTIPLIER: 0.02, // Multiplier for extra features
    FEATURE_EXTRA_DIVISOR: 5, // Divisor for extra feature calculation
    ROCK_CHANCE_MULTIPLIER: 0.98, // Multiplier for rock chance
    FEATURE_CHANCE_MULTIPLIER: 0.55, // Multiplier for feature chance
    MAX_THRESHOLD: 0.95, // Maximum threshold for generation

    // Enemy generation
    MAX_SCALED_ENEMY_COUNT: 20, // Maximum scaled enemy count
};

export const PLAYER_STAT_CONSTANTS = {
    // Initial player stats
    INITIAL_THIRST: 50, // Starting thirst level
    INITIAL_HUNGER: 50, // Starting hunger level
};

// Build and development constants
export const BUILD_CONSTANTS = {
    // Code generation formatting
    JSON_INDENT_SPACES: 2, // Number of spaces for JSON stringification in generated code
};
