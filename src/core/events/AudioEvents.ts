/**
 * Audio-related event types and interfaces
 */

// Audio Event Constants
export const AudioEvents = {
  SOUND_PLAY: 'audio:sound:play',
  MUSIC_CHANGE: 'audio:music:change',
} as const;

export type AudioEventType = typeof AudioEvents[keyof typeof AudioEvents];

// Audio Event Interfaces
export interface SoundPlayEvent {
  soundName: string;
  volume?: number;
  loop?: boolean;
}

export interface MusicChangeEvent {
  dimension?: number;
  trackName?: string;
  volume?: number;
}
