import logger from './logger.js';

export class SoundManager {
    constructor() {
        this.sounds = {};
        this.audioContext = null; // lazily created/resumed on user gesture
        this.loadSounds();
    }

    async loadSounds() {
        // Skipping file loading for now - sound files would need to be proper audio files
        // This prevents the "could not be decoded" errors from empty placeholder files
        // When proper .wav or .mp3 files are added, they can be re-enabled
        /*
        try {
            // Load attack sounds
            this.addSound('attack', 'sounds/attack.wav'); // General combat attack
            this.addSound('chop', 'sounds/chop.wav'); // Tree chopping sound
            this.addSound('smash', 'sounds/smash.wav'); // Rock smashing sound
            this.addSound('move', 'sounds/move.wav'); // Player movement
            this.addSound('pickup', 'sounds/pickup.wav'); // Item pickup
        } catch (error) {
            logger.warn('Could not load sound files, using procedural generation:', error);
        }
        */
    }

    addSound(name, filePath) {
        const audio = new Audio();
        audio.src = filePath;
        audio.volume = 0.2; // Slightly more subtle default
        this.sounds[name] = audio;
    }

    playSound(soundName) {
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
            if (this.audioContext && typeof this.audioContext.resume === 'function') {
                return this.audioContext.resume().catch(() => {});
            }
        } catch (e) {
            // ignore
        }
        return Promise.resolve();
    }
}
