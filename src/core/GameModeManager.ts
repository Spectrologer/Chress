/**
 * GameModeManager - Centralized game mode management
 *
 * Provides helper functions for switching between game modes
 * and accessing mode-specific configurations safely.
 */

import { GameMode, type GameModeConfig, DEFAULT_MODE_CONFIG, isChessMode } from './GameMode';
import type { GameContext } from './context';
import { logger } from './logger';

/**
 * Switch to a specific game mode
 */
export function setGameMode(game: GameContext, mode: GameMode): void {
    const previousMode = game.gameMode.currentMode;

    if (previousMode === mode) {
        logger.debug(`[GameModeManager] Already in ${mode} mode`);
        return;
    }

    // Exit previous mode
    exitMode(game, previousMode);

    // Update mode
    game.gameMode.currentMode = mode;

    // Update legacy flags
    game.chessMode = (mode === GameMode.CHESS);

    // Enter new mode
    enterMode(game, mode);

    logger.info(`[GameModeManager] Switched from ${previousMode} to ${mode}`);
}

/**
 * Enter a game mode (setup)
 */
function enterMode(game: GameContext, mode: GameMode): void {
    switch (mode) {
        case GameMode.CHESS:
            // Reset chess mode state
            game.gameMode.chess.selectedUnit = null;
            game.selectedUnit = null;

            // Store return zone when entering chess mode
            const currentZone = game.playerFacade.getCurrentZone();
            game.gameMode.chess.returnZone = {
                x: currentZone.x,
                y: currentZone.y,
                dimension: currentZone.dimension
            };
            logger.debug('[Chess Mode] Initialized. Return zone stored:', game.gameMode.chess.returnZone);
            break;

        case GameMode.NORMAL:
            logger.debug('[Normal Mode] Initialized');
            break;

        default:
            logger.warn(`[GameModeManager] Unknown mode: ${mode}`);
    }
}

/**
 * Exit a game mode (cleanup)
 */
function exitMode(game: GameContext, mode: GameMode): void {
    switch (mode) {
        case GameMode.CHESS:
            // Clean up chess mode state
            game.gameMode.chess.selectedUnit = null;
            game.selectedUnit = null;
            logger.debug('[Chess Mode] Exited');
            break;

        case GameMode.NORMAL:
            logger.debug('[Normal Mode] Exited');
            break;

        default:
            logger.warn(`[GameModeManager] Unknown mode: ${mode}`);
    }
}

/**
 * Check if currently in chess mode
 */
export function isInChessMode(game: GameContext): boolean {
    return isChessMode(game.gameMode);
}

/**
 * Get the chess mode configuration (type-safe)
 */
export function getChessConfig(game: GameContext) {
    return game.gameMode.chess;
}

/**
 * Reset game mode to normal
 */
export function resetToNormalMode(game: GameContext): void {
    setGameMode(game, GameMode.NORMAL);
}

/**
 * Exit chess mode and return to the zone where it was entered from
 */
export function exitChessModeAndReturn(game: GameContext): void {
    const returnZone = game.gameMode.chess.returnZone;

    if (!returnZone) {
        logger.warn('[Chess Mode] No return zone stored, defaulting to normal mode reset');
        resetToNormalMode(game);
        return;
    }

    logger.info(`[Chess Mode] Exiting and returning to zone (${returnZone.x}, ${returnZone.y}) dimension ${returnZone.dimension}`);

    // Switch back to normal mode
    setGameMode(game, GameMode.NORMAL);

    // Return to the stored zone
    game.playerFacade.setCurrentZone(returnZone.x, returnZone.y);
    game.playerFacade.setZoneDimension(returnZone.dimension);

    // Clear the return zone
    game.gameMode.chess.returnZone = undefined;

    // Regenerate the zone
    game.generateZone();
}
