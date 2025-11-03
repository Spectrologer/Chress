import { GRID_SIZE } from '../constants/index';
import type { ArrowDirection } from './DirectionUtils';

/**
 * Determines the exit direction based on the exit tile position.
 * @param exitX - The x-coordinate of the exit tile.
 * @param exitY - The y-coordinate of the exit tile.
 * @returns The direction ('arrowup', 'arrowdown', 'arrowleft', 'arrowright') or empty string if not on edge.
 */
export function getExitDirection(exitX: number, exitY: number): ArrowDirection | '' {
    if (exitY === 0) {
        // Top edge exit - move north
        return 'arrowup';
    } else if (exitY === GRID_SIZE - 1) {
        // Bottom edge exit - move south
        return 'arrowdown';
    } else if (exitX === 0) {
        // Left edge exit - move west
        return 'arrowleft';
    } else if (exitX === GRID_SIZE - 1) {
        // Right edge exit - move east
        return 'arrowright';
    }
    return '';
}
