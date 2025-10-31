// Animation constants
// Note: We don't use 'as const' to allow numbers to be used flexibly with default parameters
export const ANIMATION_CONSTANTS = {
    LIFT_FRAMES: 15, // Frames for player/enemy lift animations
    ATTACK_ANIMATION_FRAMES: 15, // Frames for attack animations
    LIZARDY_FLIP_FRAMES: 20, // Frames for lizardy flip animation
    BUMP_ANIMATION_FRAMES: 15, // Frames for bump animations
    DEATH_ANIMATION_FRAMES: 15, // Frames for death animations
    ARROW_ANIMATION_FRAMES: 20, // Frames for arrow animations
    HORSE_CHARGE_FRAMES: 20, // Frames for horse charge animations
    SMOKE_ANIMATION_FRAMES: 20, // Frames for smoke animations (long)
    SMOKE_SHORT_LIFETIME: 12, // Frames for short smoke effects (ActionManager)
    TIMER_ANIMATION_FRAMES: 30, // Frames for timer animations
    SPLODE_FRAMES: 36, // Total frames for explosion/splode animation
    SMOKE_FRAME_LIFETIME: 18, // Individual smoke frame lifetime (PlayerAnimations)
    DAMAGE_FLASH_FRAMES: 30, // Duration of damage flash animation
    BACKFLIP_DEFAULT_FRAMES: 20, // Default frame count for backflip
    BACKFLIP_DELAY_FRAMES: 6, // Delay frames at start of backflip

    // Point/damage number animations
    POINT_ANIMATION_FRAMES: 15, // Duration of point/damage number rising animation
    POINT_RISE_DISTANCE: 40, // Pixels the point number rises
    POINT_HEAD_OFFSET: -18, // Pixels above entity center to display points

    // Multiplier animations
    MULTIPLIER_ANIMATION_FRAMES: 30, // Duration of multiplier display
    MULTIPLIER_RISE_DISTANCE: 36, // Pixels the multiplier text rises

    // Splode animation mapping
    SPLODE_FRAME_DIVISOR: 8, // Maps 36 frames to display across fewer frames

    // Smoke animation
    SMOKE_FRAME_DIVISOR: 3, // Maps smoke frames (18 frames / 3 = 6 display frames)

    // Pickup animation
    PICKUP_FLOAT_FACTOR: 0.6, // Math.PI multiplier for pickup float animation

    // Easing constants
    EASE_BASE: 0.5, // Base value for cosine easing (0.5 - 0.5 * cos)
    EASE_AMPLITUDE: 0.5, // Amplitude for cosine easing

    // Bomb animation
    BOMB_PULSE_FREQUENCY: 0.005, // Frequency multiplier for bomb pulsation (Date.now() * this)
    BOMB_PULSE_AMPLITUDE: 0.1, // Scale amplitude for bomb pulsation (0.1 = 10% scale change)

    // Bow shot animation
    BOW_SHOT_FRAMES: 20 // Frames for bow shot animation
};

// Rendering constants
export const RENDERING_CONSTANTS = {
    // Horse charge animation
    HORSE_CHARGE_TURN_POINT: 0.5, // 50% through animation

    // Damage number scaling
    DAMAGE_SCALE_BASE: 1, // Base scale for damage numbers
    DAMAGE_SCALE_MAX: 0.6, // Maximum scale increase
    DAMAGE_SCALE_COEFFICIENT: 0.12, // Scale per damage point

    // Bow rendering
    BOW_BASE_SCALE: 0.6, // Base scale of bow relative to tile (60%)
    BOW_PIXEL_OFFSET_Y: -6, // Pixel offset for bow vertical positioning

    // Pickup fade
    PICKUP_FADE_MULTIPLIER: 0.9, // Alpha fade rate during pickup animation

    // Attack animation scales
    ATTACK_SCALE_LARGE: 1.6, // Scale for large attack animation
    ATTACK_SCALE_SMALL: 1.3, // Scale for small attack animation
    ATTACK_SHAKE_INTENSITY: 16, // Pixels for shake effect during attack

    // Brightness/filter values
    FROZEN_BRIGHTNESS: 0.8, // Brightness level for frozen enemies
    FROZEN_ALPHA: 0.9, // Alpha level for frozen enemies
    ATTACK_FLASH_BRIGHTNESS: 2.0, // Brightness for attack flash effect
    ATTACK_FLASH_SATURATE: 2, // Saturation for attack flash
    ATTACK_FLASH_HUE_ROTATE: 340, // Hue rotation in degrees for attack flash
    ATTACK_FLASH_SHADOW_BLUR: 16, // Shadow blur in pixels
    ATTACK_FLASH_SHADOW_SPREAD: 8, // Shadow spread in pixels

    // Font rendering
    ENTITY_NAME_FONT_SCALE: 0.5, // Scale factor for entity name font size

    // Statue rendering
    STATUE_SIZE_OFFSET: -16, // Offset from TILE_SIZE for statue max scale
    STATUE_BRIGHTNESS_STONE: 0.8, // Brightness for stone statues (grayscale)
    STATUE_BRIGHTNESS_NORMAL: 0.85, // Brightness for normal statues

    // Flash opacity ranges
    FLASH_OPACITY_MIN: 0.4, // Min opacity (0.6 - 0.2)
    FLASH_OPACITY_MAX: 0.8, // Max opacity (0.6 + 0.2)
    FLASH_OPACITY_BASE: 0.6,
    FLASH_OPACITY_VARIANCE: 0.2,

    FLASH_OPACITY_ALT_MIN: 0.2, // Alt min (0.5 - 0.3)
    FLASH_OPACITY_ALT_MAX: 0.8, // Alt max (0.5 + 0.3)
    FLASH_OPACITY_ALT_BASE: 0.5,
    FLASH_OPACITY_ALT_VARIANCE: 0.3,

    // Tile tinting
    DARK_TINT_OPACITY: 0.05,
    LIGHT_TINT_OPACITY: 0.05,
    DARK_TINT_COLOR: 'rgba(0, 0, 0, 0.05)',
    LIGHT_TINT_COLOR: 'rgba(255, 255, 255, 0.05)'
} as const;

// Animation schemas for validation
export interface PointAnimationSchema {
    x: number;
    y: number;
    amount: number;
    frame: number;
}

export interface MultiplierAnimationSchema {
    x: number;
    y: number;
    multiplier: number;
    frame: number;
}

export interface ArrowAnimationSchema {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    frame: number;
}

export interface Position {
    x: number;
    y: number;
}

export interface HorseChargeAnimationSchema {
    startPos: Position;
    midPos: Position;
    endPos: Position;
    frame: number;
}

export interface BumpAnimationSchema {
    offsetX: number;
    offsetY: number;
    frames: number;
}

export interface LiftAnimationSchema {
    offsetY: number;
    frames: number;
}

export interface TimerAnimationSchema {
    duration: number;
    elapsed: number;
}

export interface SmokeAnimationSchema {
    frame: number;
}

// Legacy schema map for backward compatibility
export const ANIMATION_SCHEMAS = {
    POINT: {
        x: 'number',
        y: 'number',
        amount: 'number',
        frame: 'number'
    },
    MULTIPLIER: {
        x: 'number',
        y: 'number',
        multiplier: 'number',
        frame: 'number'
    },
    ARROW: {
        startX: 'number',
        startY: 'number',
        endX: 'number',
        endY: 'number',
        frame: 'number'
    },
    HORSE_CHARGE: {
        startPos: 'object', // { x: number, y: number }
        midPos: 'object',   // { x: number, y: number }
        endPos: 'object',   // { x: number, y: number }
        frame: 'number'
    },
    BUMP: {
        offsetX: 'number',
        offsetY: 'number',
        frames: 'number'
    },
    LIFT: {
        offsetY: 'number',
        frames: 'number'
    },
    TIMER: {
        duration: 'number',
        elapsed: 'number'
    },
    SMOKE: {
        frame: 'number'
    }
} as const;
