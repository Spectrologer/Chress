// Animation constants
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
    BACKFLIP_DELAY_FRAMES: 6 // Delay frames at start of backflip
};

// Rendering constants
export const RENDERING_CONSTANTS = {
    // Horse charge animation
    HORSE_CHARGE_TURN_POINT: 0.5, // 50% through animation

    // Damage number scaling
    DAMAGE_SCALE_MAX: 0.6, // Maximum scale increase
    DAMAGE_SCALE_COEFFICIENT: 0.12, // Scale per damage point

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
};

// Animation schemas for validation
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
};
