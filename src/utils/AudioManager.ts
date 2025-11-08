/**
 * AudioManager.ts - Centralized audio playback wrapper
 *
 * Provides a clean API for playing sounds throughout the application,
 * handling all fallback logic internally to avoid repetitive defensive code.
 *
 * This manager tries multiple fallback strategies in order:
 * 1. game.soundManager (when available, e.g., in game context)
 * 2. window.soundManager (global fallback)
 * 3. Silent failure (graceful degradation)
 */

import { logger } from '@core/logger';
import { errorHandler, ErrorSeverity } from '@core/ErrorHandler';
import MethodChecker from './MethodChecker';
import type { GameInstance } from '../types/game';
import type { IGame } from '@core/context';

interface SoundManager {
  playSound(soundName: string): void;
}

interface PlaySoundOptions {
  game?: GameInstance | IGame | null;
}

interface IsAvailableOptions {
  game?: GameInstance | IGame | null;
}

class AudioManager {
  private game: GameInstance | IGame | null;

  constructor() {
    this.game = null; // Will be set by GameInitializer or can be passed to methods
  }

  /**
   * Set the game instance to access game.soundManager
   * @param game - The game instance
   */
  setGame(game: GameInstance | IGame): void {
    this.game = game;
  }

  /**
   * Play a sound with automatic fallback handling
   * @param soundName - Name of the sound to play (e.g., 'attack', 'move', 'slash')
   * @param options - Optional configuration
   * @returns Returns true if sound was attempted, false otherwise
   */
  playSound(soundName: string, options: PlaySoundOptions = {}): boolean {
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
      if (typeof window !== 'undefined' && MethodChecker.call((window as Window & { soundManager?: SoundManager }).soundManager, 'playSound', [soundName])) {
        return true;
      }

      // Strategy 3: Silent failure - log in debug mode only
      if (logger.debug) {
        logger.debug(`[AudioManager] No sound manager available for sound: ${soundName}`);
      }
      return false;
    } catch (error) {
      // Catch any errors from sound playback to prevent crashes
      errorHandler.handle(error as Error, ErrorSeverity.WARNING, {
        component: 'AudioManager',
        action: 'play sound',
        soundName
      });
      return false;
    }
  }

  /**
   * Play a sound with additional safety check (wrapper for backward compatibility)
   * @param soundName - Name of the sound to play
   * @param gameInstance - Game instance to use
   */
  playSafe(soundName: string, gameInstance: GameInstance | IGame | null = null): boolean {
    return this.playSound(soundName, { game: gameInstance });
  }

  /**
   * Check if sound playback is currently available
   * @param options - Optional configuration
   * @returns Returns true if a sound manager is available
   */
  isAvailable(options: IsAvailableOptions = {}): boolean {
    const gameInstance = options.game || this.game;

    // Check game.soundManager
    if (MethodChecker.exists(gameInstance?.soundManager, 'playSound')) {
      return true;
    }

    // Check window.soundManager
    if (typeof window !== 'undefined' && MethodChecker.exists((window as Window & { soundManager?: SoundManager }).soundManager, 'playSound')) {
      return true;
    }

    return false;
  }
}

// Export a singleton instance
const audioManager = new AudioManager();
export default audioManager;
