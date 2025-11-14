/**
 * StrudelMusicManager - Manages Strudel-based procedural music
 *
 * Handles real-time music generation using the Strudel library for
 * dynamic, generative background music.
 */

import { repl, type Pattern, type Scheduler } from '@strudel/core';
import { getAudioContext, webaudioOutput } from '@strudel/webaudio';
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

            // Get or create the audio context directly (should be called during user gesture)
            const ctx = getAudioContext();

            // Resume the context if it's suspended (due to autoplay policy)
            if (ctx.state === 'suspended') {
                await ctx.resume();
            }

            // Register synth sounds first
            await registerSynthSounds();

            // Create scheduler with repl
            const replInstance = repl({
                defaultOutput: webaudioOutput,
                getTime: () => ctx.currentTime
            });

            this.scheduler = replInstance.scheduler;
            this.audioContextInitialized = true;

            // Load soundfonts (non-blocking but ensure it's called)
            this.loadSoundfonts().then(() => {
                // Soundfonts loaded successfully
            }).catch(e => {
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
        if (this.soundfontsLoaded) return Promise.resolve();

        try {
            // Wrap in additional promise handling to catch any delayed errors
            const result = registerSoundfonts();

            // Check if registerSoundfonts actually returned a Promise
            if (result && typeof result.catch === 'function') {
                await result.catch((sfError: unknown) => {
                    // Soundfont loading errors are non-critical - synth sounds still work
                    errorHandler.handle(sfError, ErrorSeverity.WARNING, {
                        component: 'StrudelMusicManager',
                        action: 'registerSoundfonts',
                        message: 'Soundfont sample loading failed (using synth fallback)'
                    });
                });
            }

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
        console.log('[DEBUG] StrudelMusicManager.play() called, audioContextInitialized:', this.audioContextInitialized);
        try {
            // Initialize audio if needed
            if (!this.audioContextInitialized) {
                console.log('[DEBUG] Initializing audio...');
                await this.initializeAudio();
                console.log('[DEBUG] Audio initialized');
            }

            // Always ensure soundfonts are loaded before playing (wait for the promise to resolve)
            console.log('[DEBUG] Loading soundfonts...');
            await this.loadSoundfonts();
            console.log('[DEBUG] Soundfonts loaded');

            if (!this.scheduler) {
                console.log('[DEBUG] ERROR: Scheduler not initialized');
                throw new Error('Scheduler not initialized');
            }

            // Stop current pattern if playing
            if (this.isPlaying) {
                console.log('[DEBUG] Stopping current pattern...');
                this.scheduler.stop();
            }

            // Set and start the new pattern
            console.log('[DEBUG] Setting and starting new pattern...');
            this.currentPattern = pattern;
            this.scheduler.setPattern(pattern);
            this.scheduler.start();

            this.isPlaying = true;
            console.log('[DEBUG] Music is now playing');
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
