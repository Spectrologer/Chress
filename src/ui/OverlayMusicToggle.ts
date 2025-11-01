import { logger } from '../core/logger.ts';
import { safeCall, safeGet } from '../utils/SafeServiceCall.js';

interface GameInstance {
    player: any;
    soundManager: any;
}

/**
 * OverlayMusicToggle
 *
 * Manages music preferences on the start overlay.
 * Handles music toggle state and applies preferences to the game.
 */
export class OverlayMusicToggle {
    private game: GameInstance;
    private overlayMusicPref: boolean = true; // Default music preference

    constructor(game: GameInstance) {
        this.game = game;
    }

    /**
     * Sets up the music toggle functionality.
     */
    setupMusicToggle(overlay: HTMLElement): void {
        const overlayMusicToggle = document.getElementById('overlay-music-toggle') as HTMLInputElement | null;
        if (!overlayMusicToggle) return;

        try {
            this.overlayMusicPref = typeof overlayMusicToggle.checked === 'boolean'
                ? overlayMusicToggle.checked
                : true;

            overlayMusicToggle.addEventListener('change', (e) => {
                try {
                    this.overlayMusicPref = !!(e.target as HTMLInputElement).checked;
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
    applyMusicPreference(): void {
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
     */
    getMusicPreference(): boolean {
        return this.overlayMusicPref;
    }

    /**
     * Sets the music preference value.
     */
    setMusicPreference(enabled: boolean): void {
        this.overlayMusicPref = !!enabled;
    }
}
