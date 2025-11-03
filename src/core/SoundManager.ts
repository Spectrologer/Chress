// @ts-check
/**
 * SoundManager - Main audio coordinator
 *
 * Refactored Architecture:
 * - MusicController: Background music with crossfading
 * - ProceduralSoundGenerator: 11 procedural sound effects
 * - SoundLifecycleManager: Focus/blur handling and audio context lifecycle
 */

import { logger } from './logger.ts';
import { eventBus } from './EventBus.ts';
import { EventTypes } from './EventTypes.ts';
import { VOLUME_CONSTANTS } from './constants/audio.js';
import { MusicController } from './sound/MusicController.js';
import { ProceduralSoundGenerator } from './sound/ProceduralSoundGenerator.js';
import { SoundLifecycleManager } from './sound/SoundLifecycleManager.js';

export class SoundManager {
    constructor() {
        this.sounds = {};
        this.sfxEnabled = true;

        // Initialize sub-managers
        this.musicController = new MusicController();
        this.proceduralGenerator = new ProceduralSoundGenerator(
            () => this.musicController.getAudioContext()
        );
        this.lifecycleManager = new SoundLifecycleManager(this.musicController);

        this.loadSounds();
        this.setupEventListeners();
        this.lifecycleManager.setupFocusListeners();
    }

    setupEventListeners() {
        eventBus.on(EventTypes.MUSIC_CHANGE, (data) => {
            this.setMusicForZone({ dimension: data.dimension });
        });

        eventBus.on(EventTypes.ZONE_CHANGED, (data) => {
            this.setMusicForZone({ dimension: data.dimension });
        });
    }

    async loadSounds() {
        try {
            this.addSound('point', 'sfx/noises/point.wav');
            this.addSound('slash', 'sfx/noises/slash.wav');
        } catch (error) {
            logger.warn('Could not load sfx/noises assets, falling back to procedural sounds:', error);
        }
    }

    addSound(name, filePath) {
        const audio = new Audio();
        audio.src = filePath;
        audio.volume = VOLUME_CONSTANTS.DEFAULT_SFX_VOLUME;
        this.sounds[name] = audio;
    }

    playSound(soundName) {
        if (this.sfxEnabled === false) return;

        const audio = this.sounds[soundName];
        if (audio) {
            const newAudio = audio.cloneNode();
            newAudio.volume = Math.min(VOLUME_CONSTANTS.MAX_VOLUME, audio.volume || VOLUME_CONSTANTS.DEFAULT_SFX_VOLUME);
            newAudio.play().catch(error => {
                // Could not play sound
            });
        } else {
            this.proceduralGenerator.playProceduralSound(soundName);
        }
    }

    // ========== Music Control ==========

    playBackground(filePath, volume = VOLUME_CONSTANTS.DEFAULT_MUSIC_VOLUME) {
        this.musicController.playBackground(filePath, volume);
    }

    stopBackground() {
        this.musicController.stopBackground();
    }

    setMusicForZone({ dimension = 0 } = {}) {
        this.musicController.setMusicForZone({ dimension });
    }

    playBackgroundContinuous(filePath, volume = VOLUME_CONSTANTS.DEFAULT_MUSIC_VOLUME, crossfadeMs = VOLUME_CONSTANTS.DEFAULT_CROSSFADE_DURATION) {
        this.musicController.playBackgroundContinuous(filePath, volume, crossfadeMs);
    }

    // ========== Settings ==========

    setSfxEnabled(enabled) {
        this.sfxEnabled = !!enabled;
    }

    setMusicEnabled(enabled) {
        this.musicController.setMusicEnabled(enabled);
    }

    get musicEnabled() {
        return this.musicController.musicEnabled;
    }

    set musicEnabled(value) {
        this.musicController.musicEnabled = value;
    }

    // ========== Lifecycle ==========

    resumeAudioContext() {
        return this.lifecycleManager.resumeAudioContext();
    }

    playProceduralSound(soundName) {
        this.proceduralGenerator.playProceduralSound(soundName);
    }
}
