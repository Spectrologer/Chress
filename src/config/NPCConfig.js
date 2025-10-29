import { TILE_TYPES } from '../core/constants/index.js';

/**
 * Centralized NPC configuration
 * Maps NPC names to their tile types and interaction behaviors
 */
export const NPC_CONFIG = {
    penne: {
        tileType: TILE_TYPES.PENNE,
        action: 'barter'
    },
    squig: {
        tileType: TILE_TYPES.SQUIG,
        action: 'barter'
    },
    rune: {
        tileType: TILE_TYPES.RUNE,
        action: 'barter'
    },
    nib: {
        tileType: TILE_TYPES.NIB,
        action: 'barter'
    },
    mark: {
        tileType: TILE_TYPES.MARK,
        action: 'barter'
    },
    axelotl: {
        tileType: TILE_TYPES.AXELOTL,
        action: 'barter'
    },
    gouge: {
        tileType: TILE_TYPES.GOUGE,
        action: 'barter'
    },
    crayn: {
        tileType: TILE_TYPES.CRAYN,
        action: 'dialogue'
    },
    felt: {
        tileType: TILE_TYPES.FELT,
        action: 'dialogue'
    },
    forge: {
        tileType: TILE_TYPES.FORGE,
        action: 'dialogue'
    }
};

/**
 * Get NPC configuration by name
 * @param {string} npcName - The name of the NPC
 * @returns {Object|null} The NPC configuration or null if not found
 */
export function getNPCConfig(npcName) {
    return NPC_CONFIG[npcName] || null;
}

/**
 * Get all NPC names
 * @returns {string[]} Array of NPC names
 */
export function getAllNPCNames() {
    return Object.keys(NPC_CONFIG);
}

/**
 * Check if a tile type corresponds to an NPC
 * @param {number} tileType - The tile type to check
 * @returns {string|null} The NPC name if found, null otherwise
 */
export function getNPCNameByTileType(tileType) {
    for (const [npcName, config] of Object.entries(NPC_CONFIG)) {
        if (config.tileType === tileType) {
            return npcName;
        }
    }
    return null;
}
