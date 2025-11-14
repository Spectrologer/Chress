/**
 * Music patterns for different zones and combat states
 */

import type { Pattern } from '@strudel/web';

/**
 * Get music pattern for zone dimension or level
 * @param dimensionOrLevel - Zone dimension (0=surface, 1=interior, 2=underground) or zone level offset (11=home, 12=woods, 13=wilds, 14=frontier)
 * @param combat - Whether combat music should play
 * @returns Strudel Pattern object or null
 *
 * Note: Surface zones pass zone level + 10 (11-14) to distinguish from dimensions (0-2).
 * Interior/underground zones pass dimension directly (1 or 2).
 */
export function getMusicPatternForDimension(dimensionOrLevel: number, combat: boolean = false): Pattern<any> | null {
    if (combat) {
        // Combat music patterns
        return null;
    }

    // Ambient zone music patterns
    switch (dimensionOrLevel) {
        case 11: // Home
            return null;
        case 12: // Woods
            return null;
        case 13: // Wilds
            return null;
        case 14: // Frontier
            return null;
        case 1:  // Interior
            return null;
        case 2:  // Underground
            return null;
        default:
            return null;
    }
}
