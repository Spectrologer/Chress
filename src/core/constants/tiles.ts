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
    // Individual enemy types
    LIZARDY: 127,
    LIZARDO: 128,
    LIZARDEAUX: 129,
    ZARD: 130,
    LIZORD: 131,
    LAZERD: 132,
    // Black enemy variants (grayscale)
    BLACK_LIZARDY: 133,
    BLACK_LIZARDO: 134,
    BLACK_LIZARDEAUX: 135,
    BLACK_ZARD: 136,
    BLACK_LIZORD: 137,
    BLACK_LAZERD: 138,
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
    FISCHERS_CUBE: 108, // Fischer's Cube - Shuffles enemies and obstacles
    TELEPORT_BRANCH: 110, // Teleportation Branch
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
    // New gossip NPCs
    BIT: 88,
    BLOCK: 89,
    CALLI: 90,
    CAPYBARA: 91,
    FLEX: 92,
    GELINKA: 93,
    GOMA: 94,
    HIGHLIGHT: 95,
    HOJA: 96,
    MIDORI: 97,
    NUB: 98,
    POLLY: 99,
    PULP: 100,
    REDAKT: 101,
    SCRAPE: 102,
    SCROLL: 103,
    SHADE: 104,
    SKRIB: 105,
    STICK: 106,
    WASH: 107,
    // Additional gossip NPCs
    DRAGON: 109,
    SNAK: 113,
    // New doodads from static/assets/environment/doodads
    ANEMONE: 114,
    BIG_TREE: 115,
    BLUE_SHROOM: 116,
    CACTUS: 117,
    CACTUS2: 118,
    GREEN_SHROOM: 119,
    SMALL_EVERGREEN: 120,
    URCHIN: 121,
    // Sign variants
    SIGN_BLANK: 122,
    SIGN_EATEN: 123,
    SIGN_GOLD: 124,
    SIGN_METAL: 125,
    SIGN_METAL_ALT: 126,
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
    [TILE_TYPES.FISCHERS_CUBE]: '#87CEEB', // Sky blue for Fischer's Cube
    [TILE_TYPES.TELEPORT_BRANCH]: '#8B4513', // Brown for teleport branch
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
    // New gossip NPC colors
    [TILE_TYPES.BIT]: '#FFB6C1', // Light pink for Bit
    [TILE_TYPES.BLOCK]: '#A9A9A9', // Dark gray for Block
    [TILE_TYPES.CALLI]: '#DA70D6', // Orchid for Calli
    [TILE_TYPES.CAPYBARA]: '#D2B48C', // Tan for Capybara
    [TILE_TYPES.FLEX]: '#4682B4', // Steel blue for Flex
    [TILE_TYPES.GELINKA]: '#E0FFFF', // Light cyan for Gelinka
    [TILE_TYPES.GOMA]: '#FFE4B5', // Moccasin for Goma
    [TILE_TYPES.HIGHLIGHT]: '#FFFF00', // Yellow for Highlight
    [TILE_TYPES.HOJA]: '#98FB98', // Pale green for Hoja
    [TILE_TYPES.MIDORI]: '#00FF00', // Lime for Midori
    [TILE_TYPES.NUB]: '#D2691E', // Chocolate for Nub
    [TILE_TYPES.POLLY]: '#F0E68C', // Khaki for Polly
    [TILE_TYPES.PULP]: '#DEB887', // Burlywood for Pulp
    [TILE_TYPES.REDAKT]: '#DC143C', // Crimson for Redakt
    [TILE_TYPES.SCRAPE]: '#A0522D', // Sienna for Scrape
    [TILE_TYPES.SCROLL]: '#F5DEB3', // Wheat for Scroll
    [TILE_TYPES.SHADE]: '#2F4F4F', // Dark slate gray for Shade
    [TILE_TYPES.SKRIB]: '#4B0082', // Indigo for Skrib
    [TILE_TYPES.STICK]: '#8B4513', // Saddle brown for Stick
    [TILE_TYPES.WASH]: '#87CEEB', // Sky blue for Wash
    // New doodad colors
    [TILE_TYPES.ANEMONE]: '#FF1493', // Deep pink for Anemone
    [TILE_TYPES.BIG_TREE]: '#228B22', // Forest green for Big Tree
    [TILE_TYPES.BLUE_SHROOM]: '#4169E1', // Royal blue for Blue Shroom
    [TILE_TYPES.CACTUS]: '#32CD32', // Lime green for Cactus
    [TILE_TYPES.CACTUS2]: '#9ACD32', // Yellow green for Cactus2
    [TILE_TYPES.GREEN_SHROOM]: '#00FF00', // Green for Green Shroom
    [TILE_TYPES.SMALL_EVERGREEN]: '#006400', // Dark green for Small Evergreen
    [TILE_TYPES.URCHIN]: '#8B008B', // Dark magenta for Urchin
    // Sign variant colors
    [TILE_TYPES.SIGN_BLANK]: '#D2691E', // Chocolate for Blank Sign
    [TILE_TYPES.SIGN_EATEN]: '#8B4513', // Saddle brown for Eaten Sign
    [TILE_TYPES.SIGN_GOLD]: '#FFD700', // Gold for Gold Sign
    [TILE_TYPES.SIGN_METAL]: '#C0C0C0', // Silver for Metal Sign
    [TILE_TYPES.SIGN_METAL_ALT]: '#A9A9A9', // Dark gray for Metal Alt Sign
    // Individual enemy type colors
    [TILE_TYPES.LIZARDY]: '#90EE90', // Light green for Lizardy
    [TILE_TYPES.LIZARDO]: '#7CFC00', // Lawn green for Lizardo
    [TILE_TYPES.LIZARDEAUX]: '#32CD32', // Lime green for Lizardeaux
    [TILE_TYPES.ZARD]: '#00FF00', // Green for Zard
    [TILE_TYPES.LIZORD]: '#228B22', // Forest green for Lizord
    [TILE_TYPES.LAZERD]: '#006400', // Dark green for Lazerd
    // Black enemy variants
    [TILE_TYPES.BLACK_LIZARDY]: '#4B4B4B', // Dark gray for Black Lizardy
    [TILE_TYPES.BLACK_LIZARDO]: '#3C3C3C', // Darker gray for Black Lizardo
    [TILE_TYPES.BLACK_LIZARDEAUX]: '#2D2D2D', // Even darker for Black Lizardeaux
    [TILE_TYPES.BLACK_ZARD]: '#1E1E1E', // Very dark for Black Zard
    [TILE_TYPES.BLACK_LIZORD]: '#0F0F0F', // Almost black for Black Lizord
    [TILE_TYPES.BLACK_LAZERD]: '#000000' // Black for Black Lazerd
};

// Direction constants for exits and movements
export const DIRECTIONS = {
    NORTH: 'north',
    SOUTH: 'south',
    EAST: 'east',
    WEST: 'west'
} as const;

export type Direction = typeof DIRECTIONS[keyof typeof DIRECTIONS];
