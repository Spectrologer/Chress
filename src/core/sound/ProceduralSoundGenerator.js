// @ts-check
/**
 * ProceduralSoundGenerator - Generates sound effects using WebAudio oscillators
 *
 * Provides 11 different procedural sound effects for game events.
 * Extracted from SoundManager to reduce file size.
 */

import { SFX_CONSTANTS } from '../constants/audio.js';

export class ProceduralSoundGenerator {
    /**
     * @param {Function} getAudioContext - Function to get audio context
     */
    constructor(getAudioContext) {
        this.getAudioContext = getAudioContext;
    }

    /**
     * Play a procedural sound effect
     * @param {string} soundName - Name of the sound to play
     * @returns {void}
     */
    playProceduralSound(soundName) {
        try {
            const audioContext = this.getAudioContext();
            if (!audioContext) return;

            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            switch(soundName) {
                case 'attack':
                    this._playAttackSound(oscillator, gainNode, audioContext);
                    break;

                case 'tap_enemy':
                    this._playTapEnemySound(oscillator, gainNode, audioContext);
                    break;

                case 'chop':
                    this._playChopSound(oscillator, gainNode, audioContext);
                    break;

                case 'smash':
                    this._playSmashSound(oscillator, gainNode, audioContext);
                    break;

                case 'hurt':
                    this._playHurtSound(oscillator, gainNode, audioContext);
                    break;

                case 'move':
                    this._playMoveSound(oscillator, gainNode, audioContext);
                    break;

                case 'pickup':
                    this._playPickupSound(oscillator, gainNode, audioContext);
                    break;

                case 'bloop':
                    this._playBloopSound(oscillator, gainNode, audioContext);
                    break;

                case 'bow_shot':
                    this._playBowShotSound(oscillator, gainNode, audioContext);
                    break;

                case 'double_tap':
                    this._playDoubleTapSound(oscillator, gainNode, audioContext);
                    break;

                default:
                    this._playDefaultSound(oscillator, gainNode, audioContext);
            }
        } catch (error) {
            // Could not play procedural sound
        }
    }

    _playAttackSound(oscillator, gainNode, audioContext) {
        oscillator.frequency.setValueAtTime(SFX_CONSTANTS.ATTACK_FREQ_START, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(SFX_CONSTANTS.ATTACK_FREQ_END, audioContext.currentTime + SFX_CONSTANTS.ATTACK_DURATION);
        gainNode.gain.setValueAtTime(SFX_CONSTANTS.ATTACK_GAIN, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(SFX_CONSTANTS.ATTACK_DECAY, audioContext.currentTime + SFX_CONSTANTS.ATTACK_TOTAL_DURATION);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + SFX_CONSTANTS.ATTACK_TOTAL_DURATION);
    }

    _playTapEnemySound(oscillator, gainNode, audioContext) {
        oscillator.frequency.setValueAtTime(SFX_CONSTANTS.TAP_ENEMY_FREQ_START, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(SFX_CONSTANTS.TAP_ENEMY_FREQ_END, audioContext.currentTime + SFX_CONSTANTS.TAP_ENEMY_DURATION);
        gainNode.gain.setValueAtTime(SFX_CONSTANTS.TAP_ENEMY_GAIN, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(SFX_CONSTANTS.TAP_ENEMY_DECAY, audioContext.currentTime + SFX_CONSTANTS.TAP_ENEMY_TOTAL_DURATION);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + SFX_CONSTANTS.TAP_ENEMY_TOTAL_DURATION);
    }

    _playChopSound(oscillator, gainNode, audioContext) {
        oscillator.frequency.setValueAtTime(SFX_CONSTANTS.CHOP_FREQUENCY, audioContext.currentTime);
        gainNode.gain.setValueAtTime(SFX_CONSTANTS.CHOP_GAIN, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(SFX_CONSTANTS.CHOP_DECAY, audioContext.currentTime + SFX_CONSTANTS.CHOP_TOTAL_DURATION);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + SFX_CONSTANTS.CHOP_TOTAL_DURATION);
    }

    _playSmashSound(oscillator, gainNode, audioContext) {
        oscillator.frequency.setValueAtTime(SFX_CONSTANTS.SMASH_FREQUENCY, audioContext.currentTime);
        gainNode.gain.setValueAtTime(SFX_CONSTANTS.SMASH_GAIN, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(SFX_CONSTANTS.SMASH_DECAY, audioContext.currentTime + SFX_CONSTANTS.SMASH_TOTAL_DURATION);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + SFX_CONSTANTS.SMASH_TOTAL_DURATION);
    }

    _playHurtSound(oscillator, gainNode, audioContext) {
        oscillator.frequency.setValueAtTime(SFX_CONSTANTS.HURT_FREQ_START, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(SFX_CONSTANTS.HURT_FREQ_END, audioContext.currentTime + SFX_CONSTANTS.HURT_DURATION);
        gainNode.gain.setValueAtTime(SFX_CONSTANTS.HURT_GAIN, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(SFX_CONSTANTS.HURT_DECAY, audioContext.currentTime + SFX_CONSTANTS.HURT_DURATION);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + SFX_CONSTANTS.HURT_DURATION);
    }

    _playMoveSound(oscillator, gainNode, audioContext) {
        oscillator.frequency.setValueAtTime(SFX_CONSTANTS.MOVE_FREQUENCY, audioContext.currentTime);
        gainNode.gain.setValueAtTime(SFX_CONSTANTS.MOVE_GAIN, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(SFX_CONSTANTS.MOVE_DECAY, audioContext.currentTime + SFX_CONSTANTS.MOVE_STOP_TIME);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + SFX_CONSTANTS.MOVE_STOP_TIME);
    }

    _playPickupSound(oscillator, gainNode, audioContext) {
        oscillator.frequency.setValueAtTime(SFX_CONSTANTS.PICKUP_FREQ_START, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(SFX_CONSTANTS.PICKUP_FREQ_END, audioContext.currentTime + SFX_CONSTANTS.PICKUP_DURATION);
        gainNode.gain.setValueAtTime(SFX_CONSTANTS.PICKUP_GAIN, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(SFX_CONSTANTS.PICKUP_DECAY, audioContext.currentTime + SFX_CONSTANTS.PICKUP_DURATION);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + SFX_CONSTANTS.PICKUP_DURATION);
    }

    _playBloopSound(oscillator, gainNode, audioContext) {
        oscillator.frequency.setValueAtTime(SFX_CONSTANTS.BLOOP_FREQ_START, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(SFX_CONSTANTS.BLOOP_FREQ_END, audioContext.currentTime + SFX_CONSTANTS.BLOOP_DURATION);
        gainNode.gain.setValueAtTime(SFX_CONSTANTS.BLOOP_GAIN, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(SFX_CONSTANTS.BLOOP_DECAY, audioContext.currentTime + SFX_CONSTANTS.BLOOP_TOTAL_DURATION);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + SFX_CONSTANTS.BLOOP_TOTAL_DURATION);
    }

    _playBowShotSound(oscillator, gainNode, audioContext) {
        oscillator.frequency.setValueAtTime(SFX_CONSTANTS.BOW_SHOT_FREQ_START, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(SFX_CONSTANTS.BOW_SHOT_FREQ_END, audioContext.currentTime + SFX_CONSTANTS.BOW_SHOT_DURATION);
        gainNode.gain.setValueAtTime(SFX_CONSTANTS.BOW_SHOT_GAIN, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(SFX_CONSTANTS.BOW_SHOT_DECAY, audioContext.currentTime + SFX_CONSTANTS.BOW_SHOT_TOTAL_DURATION);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + SFX_CONSTANTS.BOW_SHOT_TOTAL_DURATION);
    }

    _playDoubleTapSound(oscillator, gainNode, audioContext) {
        oscillator.frequency.setValueAtTime(SFX_CONSTANTS.DOUBLE_TAP_FREQ_START, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(SFX_CONSTANTS.DOUBLE_TAP_FREQ_END, audioContext.currentTime + SFX_CONSTANTS.DOUBLE_TAP_DURATION);
        gainNode.gain.setValueAtTime(SFX_CONSTANTS.DOUBLE_TAP_GAIN, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(SFX_CONSTANTS.DOUBLE_TAP_DECAY, audioContext.currentTime + SFX_CONSTANTS.DOUBLE_TAP_TOTAL_DURATION);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + SFX_CONSTANTS.DOUBLE_TAP_TOTAL_DURATION);
    }

    _playDefaultSound(oscillator, gainNode, audioContext) {
        oscillator.frequency.setValueAtTime(SFX_CONSTANTS.ATTACK_FREQ_START, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(SFX_CONSTANTS.ATTACK_FREQ_END, audioContext.currentTime + SFX_CONSTANTS.ATTACK_DURATION);
        gainNode.gain.setValueAtTime(SFX_CONSTANTS.DEFAULT_GAIN, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(SFX_CONSTANTS.DEFAULT_DECAY, audioContext.currentTime + SFX_CONSTANTS.ATTACK_TOTAL_DURATION);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + SFX_CONSTANTS.ATTACK_TOTAL_DURATION);
    }
}
