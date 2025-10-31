/**
 * NPCLoader - Load NPC data from JSON files
 *
 * This module handles loading NPC configurations from the characters/ folder
 * and converting them to the format expected by ContentRegistry.
 */

import { TILE_TYPES } from './constants/index.js';
import { npcList } from 'virtual:npc-list';

/**
 * NPC character data loaded from JSON files
 */
const npcCharacterData = new Map();

/**
 * Load a single NPC from JSON data
 * @param {Object} npcData - The parsed JSON data
 */
function loadNPCFromJSON(npcData) {
    // Store the full character data for later use
    npcCharacterData.set(npcData.id, npcData);

    // Convert to ContentRegistry format
    const registryConfig = {
        tileType: TILE_TYPES[npcData.display.tileType],
        action: npcData.type === 'dialogue' ? 'dialogue' : 'barter',
        placement: {}
    };

    // Handle placement
    if (npcData.placement) {
        if (npcData.placement.zone) {
            // Fixed or special placement - map zone coordinates to zone names
            const zoneParts = npcData.placement.zone.split(',');
            if (zoneParts.length === 2 && zoneParts[0] === '0' && zoneParts[1] === '0') {
                // Zone 0,0 maps to home_interior or home_underground depending on dimension
                if (npcData.placement.dimension === 2) {
                    registryConfig.placement.zone = 'home_underground';
                } else if (npcData.placement.dimension === 1) {
                    registryConfig.placement.zone = 'home_interior';
                }
            }
            registryConfig.placement.x = npcData.placement.x;
            registryConfig.placement.y = npcData.placement.y;
            registryConfig.placement.dimension = npcData.placement.dimension;
        } else {
            // Procedural placement
            registryConfig.placement.dimension = npcData.placement.dimension;
        }

        // Add spawn weight if it exists
        if (npcData.placement.spawnWeight !== undefined) {
            registryConfig.placement.spawnWeight = npcData.placement.spawnWeight;
        }
    }

    // Store additional metadata
    registryConfig.metadata = {
        characterData: npcData,
        name: npcData.name,
        portrait: npcData.display.portrait,
        sprite: npcData.display.sprite
    };

    return registryConfig;
}

/**
 * Load all NPC JSON files
 * Auto-discovers NPCs from src/characters/*.json files
 * @param {Object} registry - ContentRegistry instance to register NPCs to
 * @returns {Promise<void>}
 */
export async function loadAllNPCs(registry) {
    if (!registry || typeof registry.registerNPC !== 'function') {
        throw new Error('NPCLoader.loadAllNPCs requires a valid ContentRegistry instance');
    }

    const npcFiles = npcList;

    const loadPromises = npcFiles.map(async (npcId) => {
        try {
            // Use relative path that works with base URL configuration
            // In dev, files are at /src/characters/
            // In production (after viteStaticCopy), files are at /characters/ (relative to base)
            const basePath = import.meta.env.BASE_URL || '/';
            const isProduction = import.meta.env.PROD;
            const characterPath = isProduction ? 'characters' : 'src/characters';
            const response = await fetch(`${basePath}${characterPath}/${npcId}.json`);
            if (!response.ok) {
                console.warn(`[NPCLoader] Failed to load ${npcId}.json: ${response.status}`);
                return;
            }

            const npcData = await response.json();
            const registryConfig = loadNPCFromJSON(npcData);

            registry.registerNPC(npcId, registryConfig);
            // console.log(`[NPCLoader] Loaded NPC: ${npcId}`);
        } catch (error) {
            console.error(`[NPCLoader] Error loading ${npcId}:`, error);
        }
    });

    await Promise.all(loadPromises);
}

/**
 * Get full character data for an NPC
 * @param {string} npcId - The NPC identifier
 * @returns {Object|null} The full character data or null if not found
 */
export function getNPCCharacterData(npcId) {
    return npcCharacterData.get(npcId) || null;
}

/**
 * Get all loaded NPC character data
 * @returns {Map<string, Object>} Map of NPC ID to character data
 */
export function getAllNPCCharacterData() {
    return new Map(npcCharacterData);
}
