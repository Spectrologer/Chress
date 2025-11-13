/**
 * NPCLoader - Load NPC data from JSON files
 *
 * This module handles loading NPC configurations from the characters/ folder
 * and converting them to the format expected by ContentRegistry.
 */

import { TILE_TYPES } from './constants/index';
import { npcList, npcPaths } from 'virtual:npc-list';
import type { TradeData } from './SharedTypes';
import type { ContentRegistry, NPCConfig } from './ContentRegistry';
import { logger } from '@core/logger';

interface DialogueNode {
    text: string;
    choices?: Array<{
        text: string;
        next?: string | number;
    }>;
}

interface NPCData {
    id: string;
    name: string;
    type: string;
    metadata?: {
        description?: string;
        created?: string;
        version?: string;
        category?: string;
        subcategory?: string;
    };
    display: {
        tileType: string;
        portrait?: string;
        sprite: string;
        portraitBackground?: string;
    };
    interaction?: {
        type?: string;
        greeting?: string;
        trades?: TradeData[];
        cycleMode?: string;
        dialogueTree?: DialogueNode[];
        message?: string; // For statue messages
    };
    audio?: {
        voicePitch?: number;
        voicePattern?: {
            notes: number[];              // Array of frequencies in Hz
            wave1?: string;               // Primary waveform: 'sine', 'triangle', 'sawtooth', 'square'
            wave2?: string;               // Secondary waveform
            rhythmVariation?: number[];   // Optional timing multipliers per note
            gain?: number;                // Volume (0-1)
            attack?: number;              // Attack time in seconds
            decay?: number;               // Decay time in seconds
        };
    };
    placement?: {
        zone?: string;
        x?: number;
        y?: number;
        dimension?: number;
        spawnWeight?: number;
    };
}

interface NPCPath {
    id: string;
    path: string;
}

/**
 * NPC character data loaded from JSON files
 */
const npcCharacterData = new Map<string, NPCData>();

/**
 * Statue data loaded from JSON files
 */
const statueData = new Map<string, NPCData>();

/**
 * Load a single NPC from JSON data
 */
function loadNPCFromJSON(npcData: NPCData): NPCConfig {
    // Store the full character data for later use
    npcCharacterData.set(npcData.id, npcData);

    // Convert to ContentRegistry format
    const registryConfig: NPCConfig = {
        tileType: (TILE_TYPES as Record<string, number>)[npcData.display.tileType],
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
        sprite: npcData.display.sprite,
        portraitBackground: npcData.display.portraitBackground
    };

    return registryConfig;
}

/**
 * Load all NPC JSON files
 * Auto-discovers NPCs from src/characters/*.json files
 */
export async function loadAllNPCs(registry: typeof ContentRegistry): Promise<void> {
    if (!registry || typeof registry.registerNPC !== 'function') {
        throw new Error('NPCLoader.loadAllNPCs requires a valid ContentRegistry instance');
    }

    // Use npcPaths if available (supports subdirectories), fallback to npcList
    const npcs: NPCPath[] = npcPaths && npcPaths.length > 0
        ? npcPaths
        : npcList.map((id: string) => ({ id, path: id }));

    const loadPromises = npcs.map(async (npc) => {
        try {
            // Use relative path that works with base URL configuration
            const basePath = import.meta.env.BASE_URL || '/';
            const isProduction = import.meta.env.PROD;
            const characterPath = isProduction ? 'characters' : 'src/characters';
            const response = await fetch(`${basePath}${characterPath}/${npc.path}.json`);
            if (!response.ok) {
                logger.warn(`[NPCLoader] Failed to load ${npc.path}.json: ${response.status}`);
                return;
            }

            const npcData: NPCData = await response.json();
            const registryConfig = loadNPCFromJSON(npcData);

            registry.registerNPC(npc.id, registryConfig);
        } catch (error) {
            logger.error(`[NPCLoader] Error loading ${npc.id}:`, error);
        }
    });

    await Promise.all(loadPromises);
}

/**
 * Get full character data for an NPC
 */
export function getNPCCharacterData(npcId: string): NPCData | null {
    return npcCharacterData.get(npcId) || null;
}

/**
 * Get all loaded NPC character data
 */
export function getAllNPCCharacterData(): Map<string, NPCData> {
    return new Map(npcCharacterData);
}

/**
 * Load all statue JSON files
 * Statues are simpler than NPCs - they just contain display messages
 */
export async function loadAllStatues(): Promise<void> {
    const statueTypes = [
        'lizardy', 'lizardo', 'lizardeaux', 'zard', 'lazerd', 'lizord',
        'bomb', 'spear', 'bow', 'horse', 'book', 'shovel', 'default'
    ];

    const loadPromises = statueTypes.map(async (statueType) => {
        try {
            const basePath = import.meta.env.BASE_URL || '/';
            const isProduction = import.meta.env.PROD;
            const characterPath = isProduction ? 'characters' : 'src/characters';
            const response = await fetch(`${basePath}${characterPath}/statues/${statueType}.json`);
            if (!response.ok) {
                logger.warn(`[NPCLoader] Failed to load statue ${statueType}.json: ${response.status}`);
                return;
            }

            const data: NPCData = await response.json();
            statueData.set(statueType, data);
        } catch (error) {
            logger.error(`[NPCLoader] Error loading statue ${statueType}:`, error);
        }
    });

    await Promise.all(loadPromises);
}

/**
 * Get statue data by type
 */
export function getStatueData(statueType: string): NPCData | null {
    return statueData.get(statueType) || statueData.get('default') || null;
}
