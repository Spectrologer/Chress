/**
 * GameMode - Type-safe game mode system
 *
 * Defines different game modes and their configurations.
 * Chess mode is the foundation for turn-based strategic modes.
 */

import type { Enemy } from '@entities/Enemy';

/**
 * Available game modes
 */
export enum GameMode {
    NORMAL = 'normal',      // Standard Chress gameplay
    CHESS = 'chess',        // Turn-based chess-like mode with unit control
    PUZZLE = 'puzzle',      // Puzzle mode (future)
    TUTORIAL = 'tutorial'   // Tutorial mode (future)
}

/**
 * Team assignment for units in team-based modes
 */
export type Team = 'player' | 'enemy';

/**
 * Configuration for chess mode
 */
export interface ChessModeConfig {
    /** Currently selected unit */
    selectedUnit: Enemy | null;

    /** Enable turn-based gameplay */
    turnBased: boolean;

    /** Show movement indicators */
    showMoveIndicators: boolean;

    /** AI delay in milliseconds */
    aiDelayMs: number;
}

/**
 * Configuration for all game modes
 */
export interface GameModeConfig {
    currentMode: GameMode;
    chess: ChessModeConfig;
}

/**
 * Default configurations for each mode
 */
export const DEFAULT_MODE_CONFIG: GameModeConfig = {
    currentMode: GameMode.NORMAL,
    chess: {
        selectedUnit: null,
        turnBased: true,
        showMoveIndicators: true,
        aiDelayMs: 500
    }
};

/**
 * Type guard to check if in chess mode
 */
export function isChessMode(config: GameModeConfig): boolean {
    return config.currentMode === GameMode.CHESS;
}

/**
 * Type guard to check if a mode uses teams
 */
export function isTeamBasedMode(mode: GameMode): boolean {
    return mode === GameMode.CHESS;
}
