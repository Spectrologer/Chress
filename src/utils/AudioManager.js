/**
 * AudioManager.js - Centralized audio playback wrapper
 *
 * Provides a clean API for playing sounds throughout the application,
 * handling all fallback logic internally to avoid repetitive defensive code.
 *
 * This manager tries multiple fallback strategies in order:
 * 1. game.soundManager (when available, e.g., in game context)
 * 2. window.soundManager (global fallback)
 * 3. Silent failure (graceful degradation)
 */

import { logger } from '../core/logger.js';
import { errorHandler, ErrorSeverity } from '../core/ErrorHandler.js';
import MethodChecker from './MethodChecker.js';

class AudioManager {
    constructor() {
        this.game = null; // Will be set by GameInitializer or can be passed to methods
    }

    /**
     * Set the game instance to access game.soundManager
     * @param {Object} game - The game instance
     */
    setGame(game) {
        this.game = game;
    }

    /**
     * Play a sound with automatic fallback handling
     * @param {string} soundName - Name of the sound to play (e.g., 'attack', 'move', 'slash')
     * @param {Object} options - Optional configuration
     * @param {Object} options.game - Override game instance for this call
     * @returns {boolean} - Returns true if sound was attempted, false otherwise
     */
    playSound(soundName, options = {}) {
        if (!soundName) {
            logger.warn('[AudioManager] playSound called without soundName');
            return false;
        }

        const gameInstance = options.game || this.game;

        try {
            // Strategy 1: Try game.soundManager (preferred, respects user settings)
            if (MethodChecker.call(gameInstance?.soundManager, 'playSound', [soundName])) {
                return true;
            }

            // Strategy 2: Try window.soundManager (global fallback)
            if (typeof window !== 'undefined' && MethodChecker.call(window.soundManager, 'playSound', [soundName])) {
                return true;
            }

            // Strategy 3: Silent failure - log in debug mode only
            if (logger.debug) {
                logger.debug(`[AudioManager] No sound manager available for sound: ${soundName}`);
            }
            return false;
        } catch (error) {
            // Catch any errors from sound playback to prevent crashes
            errorHandler.handle(error, ErrorSeverity.WARNING, {
                component: 'AudioManager',
                action: 'play sound',
                soundName
            });
            return false;
        }
    }

    /**
     * Play a sound with additional safety check (wrapper for backward compatibility)
     * @param {string} soundName - Name of the sound to play
     * @param {Object} gameInstance - Game instance to use
     */
    playSafe(soundName, gameInstance = null) {
        return this.playSound(soundName, { game: gameInstance });
    }

    /**
     * Check if sound playback is currently available
     * @param {Object} options - Optional configuration
     * @param {Object} options.game - Override game instance for this check
     * @returns {boolean} - Returns true if a sound manager is available
     */
    isAvailable(options = {}) {
        const gameInstance = options.game || this.game;

        // Check game.soundManager
        if (MethodChecker.exists(gameInstance?.soundManager, 'playSound')) {
            return true;
        }

        // Check window.soundManager
        if (typeof window !== 'undefined' && MethodChecker.exists(window.soundManager, 'playSound')) {
            return true;
        }

        return false;
    }
}

// Export a singleton instance
const audioManager = new AudioManager();
export default audioManager;
