// @ts-check
/**
 * StrudelMusicManager - Manages Strudel-based procedural music
 *
 * Handles real-time music generation using the Strudel library for
 * dynamic, generative background music.
 */

import { repl, type Pattern } from '@strudel/core';
import { getAudioContext, webaudioOutput, initAudioOnFirstClick, samples } from '@strudel/webaudio';
import { registerSynthSounds } from 'superdough';
// @ts-ignore - Strudel soundfonts for GM instruments
import { registerSoundfonts } from '@strudel/soundfonts';
import { errorHandler, ErrorSeverity } from '@core/ErrorHandler.js';

export class StrudelMusicManager {
    private scheduler: any | null = null;
    private currentPattern: Pattern<any> | null = null;
    private isPlaying: boolean = false;
    private audioContextInitialized: boolean = false;
    private samplesLoaded: boolean = false;

    constructor() {
        this.scheduler = null;
        this.currentPattern = null;
        this.isPlaying = false;
        this.audioContextInitialized = false;
        this.samplesLoaded = false;
    }

    /**
     * Initialize Web Audio context and scheduler (call on user interaction)
     */
    async initializeAudio(): Promise<void> {
        try {
            if (this.audioContextInitialized) return;

            // Initialize audio context and register synth sounds
            await Promise.all([
                initAudioOnFirstClick(),
                registerSynthSounds()
            ]);

            // Register GM soundfonts
            registerSoundfonts();

            // Create scheduler with repl
            const ctx = getAudioContext();
            const replInstance = repl({
                defaultOutput: webaudioOutput,
                getTime: () => ctx.currentTime
            });

            this.scheduler = replInstance.scheduler;
            this.audioContextInitialized = true;

            // Load GM samples for richer instruments
            if (!this.samplesLoaded) {
                await this.loadGMSamples();
            }
        } catch (e: unknown) {
            errorHandler.handle(e, ErrorSeverity.WARNING, {
                component: 'StrudelMusicManager',
                action: 'initializeAudio'
            });
        }
    }

    /**
     * Load necessary samples for music playback
     * Loads basic drum samples (bd, hh) from Dirt-Samples repository
     */
    private async loadGMSamples(): Promise<void> {
        try {
            // Load only the basic samples we need from the Dirt-Samples repository
            // @ts-ignore - samples function exists at runtime
            await samples({
                bd: ['bd/BT0A0A7.wav', 'bd/BT0AADA.wav', 'bd/BT0AAD0.wav'],
                hh: ['hh/000_hh3closedhh.wav', 'hh/001_hh3openhh.wav', 'hh/002_hh3closedhh.wav',
                     'hh/003_hh3closedhh.wav', 'hh/004_hh3pedalhh.wav', 'hh/005_hh3openhh.wav',
                     'hh/006_hh3openhh.wav', 'hh/007_hh3closedhh.wav']
            }, 'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/');

            this.samplesLoaded = true;
        } catch (e: unknown) {
            errorHandler.handle(e, ErrorSeverity.WARNING, {
                component: 'StrudelMusicManager',
                action: 'loadGMSamples',
                message: 'Failed to load samples, falling back to basic synths'
            });
            // Continue without samples - basic synths will still work
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
