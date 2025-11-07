/**
 * Player-related event types and interfaces
 */

// Player Event Constants
export const PlayerEvents = {
  PLAYER_MOVED: 'player:moved',
  PLAYER_STATS_CHANGED: 'player:stats:changed',
  PLAYER_POSITION_CHANGED: 'player:position:changed',
  TREASURE_FOUND: 'treasure:found',
  STATS_HEALTH_CHANGED: 'stats:health:changed',
  STATS_POINTS_CHANGED: 'stats:points:changed',
  STATS_HUNGER_CHANGED: 'stats:hunger:changed',
  STATS_THIRST_CHANGED: 'stats:thirst:changed',
  STATS_CHANGED: 'stats:changed',
  POINTS_CHANGED: 'points:changed',
} as const;

export type PlayerEventType = typeof PlayerEvents[keyof typeof PlayerEvents];

// Player Event Interfaces
export interface PlayerMovedEvent {
  x: number;
  y: number;
}

export interface PlayerStatsChangedEvent {
  health: number;
  points: number;
  hunger: number;
  thirst: number;
}

export interface PlayerPositionChangedEvent {
  oldX: number;
  oldY: number;
  newX: number;
  newY: number;
}

export interface TreasureFoundEvent {
  itemType: string;
  quantity: number;
  message: string;
}

export interface StatsHealthChangedEvent {
  oldValue: number;
  newValue: number;
  delta: number;
  source?: string;
}

export interface StatsPointsChangedEvent {
  oldValue: number;
  newValue: number;
  delta: number;
  source?: string;
}

export interface StatsHungerChangedEvent {
  oldValue: number;
  newValue: number;
  delta: number;
}

export interface StatsThirstChangedEvent {
  oldValue: number;
  newValue: number;
  delta: number;
}

export interface StatsChangedEvent {
  stat: string;
  value: number | boolean | string;
  stats: Record<string, any>;
}

export interface PointsChangedEvent {
  points: number;
}
