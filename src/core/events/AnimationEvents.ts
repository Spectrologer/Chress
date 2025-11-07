/**
 * Animation-related event types and interfaces
 */

import type { Position } from '../Position';
import type { AnimationData } from '../SharedTypes';

// Animation Event Constants
export const AnimationEvents = {
  ANIMATION_REQUESTED: 'animation:requested',
  ANIMATION_COMPLETED: 'animation:completed',
  ANIMATION_HORSE_CHARGE: 'animation:horse:charge',
  ANIMATION_ARROW: 'animation:arrow',
  ANIMATION_POINT: 'animation:point',
  ANIMATION_MULTIPLIER: 'animation:multiplier',
  ANIMATION_BUMP: 'animation:bump',
  ANIMATION_BACKFLIP: 'animation:backflip',
  ANIMATION_SMOKE: 'animation:smoke',
  ANIMATION_ATTACK: 'animation:attack',
} as const;

export type AnimationEventType = typeof AnimationEvents[keyof typeof AnimationEvents];

// Animation Event Interfaces
export interface AnimationRequestedEvent {
  type: string;
  x: number;
  y: number;
  data: AnimationData;
}

export interface AnimationCompletedEvent {
  type: string;
  x?: number;
  y?: number;
}

export interface AnimationHorseChargeEvent {
  startPos: Position;
  midPos: Position;
  endPos: Position;
}

export interface AnimationArrowEvent {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface AnimationPointEvent {
  x: number;
  y: number;
  points: number;
  color?: string;
}

export interface AnimationMultiplierEvent {
  x: number;
  y: number;
  multiplier: number;
}

export interface AnimationBumpEvent {
  dx: number;
  dy: number;
  playerX: number;
  playerY: number;
}

export interface AnimationBackflipEvent {
  x?: number;
  y?: number;
}

export interface AnimationSmokeEvent {
  x: number;
  y: number;
}

export interface AnimationAttackEvent {
  x?: number;
  y?: number;
}
