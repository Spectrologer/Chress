// @ts-check
// Asset Scanner Module - Dynamically reads game asset definitions
// v2.1 - Feltface moved to portraits folder
import { IMAGE_ASSETS, FOOD_ASSETS } from '/src/core/constants/index.js';
import { ContentRegistry } from '/src/core/ContentRegistry.js';
import { loadAllNPCs, getAllNPCCharacterData } from '/src/core/NPCLoader.js';

/**
 * @typedef {Object} AssetCategory
 * @property {string} asset - The asset path
 * @property {string} name - The display name
 * @property {string} path - The full path to the asset
 * @property {string} [type] - The type of asset
 * @property {string} [itemType] - For items: 'equipment', 'consumable', 'misc'
 * @property {string} [foodType] - For food items
 * @property {string} [floorType] - For floor tiles
 * @property {string} [effectType] - For effects: 'smoke', 'explosion', 'general'
 * @property {string|null} [frame] - Animation frame number
 */

/**
 * @typedef {Object} NPCAsset
 * @property {string} name - NPC name
 * @property {string} type - NPC type
 * @property {string|null} sprite - Path to sprite asset
 * @property {string|null} portrait - Path to portrait asset
 * @property {any} [trades] - Trade information if applicable
 * @property {string} key - NPC key identifier
 */

/**
 * @typedef {Object} NPCInfo
 * @property {string} name - NPC name
 * @property {string|null} portrait - Portrait path
 * @property {string|null} sprite - Sprite path
 * @property {string} type - NPC type
 * @property {any} [trades] - Trade information
 * @property {string} key - NPC key identifier
 */

/**
 * @typedef {Object} AssetCategories
 * @property {NPCAsset[]} npcs
 * @property {AssetCategory[]} enemies
 * @property {AssetCategory[]} items
 * @property {AssetCategory[]} food
 * @property {AssetCategory[]} ui
 * @property {AssetCategory[]} flora
 * @property {AssetCategory[]} doodads
 * @property {AssetCategory[]} floors
 * @property {AssetCategory[]} effects
 * @property {AssetCategory[]} protag
 * @property {AssetCategory[]} misc
 */

/**
 * AssetScanner class - Scans and categorizes game assets
 */
export class AssetScanner {
    constructor() {
        /** @type {AssetCategories} */
        this.categories = {
            npcs: [],
            enemies: [],
            items: [],
            food: [],
            ui: [],
            flora: [],
            doodads: [],
            floors: [],
            effects: [],
            protag: [],
            misc: []
        };

        /** @type {Record<string, NPCInfo>} */
        this.npcData = {};

        /** @type {boolean} */
        this.npcDataLoaded = false;

        /** @type {string[]} */
        this.enemyTypes = ['lizardy', 'lizardo', 'lizardeaux', 'lizord', 'lazerd', 'zard'];
    }

    /**
     * Load NPC data from JSON files
     * @returns {Promise<void>}
     */
    async loadNPCData() {
        if (this.npcDataLoaded) return;

        try {
            // Load all NPC character data from JSON files
            await loadAllNPCs(ContentRegistry);
            const allNPCData = getAllNPCCharacterData();

            // Convert to the format we need
            /** @type {Record<string, NPCInfo>} */
            const npcs = {};
            allNPCData.forEach((data, key) => {
                if (data.name) {
                    const npcType = data.interaction?.type || 'npc';
                    // Ensure paths are absolute
                    const portrait = data.display?.portrait;
                    const sprite = data.display?.sprite;
                    const npcInfo = {
                        name: data.name,
                        portrait: portrait ? (portrait.startsWith('/') ? portrait : '/' + portrait) : null,
                        sprite: sprite ? (sprite.startsWith('/') ? sprite : '/' + sprite) : null,
                        type: npcType,
                        trades: data.interaction?.trades,
                        key: key
                    };

                    // Use the key as the lookup name
                    npcs[key] = npcInfo;
                    // Also add by name for redundancy
                    npcs[data.name.toLowerCase()] = npcInfo;

                    // Special case for Penne who is a lion
                    if (key === 'penne') {
                        npcs['lion'] = npcInfo;
                    }
                }
            });

            this.npcData = npcs;
            this.npcDataLoaded = true;
        } catch (error) {
            console.warn('Could not load NPC data:', error);
            // Fallback to empty data
            this.npcData = {};
            this.npcDataLoaded = true;
        }
    }

    /**
     * Categorize an asset based on its path
     * @param {string} path - The asset path to categorize
     * @returns {void}
     */
    categorizeAsset(path) {
        const category = {
            asset: path,
            name: this.extractName(path),
            path: '/assets/' + path
        };

        // Categorize based on new path structure
        if (path.startsWith('characters/enemies/')) {
            const baseName = path.replace('characters/enemies/', '').replace('.png', '');
            this.categories.enemies.push({
                ...category,
                name: this.capitalize(baseName),
                type: 'enemy'
            });
        } else if (path.startsWith('characters/npcs/')) {
            const baseName = path.replace('characters/npcs/', '').replace('.png', '');
            const isPortrait = baseName.includes('face');
            const cleanName = baseName.replace('face', '');

            // Check if it's an NPC
            if (this.npcData[cleanName]) {
                const npcInfo = this.npcData[cleanName];

                // Find or create NPC entry - use the NPC's actual name as the key
                let npc = this.categories.npcs.find(n => n.name === npcInfo.name || n.key === npcInfo.key);
                if (!npc) {
                    npc = {
                        name: npcInfo.name,
                        type: npcInfo.type,
                        sprite: null,
                        portrait: null,
                        trades: npcInfo.trades,
                        key: npcInfo.key
                    };
                    this.categories.npcs.push(npc);
                }

                // Add sprite or portrait
                if (isPortrait) {
                    npc.portrait = '/assets/' + path;
                } else {
                    npc.sprite = '/assets/' + path;
                }
            } else {
                // Unknown NPC - might still be an NPC we haven't matched
                // Try to find by checking all NPC data for matching portraits
                let found = false;
                Object.values(this.npcData).forEach(npcInfo => {
                    if (npcInfo.portrait && npcInfo.portrait.includes(baseName)) {
                        let npc = this.categories.npcs.find(n => n.name === npcInfo.name);
                        if (!npc) {
                            npc = {
                                name: npcInfo.name,
                                type: npcInfo.type,
                                sprite: null,
                                portrait: null,
                                trades: npcInfo.trades,
                                key: npcInfo.key
                            };
                            this.categories.npcs.push(npc);
                        }
                        if (isPortrait) {
                            npc.portrait = 'assets/' + path;
                        } else {
                            npc.sprite = 'assets/' + path;
                        }
                        found = true;
                    }
                });

                if (!found) {
                    // Really unknown NPC
                    this.categories.misc.push({
                        ...category,
                        name: this.capitalize(cleanName),
                        type: 'npc'
                    });
                }
            }
        } else if (path.startsWith('characters/player/')) {
            this.categories.protag.push({
                ...category,
                name: this.capitalize(path.replace('characters/player/', '').replace('.png', ''))
            });
        } else if (path.startsWith('fauna/')) {
            const baseName = path.replace('fauna/', '').replace('.png', '');
            const isPortrait = baseName.includes('face');
            const cleanName = baseName.replace('face', '');

            // Check if it's an enemy
            if (this.enemyTypes.includes(cleanName)) {
                this.categories.enemies.push({
                    ...category,
                    name: this.capitalize(cleanName),
                    type: 'enemy'
                });
            }
            // Check if it's an NPC
            else if (this.npcData[cleanName]) {
                const npcInfo = this.npcData[cleanName];

                // Find or create NPC entry - use the NPC's actual name as the key
                let npc = this.categories.npcs.find(n => n.name === npcInfo.name || n.key === npcInfo.key);
                if (!npc) {
                    npc = {
                        name: npcInfo.name,
                        type: npcInfo.type,
                        sprite: null,
                        portrait: null,
                        trades: npcInfo.trades,
                        key: npcInfo.key
                    };
                    this.categories.npcs.push(npc);
                }

                // Add sprite or portrait
                if (isPortrait) {
                    npc.portrait = '/assets/' + path;
                } else {
                    npc.sprite = '/assets/' + path;
                }
            } else {
                // Unknown fauna - might still be an NPC we haven't matched
                // Try to find by checking all NPC data for matching portraits
                let found = false;
                Object.values(this.npcData).forEach(npcInfo => {
                    if (npcInfo.portrait && npcInfo.portrait.includes(baseName)) {
                        let npc = this.categories.npcs.find(n => n.name === npcInfo.name);
                        if (!npc) {
                            npc = {
                                name: npcInfo.name,
                                type: npcInfo.type,
                                sprite: null,
                                portrait: null,
                                trades: npcInfo.trades,
                                key: npcInfo.key
                            };
                            this.categories.npcs.push(npc);
                        }
                        if (isPortrait) {
                            npc.portrait = 'assets/' + path;
                        } else {
                            npc.sprite = 'assets/' + path;
                        }
                        found = true;
                    }
                });

                if (!found) {
                    // Really unknown fauna
                    this.categories.misc.push({
                        ...category,
                        name: this.capitalize(cleanName),
                        type: 'fauna'
                    });
                }
            }
        } else if (path.startsWith('items/')) {
            const itemPath = path.replace('items/', '');
            let itemType = 'misc';
            if (itemPath.startsWith('equipment/')) {
                itemType = 'equipment';
            } else if (itemPath.startsWith('consumables/')) {
                itemType = 'consumable';
            }

            this.categories.items.push({
                ...category,
                name: this.capitalize(itemPath.replace(/^(equipment|misc|consumables)\//, '').replace('.png', '')),
                itemType: itemType
            });

            // Also add to food category if consumable
            if (itemType === 'consumable') {
                this.categories.food.push({
                    ...category,
                    name: this.capitalize(itemPath.replace('consumables/', '').replace('.png', '')),
                    foodType: 'consumable'
                });
            }
        } else if (path.startsWith('ui/')) {
            this.categories.ui.push({
                ...category,
                name: this.capitalize(path.replace('ui/', '').replace('.png', ''))
            });
        } else if (path.startsWith('environment/flora/')) {
            this.categories.flora.push({
                ...category,
                name: this.capitalize(path.replace('environment/flora/', '').replace('.png', ''))
            });
        } else if (path.startsWith('environment/doodads/')) {
            this.categories.doodads.push({
                ...category,
                name: this.capitalize(path.replace('environment/doodads/', '').replace('.png', ''))
            });
        } else if (path.startsWith('environment/floors/')) {
            const floorName = path.replace('environment/floors/', '').replace('.png', '');
            this.categories.floors.push({
                ...category,
                name: this.capitalize(floorName),
                floorType: floorName
            });
        } else if (path.startsWith('environment/walls/')) {
            this.categories.doodads.push({
                ...category,
                name: this.capitalize(path.replace('environment/walls/', '').replace('.png', '')),
                type: 'wall'
            });
        } else if (path.startsWith('environment/effects/')) {
            const effectName = path.replace('environment/effects/', '').replace('.png', '');
            let effectType = 'general';
            let frame = null;

            if (effectName.includes('smoke')) {
                effectType = 'smoke';
                frame = effectName.match(/\d+/)?.[0];
            } else if (effectName.includes('splode')) {
                effectType = 'explosion';
                frame = effectName.match(/\d+/)?.[0];
            }

            this.categories.effects.push({
                ...category,
                name: this.capitalize(effectName),
                effectType: effectType,
                frame: frame
            });
        } else {
            // Miscellaneous assets (rock.png, bush.png, etc.)
            this.categories.misc.push({
                ...category,
                name: this.capitalize(path.replace('.png', ''))
            });
        }
    }

    /**
     * Extract the display name from an asset path
     * @param {string} path - The asset path
     * @returns {string} The extracted display name
     */
    extractName(path) {
        const parts = path.split('/');
        const filename = parts[parts.length - 1];
        return filename.replace('.png', '').replace(/_/g, ' ');
    }

    /**
     * Capitalize a string and replace underscores with spaces
     * @param {string} str - The string to capitalize
     * @returns {string} The capitalized string
     */
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
    }

    /**
     * Scan and categorize all game assets
     * @returns {Promise<AssetCategories>} The categorized assets
     */
    async scanAssets() {
        // Load NPC data first
        await this.loadNPCData();

        // Process all image assets
        IMAGE_ASSETS.forEach(asset => {
            this.categorizeAsset(asset);
        });

        // Process food assets
        FOOD_ASSETS.forEach(asset => {
            this.categorizeAsset(asset);
        });

        // Now go through NPCs and ensure they have their portraits from loaded data
        Object.values(this.npcData).forEach(npcInfo => {
            if (npcInfo.portrait) {
                let npc = this.categories.npcs.find(n => n.name === npcInfo.name);
                if (npc) {
                    // Use the portrait path directly from NPC data, ensure it's absolute
                    const portraitPath = npcInfo.portrait.startsWith('/') ? npcInfo.portrait : '/' + npcInfo.portrait;
                    npc.portrait = portraitPath;
                }
            }
        });

        // Sort categories
        Object.keys(this.categories).forEach(key => {
            this.categories[key].sort((a, b) => {
                const nameA = a.name || '';
                const nameB = b.name || '';
                return nameA.localeCompare(nameB);
            });
        });

        return this.categories;
    }

    /**
     * Get statistics about scanned assets
     * @returns {{total: number, byCategory: Record<string, number>}} Statistics object
     */
    getStats() {
        const stats = {
            total: IMAGE_ASSETS.length + FOOD_ASSETS.length,
            byCategory: {}
        };

        Object.entries(this.categories).forEach(([key, items]) => {
            if (items.length > 0) {
                stats.byCategory[key] = items.length;
            }
        });

        return stats;
    }

    /**
     * Search for assets by query string
     * @param {string} query - The search query
     * @returns {Array<AssetCategory & {category: string}>} Array of matching assets with their category
     */
    searchAssets(query) {
        const results = [];
        const searchTerm = query.toLowerCase();

        Object.entries(this.categories).forEach(([category, items]) => {
            items.forEach(item => {
                const name = (item.name || '').toLowerCase();
                const path = (item.path || item.sprite || item.portrait || '').toLowerCase();

                if (name.includes(searchTerm) || path.includes(searchTerm)) {
                    results.push({
                        ...item,
                        category: category
                    });
                }
            });
        });

        return results;
    }
}

// Export singleton instance
export const assetScanner = new AssetScanner();