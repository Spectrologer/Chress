/**
 * Combat-related event types and interfaces
 */

import type { Enemy } from '../SharedTypes';

// Combat Event Constants
export const CombatEvents = {
  ENEMY_DEFEATED: 'enemy:defeated',
  COMBO_ACHIEVED: 'combat:combo',
  PLAYER_DAMAGED: 'player:damaged',
  POINT_AWARDED: 'points:awarded',
  MULTIPLIER_CHANGED: 'multiplier:changed',
  COMBAT_STARTED: 'combat:started',
  COMBAT_ENDED: 'combat:ended',
  PLAYER_KNOCKBACK: 'player:knockback',
  PLAYER_ATTACKED: 'player:attacked',
  ENEMY_SPAWNED: 'enemy:spawned',
  ENEMY_REMOVED: 'enemy:removed',
  ENEMIES_CLEARED: 'enemies:cleared',
  ENEMIES_REPLACED: 'enemies:replaced',
} as const;

export type CombatEventType = typeof CombatEvents[keyof typeof CombatEvents];

// Combat Event Interfaces
export interface EnemyDefeatedEvent {
  enemy: Enemy;
  points: number;
  x: number;
  y: number;
  isComboKill: boolean;
}

export interface ComboAchievedEvent {
  comboCount: number;
  multiplier: number;
  bonusPoints: number;
}

export interface PlayerDamagedEvent {
  damage: number;
  currentHealth: number;
  source: Enemy | string;
}

export interface PointAwardedEvent {
  points: number;
  x: number;
  y: number;
  source: string;
}

export interface MultiplierChangedEvent {
  oldMultiplier: number;
  newMultiplier: number;
  x?: number;
  y?: number;
}

export interface CombatStartedEvent {
  enemies: Enemy[];
  playerHealth: number;
}

export interface CombatEndedEvent {
  victory: boolean;
  enemiesDefeated: number;
  damageDealt: number;
  damageTaken: number;
}

export interface PlayerKnockbackEvent {
  x: number;
  y: number;
  source?: string;
}

export interface PlayerAttackedEvent {
  damage?: number;
  attacker?: Enemy | string;
}

export interface EnemySpawnedEvent {
  enemy: Enemy;
  x: number;
  y: number;
}

export interface EnemyRemovedEvent {
  enemy: Enemy;
  x: number;
  y: number;
  reason: string;
}

export interface EnemiesClearedEvent {
  count: number;
  zoneCoords: { x: number; y: number };
}

export interface EnemiesReplacedEvent {
  oldEnemies: Enemy[];
  newEnemies: Enemy[];
}
