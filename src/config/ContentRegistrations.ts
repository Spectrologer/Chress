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

import { ContentRegistry } from '@core/ContentRegistry';
import { boardLoader } from '@core/BoardLoader';
import { loadAllNPCs, loadAllStatues } from '@core/NPCLoader';

// Import registration modules
import { registerItems } from './registrations/ItemRegistrations';
import { registerEnemies } from './registrations/EnemyRegistrations';
import { registerBoards } from './registrations/BoardRegistrations';

/**
 * Initialize all game content registrations
 * Call this once during game initialization
 */
export async function registerAllContent(): Promise<void> {
    registerItems();
    await loadAllNPCs(ContentRegistry); // Load NPCs from JSON files, passing ContentRegistry as dependency
    await loadAllStatues(); // Load statue data from JSON files
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
