import { logger } from '../core/logger.js';
import { safeCall, safeGet } from '../utils/SafeServiceCall.js';

/**
 * OverlayMusicToggle
 *
 * Manages music preferences on the start overlay.
 * Handles music toggle state and applies preferences to the game.
 */
export class OverlayMusicToggle {
    constructor(game) {
        this.game = game;
        this.overlayMusicPref = true; // Default music preference
    }

    /**
     * Sets up the music toggle functionality.
     * @param {HTMLElement} overlay
     */
    setupMusicToggle(overlay) {
        const overlayMusicToggle = document.getElementById('overlay-music-toggle');
        if (!overlayMusicToggle) return;

        try {
            this.overlayMusicPref = typeof overlayMusicToggle.checked === 'boolean'
                ? overlayMusicToggle.checked
                : true;

            overlayMusicToggle.addEventListener('change', (e) => {
                try {
                    this.overlayMusicPref = !!e.target.checked;
                } catch (err) {
                    logger.error('Error handling music toggle:', err);
                }
            });
        } catch (e) {
            logger.error('Error setting up music toggle:', e);
        }
    }

    /**
     * Applies the music preference from the overlay toggle.
     */
    applyMusicPreference() {
        try {
            const playerStats = safeGet(this.game, 'player.stats');
            if (playerStats) {
                playerStats.musicEnabled = !!this.overlayMusicPref;
            }

            safeCall(this.game.soundManager, 'setMusicEnabled', !!this.overlayMusicPref);

            // Apply SFX preference if available
            const sfxEnabled = safeGet(this.game, 'player.stats.sfxEnabled');
            if (sfxEnabled !== undefined) {
                safeCall(this.game.soundManager, 'setSfxEnabled', !!sfxEnabled);
            }
        } catch (e) {
            logger.error('Error applying music preference:', e);
        }
    }

    /**
     * Gets the current music preference value.
     * @returns {boolean}
     */
    getMusicPreference() {
        return this.overlayMusicPref;
    }

    /**
     * Sets the music preference value.
     * @param {boolean} enabled
     */
    setMusicPreference(enabled) {
        this.overlayMusicPref = !!enabled;
    }
}
