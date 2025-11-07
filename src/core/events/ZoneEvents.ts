/**
 * Zone and region-related event types and interfaces
 */

import type { Grid, Enemy } from '../SharedTypes';

// Zone Event Constants
export const ZoneEvents = {
  ZONE_CHANGED: 'zone:changed',
  ZONE_INITIALIZED: 'zone:initialized',
  REGION_CHANGED: 'region:changed',
  PORT_TRANSITION_DATA_SET: 'zone:port:transition:set',
  PORT_TRANSITION_DATA_CLEARED: 'zone:port:transition:cleared',
  PITFALL_ZONE_ENTERED: 'zone:pitfall:entered',
  PITFALL_ZONE_EXITED: 'zone:pitfall:exited',
  PITFALL_TURN_SURVIVED: 'zone:pitfall:turn:survived',
} as const;

export type ZoneEventType = typeof ZoneEvents[keyof typeof ZoneEvents];

// Zone Event Interfaces
export interface ZoneChangedEvent {
  x: number;
  y: number;
  dimension: number;
  regionName: string;
}

export interface ZoneInitializedEvent {
  x: number;
  y: number;
  dimension: number;
  tiles: Grid;
  enemies: Enemy[];
}

export interface RegionChangedEvent {
  oldRegion: string;
  newRegion: string;
  x: number;
  y: number;
}

export interface PortTransitionDataSetEvent {
  from: string;
  x?: number;
  y?: number;
}

export interface PortTransitionDataClearedEvent {
  previousData: { from: string; x?: number; y?: number } | null;
}

export interface PitfallZoneEnteredEvent {
  turnsSurvived: number;
}

export interface PitfallZoneExitedEvent {
  turnsSurvived: number;
}

export interface PitfallTurnSurvivedEvent {
  turnsSurvived: number;
}
