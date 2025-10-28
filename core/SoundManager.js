import { logger } from './logger.js';
import { eventBus } from './EventBus.js';
import { EventTypes } from './EventTypes.js';
import { errorHandler, ErrorSeverity } from './ErrorHandler.js';
import { safeCallAsync } from '../utils/SafeServiceCall.js';
import { VOLUME_CONSTANTS, SFX_CONSTANTS } from './constants/audio.js';

export class SoundManager {
    constructor() {
        this.sounds = {};
        this.sfxEnabled = true;
        this.musicEnabled = true;
        this.audioContext = null; // lazily created/resumed on user gesture
        this.currentMusicVolume = VOLUME_CONSTANTS.DEFAULT_MUSIC_VOLUME; // default music volume (reduced)
        this.currentMusicTrack = null; // track file path intended to be playing
        this.wasMusicPlayingBeforeBlur = false; // track if music was playing before losing focus
        this.loadSounds();
        this.setupEventListeners();
        this.setupFocusListeners();
    }

    setupEventListeners() {
        // Listen to music change events
        eventBus.on(EventTypes.MUSIC_CHANGE, (data) => {
            this.setMusicForZone({ dimension: data.dimension });
        });

        // Listen to zone changed events to update music
        eventBus.on(EventTypes.ZONE_CHANGED, (data) => {
            this.setMusicForZone({ dimension: data.dimension });
        });
    }

    setupFocusListeners() {
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

    handleBlur() {
        // When app loses focus, pause music if it's currently playing
        const isMusicPlaying = this.musicEnabled &&
            (this.backgroundAudioElement && !this.backgroundAudioElement.paused);

        this.wasMusicPlayingBeforeBlur = isMusicPlaying;

        if (isMusicPlaying) {
            try {
                if (this.backgroundGain) {
                    // Mute via gain node
                    this.backgroundGain.gain.setValueAtTime(0, this.audioContext?.currentTime || 0);
                }
                if (this.backgroundAudioElement) {
                    // Pause the audio element
                    this.backgroundAudioElement.pause();
                }
            } catch (e) {
                // Ignore pause errors
            }
        }
    }

    handleFocus() {
        // When app regains focus, resume music only if it was playing before blur
        // and music is still enabled by user preference
        if (this.wasMusicPlayingBeforeBlur && this.musicEnabled) {
            try {
                if (this.backgroundAudioElement) {
                    this.backgroundAudioElement.play().catch(() => {
                        // Ignore autoplay policy errors
                    });
                }
                if (this.backgroundGain && this.audioContext) {
                    // Restore volume via gain node
                    this.backgroundGain.gain.setValueAtTime(this.currentMusicVolume || VOLUME_CONSTANTS.DEFAULT_MUSIC_VOLUME, this.audioContext.currentTime);
                }
            } catch (e) {
                // Ignore resume errors
            }
        }
        // Reset the flag after handling focus
        this.wasMusicPlayingBeforeBlur = false;
    }

    async loadSounds() {
        // Load a small set of on-disk SFX that exist in the repo. Keep other sound
        // loading disabled to avoid decode issues for placeholder files.
        try {
            // Point and slash sounds used for defeating enemies and chopping shrubbery
            this.addSound('point', 'sfx/noises/point.wav');
            this.addSound('slash', 'sfx/noises/slash.wav');
        } catch (error) {
            logger.warn('Could not load sfx/noises assets, falling back to procedural sounds:', error);
        }
    }

    addSound(name, filePath) {
        const audio = new Audio();
        audio.src = filePath;
        audio.volume = VOLUME_CONSTANTS.DEFAULT_SFX_VOLUME; // Slightly more subtle default
        this.sounds[name] = audio;
    }

    // Play a background music track by file path (loops)
    // Default volume reduced to ~half to make music quieter
    playBackground(filePath, volume = VOLUME_CONSTANTS.DEFAULT_MUSIC_VOLUME) {
        try {
            // If music is disabled, remember the intended track but don't start it
            if (this.musicEnabled === false) {
                this.currentMusicTrack = filePath;
                this.currentMusicVolume = volume;
                return;
            }
            // Stop existing background if any
            this.stopBackground();
            const audio = new Audio();
            audio.src = filePath;
            audio.loop = true;
            audio.volume = volume;
            this.currentMusicVolume = volume;
            audio.play().catch(err => {
                errorHandler.handle(err, ErrorSeverity.WARNING, {
                    component: 'SoundManager',
                    action: 'play background music',
                    filePath
                });
            });
            this.backgroundAudio = audio;
        } catch (e) {
            // ignore background play errors
        }
    }

    stopBackground() {
        try {
            if (this.backgroundAudio) {
                try { this.backgroundAudio.pause(); } catch (e) {}
                // Don't set src to empty string - causes "Invalid URI" console errors
                // Just remove the reference and let garbage collection handle it
                this.backgroundAudio = null;
            }
        } catch (e) {}
    }

    // Convenience helper to set music depending on the zone dimension
    // dimension: 0=surface, 1=interior, 2=underground
    setMusicForZone({ dimension = 0 } = {}) {
        const peacefulPath = 'sfx/music/peaceful.ogg';
        const tensionPath = 'sfx/music/tension.ogg';
        const cavePath = 'sfx/music/cave.ogg';
        const crossfadeMs = 800; // soft crossfade duration

        // Determine desired track
        let filePath;
        if (dimension === 1) filePath = peacefulPath;
        else if (dimension === 2) filePath = cavePath;
        else filePath = tensionPath;

        // Store intended track so it can be resumed when music is enabled
        this.currentMusicTrack = filePath;

        // If music is disabled, don't start playback now. When music is enabled
        // we will start the currentMusicTrack in setMusicEnabled(true).
        if (this.musicEnabled === false) return;

        this.playBackgroundContinuous(filePath, this.currentMusicVolume, crossfadeMs);
    }

    // Play background using WebAudio so we can crossfade smoothly between tracks.
    // If the same file is already playing, keep it running.
    playBackgroundContinuous(filePath, volume = VOLUME_CONSTANTS.DEFAULT_MUSIC_VOLUME, crossfadeMs = VOLUME_CONSTANTS.DEFAULT_CROSSFADE_DURATION) {
        try {
            // If music is disabled, remember the intended track but don't start it
            if (this.musicEnabled === false) {
                this.currentMusicTrack = filePath;
                this.currentMusicVolume = volume;
                return;
            }
            // Lazily create AudioContext
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            // If there's an existing background and it's the same src, just ensure volume
            if (this.backgroundAudioElement && this.backgroundAudioElement.src && this.backgroundAudioElement.src.endsWith(filePath)) {
                // adjust gain if needed
                if (this.backgroundGain) this.backgroundGain.gain.setTargetAtTime(volume, this.audioContext.currentTime, 0.01);
                return;
            }

            // Create new audio element for the next track
            const nextAudio = new Audio();
            nextAudio.src = filePath;
            nextAudio.loop = true;
            nextAudio.crossOrigin = 'anonymous';

            // Track the intended music volume so unmute can restore it
            this.currentMusicVolume = volume;

            // Create source and gain for the next track
            const nextSource = this.audioContext.createMediaElementSource(nextAudio);
            const nextGain = this.audioContext.createGain();
            nextGain.gain.value = 0;
            nextSource.connect(nextGain).connect(this.audioContext.destination);

            // Start playing the next track (may require user gesture to allow autoplay)
            nextAudio.play().catch(err => {
                errorHandler.handle(err, ErrorSeverity.WARNING, {
                    component: 'SoundManager',
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

                // schedule pause of previous audio element after fade
                const oldAudio = this.backgroundAudioElement;
                setTimeout(() => {
                    try { oldAudio.pause(); } catch (e) {}
                    // Don't set src to empty string - causes "Invalid URI" console errors
                    // Just pause and let garbage collection handle it
                }, Math.ceil(fadeSec * 1000) + 50);
            }

            // Store references to current background
            this.backgroundAudioElement = nextAudio;
            this.backgroundSource = nextSource;
            this.backgroundGain = nextGain;
        } catch (e) {
            // Fallback to simple HTMLAudio playback if WebAudio fails
            try { this.playBackground(filePath, volume); } catch (ee) {}
        }
    }

    playSound(soundName) {
        if (this.sfxEnabled === false) return; // SFX globally disabled
        const audio = this.sounds[soundName];
        if (audio) {
            // Create a fresh audio instance to allow overlapping sounds
            const newAudio = audio.cloneNode();
            // Keep clone volume in line with the stored asset but slightly subdued
            newAudio.volume = Math.min(VOLUME_CONSTANTS.MAX_VOLUME, audio.volume || VOLUME_CONSTANTS.DEFAULT_SFX_VOLUME);
            newAudio.play().catch(error => {
                // Could not play sound
            });
        } else {
            // Fallback procedural sounds
            this.playProceduralSound(soundName);
        }
    }

    setSfxEnabled(enabled) {
        this.sfxEnabled = !!enabled;
    }

    setMusicEnabled(enabled) {
        this.musicEnabled = !!enabled;
        try {
            if (!this.musicEnabled) {
                // mute or pause background
                if (this.backgroundGain) {
                    try { this.backgroundGain.gain.setValueAtTime(0, this.audioContext ? this.audioContext.currentTime : 0); } catch (e) {}
                }
                if (this.backgroundAudioElement && !this.backgroundGain) {
                    try { this.backgroundAudioElement.pause(); } catch (e) {}
                }
            } else {
                // restore music based on current zone if available
                if (this.backgroundGain && this.backgroundAudioElement) {
                    try { this.backgroundGain.gain.setValueAtTime(this.currentMusicVolume || VOLUME_CONSTANTS.DEFAULT_MUSIC_VOLUME, this.audioContext.currentTime); } catch (e) {}
                } else if (this.backgroundAudioElement) {
                    try { this.backgroundAudioElement.play().catch(() => {}); } catch (e) {}
                } else if (this.currentMusicTrack) {
                    // No existing background element; start the stored track
                    try { this.playBackgroundContinuous(this.currentMusicTrack, this.currentMusicVolume || VOLUME_CONSTANTS.DEFAULT_MUSIC_VOLUME); } catch (e) {}
                }
            }
        } catch (e) {}
    }

    playProceduralSound(soundName) {
        try {
            // Use or create a shared AudioContext so autoplay policies can be satisfied
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            const audioContext = this.audioContext;
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            switch(soundName) {
                case 'attack':
                    // Attack sound: descending pitch (subtler)
                    oscillator.frequency.setValueAtTime(SFX_CONSTANTS.ATTACK_FREQ_START, audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(SFX_CONSTANTS.ATTACK_FREQ_END, audioContext.currentTime + SFX_CONSTANTS.ATTACK_DURATION);
                    gainNode.gain.setValueAtTime(SFX_CONSTANTS.ATTACK_GAIN, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(SFX_CONSTANTS.ATTACK_DECAY, audioContext.currentTime + SFX_CONSTANTS.ATTACK_TOTAL_DURATION);
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + SFX_CONSTANTS.ATTACK_TOTAL_DURATION);
                    break;

                case 'tap_enemy':
                    // Distinct subtle tone for tapping an enemy tile (not overly loud)
                    oscillator.frequency.setValueAtTime(SFX_CONSTANTS.TAP_ENEMY_FREQ_START, audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(SFX_CONSTANTS.TAP_ENEMY_FREQ_END, audioContext.currentTime + SFX_CONSTANTS.TAP_ENEMY_DURATION);
                    gainNode.gain.setValueAtTime(SFX_CONSTANTS.TAP_ENEMY_GAIN, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(SFX_CONSTANTS.TAP_ENEMY_DECAY, audioContext.currentTime + SFX_CONSTANTS.TAP_ENEMY_TOTAL_DURATION);
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + SFX_CONSTANTS.TAP_ENEMY_TOTAL_DURATION);
                    break;

                case 'chop':
                    // Chopping sound: low frequency burst (subtler)
                    oscillator.frequency.setValueAtTime(SFX_CONSTANTS.CHOP_FREQUENCY, audioContext.currentTime);
                    gainNode.gain.setValueAtTime(SFX_CONSTANTS.CHOP_GAIN, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(SFX_CONSTANTS.CHOP_DECAY, audioContext.currentTime + SFX_CONSTANTS.CHOP_TOTAL_DURATION);
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + SFX_CONSTANTS.CHOP_TOTAL_DURATION);
                    break;

                case 'smash':
                    // Smashing sound: noisy burst (subtler)
                    oscillator.frequency.setValueAtTime(SFX_CONSTANTS.SMASH_FREQUENCY, audioContext.currentTime);
                    gainNode.gain.setValueAtTime(SFX_CONSTANTS.SMASH_GAIN, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(SFX_CONSTANTS.SMASH_DECAY, audioContext.currentTime + SFX_CONSTANTS.SMASH_TOTAL_DURATION);
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + SFX_CONSTANTS.SMASH_TOTAL_DURATION);
                    break;

                case 'hurt':
                    // Hurt sound: low descending tone with slight warble for pain effect
                    oscillator.frequency.setValueAtTime(SFX_CONSTANTS.HURT_FREQ_START, audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(SFX_CONSTANTS.HURT_FREQ_END, audioContext.currentTime + SFX_CONSTANTS.HURT_DURATION);
                    gainNode.gain.setValueAtTime(SFX_CONSTANTS.HURT_GAIN, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(SFX_CONSTANTS.HURT_DECAY, audioContext.currentTime + SFX_CONSTANTS.HURT_DURATION);
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + SFX_CONSTANTS.HURT_DURATION);
                    break;

                case 'move':
                    // Very subtle movement sound
                    oscillator.frequency.setValueAtTime(SFX_CONSTANTS.MOVE_FREQUENCY, audioContext.currentTime);
                    gainNode.gain.setValueAtTime(SFX_CONSTANTS.MOVE_GAIN, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(SFX_CONSTANTS.MOVE_DECAY, audioContext.currentTime + SFX_CONSTANTS.MOVE_STOP_TIME);
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + SFX_CONSTANTS.MOVE_STOP_TIME);
                    break;

                case 'pickup':
                    // Pickup sound: ascending ding (subtler)
                    oscillator.frequency.setValueAtTime(SFX_CONSTANTS.PICKUP_FREQ_START, audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(SFX_CONSTANTS.PICKUP_FREQ_END, audioContext.currentTime + SFX_CONSTANTS.PICKUP_DURATION);
                    gainNode.gain.setValueAtTime(SFX_CONSTANTS.PICKUP_GAIN, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(SFX_CONSTANTS.PICKUP_DECAY, audioContext.currentTime + SFX_CONSTANTS.PICKUP_DURATION);
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + SFX_CONSTANTS.PICKUP_DURATION);
                    break;

                case 'bloop':
                    // Subtle bloop/ping for selection (more subdued)
                    oscillator.frequency.setValueAtTime(SFX_CONSTANTS.BLOOP_FREQ_START, audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(SFX_CONSTANTS.BLOOP_FREQ_END, audioContext.currentTime + SFX_CONSTANTS.BLOOP_DURATION);
                    // Reduce overall selection volume to be less intrusive
                    gainNode.gain.setValueAtTime(SFX_CONSTANTS.BLOOP_GAIN, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(SFX_CONSTANTS.BLOOP_DECAY, audioContext.currentTime + SFX_CONSTANTS.BLOOP_TOTAL_DURATION);
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + SFX_CONSTANTS.BLOOP_TOTAL_DURATION);
                    break;

                case 'bow_shot':
                    // Twang-like bow shot: quick pluck + short higher overtone
                    oscillator.frequency.setValueAtTime(SFX_CONSTANTS.BOW_SHOT_FREQ_START, audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(SFX_CONSTANTS.BOW_SHOT_FREQ_END, audioContext.currentTime + SFX_CONSTANTS.BOW_SHOT_DURATION);
                    gainNode.gain.setValueAtTime(SFX_CONSTANTS.BOW_SHOT_GAIN, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(SFX_CONSTANTS.BOW_SHOT_DECAY, audioContext.currentTime + SFX_CONSTANTS.BOW_SHOT_TOTAL_DURATION);
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + SFX_CONSTANTS.BOW_SHOT_TOTAL_DURATION);
                    break;

                case 'double_tap':
                    // Slightly different, shorter, and subtler tone for double-tap
                    oscillator.frequency.setValueAtTime(SFX_CONSTANTS.DOUBLE_TAP_FREQ_START, audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(SFX_CONSTANTS.DOUBLE_TAP_FREQ_END, audioContext.currentTime + SFX_CONSTANTS.DOUBLE_TAP_DURATION);
                    // Make double-tap more subtle
                    gainNode.gain.setValueAtTime(SFX_CONSTANTS.DOUBLE_TAP_GAIN, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(SFX_CONSTANTS.DOUBLE_TAP_DECAY, audioContext.currentTime + SFX_CONSTANTS.DOUBLE_TAP_TOTAL_DURATION);
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + SFX_CONSTANTS.DOUBLE_TAP_TOTAL_DURATION);
                    break;

                default:
                    // Default attack sound
                    oscillator.frequency.setValueAtTime(SFX_CONSTANTS.ATTACK_FREQ_START, audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(SFX_CONSTANTS.ATTACK_FREQ_END, audioContext.currentTime + SFX_CONSTANTS.ATTACK_DURATION);
                    gainNode.gain.setValueAtTime(SFX_CONSTANTS.DEFAULT_GAIN, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(SFX_CONSTANTS.DEFAULT_DECAY, audioContext.currentTime + SFX_CONSTANTS.ATTACK_TOTAL_DURATION);
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + SFX_CONSTANTS.ATTACK_TOTAL_DURATION);
            }
        } catch (error) {
            // Could not play procedural sound
        }
    }

    // Attempt to resume or create the shared AudioContext. Call this from a
    // user gesture (keydown, mousedown, touchstart) to satisfy browser policies.
    resumeAudioContext() {
        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                return Promise.resolve();
            }
            return safeCallAsync(this.audioContext, 'resume')?.catch(err => {
                errorHandler.handle(err, ErrorSeverity.WARNING, {
                    component: 'SoundManager',
                    action: 'resume audio context'
                });
            }) || Promise.resolve();
        } catch (e) {
            // ignore
        }
        return Promise.resolve();
    }
}
