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
