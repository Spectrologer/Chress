// Spawn probability constants

interface FoodWaterProbabilities {
    UNDERGROUND_AGUAMELIN: number;
    HOME: number;
    WOODS: number;
    WILDS: number;
    FRONTIER: number;
}

interface SpecialItemsProbabilities {
    SQUIG: number;
    PENNE: number;
    NIB: number;
    MARK: number;
    RUNE: number;
    NOTE: number;
    BISHOP_SPEAR: number;
    HORSE_ICON: number;
    BOMB: number;
    HEART: number;
    BOW: number;
    SHOVEL: number;
    PITFALL: number;
    FISCHERS_WAND: number;
}

interface InteriorProbabilities {
    HOME_PENNE_NPC: number;
    HOME_SQUIG_NPC: number;
    GOSSIP_NPC: number;
    SHACK_ITEM_1: number;
    SHACK_ITEM_2: number;
    SHACK_ITEM_3: number;
    SHACK_ITEM_4: number;
    SHACK_ITEM_5: number;
}

interface MazeProbabilities {
    UNDERGROUND: number;
    WOODS: number;
    WILDS: number;
    FRONTIER: number;
}

interface ChanceTilesProbabilities {
    SIGN: number;
    WATER: number;
    FOOD: number;
    BASE_CHANCE: number;
}

interface SurfaceEnemyProbabilities {
    HOME: number;
    WOODS: number;
    WILDS: number;
    FRONTIER: number;
}

interface UndergroundEnemyProbabilities {
    HOME: number;
    WOODS: number;
    WILDS: number;
    FRONTIER: number;
    PITFALL_MULTIPLIER: number;
}

interface EnemyTypeDistribution {
    LIZARDY?: number;
    LIZARDO?: number;
    LIZARDEAUX?: number;
    ZARD?: number;
    LIZORD?: number;
    LAZERD?: number;
}

interface EnemyTypesProbabilities {
    LEVEL_1_HOME: EnemyTypeDistribution;
    LEVEL_2_WOODS: EnemyTypeDistribution;
    LEVEL_3_WILDS: EnemyTypeDistribution;
    LEVEL_4_FRONTIER: EnemyTypeDistribution;
}

export const SPAWN_PROBABILITIES = {
    // Feature spawning
    CISTERN: 0.07, // Surface cistern spawn chance (7%)
    STAIRS_DOWN: 0.15, // Underground stairs spawn chance (15%)
    INTERCONNECTED_HOME: 0.95, // Interconnected home zone connections (95%)

    // Food/Water spawning by zone
    FOOD_WATER: {
        UNDERGROUND_AGUAMELIN: 0.02, // 2% chance for aguamelin underground
        HOME: 0.40, // 40% chance in home zone
        WOODS: 0.25, // 25% chance in woods zone
        WILDS: 0.15, // 15% chance in wilds zone
        FRONTIER: 0.05 // 5% chance in frontier zone
    } as FoodWaterProbabilities,

    // Special item spawning
    SPECIAL_ITEMS: {
        SQUIG: 0.03, // Surface only
        PENNE: 0.03, // Surface only
        NIB: 0.05, // Underground only
        MARK: 0.03, // Surface only
        RUNE: 0.05, // Underground only
        NOTE: 0.04, // Activated item, any dimension
        BISHOP_SPEAR: 0.04, // Activated item, levels 1-4
        HORSE_ICON: 0.04, // Activated item, levels 1-4
        BOMB: 0.04, // Activated item, levels 1-4
        HEART: 0.04, // Levels 1-4
        BOW: 0.04, // Activated item, levels 1-4
        SHOVEL: 0.04, // Activated item, levels 1-4
        PITFALL: 0.03, // Surface, levels 2-4
        FISCHERS_WAND: 0.015 // Activated item, levels 1-4 (very powerful)
    } as SpecialItemsProbabilities,

    // Interior/Shack spawning
    INTERIOR: {
        HOME_PENNE_NPC: 0.2, // 20% chance for Penne NPC in home
        HOME_SQUIG_NPC: 0.1, // 10% chance for Squig NPC in home
        GOSSIP_NPC: 0.01, // 1% chance for gossip NPCs across levels
        SHACK_ITEM_1: 0.25, // First additional item
        SHACK_ITEM_2: 0.20, // Second additional item
        SHACK_ITEM_3: 0.15, // Third additional item
        SHACK_ITEM_4: 0.10, // Fourth additional item
        SHACK_ITEM_5: 0.05 // Fifth additional item
    } as InteriorProbabilities,

    // Maze generation by zone
    MAZE: {
        UNDERGROUND: 0.4, // 40% maze chance underground
        WOODS: 0.05, // 5% maze chance in woods
        WILDS: 0.08, // 8% maze chance in wilds
        FRONTIER: 0.10 // 10% maze chance in frontier
    } as MazeProbabilities,

    // Chance tile distribution
    CHANCE_TILES: {
        SIGN: 0.05, // 5% signs
        WATER: 0.35, // 35% water
        FOOD: 0.65, // 65% food (remaining probability)
        BASE_CHANCE: 0.15 // Base 15% for chance tiles (depth-scaled)
    } as ChanceTilesProbabilities,

    // Enemy spawning by zone (surface)
    SURFACE_ENEMY: {
        HOME: 0.11, // 11% base
        WOODS: 0.15, // 15% base
        WILDS: 0.17, // 17% base
        FRONTIER: 0.22 // 22% base
        // Note: Modified by (zoneCounter/10 * 0.01) in code
    } as SurfaceEnemyProbabilities,

    // Enemy spawning by zone (underground)
    UNDERGROUND_ENEMY: {
        HOME: 0.15, // 15% base
        WOODS: 0.20, // 20% base
        WILDS: 0.22, // 22% base
        FRONTIER: 0.27, // 27% base
        PITFALL_MULTIPLIER: 2.5 // Multiplied by 2.5 if from pitfall
    } as UndergroundEnemyProbabilities,

    // Enemy type distribution by zone level
    ENEMY_TYPES: {
        LEVEL_1_HOME: {
            LIZARDY: 0.80,
            LIZARDO: 0.15,
            LIZARDEAUX: 0.05
        },
        LEVEL_2_WOODS: {
            LIZARDY: 0.50,
            LIZARDO: 0.25,
            LIZARDEAUX: 0.10,
            ZARD: 0.10,
            LIZORD: 0.05
        },
        LEVEL_3_WILDS: {
            LIZARDY: 0.20,
            LIZARDO: 0.20,
            LIZARDEAUX: 0.20,
            ZARD: 0.20,
            LIZORD: 0.10,
            LAZERD: 0.10
        },
        LEVEL_4_FRONTIER: {
            LIZARDEAUX: 0.25,
            LIZARDY: 0.25,
            LIZORD: 0.25,
            LAZERD: 0.15,
            ZARD: 0.10
        }
    } as EnemyTypesProbabilities
};
