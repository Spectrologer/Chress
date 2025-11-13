/**
 * SoundLifecycleManager - Manages sound lifecycle events
 *
 * Handles focus/blur events and audio context resumption.
 * Extracted from SoundManager to reduce file size.
 */

import { errorHandler, ErrorSeverity } from '@core/ErrorHandler.js';
import { safeCallAsync } from '@utils/SafeServiceCall.js';
import { VOLUME_CONSTANTS } from '@core/constants/audio.js';

interface MusicController {
    musicEnabled: boolean;
    backgroundAudioElement: HTMLAudioElement | null;
    backgroundGain: GainNode | null;
    audioContext: AudioContext | null;
    currentMusicVolume: number;
    getAudioContext(): AudioContext | null;
}

export class SoundLifecycleManager {
    private musicController: MusicController;
    private wasMusicPlayingBeforeBlur: boolean;

    constructor(musicController: MusicController) {
        this.musicController = musicController;
        this.wasMusicPlayingBeforeBlur = false;
    }

    /**
     * Setup focus/blur event listeners
     */
    setupFocusListeners(): void {
        // Handle Page Visibility API (desktop and mobile)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.handleBlur();
            } else {
                this.handleFocus();
            }
        });

        // Handle window blur/focus events (desktop fallback)
        window.addEventListener('blur', () => {
            this.handleBlur();
        });

        window.addEventListener('focus', () => {
            this.handleFocus();
        });
    }

    /**
     * Handle blur event (app loses focus)
     */
    handleBlur(): void {
        const isMusicPlaying = this.musicController.musicEnabled &&
            (this.musicController.backgroundAudioElement && !this.musicController.backgroundAudioElement.paused);

        this.wasMusicPlayingBeforeBlur = isMusicPlaying;

        if (isMusicPlaying) {
            try {
                if (this.musicController.backgroundGain) {
                    const audioContext = this.musicController.audioContext;
                    this.musicController.backgroundGain.gain.setValueAtTime(0, audioContext?.currentTime || 0);
                }
                if (this.musicController.backgroundAudioElement) {
                    this.musicController.backgroundAudioElement.pause();
                }
            } catch (e) {
                // Ignore pause errors
            }
        }
    }

    /**
     * Handle focus event (app regains focus)
     */
    handleFocus(): void {
        if (this.wasMusicPlayingBeforeBlur && this.musicController.musicEnabled) {
            try {
                if (this.musicController.backgroundAudioElement) {
                    this.musicController.backgroundAudioElement.play().catch(() => {
                        // Ignore autoplay policy errors
                    });
                }
                if (this.musicController.backgroundGain && this.musicController.audioContext) {
                    const volume = this.musicController.currentMusicVolume || VOLUME_CONSTANTS.DEFAULT_MUSIC_VOLUME;
                    this.musicController.backgroundGain.gain.setValueAtTime(volume, this.musicController.audioContext.currentTime);
                }
            } catch (e) {
                // Ignore resume errors
            }
        }
        this.wasMusicPlayingBeforeBlur = false;
    }

    /**
     * Resume audio context (call from user gesture)
     */
    async resumeAudioContext(): Promise<void> {
        try {
            const audioContext = this.musicController.getAudioContext();
            if (audioContext) {
                await safeCallAsync(audioContext, 'resume')?.catch(err => {
                    errorHandler.handle(err, ErrorSeverity.WARNING, {
                        component: 'SoundLifecycleManager',
                        action: 'resume audio context'
                    });
                });
            }

            // Also initialize Strudel audio on user interaction
            const strudelManager = (this.musicController as any).strudelManager;
            if (strudelManager && typeof strudelManager.initializeAudio === 'function') {
                await strudelManager.initializeAudio().catch((err: unknown) => {
                    errorHandler.handle(err, ErrorSeverity.WARNING, {
                        component: 'SoundLifecycleManager',
                        action: 'initialize Strudel audio'
                    });
                });
            }
        } catch (e) {
            // ignore
        }
    }
}
