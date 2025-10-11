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
    MARK: 43
};

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
    [TILE_TYPES.MARK]: '#FFD700' // Gold for Mark
};

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
    'items/water.png',
    'protag/Special2.png',
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
    'items/points.png',
    'items/chest.png',
    'doodads/well.png',
    'doodads/deadtree.png',
    'fauna/lion.png',
    'fauna/squig.png',
    'fauna/nib.png',
    'fauna/rune.png',
    'fauna/crayn.png',
    'fauna/felt.png',
    'fauna/forge.png',
    'fauna/mark.png',
    'fauna/forgeface.png',
    'fauna/zard.png',
    'floors/frontier/desert.png',
    'flora/succulent.png',
    'flora/stump.png',
    'flora/blocklily.png',
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
];

// Food image assets
export const FOOD_ASSETS = [
    'food/meat/beaf.png',
    'food/veg/nut.png'
];

export const TOTAL_IMAGES = IMAGE_ASSETS.length + FOOD_ASSETS.length;
