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
    SPEAR: 12,
    SHRUBBERY: 13,
    // Tinted dirt tiles for special zone
    PINK_FLOOR: 14,
    RED_FLOOR: 15,
    ORANGE_FLOOR: 16,
    PURPLE_FLOOR: 17,
    BLUE_FLOOR: 18,
    GREEN_FLOOR: 19,
    YELLOW_FLOOR: 20
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
    [TILE_TYPES.SPEAR]: '#8B4513',   // Brown for spear
    [TILE_TYPES.SHRUBBERY]: '#228B22', // Green for shrubbery
    [TILE_TYPES.PINK_FLOOR]: '#FFB6C1',    // Light pink
    [TILE_TYPES.RED_FLOOR]: '#DC143C',     // Crimson red
    [TILE_TYPES.ORANGE_FLOOR]: '#FFA500', // Orange
    [TILE_TYPES.PURPLE_FLOOR]: '#9370DB',   // Medium purple
    [TILE_TYPES.BLUE_FLOOR]: '#00BFFF',   // Deep sky blue
    [TILE_TYPES.GREEN_FLOOR]: '#32CD32',  // Lime green
    [TILE_TYPES.YELLOW_FLOOR]: '#FFD700'  // Gold
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
    'house.png',
    'water.png',
    'SeparateAnim/Special2.png',
    'SeparateAnim/dead.png',
    'fauna/lizardy.png',
    'fauna/lizardo.png',
    'axe.png',
    'hammer.png',
    'spear.png',
    'note.png',
    'floors/frontier/desert.png',
    'flora/succulent.png'
];

// Food image assets
export const FOOD_ASSETS = [
    'Food/meat/Beaf.png',
    'Food/meat/Calamari.png',
    'Food/meat/Fish.png',
    'Food/FortuneCookie.png',
    'Food/Honey.png',
    'Food/meat/Meat.png',
    'Food/Noodle.png',
    'Food/nut/Nut.png',
    'Food/nut/Nut2.png',
    'Food/meat/Octopus.png',
    'Food/sushi/Onigiri.png',
    'Food/seeds/Seed1.png',
    'Food/seeds/Seed2.png',
    'Food/seeds/Seed3.png',
    'Food/seeds/SeedBig1.png',
    'Food/seeds/SeedBig2.png',
    'Food/seeds/SeedBig3.png',
    'Food/seeds/SeedLarge.png',
    'Food/seeds/SeedLargeWhite.png',
    'Food/meat/Shrimp.png',
    'Food/sushi/Sushi.png',
    'Food/sushi/Sushi2.png',
    'Food/TeaLeaf.png',
    'Food/meat/Yakitori.png'
];

export const TOTAL_IMAGES = IMAGE_ASSETS.length + FOOD_ASSETS.length;
