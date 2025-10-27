// Player stats and initialization constants

export const PLAYER_STATS = {
    // Initial player stats
    INITIAL_HEALTH: 3, // Starting health points
    INITIAL_THIRST: 50, // Starting thirst level (max is also 50)
    INITIAL_HUNGER: 50, // Starting hunger level (max is also 50)

    // Maximum stat values (some overlap with GAMEPLAY_CONSTANTS restoration amounts)
    MAX_THIRST: 50, // Maximum thirst level
    MAX_HUNGER: 50, // Maximum hunger level
};

// Note: Restoration amounts are in gameplay.js:
// - WATER_RESTORATION_AMOUNT: 10
// - FOOD_RESTORATION_AMOUNT: 10
// - HEART_RESTORATION_AMOUNT: 1
