import { logger } from '../core/logger.js';
import { TypewriterEffect } from './TypewriterEffect.js';
import { getVoiceSettingsForName, playTypingBlip } from './VoiceSettings.js';
import { safeCall } from '../utils/SafeServiceCall.js';

/**
 * Coordinates typewriter text reveal effects with voice SFX.
 * Manages character detection and voice settings for dialogue.
 */
export class TypewriterController {
    constructor() {
        this.currentTypewriterInterval = null;
        this.typewriterSpeed = 28; // ms per character
        this.typewriterSfxEnabled = true;

        // Voice settings cache and state
        this._voiceCache = new Map(); // name -> voiceSettings
        this._currentVoiceSettings = null;
        this._typingAudioContext = null;
        this._typingMasterGain = null;
    }

    /**
     * Start typewriter effect on an element
     * @param {HTMLElement} element - Element containing text to animate
     * @param {function|null} onComplete - Callback when animation completes
     */
    start(element, onComplete = null) {
        try {
            // Detect character name for voice SFX
            const detectedName = this._detectCharacterNameForElement(element);
            if (detectedName) {
                this._currentVoiceSettings = getVoiceSettingsForName(detectedName);
            } else {
                this._currentVoiceSettings = null;
            }

            // Stop any previous typewriter
            this.stop();

            // Create new typewriter effect
            const effect = new TypewriterEffect({
                speed: this.typewriterSpeed,
                onChar: (ch) => {
                    if (this.typewriterSfxEnabled && this._currentVoiceSettings) {
                        if (ch && ch.trim().length > 0) {
                            playTypingBlip(this, this._currentVoiceSettings);
                        }
                    }
                },
                onComplete: () => {
                    this._currentVoiceSettings = null;
                    if (onComplete) {
                        onComplete();
                    }
                }
            });

            effect.start(element);
            this.currentTypewriterInterval = effect;
        } catch (e) {
            logger.error('TypewriterController error:', e);
            if (onComplete) {
                onComplete();
            }
        }
    }

    /**
     * Stop any running typewriter effect
     */
    stop() {
        if (this.currentTypewriterInterval) {
            const stopped = safeCall(this.currentTypewriterInterval, 'stop');
            if (!stopped) {
                try {
                    clearInterval(this.currentTypewriterInterval);
                } catch (e) {}
            }
            this.currentTypewriterInterval = null;
        }
        this._currentVoiceSettings = null;
    }

    /**
     * Check if character should use typewriter effect
     * @param {HTMLElement} element - Element to check
     * @returns {boolean}
     */
    shouldUseTypewriter(element) {
        if (this.typewriterSpeed <= 0) {
            return false;
        }

        try {
            const hasCharacterName = !!element.querySelector &&
                                    !!element.querySelector('.character-name');
            return hasCharacterName;
        } catch (e) {
            return false;
        }
    }

    /**
     * Detect character name from element
     * @param {HTMLElement} element - Element to search
     * @returns {string|null} Character name or null
     */
    _detectCharacterNameForElement(element) {
        try {
            if (!element) return null;

            const nameEl = element.querySelector && element.querySelector('.character-name');
            if (!nameEl) return null;

            const txt = (nameEl.textContent || '').trim();
            return txt.length ? txt : null;
        } catch (e) {
            return null;
        }
    }

    /**
     * Set typewriter speed
     * @param {number} speed - Milliseconds per character
     */
    setSpeed(speed) {
        this.typewriterSpeed = Math.max(0, speed);
    }

    /**
     * Enable or disable SFX
     * @param {boolean} enabled
     */
    setSfxEnabled(enabled) {
        this.typewriterSfxEnabled = !!enabled;
    }
}
