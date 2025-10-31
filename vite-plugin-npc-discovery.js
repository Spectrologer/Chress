import { readdir } from 'fs/promises';
import { resolve, basename } from 'path';
import { BUILD_CONSTANTS } from './src/core/constants/ui.js';

/**
 * Vite plugin to auto-discover NPC JSON files and generate a virtual module
 * that exports the list of NPC IDs
 */
export function npcDiscoveryPlugin() {
  const virtualModuleId = 'virtual:npc-list';
  const resolvedVirtualModuleId = '\0' + virtualModuleId;

  return {
    name: 'vite-plugin-npc-discovery',

    async resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },

    async load(id) {
      if (id === resolvedVirtualModuleId) {
        // Read the characters directory
        const charactersDir = resolve(__dirname, 'src/characters');

        try {
          const files = await readdir(charactersDir);

          // Filter for JSON files and extract NPC IDs
          const npcIds = files
            .filter(file => file.endsWith('.json'))
            .map(file => basename(file, '.json'));

          // Generate the module content
          return `export const npcList = ${JSON.stringify(npcIds, null, BUILD_CONSTANTS.JSON_INDENT_SPACES)};`;
        } catch (error) {
          console.error('[npc-discovery] Error reading characters directory:', error);
          return `export const npcList = [];`;
        }
      }
    }
  };
}
