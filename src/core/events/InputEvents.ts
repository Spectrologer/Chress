/**
 * Input-related event types and interfaces
 */

import type { Position } from '../Position';

// Input Event Constants
export const InputEvents = {
  INPUT_KEY_PRESS: 'input:key:press',
  INPUT_PATH_STARTED: 'input:path:started',
  INPUT_PATH_CANCELLED: 'input:path:cancelled',
  INPUT_PATH_COMPLETED: 'input:path:completed',
  INPUT_EXIT_REACHED: 'input:exit:reached',
  INPUT_TAP: 'input:tap',
  INPUT_PLAYER_TILE_TAP: 'input:player:tile:tap',
} as const;

export type InputEventType = typeof InputEvents[keyof typeof InputEvents];

// Input Event Interfaces
export interface InputKeyPressEvent {
  key: string;
  preventDefault: () => void;
  _synthetic?: boolean;
}

export interface InputPathStartedEvent {
  pathLength: number;
}

export interface InputPathCancelledEvent {
  pathLength?: number;
  reason?: string;
}

export interface InputPathCompletedEvent {
  pathLength?: number;
  endPosition?: Position;
}

export interface InputExitReachedEvent {
  x: number;
  y: number;
}

export interface InputTapEvent {
  gridCoords: Position;
  screenX: number;
  screenY: number;
  handled: boolean;
}

export interface InputPlayerTileTapEvent {
  gridCoords: Position;
  tileType: number;
  portKind: string | null;
}
