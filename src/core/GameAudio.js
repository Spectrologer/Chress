// @ts-check

/**
 * GameAudio
 *
 * Encapsulates all audio-related managers and state including:
 * - SoundManager for music and SFX
 * - ConsentManager for audio consent handling
 */
export class GameAudio {
    constructor() {
        // Audio managers (set by ServiceContainer)
        /** @type {any} */
        this.soundManager = null;

        /** @type {any} */
        this.consentManager = null;
    }

    /**
     * Initialize consent check
     * @returns {void}
     */
    initializeConsent() {
        if (this.consentManager && typeof this.consentManager.initialize === 'function') {
            this.consentManager.initialize();
        }
    }

    /**
     * Resume audio context (for browser autoplay policies)
     * @returns {Promise<void>}
     */
    async resumeAudioContext() {
        if (this.soundManager && typeof this.soundManager.resumeAudioContext === 'function') {
            try {
                await this.soundManager.resumeAudioContext();
            } catch (e) {
                console.error('Error resuming audio context:', e);
            }
        }
    }

    /**
     * Set music enabled state
     * @param {boolean} enabled
     * @returns {void}
     */
    setMusicEnabled(enabled) {
        if (this.soundManager && typeof this.soundManager.setMusicEnabled === 'function') {
            this.soundManager.setMusicEnabled(enabled);
        }
    }

    /**
     * Set SFX enabled state
     * @param {boolean} enabled
     * @returns {void}
     */
    setSfxEnabled(enabled) {
        if (this.soundManager && typeof this.soundManager.setSfxEnabled === 'function') {
            this.soundManager.setSfxEnabled(enabled);
        }
    }

    /**
     * Set music for current zone
     * @param {any} zoneInfo
     * @returns {void}
     */
    setMusicForZone(zoneInfo) {
        if (this.soundManager && typeof this.soundManager.setMusicForZone === 'function') {
            this.soundManager.setMusicForZone(zoneInfo);
        }
    }
}
