// Animation constants
export const ANIMATION_CONSTANTS = {
    LIFT_FRAMES: 15, // Frames for player/enemy lift animations
    ATTACK_ANIMATION_FRAMES: 15, // Frames for attack animations
    LIZARDY_FLIP_FRAMES: 20, // Frames for lizardy flip animation
    BUMP_ANIMATION_FRAMES: 15, // Frames for bump animations
    DEATH_ANIMATION_FRAMES: 15, // Frames for death animations
    ARROW_ANIMATION_FRAMES: 20, // Frames for arrow animations
    HORSE_CHARGE_FRAMES: 20, // Frames for horse charge animations
    SMOKE_ANIMATION_FRAMES: 20, // Frames for smoke animations
    TIMER_ANIMATION_FRAMES: 30 // Frames for timer animations
};

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
    OPACITY_INDICATOR_FLASH_VARIANCE: 0.3 // Variance in flash opacity
};

// Simulation constants
export const SIMULATION_CONSTANTS = {
    DEFEAT_DAMAGE: 999, // Damage dealt when enemy is defeated
    VICTORY_POINTS: 1 // Points awarded for defeating enemy
};

// Input constants (moved from INPUT_CONSTANTS)
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

// Zone positioning constants
export const ZONE_CONSTANTS = {
    PLAYER_SPAWN_POSITION: { x: 4, y: 7 }, // Default player spawn position
    HOUSE_START_POSITION: { x: 3, y: 3 }, // House center position
    SHACK_START_POSITION: { x: 3, y: 3 }, // Shack center position
    SHACK_SIZE: 3, // Shack is 3x3 tiles
    SHACK_PORT_OFFSET: { x: 1, y: 2 }, // Port placement offset within shack (dx, dy)
    ZONE_GENERATION_START: { x: 3, y: 3 } // Zone generation start position
};

// Inventory constants
export const INVENTORY_CONSTANTS = {
    MAX_INVENTORY_SIZE: 6, // Maximum items in player inventory
    RADIAL_MAX_SIZE: 8 // Maximum items in radial inventory
};

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

// Dimension/depth constants
export const DIMENSION_CONSTANTS = {
    SURFACE: 0, // Surface dimension code
    INTERIOR: 1, // Interior (houses, shacks) dimension code
    UNDERGROUND: 2, // Underground dimension code
    DEFAULT_SURFACE_DEPTH: 0, // Default depth for surface
    DEFAULT_UNDERGROUND_DEPTH: 1 // Initial underground depth
};

// Gameplay mechanics constants
export const GAMEPLAY_CONSTANTS = {
    // Bomb mechanics
    BOMB_EXPLOSION_THRESHOLD: 2, // Actions required before bomb explodes
    BOMB_LAUNCH_MAX_STEPS: 8, // Maximum steps for bomb launch

    // Pitfall mechanics
    PITFALL_SURVIVAL_TURNS: 10, // Turns to survive in pitfall

    // Zone generation
    UNDERGROUND_CONNECTION_PROBABILITY: 0.50, // 50% chance for underground connections
    MAX_PLACEMENT_ATTEMPTS: 50, // Max attempts for zone placement
    CONNECTION_ATTEMPT_LIMIT: 20, // Max attempts for connection placement

    // Item restoration amounts
    WATER_RESTORATION_AMOUNT: 10, // Thirst restored by water
    HEART_RESTORATION_AMOUNT: 1, // Health restored by heart
    FOOD_RESTORATION_AMOUNT: 10, // Hunger restored by food

    // Item starting uses
    BOW_STARTING_USES: 3,
    SPEAR_STARTING_USES: 3,
    HORSE_STARTING_USES: 3,
    BOOK_STARTING_USES: 1
};

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

// Game constants
export const GRID_SIZE = 9;
export const TILE_SIZE = 64;
export const CANVAS_SIZE = GRID_SIZE * TILE_SIZE; // 576x576 pixels

// Tile types
export const TILE_TYPES = {
    FLOOR: 0,
    WALL: 1,
    GRASS: 2,
    EXIT: 3,
    ROCK: 4,
    HOUSE: 5,
    WATER: 6,
    FOOD: 7,
    ENEMY: 8,
    AXE: 9,
    HAMMER: 10,
    NOTE: 11,
    BISHOP_SPEAR: 12,
    HORSE_ICON: 28,
    SHRUBBERY: 13,
    WELL: 14,
    DEADTREE: 15,
    PENNE: 16,
    SQUIG: 25,
    NIB: 42,
    RUNE: 39,
    BOMB: 24,
    HEART: 27,
    SIGN: 26,
    PORT: 29,
    // Enemy statues
    LIZARDY_STATUE: 30,
    LIZARDO_STATUE: 31,
    LIZARDEAUX_STATUE: 32,
    ZARD_STATUE: 33,
    LAZERD_STATUE: 34,
    LIZORD_STATUE: 35,
    CRAYN: 36,
    FELT: 37,
    FORGE: 38,
    BOOK_OF_TIME_TRAVEL: 40,
    BOW: 41,
    MARK: 43,
    SHACK: 44,
    SHOVEL: 48,
    CISTERN: 45,
    AXELOTL: 46,
    GOUGE: 47,
    PITFALL: 49,
    TABLE: 56
};

// Item statue tile types (stone statues of activated items)
TILE_TYPES.BOMB_STATUE = 50;
TILE_TYPES.SPEAR_STATUE = 51;
TILE_TYPES.BOW_STATUE = 52;
TILE_TYPES.HORSE_STATUE = 53;
TILE_TYPES.BOOK_STATUE = 54;
TILE_TYPES.SHOVEL_STATUE = 55;

// Colors for different tile types (fallback when images don't load)
export const TILE_COLORS = {
    [TILE_TYPES.FLOOR]: '#ffcb8d',
    [TILE_TYPES.WALL]: '#8B4513',
    [TILE_TYPES.GRASS]: '#228B22',
    [TILE_TYPES.EXIT]: '#ffcb8d',  // Same as floor - opening is indicator enough
    [TILE_TYPES.ROCK]: '#666666',
    [TILE_TYPES.HOUSE]: '#D2691E',  // Brown/orange for house
    [TILE_TYPES.WATER]: '#4169E1',  // Blue for water
    [TILE_TYPES.FOOD]: '#FF6347',    // Red/orange for food
    [TILE_TYPES.ENEMY]: '#32CD32',   // Lime green for enemy
    [TILE_TYPES.NOTE]: '#FFFF00',    // Yellow for note
    [TILE_TYPES.HAMMER]: '#8B4513',  // Brown for hammer
    [TILE_TYPES.BISHOP_SPEAR]: '#8B4513',   // Brown for bishop spear
    [TILE_TYPES.HORSE_ICON]: '#8B4513', // Brown for horse icon
    [TILE_TYPES.SHRUBBERY]: '#228B22', // Green for shrubbery
    [TILE_TYPES.WELL]: '#D2691E',   // Brown/orange for well
    [TILE_TYPES.DEADTREE]: '#8B4513',   // Brown for deadtree
    [TILE_TYPES.PENNE]: '#8A2BE2',    // Blueviolet for Penne
    [TILE_TYPES.SQUIG]: '#8A2BE2',   // Blueviolet for squig
    [TILE_TYPES.NIB]: '#8A2BE2',     // Blueviolet for nib
    [TILE_TYPES.RUNE]: '#8A2BE2',    // Blueviolet for rune
    [TILE_TYPES.BOMB]: '#FF0000',  // Red for bomb
    [TILE_TYPES.HEART]: '#FF69B4', // Hot pink for heart
    [TILE_TYPES.SIGN]: '#8B4513', // Saddle brown for sign
    [TILE_TYPES.PORT]: '#ffcb8d', // Same as floor, transparent
    // Enemy statue colors (grey for stone statues)
    [TILE_TYPES.LIZARDY_STATUE]: '#A0A0A0',
    [TILE_TYPES.LIZARDO_STATUE]: '#A0A0A0',
    [TILE_TYPES.LIZARDEAUX_STATUE]: '#A0A0A0',
    [TILE_TYPES.ZARD_STATUE]: '#A0A0A0',
    [TILE_TYPES.LAZERD_STATUE]: '#A0A0A0',
    [TILE_TYPES.LIZORD_STATUE]: '#A0A0A0',
    [TILE_TYPES.CRAYN]: '#8A2BE2', // Blueviolet for Crayn
    [TILE_TYPES.FELT]: '#8A2BE2', // Blueviolet for Felt
    [TILE_TYPES.FORGE]: '#8A2BE2', // Blueviolet for Forge
    [TILE_TYPES.BOOK_OF_TIME_TRAVEL]: '#D2691E', // Chocolate color for book
    [TILE_TYPES.BOW]: '#8B4513', // Brown for bow
    [TILE_TYPES.MARK]: '#FFD700', // Gold for Mark
    [TILE_TYPES.CISTERN]: '#708090', // Slate gray for cistern
    [TILE_TYPES.SHACK]: '#8B4513', // Brown for shack
    [TILE_TYPES.SHOVEL]: '#8B4513', // Brown for shovel
    [TILE_TYPES.GOUGE]: '#8A2BE2', // Blueviolet for Gouge
    [TILE_TYPES.PITFALL]: '#ffcb8d' // Same as floor, should be mostly invisible
};
TILE_COLORS[TILE_TYPES.TABLE] = '#A0522D'; // Sienna for table fallback

// Stone statue fallbacks (grey) for item statues
TILE_COLORS[TILE_TYPES.BOMB_STATUE] = '#A0A0A0';
TILE_COLORS[TILE_TYPES.SPEAR_STATUE] = '#A0A0A0';
TILE_COLORS[TILE_TYPES.BOW_STATUE] = '#A0A0A0';
TILE_COLORS[TILE_TYPES.HORSE_STATUE] = '#A0A0A0';
TILE_COLORS[TILE_TYPES.BOOK_STATUE] = '#A0A0A0';
TILE_COLORS[TILE_TYPES.SHOVEL_STATUE] = '#A0A0A0';

// Direction constants for exits and movements
export const DIRECTIONS = {
    NORTH: 'north',
    SOUTH: 'south',
    EAST: 'east',
    WEST: 'west'
};

// Image asset names
export const IMAGE_ASSETS = [
    'floors/dirt/dirt.png',
    'rock.png',
    'floors/dirt/dirt_north.png',
    'floors/dirt/dirt_corner.png',
    'floors/dirt/dirt_tunnel.png',
    'floors/dirt/dirt_corner2.png',
    'shrubbery.png',
    'bush.png',
    'floors/dirt/dircle.png',
    'doodads/club.png',
    'doodads/table.png',
    'items/water.png',
    'doodads/shack.png',
    'protag/Special2.png',
    'doodads/cistern.png',
    'protag/whack.png',
    'protag/dead.png',
    'fauna/lizardy.png',
    'fauna/lizardo.png',
    'fauna/lizardeaux.png',
    'fauna/lizord.png',
    'fauna/lazerd.png',
    'items/axe.png',
    'items/hammer.png',
    'items/spear.png',
    'items/bomb.png',
    'items/heart.png',
    'items/note.png',
    'items/book.png',
    'items/bow.png',
    'doodads/stairdown.png',
    // Use the actual stairup filename present in the repo; TextureLoader will accept both names
    'doodads/stairup.png',
    'items/shovel.png',
    'items/points.png',
    'items/chest.png',
    'doodads/well.png',
    'doodads/hole.png',
    'doodads/deadtree.png',
    'doodads/pitfall.png',
    'fauna/penne.png',
    'fauna/squig.png',
    'fauna/nib.png',
    'fauna/rune.png',
    'fauna/crayn.png',
    'fauna/felt.png',
    'fauna/forge.png',
    'fauna/mark.png',
    'fauna/gouge.png',
    'fauna/gougeface.png',
    'fauna/axolotl.png',
    'fauna/forgeface.png',
    'fauna/axolotlface.png',
    'fauna/zard.png',
    'floors/frontier/desert.png',
    'flora/succulent.png',
    'flora/stump.png',
    'flora/blocklily.png',
    'flora/boulder.png',
    'sign.png',
    'items/horse.png',
    'protag/default.png',
    'protag/faceset.png',
    'items/arrow.png',
    'floors/interior/housetile.png',
    'floors/interior/house_wall_corner.png',
    'floors/interior/house_wall_side.png',
    'floors/interior/house_wall_open.png',
    'ui/arrow.png',
    'fx/smoke/smoke_frame_1.png',
    'fx/smoke/smoke_frame_2.png',
    'fx/smoke/smoke_frame_3.png',
    'fx/smoke/smoke_frame_4.png',
    'fx/smoke/smoke_frame_5.png',
    'fx/smoke/smoke_frame_6.png',
    'fx/splode/splode_1.png',
    'fx/splode/splode_2.png',
    'fx/splode/splode_3.png',
    'fx/splode/splode_4.png',
    'fx/splode/splode_5.png',
    'fx/splode/splode_6.png',
    'fx/splode/splode_7.png',
    'fx/splode/splode_8.png'
    , 'fx/fog.png'
];

// Food image assets
export const FOOD_ASSETS = [
    'food/meat/beaf.png',
    'food/veg/nut.png',
    'food/aguamelin.png'
];

export const TOTAL_IMAGES = IMAGE_ASSETS.length + FOOD_ASSETS.length;

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
