/**
 * ContentRegistrations - Register all game content with ContentRegistry
 *
 * This file serves as the single source of truth for all game content.
 * Content is now organized into separate modules by type for better maintainability.
 *
 * To add new content:
 * 1. Navigate to the appropriate registration file in config/registrations/
 * 2. Add your new content registration
 * 3. Done! The content is now available throughout the game
 */

import { ContentRegistry } from '../core/ContentRegistry.js';
import { boardLoader } from '../core/BoardLoader.js';
import { loadAllNPCs } from '../core/NPCLoader.js';

// Import registration modules
import { registerItems } from './registrations/ItemRegistrations.js';
import { registerEnemies } from './registrations/EnemyRegistrations.js';
import { registerBoards } from './registrations/BoardRegistrations.js';

/**
 * Initialize all game content registrations
 * Call this once during game initialization
 */
export async function registerAllContent() {
    registerItems();
    await loadAllNPCs(ContentRegistry); // Load NPCs from JSON files, passing ContentRegistry as dependency
    registerEnemies();
    registerBoards();
    // Zone handlers registered separately in ZoneGenerator

    // Pre-load custom boards
    await boardLoader.preloadAllBoards();

    ContentRegistry.markInitialized();
    const stats = ContentRegistry.getStats();

    if (stats.items === 0 || stats.npcs === 0 || stats.enemies === 0) {
        console.error('[ContentRegistry] WARNING: Some content categories are empty!', stats);
    }
}
