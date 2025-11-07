/**
 * Game state and lifecycle event types and interfaces
 */

import type { SaveGameData, GameStatistics } from '../SharedTypes';
import type { Coordinates } from '../PositionTypes';

// Game State Event Constants
export const GameStateEvents = {
  GAME_RESET: 'game:reset',
  GAME_INITIALIZED: 'game:initialized',
  GAME_OVER: 'game:over',
  GAME_STATE_LOADED: 'game:loaded',
  GAME_STATE_SAVED: 'game:saved',
  GAME_EXIT_SHOVEL_MODE: 'game:exit:shovel_mode',
  GAME_INCREMENT_BOMB_ACTIONS: 'game:increment:bomb_actions',
  GAME_DECREMENT_ZONE_ENTRY_COUNT: 'game:decrement:zone_entry_count',
} as const;

export type GameStateEventType = typeof GameStateEvents[keyof typeof GameStateEvents];

// Game State Event Interfaces
export interface GameResetEvent {
  zone: { x: number; y: number; dimension: number };
  regionName: string;
}

export interface GameInitializedEvent {
  timestamp: number;
  version?: string;
}

export interface GameOverEvent {
  finalScore: number;
  reason: string;
  statistics?: GameStatistics;
}

export interface GameStateLoadedEvent {
  saveData: SaveGameData;
  loadedAt: number;
}

export interface GameStateSavedEvent {
  saveData: SaveGameData;
  savedAt: number;
}

export interface GameExitShovelModeEvent {
  itemsCollected?: number;
}

export interface GameIncrementBombActionsEvent {
  currentCount: number;
}

export interface GameDecrementZoneEntryCountEvent {
  currentCount: number;
}
