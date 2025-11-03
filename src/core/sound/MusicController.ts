// @ts-check
/**
 * MusicController - Manages background music playback with crossfading
 *
 * Handles WebAudio-based music playback with smooth transitions between tracks.
 * Extracted from SoundManager to reduce file size.
 */

import { errorHandler, ErrorSeverity } from '../ErrorHandler';
import { VOLUME_CONSTANTS } from '../constants/audio';

export class MusicController {
    constructor() {
        this.audioContext = null;
        this.backgroundAudioElement = null;
        this.backgroundSource = null;
        this.backgroundGain = null;
        this.currentMusicVolume = VOLUME_CONSTANTS.DEFAULT_MUSIC_VOLUME;
        this.currentMusicTrack = null;
        this.musicEnabled = true;
    }

    /**
     * Play background music track by file path (loops)
     * @param {string} filePath - Path to music file
     * @param {number} [volume] - Volume level (0-1)
     * @returns {void}
     */
    playBackground(filePath, volume = VOLUME_CONSTANTS.DEFAULT_MUSIC_VOLUME) {
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
            audio.play().catch(err => {
                errorHandler.handle(err, ErrorSeverity.WARNING, {
                    component: 'MusicController',
                    action: 'play background music',
                    filePath
                });
            });
            this.backgroundAudio = audio;
        } catch (e) {
            // ignore background play errors
        }
    }

    /**
     * Stop background music
     * @returns {void}
     */
    stopBackground() {
        try {
            if (this.backgroundAudio) {
                try { this.backgroundAudio.pause(); } catch (e) {}
                this.backgroundAudio = null;
            }
        } catch (e) {}
    }

    /**
     * Set music for zone dimension
     * @param {Object} options - Zone options
     * @param {number} [options.dimension] - Zone dimension (0=surface, 1=interior, 2=underground)
     * @returns {void}
     */
    setMusicForZone({ dimension = 0 } = {}) {
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

    /**
     * Play background using WebAudio with crossfading
     * @param {string} filePath - Path to music file
     * @param {number} [volume] - Volume level
     * @param {number} [crossfadeMs] - Crossfade duration in milliseconds
     * @returns {void}
     */
    playBackgroundContinuous(filePath, volume = VOLUME_CONSTANTS.DEFAULT_MUSIC_VOLUME, crossfadeMs = VOLUME_CONSTANTS.DEFAULT_CROSSFADE_DURATION) {
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
            nextAudio.play().catch(err => {
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
                } catch (e) {}

                const oldAudio = this.backgroundAudioElement;
                setTimeout(() => {
                    try { oldAudio.pause(); } catch (e) {}
                }, Math.ceil(fadeSec * 1000) + 50);
            }

            // Store references to current background
            this.backgroundAudioElement = nextAudio;
            this.backgroundSource = nextSource;
            this.backgroundGain = nextGain;
        } catch (e) {
            // Fallback to simple HTMLAudio playback
            try { this.playBackground(filePath, volume); } catch (ee) {}
        }
    }

    /**
     * Set music enabled/disabled
     * @param {boolean} enabled - Whether music is enabled
     * @returns {void}
     */
    setMusicEnabled(enabled) {
        this.musicEnabled = !!enabled;
        try {
            if (!this.musicEnabled) {
                // Mute or pause background
                if (this.backgroundGain) {
                    try { this.backgroundGain.gain.setValueAtTime(0, this.audioContext ? this.audioContext.currentTime : 0); } catch (e) {}
                }
                if (this.backgroundAudioElement && !this.backgroundGain) {
                    try { this.backgroundAudioElement.pause(); } catch (e) {}
                }
            } else {
                // Restore music
                if (this.backgroundGain && this.backgroundAudioElement) {
                    try { this.backgroundGain.gain.setValueAtTime(this.currentMusicVolume || VOLUME_CONSTANTS.DEFAULT_MUSIC_VOLUME, this.audioContext.currentTime); } catch (e) {}
                } else if (this.backgroundAudioElement) {
                    try { this.backgroundAudioElement.play().catch(() => {}); } catch (e) {}
                } else if (this.currentMusicTrack) {
                    try { this.playBackgroundContinuous(this.currentMusicTrack, this.currentMusicVolume || VOLUME_CONSTANTS.DEFAULT_MUSIC_VOLUME); } catch (e) {}
                }
            }
        } catch (e) {}
    }

    /**
     * Get audio context (create if needed)
     * @returns {AudioContext|null}
     */
    getAudioContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        return this.audioContext;
    }
}
