// Asset Scanner Module - Dynamically reads game asset definitions
import { IMAGE_ASSETS, FOOD_ASSETS } from './core/constants/index.js';
import { Sign } from './ui/Sign.js';

export class AssetScanner {
    constructor() {
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

        this.npcData = this.extractNPCData();
        this.enemyTypes = ['lizardy', 'lizardo', 'lizardeaux', 'lizord', 'lazerd', 'zard'];
    }

    extractNPCData() {
        const npcs = {};

        // Extract dialogue NPCs
        Object.entries(Sign.dialogueNpcData).forEach(([key, data]) => {
            if (data.name && !key.includes('post_trade')) {
                // Use the key as the lookup name
                npcs[key] = {
                    name: data.name,
                    portrait: data.portrait,
                    type: 'dialogue',
                    key: key
                };
                // Also add by name for redundancy
                npcs[data.name.toLowerCase()] = {
                    name: data.name,
                    portrait: data.portrait,
                    type: 'dialogue',
                    key: key
                };
            }
        });

        // Extract barter NPCs
        Object.entries(Sign.barterNpcData).forEach(([key, data]) => {
            if (data.name) {
                // Use the key as the lookup name
                npcs[key] = {
                    name: data.name,
                    portrait: data.portrait,
                    type: 'barter',
                    trades: data.trades,
                    key: key
                };
                // Also add by name for redundancy
                npcs[data.name.toLowerCase()] = {
                    name: data.name,
                    portrait: data.portrait,
                    type: 'barter',
                    trades: data.trades,
                    key: key
                };
                // Special case for Penne who is a lion
                if (key === 'penne') {
                    npcs['lion'] = {
                        name: data.name,
                        portrait: data.portrait,
                        type: 'barter',
                        trades: data.trades,
                        key: key
                    };
                }
            }
        });

        return npcs;
    }

    categorizeAsset(path) {
        const category = {
            asset: path,
            name: this.extractName(path),
            path: 'assets/' + path
        };

        // Categorize based on path
        if (path.startsWith('fauna/')) {
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
                    npc.portrait = 'assets/' + path;
                } else {
                    npc.sprite = 'assets/' + path;
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
            this.categories.items.push({
                ...category,
                name: this.capitalize(path.replace('items/', '').replace('.png', ''))
            });
        } else if (path.startsWith('food/')) {
            const foodPath = path.replace('food/', '');
            let foodType = 'unknown';
            let name = this.extractName(path);

            if (foodPath.startsWith('meat/')) {
                foodType = 'meat';
                name = this.capitalize(foodPath.replace('meat/', '').replace('.png', ''));
            } else if (foodPath.startsWith('veg/')) {
                foodType = 'vegetable';
                name = this.capitalize(foodPath.replace('veg/', '').replace('.png', ''));
            } else {
                name = this.capitalize(foodPath.replace('.png', ''));
            }

            this.categories.food.push({
                ...category,
                name: name,
                foodType: foodType
            });
        } else if (path.startsWith('ui/')) {
            this.categories.ui.push({
                ...category,
                name: this.capitalize(path.replace('ui/', '').replace('.png', ''))
            });
        } else if (path.startsWith('flora/')) {
            this.categories.flora.push({
                ...category,
                name: this.capitalize(path.replace('flora/', '').replace('.png', ''))
            });
        } else if (path.startsWith('doodads/')) {
            this.categories.doodads.push({
                ...category,
                name: this.capitalize(path.replace('doodads/', '').replace('.png', ''))
            });
        } else if (path.startsWith('floors/')) {
            const floorPath = path.replace('floors/', '');
            const parts = floorPath.split('/');
            const floorType = parts[0];
            const variant = parts[1]?.replace('.png', '') || 'default';

            this.categories.floors.push({
                ...category,
                name: `${this.capitalize(floorType)} - ${this.capitalize(variant)}`,
                floorType: floorType,
                variant: variant
            });
        } else if (path.startsWith('fx/')) {
            const fxPath = path.replace('fx/', '');
            let effectType = 'general';
            let frame = null;

            if (fxPath.startsWith('smoke/')) {
                effectType = 'smoke';
                frame = fxPath.match(/\d+/)?.[0];
            } else if (fxPath.startsWith('splode/')) {
                effectType = 'explosion';
                frame = fxPath.match(/\d+/)?.[0];
            }

            this.categories.effects.push({
                ...category,
                name: this.capitalize(fxPath.replace('.png', '')),
                effectType: effectType,
                frame: frame
            });
        } else if (path.startsWith('protag/')) {
            this.categories.protag.push({
                ...category,
                name: this.capitalize(path.replace('protag/', '').replace('.png', ''))
            });
        } else {
            // Miscellaneous assets (rock.png, bush.png, etc.)
            this.categories.misc.push({
                ...category,
                name: this.capitalize(path.replace('.png', ''))
            });
        }
    }

    extractName(path) {
        const parts = path.split('/');
        const filename = parts[parts.length - 1];
        return filename.replace('.png', '').replace(/_/g, ' ');
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
    }

    async scanAssets() {
        // Process all image assets
        IMAGE_ASSETS.forEach(asset => {
            this.categorizeAsset(asset);
        });

        // Process food assets
        FOOD_ASSETS.forEach(asset => {
            this.categorizeAsset(asset);
        });

        // Now go through NPCs and ensure they have their portraits from Sign.js
        Object.values(this.npcData).forEach(npcInfo => {
            if (npcInfo.portrait) {
                let npc = this.categories.npcs.find(n => n.name === npcInfo.name);
                if (npc) {
                    // Use the portrait path directly from Sign.js
                    npc.portrait = npcInfo.portrait;
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