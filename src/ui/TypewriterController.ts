import { logger } from '../core/logger.ts';
import { TypewriterEffect } from './TypewriterEffect.ts';
import { getVoiceSettingsForName, playTypingBlip } from './VoiceSettings.ts';
import { safeCall } from '../utils/SafeServiceCall.js';
import { UI_TIMING_CONSTANTS } from '../core/constants/ui.js';

interface GameInstance {
    [key: string]: any;
}

/**
 * Coordinates typewriter text reveal effects with voice SFX.
 * Manages character detection and voice settings for dialogue.
 */
export class TypewriterController {
    public game: GameInstance | null;
    public currentTypewriterInterval: TypewriterEffect | null = null;
    public typewriterSpeed: number;
    public typewriterSfxEnabled: boolean = true;

    // Voice settings cache and state
    public _voiceCache: Map<string, any> = new Map(); // name -> voiceSettings
    public _currentVoiceSettings: any = null;
    public _typingAudioContext?: AudioContext;
    public _typingMasterGain?: GainNode;

    constructor(game: GameInstance | null = null) {
        this.game = game;
        this.typewriterSpeed = UI_TIMING_CONSTANTS.TYPEWRITER_SPEED; // ms per character
    }

    /**
     * Start typewriter effect on an element
     */
    start(element: HTMLElement, onComplete: (() => void) | null = null): void {
        try {
            // Stop any previous typewriter first (before detecting name)
            this.stop();

            // Detect character name for voice SFX
            const detectedName = this._detectCharacterNameForElement(element);
            if (detectedName) {
                this._currentVoiceSettings = getVoiceSettingsForName(detectedName);
            } else {
                this._currentVoiceSettings = null;
            }

            // Create new typewriter effect
            const effect = new TypewriterEffect({
                speed: this.typewriterSpeed,
                onChar: (ch: string) => {
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
    stop(): void {
        if (this.currentTypewriterInterval) {
            const stopped = safeCall(this.currentTypewriterInterval, 'stop');
            if (!stopped) {
                try {
                    clearInterval(this.currentTypewriterInterval as any);
                } catch (e) {}
            }
            this.currentTypewriterInterval = null;
        }
        this._currentVoiceSettings = null;
    }

    /**
     * Check if character should use typewriter effect
     */
    shouldUseTypewriter(element: HTMLElement): boolean {
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
     */
    private _detectCharacterNameForElement(element: HTMLElement | null): string | null {
        try {
            if (!element) {
                return null;
            }

            const nameEl = element.querySelector && element.querySelector('.character-name');
            if (!nameEl) {
                return null;
            }

            const txt = (nameEl.textContent || '').trim();
            return txt.length ? txt : null;
        } catch (e) {
            return null;
        }
    }

    /**
     * Set typewriter speed
     */
    setSpeed(speed: number): void {
        this.typewriterSpeed = Math.max(0, speed);
    }

    /**
     * Enable or disable SFX
     */
    setSfxEnabled(enabled: boolean): void {
        this.typewriterSfxEnabled = !!enabled;
    }
}
