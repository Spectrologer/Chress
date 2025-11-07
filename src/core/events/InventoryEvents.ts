/**
 * Inventory and item-related event types and interfaces
 */

import type { Position } from '../Position';
import type { InventoryItem, ChargeStateData } from '../SharedTypes';

// Inventory Event Constants
export const InventoryEvents = {
  ITEM_ADDED: 'inventory:item:added',
  INVENTORY_CHANGED: 'inventory:changed',
  RADIAL_INVENTORY_CHANGED: 'inventory:radial:changed',
  ITEM_USED: 'inventory:item:used',
  BOMB_PLACEMENT_POSITION_ADDED: 'inventory:bomb:placement:added',
  BOMB_PLACEMENT_POSITION_REMOVED: 'inventory:bomb:placement:removed',
  ABILITY_GAINED: 'ability:gained',
  ABILITY_LOST: 'ability:lost',
  CHARGE_STATE_CHANGED: 'charge:state:changed',
  BOMB_PLACEMENT_MODE_CHANGED: 'bomb:placement:mode:changed',
  TRANSIENT_STATE_RESET: 'transient:state:reset',
} as const;

export type InventoryEventType = typeof InventoryEvents[keyof typeof InventoryEvents];

// Inventory Event Interfaces
export interface ItemAddedEvent {
  item: InventoryItem;
  quantity: number;
  source: string;
}

export interface InventoryChangedEvent {
  action: string;
  item?: InventoryItem;
  quantity?: number;
}

export interface RadialInventoryChangedEvent {
  inventory: InventoryItem[];
}

export interface ItemUsedEvent {
  item: InventoryItem;
  x: number;
  y: number;
  result?: { success: boolean; message?: string };
}

export interface BombPlacementPositionAddedEvent {
  position: Position;
  totalPositions: number;
}

export interface BombPlacementPositionRemovedEvent {
  position: Position;
  totalPositions: number;
}

export interface AbilityGainedEvent {
  ability: string;
  abilities: string[];
}

export interface AbilityLostEvent {
  ability: string;
  abilities: string[];
}

export interface ChargeStateChangedEvent {
  isPending: boolean;
  data: ChargeStateData | null;
}

export interface BombPlacementModeChangedEvent {
  active: boolean;
  positions: Position[];
}

export interface TransientStateResetEvent {
  // Empty payload
}
