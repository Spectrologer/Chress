// Physics and motion constants for animations and movement

export const PHYSICS_CONSTANTS = {
    // Bump/Knockback physics
    BUMP_OFFSET_MAGNITUDE: 48, // Pixel distance for bump offset (deltaX/deltaY * 48)
    BUMP_DECAY_FACTOR: 0.85, // Friction/decay multiplier per frame (0.85 = 15% reduction)

    // Lift amplitudes (vertical movement)
    STANDARD_LIFT_AMPLITUDE: -28, // Standard lift height in pixels (negative = upward)
    BACKFLIP_LIFT_AMPLITUDE: -48, // Backflip jump height in pixels

    // Backflip physics
    BACKFLIP_ROTATION_FACTOR: 1.3, // Rotation speed multiplier for backflips
    BACKFLIP_LIFT_FRAME_RATIO: 0.8, // Fraction of total frames where lift occurs (80%)

    // Float/hover motion
    BOW_SHOT_FLOAT_AMPLITUDE: 8, // Vertical float range for bow shot animation
    PICKUP_HOVER_BASE_HEIGHT: -12, // Base height above ground for pickup hover
    PICKUP_HOVER_AMPLITUDE: 12, // Sine wave amplitude for pickup bobbing
    PORT_ARROW_FLOAT_AMPLITUDE: 4, // Float range for port indicator arrows
    PORT_ANIMATION_TIME_SCALE: 0.003, // Time multiplier for port animations (Date.now() * value)

    // Enemy scaling
    LIZARDY_SCALE: 0.9, // Scale factor for Lizardy to prevent clipping (10% smaller)
};

// Pulsate/Flash animation constants
export const PULSATE_CONSTANTS = {
    // Horse pulsate animation
    HORSE_PULSATE_FREQUENCY: 0.005, // Time multiplier for sine wave (Date.now() * value)
    HORSE_PULSATE_AMPLITUDE: 0.1, // Scale variation (1.0 ± 0.1 = 0.9 to 1.1)

    // UI flash frequencies (for sin-based alpha oscillation)
    UI_FLASH_FREQUENCY_STANDARD: 0.01, // Standard UI element flash speed

    // Bow power pulse
    BOW_PULSE_AMPLITUDE: 0.08, // Maximum pulse factor (multiplied by power - 1)
};

// Rendering scale factors (as fractions of TILE_SIZE)
export const SCALE_CONSTANTS = {
    // Item rendering scales
    ITEM_RENDER_SCALE: 0.7, // Standard item size (70% of tile)
    FOOD_RENDER_SCALE: 0.65, // Food item size (65% of tile)

    // Animation scales
    ANIMATION_BASE_SIZE_SCALE: 0.6, // Base size for particle animations (60% of tile)

    // Base tile renderer
    BASE_TILE_RENDER_SCALE: 0.7, // Generic tile rendering scale (70% of tile)

    // Player item rendering
    PLAYER_ITEM_MAX_SIZE_SCALE: 0.8, // Maximum size for player-held items (80% of tile)
    PLAYER_BOW_SCALE: 0.95, // Bow rendering scale (95% of tile)

    // Arrow indicator
    ARROW_INDICATOR_SIZE_SCALE: 0.75, // Size of directional arrows (75% of tile)

    // Bow drawing dimensions (as fractions of TILE_SIZE)
    BOW_DRAW_WIDTH: 0.3, // Width of drawn bow rectangle
    BOW_DRAW_HEIGHT_TOP: 0.05, // Height of top bow rectangle
    BOW_DRAW_WIDTH_BOTTOM: 0.6, // Width of bottom bow rectangle
    BOW_DRAW_HEIGHT_BOTTOM: 0.1, // Height of bottom bow rectangle
};

// Damage flash/visual effect constants
export const DAMAGE_FLASH_CONSTANTS = {
    DAMAGE_ANIMATION_THRESHOLD: 15, // Frame count for strong vs weak damage flash

    // Strong damage flash (first half)
    DAMAGE_BRIGHTNESS_STRONG: 2.0, // CSS brightness filter value
    DAMAGE_SATURATION_STRONG: 2, // CSS saturate filter value
    DAMAGE_HUE_ROTATION: '340deg', // CSS hue-rotate for red flash
    DAMAGE_SHADOW_BLUR_LARGE: '16px', // Large drop-shadow blur radius
    DAMAGE_SHADOW_BLUR_MEDIUM: '8px', // Medium drop-shadow blur radius
    DAMAGE_SHADOW_BLUR_SMALL: '4px', // Small drop-shadow blur radius

    // Weak damage flash (second half)
    DAMAGE_BRIGHTNESS_WEAK: 1.5, // CSS brightness for fade-out phase
};
