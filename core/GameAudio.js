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
        this.soundManager = null;
        this.consentManager = null;
    }

    /**
     * Initialize consent check
     */
    initializeConsent() {
        if (this.consentManager && typeof this.consentManager.initialize === 'function') {
            this.consentManager.initialize();
        }
    }

    /**
     * Resume audio context (for browser autoplay policies)
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
     */
    setMusicEnabled(enabled) {
        if (this.soundManager && typeof this.soundManager.setMusicEnabled === 'function') {
            this.soundManager.setMusicEnabled(enabled);
        }
    }

    /**
     * Set SFX enabled state
     */
    setSfxEnabled(enabled) {
        if (this.soundManager && typeof this.soundManager.setSfxEnabled === 'function') {
            this.soundManager.setSfxEnabled(enabled);
        }
    }

    /**
     * Set music for current zone
     */
    setMusicForZone(zoneInfo) {
        if (this.soundManager && typeof this.soundManager.setMusicForZone === 'function') {
            this.soundManager.setMusicForZone(zoneInfo);
        }
    }
}
