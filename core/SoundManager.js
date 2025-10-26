import logger from './logger.js';
import { eventBus } from './EventBus.js';
import { EventTypes } from './EventTypes.js';
import { errorHandler, ErrorSeverity } from './ErrorHandler.js';
import { safeCallAsync } from '../utils/SafeServiceCall.js';

export class SoundManager {
    constructor() {
        this.sounds = {};
        this.sfxEnabled = true;
        this.musicEnabled = true;
        this.audioContext = null; // lazily created/resumed on user gesture
        this.currentMusicVolume = 0.0625; // default music volume (reduced)
        this.currentMusicTrack = null; // track file path intended to be playing
        this.loadSounds();
        this.setupEventListeners();
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
        audio.volume = 0.2; // Slightly more subtle default
        this.sounds[name] = audio;
    }

    // Play a background music track by file path (loops)
    // Default volume reduced to ~half to make music quieter
    playBackground(filePath, volume = 0.0625) {
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
    playBackgroundContinuous(filePath, volume = 0.0625, crossfadeMs = 600) {
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
            newAudio.volume = Math.min(1, audio.volume || 0.2);
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
            if (typeof console !== 'undefined' && console.debug) {
                console.debug('[SoundManager] setMusicEnabled ->', this.musicEnabled, 'currentTrack=', this.currentMusicTrack);
            }
        } catch (e) {}
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
                    try { this.backgroundGain.gain.setValueAtTime(this.currentMusicVolume || 0.0625, this.audioContext.currentTime); } catch (e) {}
                } else if (this.backgroundAudioElement) {
                    try { this.backgroundAudioElement.play().catch(() => {}); } catch (e) {}
                } else if (this.currentMusicTrack) {
                    // No existing background element; start the stored track
                    try { this.playBackgroundContinuous(this.currentMusicTrack, this.currentMusicVolume || 0.0625); } catch (e) {}
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
                    oscillator.frequency.setValueAtTime(220, audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(110, audioContext.currentTime + 0.1);
                    gainNode.gain.setValueAtTime(0.06, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.008, audioContext.currentTime + 0.2);
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.2);
                    break;

                case 'tap_enemy':
                    // Distinct subtle tone for tapping an enemy tile (not overly loud)
                    oscillator.frequency.setValueAtTime(160, audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(320, audioContext.currentTime + 0.06);
                    gainNode.gain.setValueAtTime(0.035, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.005, audioContext.currentTime + 0.12);
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.12);
                    break;

                case 'chop':
                    // Chopping sound: low frequency burst (subtler)
                    oscillator.frequency.setValueAtTime(80, audioContext.currentTime);
                    gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.008, audioContext.currentTime + 0.15);
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.15);
                    break;

                case 'smash':
                    // Smashing sound: noisy burst (subtler)
                    oscillator.frequency.setValueAtTime(60, audioContext.currentTime);
                    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.008, audioContext.currentTime + 0.25);
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.25);
                    break;

                case 'move':
                    // Very subtle movement sound
                    oscillator.frequency.setValueAtTime(120, audioContext.currentTime);
                    gainNode.gain.setValueAtTime(0.01, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.004, audioContext.currentTime + 0.1);
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.08);
                    break;

                case 'pickup':
                    // Pickup sound: ascending ding (subtler)
                    oscillator.frequency.setValueAtTime(220, audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(440, audioContext.currentTime + 0.08);
                    gainNode.gain.setValueAtTime(0.04, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.008, audioContext.currentTime + 0.1);
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.1);
                    break;

                case 'bloop':
                    // Subtle bloop/ping for selection (more subdued)
                    oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(660, audioContext.currentTime + 0.06);
                    // Reduce overall selection volume to be less intrusive
                    gainNode.gain.setValueAtTime(0.015, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.003, audioContext.currentTime + 0.12);
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.12);
                    break;

                case 'bow_shot':
                    // Twang-like bow shot: quick pluck + short higher overtone
                    oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(700, audioContext.currentTime + 0.05);
                    gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.004, audioContext.currentTime + 0.2);
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.18);
                    break;

                case 'double_tap':
                    // Slightly different, shorter, and subtler tone for double-tap
                    oscillator.frequency.setValueAtTime(660, audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.035);
                    // Make double-tap more subtle
                    gainNode.gain.setValueAtTime(0.02, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.004, audioContext.currentTime + 0.07);
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.08);
                    break;

                default:
                    // Default attack sound
                    oscillator.frequency.setValueAtTime(220, audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(110, audioContext.currentTime + 0.1);
                    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.2);
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
