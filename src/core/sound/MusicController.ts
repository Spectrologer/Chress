// @ts-check
/**
 * MusicController - Manages background music playback with crossfading
 *
 * Handles WebAudio-based music playback with smooth transitions between tracks.
 * Extracted from SoundManager to reduce file size.
 */

import { errorHandler, ErrorSeverity } from '@core/ErrorHandler.js';
import { VOLUME_CONSTANTS } from '@core/constants/audio.js';
import { StrudelMusicManager } from './StrudelMusicManager.js';
import { getMusicPatternForDimension } from './MusicPatterns.js';

export class MusicController {
    public audioContext: AudioContext | null;
    public backgroundAudioElement: HTMLAudioElement | null;
    public backgroundSource: MediaElementAudioSourceNode | null;
    public backgroundGain: GainNode | null;
    public currentMusicVolume: number;
    public currentMusicTrack: string | null;
    public musicEnabled: boolean;
    private strudelManager: StrudelMusicManager;
    private useStrudel: boolean;
    private currentDimension: number | null;
    private inCombat: boolean;

    constructor() {
        this.audioContext = null;
        this.backgroundAudioElement = null;
        this.backgroundSource = null;
        this.backgroundGain = null;
        this.currentMusicVolume = VOLUME_CONSTANTS.DEFAULT_MUSIC_VOLUME;
        this.currentMusicTrack = null;
        this.musicEnabled = true;
        this.strudelManager = new StrudelMusicManager();
        this.useStrudel = true; // Set to false to use .ogg files instead
        this.currentDimension = null;
        this.inCombat = false;
    }

    /**
     * Play background music track by file path (loops)
     * @param {string} filePath - Path to music file
     * @param {number} [volume] - Volume level (0-1)
     * @returns {void}
     */
    playBackground(filePath: string, volume = VOLUME_CONSTANTS.DEFAULT_MUSIC_VOLUME): void {
        try {
            if (this.musicEnabled === false) {
                this.currentMusicTrack = filePath;
                this.currentMusicVolume = volume;
                return;
            }

            this.stopBackground();
            const audio = new Audio();
            audio.src = filePath;
            audio.loop = true;
            audio.volume = volume;
            this.currentMusicVolume = volume;
            audio.play().catch((err: unknown) => {
                errorHandler.handle(err, ErrorSeverity.WARNING, {
                    component: 'MusicController',
                    action: 'play background music',
                    filePath
                });
            });
            this.backgroundAudioElement = audio;
        } catch (e: unknown) {
            errorHandler.handle(e, ErrorSeverity.WARNING, {
                component: 'MusicController',
                action: 'playBackground setup'
            });
        }
    }

    /**
     * Stop background music
     * @returns {void}
     */
    stopBackground(): void {
        try {
            if (this.backgroundAudioElement) {
                try { this.backgroundAudioElement.pause(); } catch (e: unknown) {
                    errorHandler.handle(e, ErrorSeverity.WARNING, {
                        component: 'MusicController',
                        action: 'pause background audio'
                    });
                }
                this.backgroundAudioElement = null;
            }
        } catch (e: unknown) {
            errorHandler.handle(e, ErrorSeverity.WARNING, {
                component: 'MusicController',
                action: 'stopBackground'
            });
        }
    }

    /**
     * Set music for zone dimension and level
     * @param {Object} options - Zone options
     * @param {number} [options.dimension] - Zone dimension (0=surface, 1=interior, 2=underground)
     * @param {number} [options.zoneLevel] - Zone level (1=home, 2=woods, 3=wilds, 4=frontier)
     * @returns {void}
     */
    setMusicForZone({ dimension = 0, zoneLevel }: { dimension?: number; zoneLevel?: number } = {}): void {
        if (this.useStrudel) {
            // Use Strudel for procedural music
            // Surface zones (dimension=0): Use zone level for region-specific music (home/woods/wilds/frontier)
            // Interior/Underground zones: Use dimension for location-specific music (peaceful/cave)
            // Note: We offset zone levels by 10 to avoid collision with dimensions
            let musicSelector: number;
            if (dimension === 0 && zoneLevel) {
                // Surface zone: use zone level + 10 to distinguish from dimensions
                musicSelector = zoneLevel + 10;
            } else {
                // Interior or underground: use dimension directly
                musicSelector = dimension;
            }
            this.playStrudelForDimension(musicSelector);
        } else {
            // Use traditional .ogg files
            const peacefulPath = 'sfx/music/peaceful.ogg';
            const tensionPath = 'sfx/music/tension.ogg';
            const cavePath = 'sfx/music/cave.ogg';
            const crossfadeMs = 800;

            let filePath;
            if (dimension === 1) filePath = peacefulPath;
            else if (dimension === 2) filePath = cavePath;
            else filePath = tensionPath;

            this.currentMusicTrack = filePath;

            if (this.musicEnabled === false) return;

            this.playBackgroundContinuous(filePath, this.currentMusicVolume, crossfadeMs);
        }
    }

    /**
     * Play Strudel pattern for zone dimension or level
     * @param {number} dimension - Zone dimension (0=surface, 1=interior, 2=underground) or zone level (1=home, 2=woods, 3=wilds, 4=frontier)
     * @param {boolean} combat - Whether to play combat music
     * @returns {void}
     */
    private async playStrudelForDimension(dimension: number, combat: boolean = false): Promise<void> {
        try {
            if (this.musicEnabled === false) return;

            // Only change music if dimension or combat state has actually changed
            if (this.currentDimension === dimension && this.inCombat === combat && this.strudelManager.getIsPlaying()) {
                return; // Already playing correct music for this dimension and combat state
            }

            this.currentDimension = dimension;
            this.inCombat = combat;
            const pattern = getMusicPatternForDimension(dimension, combat);

            // Stop traditional audio if playing
            this.stopBackground();

            // Set volume before playing
            this.strudelManager.setVolume(this.currentMusicVolume);

            // Play Strudel pattern
            await this.strudelManager.play(pattern);
        } catch (e: unknown) {
            errorHandler.handle(e, ErrorSeverity.WARNING, {
                component: 'MusicController',
                action: 'playStrudelForDimension',
                dimension,
                combat
            });
        }
    }

    /**
     * Set combat state for music
     * @param {boolean} combat - Whether enemies are present
     * @returns {void}
     */
    setCombatMusic(combat: boolean): void {
        if (this.useStrudel && this.currentDimension !== null) {
            // Only switch if combat state changed
            if (this.inCombat !== combat) {
                this.playStrudelForDimension(this.currentDimension, combat);
            }
        }
    }

    /**
     * Play background using WebAudio with crossfading
     * @param {string} filePath - Path to music file
     * @param {number} [volume] - Volume level
     * @param {number} [crossfadeMs] - Crossfade duration in milliseconds
     * @returns {void}
     */
    playBackgroundContinuous(filePath: string, volume = VOLUME_CONSTANTS.DEFAULT_MUSIC_VOLUME, crossfadeMs = VOLUME_CONSTANTS.DEFAULT_CROSSFADE_DURATION): void {
        try {
            if (this.musicEnabled === false) {
                this.currentMusicTrack = filePath;
                this.currentMusicVolume = volume;
                return;
            }

            // Lazily create AudioContext
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            // If same track is already playing, just adjust volume
            if (this.backgroundAudioElement && this.backgroundAudioElement.src && this.backgroundAudioElement.src.endsWith(filePath)) {
                if (this.backgroundGain) this.backgroundGain.gain.setTargetAtTime(volume, this.audioContext.currentTime, 0.01);
                return;
            }

            // Create new audio element for the next track
            const nextAudio = new Audio();
            nextAudio.src = filePath;
            nextAudio.loop = true;
            nextAudio.crossOrigin = 'anonymous';

            this.currentMusicVolume = volume;

            // Create source and gain for the next track
            const nextSource = this.audioContext.createMediaElementSource(nextAudio);
            const nextGain = this.audioContext.createGain();
            nextGain.gain.value = 0;
            nextSource.connect(nextGain).connect(this.audioContext.destination);

            // Start playing the next track
            nextAudio.play().catch((err: unknown) => {
                errorHandler.handle(err, ErrorSeverity.WARNING, {
                    component: 'MusicController',
                    action: 'play next background track',
                    filePath
                });
            });

            const now = this.audioContext.currentTime;
            const fadeSec = Math.max(0.05, (crossfadeMs || 600) / 1000);

            // Ramp up next gain
            nextGain.gain.setValueAtTime(0, now);
            nextGain.gain.linearRampToValueAtTime(volume, now + fadeSec);

            // Fade out and stop previous if present
            if (this.backgroundAudioElement && this.backgroundGain) {
                try {
                    this.backgroundGain.gain.cancelScheduledValues(now);
                    this.backgroundGain.gain.setValueAtTime(this.backgroundGain.gain.value, now);
                    this.backgroundGain.gain.linearRampToValueAtTime(0, now + fadeSec);
                } catch (e: unknown) {
                    errorHandler.handle(e, ErrorSeverity.WARNING, {
                        component: 'MusicController',
                        action: 'fade out previous track'
                    });
                }

                const oldAudio = this.backgroundAudioElement;
                setTimeout(() => {
                    try { oldAudio.pause(); } catch (e: unknown) {
                        errorHandler.handle(e, ErrorSeverity.WARNING, {
                            component: 'MusicController',
                            action: 'pause old audio'
                        });
                    }
                }, Math.ceil(fadeSec * 1000) + 50);
            }

            // Store references to current background
            this.backgroundAudioElement = nextAudio;
            this.backgroundSource = nextSource;
            this.backgroundGain = nextGain;
        } catch (e: unknown) {
            errorHandler.handle(e, ErrorSeverity.WARNING, {
                component: 'MusicController',
                action: 'playBackgroundContinuous',
                filePath
            });
            // Fallback to simple HTMLAudio playback
            try { this.playBackground(filePath, volume); } catch (ee: unknown) {
                errorHandler.handle(ee, ErrorSeverity.WARNING, {
                    component: 'MusicController',
                    action: 'playBackground fallback',
                    filePath
                });
            }
        }
    }

    /**
     * Get music enabled state
     * @returns {boolean}
     */
    getMusicEnabled(): boolean {
        return this.musicEnabled;
    }

    /**
     * Set music enabled/disabled
     * @param {boolean} enabled - Whether music is enabled
     * @returns {void}
     */
    setMusicEnabled(enabled: boolean): void {
        this.musicEnabled = !!enabled;
        try {
            if (!this.musicEnabled) {
                // Stop Strudel if using it
                if (this.useStrudel) {
                    this.strudelManager.stop();
                }
                // Mute or pause background
                if (this.backgroundGain) {
                    try { this.backgroundGain.gain.setValueAtTime(0, this.audioContext ? this.audioContext.currentTime : 0); } catch (e: unknown) {
                        errorHandler.handle(e, ErrorSeverity.WARNING, {
                            component: 'MusicController',
                            action: 'mute background gain'
                        });
                    }
                }
                if (this.backgroundAudioElement && !this.backgroundGain) {
                    try { this.backgroundAudioElement.pause(); } catch (e: unknown) {
                        errorHandler.handle(e, ErrorSeverity.WARNING, {
                            component: 'MusicController',
                            action: 'pause background audio'
                        });
                    }
                }
            } else {
                // Restore music
                if (this.useStrudel && this.strudelManager.getCurrentPattern()) {
                    // Resume Strudel
                    const pattern = this.strudelManager.getCurrentPattern();
                    if (pattern) {
                        this.strudelManager.play(pattern);
                        this.strudelManager.setVolume(this.currentMusicVolume);
                    }
                } else if (this.backgroundGain && this.backgroundAudioElement) {
                    try { this.backgroundGain.gain.setValueAtTime(this.currentMusicVolume || VOLUME_CONSTANTS.DEFAULT_MUSIC_VOLUME, this.audioContext!.currentTime); } catch (e: unknown) {
                        errorHandler.handle(e, ErrorSeverity.WARNING, {
                            component: 'MusicController',
                            action: 'restore background gain'
                        });
                    }
                } else if (this.backgroundAudioElement) {
                    try { this.backgroundAudioElement.play().catch(() => {}); } catch (e: unknown) {
                        errorHandler.handle(e, ErrorSeverity.WARNING, {
                            component: 'MusicController',
                            action: 'resume background audio'
                        });
                    }
                } else if (this.currentMusicTrack) {
                    try { this.playBackgroundContinuous(this.currentMusicTrack, this.currentMusicVolume || VOLUME_CONSTANTS.DEFAULT_MUSIC_VOLUME); } catch (e: unknown) {
                        errorHandler.handle(e, ErrorSeverity.WARNING, {
                            component: 'MusicController',
                            action: 'restart background music'
                        });
                    }
                }
            }
        } catch (e: unknown) {
            errorHandler.handle(e, ErrorSeverity.WARNING, {
                component: 'MusicController',
                action: 'setMusicEnabled',
                enabled
            });
        }
    }

    /**
     * Get audio context (create if needed)
     * @returns {AudioContext|null}
     */
    getAudioContext(): AudioContext | null {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        return this.audioContext;
    }
}
