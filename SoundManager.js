export class SoundManager {
    constructor() {
        this.sounds = {};
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
            console.warn('Could not load sound files, using procedural generation:', error);
        }
        */
    }

    addSound(name, filePath) {
        const audio = new Audio();
        audio.src = filePath;
        audio.volume = 0.3; // Set reasonable volume level
        this.sounds[name] = audio;
    }

    playSound(soundName) {
        const audio = this.sounds[soundName];
        if (audio) {
            // Create a fresh audio instance to allow overlapping sounds
            const newAudio = audio.cloneNode();
            newAudio.volume = audio.volume;
            newAudio.volume = 0.3;
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
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            switch(soundName) {
                case 'attack':
                    // Attack sound: descending pitch
                    oscillator.frequency.setValueAtTime(220, audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(110, audioContext.currentTime + 0.1);
                    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.2);
                    break;

                case 'chop':
                    // Chopping sound: low frequency burst
                    oscillator.frequency.setValueAtTime(80, audioContext.currentTime);
                    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.15);
                    break;

                case 'smash':
                    // Smashing sound: noisy burst
                    oscillator.frequency.setValueAtTime(60, audioContext.currentTime);
                    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.25);
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.25);
                    break;

                case 'move':
                    // Very subtle movement sound
                    oscillator.frequency.setValueAtTime(120, audioContext.currentTime);
                    gainNode.gain.setValueAtTime(0.02, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.005, audioContext.currentTime + 0.1);
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.1);
                    break;

                case 'pickup':
                    // Pickup sound: ascending ding
                    oscillator.frequency.setValueAtTime(220, audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(440, audioContext.currentTime + 0.08);
                    gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.1);
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
}
