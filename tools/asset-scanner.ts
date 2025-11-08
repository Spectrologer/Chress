// Asset Scanner Module - Dynamically reads game asset definitions
// v2.1 - Feltface moved to portraits folder
import { IMAGE_ASSETS, FOOD_ASSETS } from '../src/core/constants/index.js';
import { ContentRegistry } from '../src/core/ContentRegistry.js';
import { loadAllNPCs, getAllNPCCharacterData } from '../src/core/NPCLoader.js';

interface AssetCategory {
  asset: string;
  name: string;
  path: string;
  type?: string;
  itemType?: 'equipment' | 'consumable' | 'misc';
  foodType?: string;
  floorType?: string;
  effectType?: 'smoke' | 'explosion' | 'general';
  frame?: string | null;
}

interface NPCAsset {
  name: string;
  type: string;
  sprite: string | null;
  portrait: string | null;
  trades?: any;
  key: string;
}

interface NPCInfo {
  name: string;
  portrait: string | null;
  sprite: string | null;
  type: string;
  trades?: any;
  key: string;
}

interface AssetCategories {
  npcs: NPCAsset[];
  enemies: AssetCategory[];
  items: AssetCategory[];
  food: AssetCategory[];
  ui: AssetCategory[];
  flora: AssetCategory[];
  doodads: AssetCategory[];
  floors: AssetCategory[];
  effects: AssetCategory[];
  protag: AssetCategory[];
  misc: AssetCategory[];
}

/**
 * AssetScanner class - Scans and categorizes game assets
 */
export class AssetScanner {
  categories: AssetCategories;
  npcData: Record<string, NPCInfo>;
  npcDataLoaded: boolean;
  enemyTypes: string[];

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

    this.npcData = {};
    this.npcDataLoaded = false;
    this.enemyTypes = ['lizardy', 'lizardo', 'lizardeaux', 'lizord', 'lazerd', 'zard'];
  }

  /**
   * Load NPC data from JSON files
   */
  async loadNPCData(): Promise<void> {
    if (this.npcDataLoaded) return;

    try {
      // Load all NPC character data from JSON files
      await loadAllNPCs(ContentRegistry);
      const allNPCData = getAllNPCCharacterData();

      // Convert to the format we need
      const npcs: Record<string, NPCInfo> = {};
      allNPCData.forEach((data: any, key: string) => {
        if (data.name) {
          // @ts-ignore - NPCData structure differs between runtime and types
          const npcType = data.interaction?.type || 'npc';
          // Ensure paths are absolute
          const portrait = data.display?.portrait;
          const sprite = data.display?.sprite;
          const npcInfo: NPCInfo = {
            name: data.name,
            portrait: portrait ? (portrait.startsWith('/') ? portrait : '/' + portrait) : null,
            sprite: sprite ? (sprite.startsWith('/') ? sprite : '/' + sprite) : null,
            type: npcType,
            // @ts-ignore - NPCData structure differs between runtime and types
            trades: data.interaction?.trades,
            key: key
          };

          // Use the key as the lookup name
          npcs[key] = npcInfo;
          // Also add by name for redundancy
          npcs[data.name.toLowerCase()] = npcInfo;

          if (key === 'penne') {
            npcs['penne'] = npcInfo;
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
   * @param path - The asset path to categorize
   */
  categorizeAsset(path: string): void {
    const category: AssetCategory = {
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
      let itemType: 'equipment' | 'consumable' | 'misc' = 'misc';
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
      let effectType: 'smoke' | 'explosion' | 'general' = 'general';
      let frame: string | null = null;

      if (effectName.includes('smoke')) {
        effectType = 'smoke';
        frame = effectName.match(/\d+/)?.[0] || null;
      } else if (effectName.includes('splode')) {
        effectType = 'explosion';
        frame = effectName.match(/\d+/)?.[0] || null;
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
   * @param path - The asset path
   * @returns The extracted display name
   */
  extractName(path: string): string {
    const parts = path.split('/');
    const filename = parts[parts.length - 1];
    return filename.replace('.png', '').replace(/_/g, ' ');
  }

  /**
   * Capitalize a string and replace underscores with spaces
   * @param str - The string to capitalize
   * @returns The capitalized string
   */
  capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
  }

  /**
   * Scan and categorize all game assets
   * @returns The categorized assets
   */
  async scanAssets(): Promise<AssetCategories> {
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
    Object.keys(this.categories).forEach((key) => {
      const categoryKey = key as keyof AssetCategories;
      this.categories[categoryKey].sort((a, b) => {
        const nameA = 'name' in a ? (a.name || '') : '';
        const nameB = 'name' in b ? (b.name || '') : '';
        return nameA.localeCompare(nameB);
      });
    });

    return this.categories;
  }

  /**
   * Get statistics about scanned assets
   * @returns Statistics object
   */
  getStats(): { total: number; byCategory: Record<string, number> } {
    const stats = {
      total: IMAGE_ASSETS.length + FOOD_ASSETS.length,
      byCategory: {} as Record<string, number>
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
   * @param query - The search query
   * @returns Array of matching assets with their category
   */
  searchAssets(query: string): Array<AssetCategory & { category: string }> {
    const results: Array<AssetCategory & { category: string }> = [];
    const searchTerm = query.toLowerCase();

    Object.entries(this.categories).forEach(([category, items]) => {
      items.forEach(item => {
        const name = ('name' in item ? item.name : '').toLowerCase();
        const path = ('path' in item ? item.path : 'sprite' in item ? item.sprite : 'portrait' in item ? item.portrait : '');
        const pathLower = (path || '').toLowerCase();

        if (name.includes(searchTerm) || pathLower.includes(searchTerm)) {
          results.push({
            ...(item as AssetCategory),
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
