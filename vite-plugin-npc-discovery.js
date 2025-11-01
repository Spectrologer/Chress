import { readdir, stat } from 'fs/promises';
import { resolve, basename, join } from 'path';
import { BUILD_CONSTANTS } from './src/core/constants/ui.js';

/**
 * Vite plugin to auto-discover NPC JSON files and generate a virtual module
 * that exports the list of NPC IDs and their paths
 */
export function npcDiscoveryPlugin() {
  const virtualModuleId = 'virtual:npc-list';
  const resolvedVirtualModuleId = '\0' + virtualModuleId;

  /**
   * Recursively scan a directory for JSON files
   * @param {string} dir - Directory to scan
   * @param {string} relativePath - Relative path from characters root
   * @returns {Promise<Array>} Array of {id, path} objects
   */
  async function scanDirectory(dir, relativePath = '') {
    const entries = await readdir(dir);
    const results = [];

    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const entryStat = await stat(fullPath);

      if (entryStat.isDirectory()) {
        // Recursively scan subdirectories
        const subResults = await scanDirectory(fullPath, relativePath ? `${relativePath}/${entry}` : entry);
        results.push(...subResults);
      } else if (entry.endsWith('.json')) {
        // Add JSON files
        const id = basename(entry, '.json');
        const path = relativePath ? `${relativePath}/${id}` : id;
        results.push({ id, path });
      }
    }

    return results;
  }

  return {
    name: 'vite-plugin-npc-discovery',

    async resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },

    async load(id) {
      if (id === resolvedVirtualModuleId) {
        // Read the characters directory recursively
        const charactersDir = resolve(__dirname, 'src/characters');

        try {
          const npcData = await scanDirectory(charactersDir);

          // For backward compatibility, also export a simple list of IDs
          const npcIds = npcData.map(npc => npc.id);

          // Generate the module content with both formats
          return `export const npcList = ${JSON.stringify(npcIds, null, BUILD_CONSTANTS.JSON_INDENT_SPACES)};
export const npcPaths = ${JSON.stringify(npcData, null, BUILD_CONSTANTS.JSON_INDENT_SPACES)};`;
        } catch (error) {
          console.error('[npc-discovery] Error reading characters directory:', error);
          return `export const npcList = [];
export const npcPaths = [];`;
        }
      }
    }
  };
}
