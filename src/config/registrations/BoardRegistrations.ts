/**
 * BoardRegistrations - Register custom board JSON files for specific zones
 */

import { boardLoader } from '@core/BoardLoader';

/**
 * Register custom board JSON files for specific zones
 * These boards override procedural generation for canon/custom zones
 */
export function registerBoards(): void {
    // Zero - The home surface starting area at zone (0,0) dimension 0
    boardLoader.registerBoard(0, 0, 0, 'zero', 'canon');

    // Museum - The home interior at zone (0,0) dimension 1
    boardLoader.registerBoard(0, 0, 1, 'museum', 'canon');

    // Well - The home underground at zone (0,0) dimension 2
    boardLoader.registerBoard(0, 0, 2, 'well', 'canon');

    // Add more custom boards here as they are created
    // Example for custom boards:
    // boardLoader.registerBoard(5, 5, 0, 'special_surface_zone', 'custom');
    // boardLoader.registerBoard(2, 3, 2, 'underground_cavern', 'custom');

    // Custom boards in dimension 3 (isolated dimension, accessible only via board loader)
    // These boards should not be accessible by normal walking

    // Classiqueste - Test board for player spawn feature
    boardLoader.registerBoard(1, 0, 3, 'classiqueste', 'custom');

    // Chess - Custom chess mode board with lizard units
    boardLoader.registerBoard(2, 0, 3, 'chess', 'custom');
}
