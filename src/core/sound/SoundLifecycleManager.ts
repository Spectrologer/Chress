/**
 * SoundLifecycleManager - Manages sound lifecycle events
 *
 * Handles focus/blur events and audio context resumption.
 * Extracted from SoundManager to reduce file size.
 */

import { errorHandler, ErrorSeverity } from '../ErrorHandler';
import { safeCallAsync } from '../../utils/SafeServiceCall';
import { VOLUME_CONSTANTS } from '../constants/audio';

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
    resumeAudioContext(): Promise<void> {
        try {
            const audioContext = this.musicController.getAudioContext();
            if (!audioContext) {
                return Promise.resolve();
            }
            return safeCallAsync(audioContext, 'resume')?.catch(err => {
                errorHandler.handle(err, ErrorSeverity.WARNING, {
                    component: 'SoundLifecycleManager',
                    action: 'resume audio context'
                });
            }) || Promise.resolve();
        } catch (e) {
            // ignore
        }
        return Promise.resolve();
    }
}
