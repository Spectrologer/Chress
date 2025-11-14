/**
 * StrudelMusicManager - Manages Strudel-based procedural music
 *
 * Handles real-time music generation using the Strudel library for
 * dynamic, generative background music.
 */

import * as strudel from '@strudel/web';
// Import soundfonts module
import { registerSoundfonts } from '@strudel/soundfonts';
import { errorHandler, ErrorSeverity } from '@core/ErrorHandler.js';

type Pattern = any;
type Scheduler = any;

export class StrudelMusicManager {
    private repl: any = null;
    private currentPattern: Pattern | null = null;
    private isPlaying: boolean = false;
    private audioContextInitialized: boolean = false;
    private soundfontsLoaded: boolean = false;

    constructor() {
        this.repl = null;
        this.currentPattern = null;
        this.isPlaying = false;
        this.audioContextInitialized = false;
        this.soundfontsLoaded = false;
    }

    /**
     * Initialize Web Audio context and scheduler (call on user interaction)
     * Based on the pattern from Material Tower Defense's strudel.js
     */
    async initializeAudio(): Promise<void> {
        try {
            if (this.audioContextInitialized) return;

            console.log('[DEBUG] Starting Strudel initialization...');

            // Step 1: Initialize audio on first click (handles browser autoplay policy)
            await strudel.initAudioOnFirstClick();
            console.log('[DEBUG] Audio context initialized');

            // Step 2: Initialize mini notation strings
            strudel.miniAllStrings();
            console.log('[DEBUG] Mini notation initialized');

            // Step 3: Create REPL with webaudio output
            this.repl = await strudel.webaudioRepl({
                transpiler: strudel.transpiler
            });
            console.log('[DEBUG] REPL created');

            // Step 4: Use defaultPrebake to load core modules and register synth sounds
            console.log('[DEBUG] Running defaultPrebake (loading core modules and synth sounds)...');
            await strudel.defaultPrebake();
            console.log('[DEBUG] defaultPrebake complete');

            // Step 5: Register soundfonts (synchronous - registers sound handlers that load fonts on-demand)
            console.log('[DEBUG] Registering soundfonts...');
            registerSoundfonts();
            console.log('[DEBUG] Soundfonts registered (fonts will load on-demand from CDN)');

            // Step 6: Set time function AFTER sounds are registered
            strudel.setTime(() => this.repl.scheduler.now());
            console.log('[DEBUG] Time function set');

            this.audioContextInitialized = true;
            this.soundfontsLoaded = true;

            console.log('[DEBUG] Strudel fully initialized');
        } catch (e: unknown) {
            errorHandler.handle(e, ErrorSeverity.WARNING, {
                component: 'StrudelMusicManager',
                action: 'initializeAudio'
            });
            console.error('[DEBUG] Strudel initialization failed:', e);
            // Even if there's an error, mark as initialized to avoid infinite loops
            this.audioContextInitialized = true;
        }
    }

    /**
     * Load soundfonts for General MIDI instruments (now handled in initializeAudio)
     */
    private async loadSoundfonts(): Promise<void> {
        // This is now handled in initializeAudio(), keeping method for compatibility
        return Promise.resolve();
    }


    /**
     * Play a Strudel pattern
     * @param pattern - The Strudel Pattern object to play
     */
    async play(pattern: Pattern): Promise<void> {
        console.log('[DEBUG] StrudelMusicManager.play() called, audioContextInitialized:', this.audioContextInitialized);
        try {
            // Initialize audio if needed
            if (!this.audioContextInitialized) {
                console.log('[DEBUG] Initializing audio...');
                await this.initializeAudio();
                console.log('[DEBUG] Audio initialized');
            }

            if (!this.repl) {
                console.log('[DEBUG] ERROR: REPL not initialized');
                throw new Error('REPL not initialized');
            }

            // Stop current pattern if playing
            if (this.isPlaying) {
                console.log('[DEBUG] Stopping current pattern...');
                this.repl.stop();
            }

            // Set and start the new pattern using the repl
            console.log('[DEBUG] Setting and starting new pattern...');
            this.currentPattern = pattern;
            this.repl.setPattern(pattern, true);

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
            if (!this.repl || !this.isPlaying) return;

            this.repl.stop();
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
    getCurrentPattern(): Pattern | null {
        return this.currentPattern;
    }

    /**
     * Set volume (0-1)
     */
    setVolume(volume: number): void {
        try {
            if (!this.repl) return;

            const clampedVolume = Math.max(0, Math.min(1, volume));

            // Use Strudel's gain control on patterns if available
            if (this.currentPattern) {
                this.currentPattern = this.currentPattern.gain(clampedVolume);
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
