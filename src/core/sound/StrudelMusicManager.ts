/**
 * StrudelMusicManager - Manages Strudel-based procedural music
 *
 * Handles real-time music generation using the Strudel library for
 * dynamic, generative background music.
 */

import { repl, type Pattern, type Scheduler } from '@strudel/core';
import { getAudioContext, webaudioOutput, initAudioOnFirstClick } from '@strudel/webaudio';
import { registerSynthSounds } from 'superdough';
import { registerSoundfonts } from '@strudel/soundfonts';
import { errorHandler, ErrorSeverity } from '@core/ErrorHandler.js';

export class StrudelMusicManager {
    private scheduler: Scheduler | null = null;
    private currentPattern: Pattern<any> | null = null;
    private isPlaying: boolean = false;
    private audioContextInitialized: boolean = false;
    private soundfontsLoaded: boolean = false;

    constructor() {
        this.scheduler = null;
        this.currentPattern = null;
        this.isPlaying = false;
        this.audioContextInitialized = false;
        this.soundfontsLoaded = false;
    }

    /**
     * Initialize Web Audio context and scheduler (call on user interaction)
     */
    async initializeAudio(): Promise<void> {
        try {
            if (this.audioContextInitialized) return;

            // Initialize audio context
            await initAudioOnFirstClick();

            // Register synth sounds first
            await registerSynthSounds();

            // Create scheduler with repl
            const ctx = getAudioContext();
            const replInstance = repl({
                defaultOutput: webaudioOutput,
                getTime: () => ctx.currentTime
            });

            this.scheduler = replInstance.scheduler;
            this.audioContextInitialized = true;

            // Load soundfonts (non-blocking)
            this.loadSoundfonts().catch(e => {
                errorHandler.handle(e, ErrorSeverity.WARNING, {
                    component: 'StrudelMusicManager',
                    action: 'initializeAudio',
                    message: 'Failed to load soundfonts'
                });
            });
        } catch (e: unknown) {
            errorHandler.handle(e, ErrorSeverity.WARNING, {
                component: 'StrudelMusicManager',
                action: 'initializeAudio'
            });
        }
    }

    /**
     * Load soundfonts for General MIDI instruments
     */
    private async loadSoundfonts(): Promise<void> {
        try {
            if (this.soundfontsLoaded) return;

            // Wrap in additional promise handling to catch any delayed errors
            await registerSoundfonts().catch((sfError: unknown) => {
                // Soundfont loading errors are non-critical - synth sounds still work
                errorHandler.handle(sfError, ErrorSeverity.WARNING, {
                    component: 'StrudelMusicManager',
                    action: 'registerSoundfonts',
                    message: 'Soundfont sample loading failed (using synth fallback)'
                });
            });

            this.soundfontsLoaded = true;
        } catch (e: unknown) {
            errorHandler.handle(e, ErrorSeverity.WARNING, {
                component: 'StrudelMusicManager',
                action: 'loadSoundfonts',
                message: 'Failed to load soundfonts'
            });
        }
    }


    /**
     * Play a Strudel pattern
     * @param pattern - The Strudel Pattern object to play
     */
    async play(pattern: Pattern<any>): Promise<void> {
        try {
            // Initialize audio if needed
            if (!this.audioContextInitialized) {
                await this.initializeAudio();
            }

            // Always ensure soundfonts are loaded before playing (wait for the promise to resolve)
            await this.loadSoundfonts();

            if (!this.scheduler) {
                throw new Error('Scheduler not initialized');
            }

            // Stop current pattern if playing
            if (this.isPlaying) {
                this.scheduler.stop();
            }

            // Set and start the new pattern
            this.currentPattern = pattern;
            this.scheduler.setPattern(pattern);
            this.scheduler.start();

            this.isPlaying = true;
        } catch (e: unknown) {
            errorHandler.handle(e, ErrorSeverity.WARNING, {
                component: 'StrudelMusicManager',
                action: 'play'
            });
        }
    }

    /**
     * Stop current pattern
     */
    async stop(): Promise<void> {
        try {
            if (!this.scheduler || !this.isPlaying) return;

            this.scheduler.stop();
            this.isPlaying = false;
            this.currentPattern = null;
        } catch (e: unknown) {
            errorHandler.handle(e, ErrorSeverity.WARNING, {
                component: 'StrudelMusicManager',
                action: 'stop'
            });
        }
    }

    /**
     * Check if currently playing
     */
    getIsPlaying(): boolean {
        return this.isPlaying;
    }

    /**
     * Get current pattern
     */
    getCurrentPattern(): Pattern<any> | null {
        return this.currentPattern;
    }

    /**
     * Set volume (0-1)
     */
    setVolume(volume: number): void {
        try {
            const audioContext = getAudioContext();
            if (!audioContext) return;

            const clampedVolume = Math.max(0, Math.min(1, volume));

            // Get the master gain node if available
            if (audioContext.destination && (audioContext.destination as any).gain) {
                (audioContext.destination as any).gain.value = clampedVolume;
            }
        } catch (e: unknown) {
            errorHandler.handle(e, ErrorSeverity.WARNING, {
                component: 'StrudelMusicManager',
                action: 'setVolume',
                volume
            });
        }
    }
}
