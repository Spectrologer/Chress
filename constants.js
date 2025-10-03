// Game constants
export const GRID_SIZE = 10;
export const TILE_SIZE = 64;
export const CANVAS_SIZE = GRID_SIZE * TILE_SIZE; // 640x640 pixels

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
    SHRUBBERY: 12
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
    [TILE_TYPES.SHRUBBERY]: '#228B22' // Green for shrubbery
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
    'dirt.png',
    'rock.png',
    'dirt_north.png',
    'dirt_corner.png',
    'dirt_tunnel.png',
    'dirt_corner2.png',
    'shrubbery.png',
    'bush.png',
    'dircle.png',
    'house.png',
    'water.png',
    'SeparateAnim/Special2.png',
    'SeparateAnim/dead.png',
    'fauna/lizardy.png',
    'axe.png',
    'hammer.png',
    'note.png'
];

// Food image assets
export const FOOD_ASSETS = [
    'Food/Beaf.png',
    'Food/Calamari.png',
    'Food/Fish.png',
    'Food/FortuneCookie.png',
    'Food/Honey.png',
    'Food/Meat.png',
    'Food/Noodle.png',
    'Food/Nut.png',
    'Food/Nut2.png',
    'Food/Octopus.png',
    'Food/Onigiri.png',
    'Food/Seed1.png',
    'Food/Seed2.png',
    'Food/Seed3.png',
    'Food/SeedBig1.png',
    'Food/SeedBig2.png',
    'Food/SeedBig3.png',
    'Food/SeedLarge.png',
    'Food/SeedLargeWhite.png',
    'Food/Shrimp.png',
    'Food/Sushi.png',
    'Food/Sushi2.png',
    'Food/TeaLeaf.png',
    'Food/Yakitori.png'
];

export const TOTAL_IMAGES = IMAGE_ASSETS.length + FOOD_ASSETS.length;
