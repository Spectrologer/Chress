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
    TABLE: 56,
    HOLE: 57, // Hole tile type
    // New NPCs
    ASTER: 58,
    BLOT: 59,
    BLOTTER: 60,
    BRUSH: 61,
    BURIN: 62,
    CALAMUS: 63,
    CAP: 64,
    CINNABAR: 65,
    CROCK: 66,
    FILUM: 67,
    FORK: 68,
    GEL: 69,
    GOUACHE: 70,
    HANE: 71,
    KRAFT: 72,
    MERKI: 73,
    MICRON: 74,
    PENNI: 75,
    PLUMA: 76,
    PLUME: 77,
    QUILL: 78,
    RADDLE: 79,
    SCRITCH: 80,
    SILVER: 81,
    SINE: 82,
    SLATE: 83,
    SLICK: 84,
    SLUG: 85,
    STYLET: 86,
    VELLUM: 87,
    // Item statue tile types (stone statues of activated items)
    BOMB_STATUE: 50,
    SPEAR_STATUE: 51,
    BOW_STATUE: 52,
    HORSE_STATUE: 53,
    BOOK_STATUE: 54,
    SHOVEL_STATUE: 55
} as const;

// Type for tile type values
export type TileType = typeof TILE_TYPES[keyof typeof TILE_TYPES];

// Colors for different tile types (fallback when images don't load)
export const TILE_COLORS: Record<number, string> = {
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
    [TILE_TYPES.PITFALL]: '#ffcb8d', // Same as floor, should be mostly invisible
    [TILE_TYPES.TABLE]: '#A0522D', // Sienna for table fallback
    // New NPC colors
    [TILE_TYPES.ASTER]: '#9370DB', // Medium purple for Aster
    [TILE_TYPES.BLOT]: '#2F4F4F', // Dark slate gray for Blot
    [TILE_TYPES.BLOTTER]: '#D3D3D3', // Light gray for Blotter
    [TILE_TYPES.BRUSH]: '#FF6347', // Tomato for Brush
    [TILE_TYPES.BURIN]: '#A9A9A9', // Dark gray for Burin
    [TILE_TYPES.CALAMUS]: '#8FBC8F', // Dark sea green for Calamus
    [TILE_TYPES.CAP]: '#4682B4', // Steel blue for Cap
    [TILE_TYPES.CINNABAR]: '#DC143C', // Crimson for Cinnabar
    [TILE_TYPES.CROCK]: '#8B4513', // Saddle brown for Crock
    [TILE_TYPES.FILUM]: '#F0E68C', // Khaki for Filum
    [TILE_TYPES.FORK]: '#C0C0C0', // Silver for Fork
    [TILE_TYPES.GEL]: '#7FFFD4', // Aquamarine for Gel
    [TILE_TYPES.GOUACHE]: '#FF69B4', // Hot pink for Gouache
    [TILE_TYPES.HANE]: '#FFE4E1', // Misty rose for Hane
    [TILE_TYPES.KRAFT]: '#D2691E', // Chocolate for Kraft
    [TILE_TYPES.MERKI]: '#BA55D3', // Medium orchid for Merki
    [TILE_TYPES.MICRON]: '#000000', // Black for Micron
    [TILE_TYPES.PENNI]: '#4169E1', // Royal blue for Penni
    [TILE_TYPES.PLUMA]: '#FAEBD7', // Antique white for Pluma
    [TILE_TYPES.PLUME]: '#DDA0DD', // Plum for Plume
    [TILE_TYPES.QUILL]: '#F5DEB3', // Wheat for Quill
    [TILE_TYPES.RADDLE]: '#CD5C5C', // Indian red for Raddle
    [TILE_TYPES.SCRITCH]: '#696969', // Dim gray for Scritch
    [TILE_TYPES.SILVER]: '#C0C0C0', // Silver for Silver
    [TILE_TYPES.SINE]: '#00CED1', // Dark turquoise for Sine
    [TILE_TYPES.SLATE]: '#708090', // Slate gray for Slate
    [TILE_TYPES.SLICK]: '#20B2AA', // Light sea green for Slick
    [TILE_TYPES.SLUG]: '#556B2F', // Dark olive green for Slug
    [TILE_TYPES.STYLET]: '#B8860B', // Dark goldenrod for Stylet
    [TILE_TYPES.VELLUM]: '#FFFAF0', // Floral white for Vellum
    // Stone statue fallbacks (grey) for item statues
    [TILE_TYPES.BOMB_STATUE]: '#A0A0A0',
    [TILE_TYPES.SPEAR_STATUE]: '#A0A0A0',
    [TILE_TYPES.BOW_STATUE]: '#A0A0A0',
    [TILE_TYPES.HORSE_STATUE]: '#A0A0A0',
    [TILE_TYPES.BOOK_STATUE]: '#A0A0A0',
    [TILE_TYPES.SHOVEL_STATUE]: '#A0A0A0'
};

// Direction constants for exits and movements
export const DIRECTIONS = {
    NORTH: 'north',
    SOUTH: 'south',
    EAST: 'east',
    WEST: 'west'
} as const;

export type Direction = typeof DIRECTIONS[keyof typeof DIRECTIONS];
