// Simulation constants
export const SIMULATION_CONSTANTS = {
    DEFEAT_DAMAGE: 999, // Damage dealt when enemy is defeated
    VICTORY_POINTS: 1 // Points awarded for defeating enemy
} as const;

// Zone positioning constants
export const ZONE_CONSTANTS = {
    PLAYER_SPAWN_POSITION: { x: 4, y: 7 }, // Default player spawn position
    HOUSE_START_POSITION: { x: 3, y: 3 }, // House center position
    SHACK_START_POSITION: { x: 3, y: 3 }, // Shack center position
    SHACK_SIZE: 3, // Shack is 3x3 tiles
    SHACK_PORT_OFFSET: { x: 1, y: 2 }, // Port placement offset within shack (dx, dy)
    ZONE_GENERATION_START: { x: 3, y: 3 } // Zone generation start position
} as const;

// Inventory constants
export const INVENTORY_CONSTANTS = {
    MAX_INVENTORY_SIZE: 6, // Maximum items in player inventory
    RADIAL_MAX_SIZE: 8 // Maximum items in radial inventory
} as const;

// Dimension/depth constants
export const DIMENSION_CONSTANTS = {
    SURFACE: 0, // Surface dimension code
    INTERIOR: 1, // Interior (houses, shacks) dimension code
    UNDERGROUND: 2, // Underground dimension code
    DEFAULT_SURFACE_DEPTH: 0, // Default depth for surface
    DEFAULT_UNDERGROUND_DEPTH: 1 // Initial underground depth
} as const;

export type Dimension = typeof DIMENSION_CONSTANTS[keyof Pick<typeof DIMENSION_CONSTANTS, 'SURFACE' | 'INTERIOR' | 'UNDERGROUND'>];

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
} as const;
