import type { SoundManager } from '../types/game.js';

/**
 * GameAudio
 *
 * Encapsulates all audio-related managers and state including:
 * - SoundManager for music and SFX
 * - ConsentManager for audio consent handling
 */
export class GameAudio {
    // Audio managers (set by ServiceContainer)
    soundManager: SoundManager | null;
    consentManager: any;

    constructor() {
        // Audio managers (set by ServiceContainer)
        this.soundManager = null;
        this.consentManager = null;
    }

    /**
     * Initialize consent check
     */
    initializeConsent(): void {
        if (this.consentManager && typeof this.consentManager.initialize === 'function') {
            this.consentManager.initialize();
        }
    }

    /**
     * Resume audio context (for browser autoplay policies)
     */
    async resumeAudioContext(): Promise<void> {
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
    setMusicEnabled(enabled: boolean): void {
        if (this.soundManager && typeof this.soundManager.setMusicEnabled === 'function') {
            this.soundManager.setMusicEnabled(enabled);
        }
    }

    /**
     * Set SFX enabled state
     */
    setSfxEnabled(enabled: boolean): void {
        if (this.soundManager && typeof this.soundManager.setSfxEnabled === 'function') {
            this.soundManager.setSfxEnabled(enabled);
        }
    }

    /**
     * Set music for current zone
     */
    setMusicForZone(zoneInfo: any): void {
        if (this.soundManager && typeof this.soundManager.setMusicForZone === 'function') {
            this.soundManager.setMusicForZone(zoneInfo);
        }
    }
}
