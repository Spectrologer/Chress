// @ts-check
/**
 * SoundManager - Main audio coordinator
 *
 * Refactored Architecture:
 * - MusicController: Background music with crossfading
 * - ProceduralSoundGenerator: 11 procedural sound effects
 * - SoundLifecycleManager: Focus/blur handling and audio context lifecycle
 */

import { logger } from './logger';
import { eventBus } from './EventBus';
import { EventTypes } from './EventTypes';
import { VOLUME_CONSTANTS } from './constants/audio';
import { MusicController } from './sound/MusicController';
import { ProceduralSoundGenerator } from './sound/ProceduralSoundGenerator';
import { SoundLifecycleManager } from './sound/SoundLifecycleManager';

export class SoundManager {
    private sounds: Record<string, HTMLAudioElement>;
    private sfxEnabled: boolean;
    private musicController: MusicController;
    private proceduralGenerator: ProceduralSoundGenerator;
    private lifecycleManager: SoundLifecycleManager;
    private _unsubscribers: Array<() => void>;

    constructor() {
        this.sounds = {};
        this.sfxEnabled = true;
        this._unsubscribers = [];

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

    setupEventListeners(): void {
        this._unsubscribers.push(
            eventBus.on(EventTypes.MUSIC_CHANGE, (data: any) => {
                this.setMusicForZone({ dimension: data.dimension });
            })
        );

        this._unsubscribers.push(
            eventBus.on(EventTypes.ZONE_CHANGED, (data: any) => {
                this.setMusicForZone({ dimension: data.dimension });
            })
        );
    }

    async loadSounds(): Promise<void> {
        try {
            this.addSound('point', 'sfx/noises/point.wav');
            this.addSound('slash', 'sfx/noises/slash.wav');
        } catch (error) {
            logger.warn('Could not load sfx/noises assets, falling back to procedural sounds:', error);
        }
    }

    addSound(name: string, filePath: string): void {
        const audio = new Audio();
        audio.src = filePath;
        audio.volume = VOLUME_CONSTANTS.DEFAULT_SFX_VOLUME;
        this.sounds[name] = audio;
    }

    playSound(soundName: string): void {
        if (this.sfxEnabled === false) return;

        const audio = this.sounds[soundName];
        if (audio) {
            const newAudio = audio.cloneNode() as HTMLAudioElement;
            newAudio.volume = Math.min(VOLUME_CONSTANTS.MAX_VOLUME, audio.volume || VOLUME_CONSTANTS.DEFAULT_SFX_VOLUME);
            newAudio.play().catch((error: unknown) => {
                // Could not play sound
            });
        } else {
            this.proceduralGenerator.playProceduralSound(soundName);
        }
    }

    // ========== Music Control ==========

    playBackground(filePath: string, volume = VOLUME_CONSTANTS.DEFAULT_MUSIC_VOLUME): void {
        this.musicController.playBackground(filePath, volume);
    }

    stopBackground(): void {
        this.musicController.stopBackground();
    }

    setMusicForZone({ dimension = 0 }: { dimension?: number } = {}): void {
        this.musicController.setMusicForZone({ dimension });
    }

    playBackgroundContinuous(filePath: string, volume = VOLUME_CONSTANTS.DEFAULT_MUSIC_VOLUME, crossfadeMs = VOLUME_CONSTANTS.DEFAULT_CROSSFADE_DURATION): void {
        this.musicController.playBackgroundContinuous(filePath, volume, crossfadeMs);
    }

    // ========== Settings ==========

    setSfxEnabled(enabled: boolean): void {
        this.sfxEnabled = !!enabled;
    }

    setMusicEnabled(enabled: boolean): void {
        this.musicController.setMusicEnabled(enabled);
    }

    get musicEnabled(): boolean {
        return this.musicController.getMusicEnabled();
    }

    set musicEnabled(value: boolean) {
        this.musicController.setMusicEnabled(value);
    }

    // ========== Lifecycle ==========

    resumeAudioContext(): Promise<void> {
        return this.lifecycleManager.resumeAudioContext();
    }

    playProceduralSound(soundName: string): void {
        this.proceduralGenerator.playProceduralSound(soundName);
    }

    // ========== Cleanup ==========

    /**
     * Cleanup event listeners
     * Call this when destroying the SoundManager instance
     */
    destroy(): void {
        this._unsubscribers?.forEach(unsub => unsub());
        this._unsubscribers = [];
    }
}
