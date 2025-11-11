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
    SHOVEL_STATUE: 55,
    // New gossip NPCs (added 2025-11-11)
    FUDE: 140,
    SPITZE: 141,
    LUPI: 142,
    DINKUS: 143,
    CARTOUCHE: 144,
    CRETA: 145,
    KAJI: 146,
    DASH: 147,
    EM: 148,
    FASCIA: 149,
    BULLET: 150,
    COURSIER: 151,
    PUNTO: 152,
    Y: 153,
    SPECTRUM: 154,
    PALIMPSEST: 155,
    BLADDER: 156,
    FASCINUS: 157,
    FONT: 158,
    GRAWLIX: 159
} as const;

// Type for tile type values
export type TileType = typeof TILE_TYPES[keyof typeof TILE_TYPES];

// Colors for different tile types (fallback when images don't load)
export const TILE_COLORS: Record<number, string> = {
    [TILE_TYPES.FLOOR]: '#ffe478',
    [TILE_TYPES.WALL]: '#964253',
    [TILE_TYPES.GRASS]: '#3CA370',
    [TILE_TYPES.EXIT]: '#ffe478',  // Same as floor - opening is indicator enough
    [TILE_TYPES.ROCK]: '#606070',
    [TILE_TYPES.HOUSE]: '#EB564B',  // Brown/orange for house
    [TILE_TYPES.WATER]: '#4B5BAB',  // Blue for water
    [TILE_TYPES.FOOD]: '#EB564B',    // Red/orange for food
    [TILE_TYPES.ENEMY]: '#3CA370',   // Lime green for enemy
    [TILE_TYPES.NOTE]: '#cfff70',    // Yellow for note
    [TILE_TYPES.HAMMER]: '#964253',  // Brown for hammer
    [TILE_TYPES.BISHOP_SPEAR]: '#964253',   // Brown for bishop spear
    [TILE_TYPES.HORSE_ICON]: '#964253', // Brown for horse icon
    [TILE_TYPES.SHRUBBERY]: '#3CA370', // Green for shrubbery
    [TILE_TYPES.WELL]: '#EB564B',   // Brown/orange for well
    [TILE_TYPES.DEADTREE]: '#964253',   // Brown for deadtree
    [TILE_TYPES.PENNE]: '#4B5BAB',    // Blueviolet for Penne
    [TILE_TYPES.SQUIG]: '#4B5BAB',   // Blueviolet for squig
    [TILE_TYPES.NIB]: '#4B5BAB',     // Blueviolet for nib
    [TILE_TYPES.RUNE]: '#4B5BAB',    // Blueviolet for rune
    [TILE_TYPES.BOMB]: '#eb564b',  // Red for bomb
    [TILE_TYPES.HEART]: '#FF6B97', // Hot pink for heart
    [TILE_TYPES.SIGN]: '#964253', // Saddle brown for sign
    [TILE_TYPES.PORT]: '#ffe478', // Same as floor, transparent
    [TILE_TYPES.CRAYN]: '#4B5BAB', // Blueviolet for Crayn
    [TILE_TYPES.FELT]: '#4B5BAB', // Blueviolet for Felt
    [TILE_TYPES.FORGE]: '#4B5BAB', // Blueviolet for Forge
    [TILE_TYPES.BOOK_OF_TIME_TRAVEL]: '#EB564B', // Chocolate color for book
    [TILE_TYPES.BOW]: '#964253', // Brown for bow
    [TILE_TYPES.MARK]: '#f2a65e', // Gold for Mark
    [TILE_TYPES.CISTERN]: '#7e7e8f', // Slate gray for cistern
    [TILE_TYPES.SHACK]: '#964253', // Brown for shack
    [TILE_TYPES.SHOVEL]: '#964253', // Brown for shovel
    [TILE_TYPES.GOUGE]: '#4B5BAB', // Blueviolet for Gouge
    [TILE_TYPES.PITFALL]: '#ffe478', // Same as floor, should be mostly invisible
    [TILE_TYPES.TABLE]: '#964253', // Sienna for table fallback
    [TILE_TYPES.FISCHERS_CUBE]: '#66FFE3', // Sky blue for Fischer's Cube
    [TILE_TYPES.TELEPORT_BRANCH]: '#964253', // Brown for teleport branch
    // New NPC colors
    [TILE_TYPES.ASTER]: '#7E7E8F', // Medium purple for Aster
    [TILE_TYPES.BLOT]: '#323E4F', // Dark slate gray for Blot
    [TILE_TYPES.BLOTTER]: '#C2C2D1', // Light gray for Blotter
    [TILE_TYPES.BRUSH]: '#EB564B', // Tomato for Brush
    [TILE_TYPES.BURIN]: '#C2C2D1', // Dark gray for Burin
    [TILE_TYPES.CALAMUS]: '#8FDE5D', // Dark sea green for Calamus
    [TILE_TYPES.CAP]: '#4B5BAB', // Steel blue for Cap
    [TILE_TYPES.CINNABAR]: '#B0305C', // Crimson for Cinnabar
    [TILE_TYPES.CROCK]: '#964253', // Saddle brown for Crock
    [TILE_TYPES.FILUM]: '#FFE478', // Khaki for Filum
    [TILE_TYPES.FORK]: '#C2C2D1', // Silver for Fork
    [TILE_TYPES.GEL]: '#66FFE3', // Aquamarine for Gel
    [TILE_TYPES.GOUACHE]: '#FF6B97', // Hot pink for Gouache
    [TILE_TYPES.HANE]: '#FFFFEB', // Misty rose for Hane
    [TILE_TYPES.KRAFT]: '#EB564B', // Chocolate for Kraft
    [TILE_TYPES.MERKI]: '#BD4882', // Medium orchid for Merki
    [TILE_TYPES.MICRON]: '#272736', // Black for Micron
    [TILE_TYPES.PENNI]: '#4B5BAB', // Royal blue for Penni
    [TILE_TYPES.PLUMA]: '#FFFFEB', // Antique white for Pluma
    [TILE_TYPES.PLUME]: '#C2C2D1', // Plum for Plume
    [TILE_TYPES.QUILL]: '#FFB5B5', // Wheat for Quill
    [TILE_TYPES.RADDLE]: '#BA6156', // Indian red for Raddle
    [TILE_TYPES.SCRITCH]: '#606070', // Dim gray for Scritch
    [TILE_TYPES.SILVER]: '#C2C2D1', // Silver for Silver
    [TILE_TYPES.SINE]: '#4DA6FF', // Dark turquoise for Sine
    [TILE_TYPES.SLATE]: '#7e7e8f', // Slate gray for Slate
    [TILE_TYPES.SLICK]: '#3CA370', // Light sea green for Slick
    [TILE_TYPES.SLUG]: '#43434F', // Dark olive green for Slug
    [TILE_TYPES.STYLET]: '#BA6156', // Dark goldenrod for Stylet
    [TILE_TYPES.VELLUM]: '#FFFFEB', // Floral white for Vellum
    // New gossip NPC colors
    [TILE_TYPES.BIT]: '#FFB5B5', // Light pink for Bit
    [TILE_TYPES.BLOCK]: '#C2C2D1', // Dark gray for Block
    [TILE_TYPES.CALLI]: '#FF6B97', // Orchid for Calli
    [TILE_TYPES.CAPYBARA]: '#FFB570', // Tan for Capybara
    [TILE_TYPES.FLEX]: '#4B5BAB', // Steel blue for Flex
    [TILE_TYPES.GELINKA]: '#FFFFEB', // Light cyan for Gelinka
    [TILE_TYPES.GOMA]: '#FFB5B5', // Moccasin for Goma
    [TILE_TYPES.HIGHLIGHT]: '#cfff70', // Yellow for Highlight
    [TILE_TYPES.HOJA]: '#8FDE5D', // Pale green for Hoja
    [TILE_TYPES.MIDORI]: '#3ca370', // Lime for Midori
    [TILE_TYPES.NUB]: '#EB564B', // Chocolate for Nub
    [TILE_TYPES.POLLY]: '#FFE478', // Khaki for Polly
    [TILE_TYPES.PULP]: '#FFB570', // Burlywood for Pulp
    [TILE_TYPES.REDAKT]: '#B0305C', // Crimson for Redakt
    [TILE_TYPES.SCRAPE]: '#964253', // Sienna for Scrape
    [TILE_TYPES.SCROLL]: '#FFB5B5', // Wheat for Scroll
    [TILE_TYPES.SHADE]: '#323E4F', // Dark slate gray for Shade
    [TILE_TYPES.SKRIB]: '#5A265E', // Indigo for Skrib
    [TILE_TYPES.STICK]: '#964253', // Saddle brown for Stick
    [TILE_TYPES.WASH]: '#66FFE3', // Sky blue for Wash
    // New doodad colors
    [TILE_TYPES.ANEMONE]: '#BD4882', // Deep pink for Anemone
    [TILE_TYPES.BIG_TREE]: '#3CA370', // Forest green for Big Tree
    [TILE_TYPES.BLUE_SHROOM]: '#4B5BAB', // Royal blue for Blue Shroom
    [TILE_TYPES.CACTUS]: '#3CA370', // Lime green for Cactus
    [TILE_TYPES.CACTUS2]: '#8FDE5D', // Yellow green for Cactus2
    [TILE_TYPES.GREEN_SHROOM]: '#3ca370', // Green for Green Shroom
    [TILE_TYPES.SMALL_EVERGREEN]: '#272736', // Dark green for Small Evergreen
    [TILE_TYPES.URCHIN]: '#80366B', // Dark magenta for Urchin
    // Sign variant colors
    [TILE_TYPES.SIGN_BLANK]: '#EB564B', // Chocolate for Blank Sign
    [TILE_TYPES.SIGN_EATEN]: '#964253', // Saddle brown for Eaten Sign
    [TILE_TYPES.SIGN_GOLD]: '#f2a65e', // Gold for Gold Sign
    [TILE_TYPES.SIGN_METAL]: '#C2C2D1', // Silver for Metal Sign
    [TILE_TYPES.SIGN_METAL_ALT]: '#C2C2D1', // Dark gray for Metal Alt Sign
    // Individual enemy type colors
    [TILE_TYPES.LIZARDY]: '#8FDE5D', // Light green for Lizardy
    [TILE_TYPES.LIZARDO]: '#8FDE5D', // Lawn green for Lizardo
    [TILE_TYPES.LIZARDEAUX]: '#3CA370', // Lime green for Lizardeaux
    [TILE_TYPES.ZARD]: '#3ca370', // Green for Zard
    [TILE_TYPES.LIZORD]: '#3CA370', // Forest green for Lizord
    [TILE_TYPES.LAZERD]: '#272736', // Dark green for Lazerd
    // Black enemy variants
    [TILE_TYPES.BLACK_LIZARDY]: '#43434F', // Dark gray for Black Lizardy
    [TILE_TYPES.BLACK_LIZARDO]: '#43434F', // Darker gray for Black Lizardo
    [TILE_TYPES.BLACK_LIZARDEAUX]: '#272736', // Even darker for Black Lizardeaux
    [TILE_TYPES.BLACK_ZARD]: '#272736', // Very dark for Black Zard
    [TILE_TYPES.BLACK_LIZORD]: '#272736', // Almost black for Black Lizord
    [TILE_TYPES.BLACK_LAZERD]: '#272736', // Black for Black Lazerd
    // New gossip NPC colors (added 2025-11-11)
    [TILE_TYPES.FUDE]: '#4b5bab', // Fude
    [TILE_TYPES.SPITZE]: '#b0305c', // Spitze
    [TILE_TYPES.LUPI]: '#ffe478', // Lupi
    [TILE_TYPES.DINKUS]: '#66ffe3', // Dinkus
    [TILE_TYPES.CARTOUCHE]: '#473b78', // Cartouche
    [TILE_TYPES.CRETA]: '#7e7e8f', // Creta
    [TILE_TYPES.KAJI]: '#ffb570', // Kaji
    [TILE_TYPES.DASH]: '#4da6ff', // Dash
    [TILE_TYPES.EM]: '#ffb5b5', // Em
    [TILE_TYPES.FASCIA]: '#57294b', // Fascia
    [TILE_TYPES.BULLET]: '#ba6156', // Bullet
    [TILE_TYPES.COURSIER]: '#73275c', // Coursier
    [TILE_TYPES.PUNTO]: '#272736', // Punto
    [TILE_TYPES.Y]: '#4b5bab', // Y
    [TILE_TYPES.SPECTRUM]: '#3ca370', // Spectrum
    [TILE_TYPES.PALIMPSEST]: '#4da6ff', // Palimpsest
    [TILE_TYPES.BLADDER]: '#ffe478', // Bladder
    [TILE_TYPES.FASCINUS]: '#272736', // Fascinus
    [TILE_TYPES.FONT]: '#ffb570', // Font
    [TILE_TYPES.GRAWLIX]: '#322947' // Grawlix
};

// Direction constants for exits and movements
export const DIRECTIONS = {
    NORTH: 'north',
    SOUTH: 'south',
    EAST: 'east',
    WEST: 'west'
} as const;

export type Direction = typeof DIRECTIONS[keyof typeof DIRECTIONS];
