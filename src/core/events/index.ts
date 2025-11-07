/**
 * Event Types - Centralized event type definitions for the event bus
 * This provides autocomplete support and prevents typos in event names
 *
 * Split into domain-specific modules for better organization and maintainability.
 */

// Re-export all domain-specific event constants
export * from './CombatEvents';
export * from './GameStateEvents';
export * from './ZoneEvents';
export * from './PlayerEvents';
export * from './UIEvents';
export * from './InventoryEvents';
export * from './InputEvents';
export * from './AnimationEvents';
export * from './AudioEvents';

// Import all event constants for the unified EventTypes object
import { CombatEvents } from './CombatEvents';
import { GameStateEvents } from './GameStateEvents';
import { ZoneEvents } from './ZoneEvents';
import { PlayerEvents } from './PlayerEvents';
import { UIEvents } from './UIEvents';
import { InventoryEvents } from './InventoryEvents';
import { InputEvents } from './InputEvents';
import { AnimationEvents } from './AnimationEvents';
import { AudioEvents } from './AudioEvents';

// Re-export Position for backward compatibility
export type { Position } from '../Position';

/**
 * Unified EventTypes object - maintains backward compatibility
 * Combines all domain-specific event constants into a single object
 */
export const EventTypes = {
  ...CombatEvents,
  ...GameStateEvents,
  ...ZoneEvents,
  ...PlayerEvents,
  ...UIEvents,
  ...InventoryEvents,
  ...InputEvents,
  ...AnimationEvents,
  ...AudioEvents,
} as const;

export type EventType = typeof EventTypes[keyof typeof EventTypes];

// Import all event interfaces for the EventDataMap
import type {
  EnemyDefeatedEvent,
  ComboAchievedEvent,
  PlayerDamagedEvent,
  PointAwardedEvent,
  MultiplierChangedEvent,
  CombatStartedEvent,
  CombatEndedEvent,
  PlayerKnockbackEvent,
  PlayerAttackedEvent,
  EnemySpawnedEvent,
  EnemyRemovedEvent,
  EnemiesClearedEvent,
  EnemiesReplacedEvent,
} from './CombatEvents';

import type {
  GameResetEvent,
  GameInitializedEvent,
  GameOverEvent,
  GameStateLoadedEvent,
  GameStateSavedEvent,
  GameExitShovelModeEvent,
  GameIncrementBombActionsEvent,
  GameDecrementZoneEntryCountEvent,
} from './GameStateEvents';

import type {
  ZoneChangedEvent,
  ZoneInitializedEvent,
  RegionChangedEvent,
  PortTransitionDataSetEvent,
  PortTransitionDataClearedEvent,
  PitfallZoneEnteredEvent,
  PitfallZoneExitedEvent,
  PitfallTurnSurvivedEvent,
} from './ZoneEvents';

import type {
  PlayerMovedEvent,
  PlayerStatsChangedEvent,
  PlayerPositionChangedEvent,
  TreasureFoundEvent,
  StatsHealthChangedEvent,
  StatsPointsChangedEvent,
  StatsHungerChangedEvent,
  StatsThirstChangedEvent,
  StatsChangedEvent,
  PointsChangedEvent,
} from './PlayerEvents';

import type {
  MessageLoggedEvent,
  PanelOpenedEvent,
  PanelClosedEvent,
  UIUpdateStatsEvent,
  UIShowMessageEvent,
  UIClosePanelEvent,
  UIDialogShowEvent,
  UIDialogHideEvent,
  UIConfirmationShowEvent,
  UIConfirmationResponseEvent,
  UIOverlayMessageShowEvent,
  UIMessageLogEvent,
  UIRegionNotificationShowEvent,
  SignMessageDisplayedEvent,
  SignMessageClearedEvent,
  TradeInitiatedEvent,
  TradeCompletedEvent,
} from './UIEvents';

import type {
  ItemAddedEvent,
  InventoryChangedEvent,
  RadialInventoryChangedEvent,
  ItemUsedEvent,
  BombPlacementPositionAddedEvent,
  BombPlacementPositionRemovedEvent,
  AbilityGainedEvent,
  AbilityLostEvent,
  ChargeStateChangedEvent,
  BombPlacementModeChangedEvent,
  TransientStateResetEvent,
} from './InventoryEvents';

import type {
  InputKeyPressEvent,
  InputPathStartedEvent,
  InputPathCancelledEvent,
  InputPathCompletedEvent,
  InputExitReachedEvent,
  InputTapEvent,
  InputPlayerTileTapEvent,
} from './InputEvents';

import type {
  AnimationRequestedEvent,
  AnimationCompletedEvent,
  AnimationHorseChargeEvent,
  AnimationArrowEvent,
  AnimationPointEvent,
  AnimationMultiplierEvent,
  AnimationBumpEvent,
  AnimationBackflipEvent,
  AnimationSmokeEvent,
  AnimationAttackEvent,
} from './AnimationEvents';

import type {
  SoundPlayEvent,
  MusicChangeEvent,
} from './AudioEvents';

import type { Coordinates } from '../PositionTypes';

/**
 * Type map for event type to event data
 * Provides type safety when emitting and listening to events
 */
export interface EventDataMap {
  // Combat Events
  [EventTypes.ENEMY_DEFEATED]: EnemyDefeatedEvent;
  [EventTypes.COMBO_ACHIEVED]: ComboAchievedEvent;
  [EventTypes.PLAYER_DAMAGED]: PlayerDamagedEvent;
  [EventTypes.POINT_AWARDED]: PointAwardedEvent;
  [EventTypes.MULTIPLIER_CHANGED]: MultiplierChangedEvent;
  [EventTypes.COMBAT_STARTED]: CombatStartedEvent;
  [EventTypes.COMBAT_ENDED]: CombatEndedEvent;
  [EventTypes.PLAYER_KNOCKBACK]: PlayerKnockbackEvent;
  [EventTypes.PLAYER_ATTACKED]: PlayerAttackedEvent;
  [EventTypes.ENEMY_SPAWNED]: EnemySpawnedEvent;
  [EventTypes.ENEMY_REMOVED]: EnemyRemovedEvent;
  [EventTypes.ENEMIES_CLEARED]: EnemiesClearedEvent;
  [EventTypes.ENEMIES_REPLACED]: EnemiesReplacedEvent;

  // Game State Events
  [EventTypes.GAME_RESET]: GameResetEvent;
  [EventTypes.GAME_INITIALIZED]: GameInitializedEvent;
  [EventTypes.GAME_OVER]: GameOverEvent;
  [EventTypes.GAME_STATE_LOADED]: GameStateLoadedEvent;
  [EventTypes.GAME_STATE_SAVED]: GameStateSavedEvent;
  [EventTypes.GAME_EXIT_SHOVEL_MODE]: GameExitShovelModeEvent;
  [EventTypes.GAME_INCREMENT_BOMB_ACTIONS]: GameIncrementBombActionsEvent;
  [EventTypes.GAME_DECREMENT_ZONE_ENTRY_COUNT]: GameDecrementZoneEntryCountEvent;

  // Zone Events
  [EventTypes.ZONE_CHANGED]: ZoneChangedEvent;
  [EventTypes.ZONE_INITIALIZED]: ZoneInitializedEvent;
  [EventTypes.REGION_CHANGED]: RegionChangedEvent;
  [EventTypes.PORT_TRANSITION_DATA_SET]: PortTransitionDataSetEvent;
  [EventTypes.PORT_TRANSITION_DATA_CLEARED]: PortTransitionDataClearedEvent;
  [EventTypes.PITFALL_ZONE_ENTERED]: PitfallZoneEnteredEvent;
  [EventTypes.PITFALL_ZONE_EXITED]: PitfallZoneExitedEvent;
  [EventTypes.PITFALL_TURN_SURVIVED]: PitfallTurnSurvivedEvent;

  // Player Events
  [EventTypes.PLAYER_MOVED]: Coordinates;
  [EventTypes.PLAYER_STATS_CHANGED]: PlayerStatsChangedEvent;
  [EventTypes.PLAYER_POSITION_CHANGED]: PlayerPositionChangedEvent;
  [EventTypes.TREASURE_FOUND]: TreasureFoundEvent;
  [EventTypes.STATS_HEALTH_CHANGED]: StatsHealthChangedEvent;
  [EventTypes.STATS_POINTS_CHANGED]: StatsPointsChangedEvent;
  [EventTypes.STATS_HUNGER_CHANGED]: StatsHungerChangedEvent;
  [EventTypes.STATS_THIRST_CHANGED]: StatsThirstChangedEvent;
  [EventTypes.STATS_CHANGED]: StatsChangedEvent;
  [EventTypes.POINTS_CHANGED]: PointsChangedEvent;

  // UI Events
  [EventTypes.MESSAGE_LOGGED]: MessageLoggedEvent;
  [EventTypes.PANEL_OPENED]: PanelOpenedEvent;
  [EventTypes.PANEL_CLOSED]: PanelClosedEvent;
  [EventTypes.UI_UPDATE_STATS]: UIUpdateStatsEvent;
  [EventTypes.UI_SHOW_MESSAGE]: UIShowMessageEvent;
  [EventTypes.UI_CLOSE_PANEL]: UIClosePanelEvent;
  [EventTypes.UI_DIALOG_SHOW]: UIDialogShowEvent;
  [EventTypes.UI_DIALOG_HIDE]: UIDialogHideEvent;
  [EventTypes.UI_CONFIRMATION_SHOW]: UIConfirmationShowEvent;
  [EventTypes.UI_CONFIRMATION_RESPONSE]: UIConfirmationResponseEvent;
  [EventTypes.UI_OVERLAY_MESSAGE_SHOW]: UIOverlayMessageShowEvent;
  [EventTypes.UI_OVERLAY_MESSAGE_HIDE]: {};
  [EventTypes.UI_MESSAGE_LOG]: UIMessageLogEvent;
  [EventTypes.UI_REGION_NOTIFICATION_SHOW]: UIRegionNotificationShowEvent;
  [EventTypes.SIGN_MESSAGE_DISPLAYED]: SignMessageDisplayedEvent;
  [EventTypes.SIGN_MESSAGE_CLEARED]: SignMessageClearedEvent;
  [EventTypes.TRADE_INITIATED]: TradeInitiatedEvent;
  [EventTypes.TRADE_COMPLETED]: TradeCompletedEvent;

  // Inventory Events
  [EventTypes.ITEM_ADDED]: ItemAddedEvent;
  [EventTypes.INVENTORY_CHANGED]: InventoryChangedEvent;
  [EventTypes.RADIAL_INVENTORY_CHANGED]: RadialInventoryChangedEvent;
  [EventTypes.ITEM_USED]: ItemUsedEvent;
  [EventTypes.BOMB_PLACEMENT_POSITION_ADDED]: BombPlacementPositionAddedEvent;
  [EventTypes.BOMB_PLACEMENT_POSITION_REMOVED]: BombPlacementPositionRemovedEvent;
  [EventTypes.ABILITY_GAINED]: AbilityGainedEvent;
  [EventTypes.ABILITY_LOST]: AbilityLostEvent;
  [EventTypes.CHARGE_STATE_CHANGED]: ChargeStateChangedEvent;
  [EventTypes.BOMB_PLACEMENT_MODE_CHANGED]: BombPlacementModeChangedEvent;
  [EventTypes.TRANSIENT_STATE_RESET]: TransientStateResetEvent;

  // Input Events
  [EventTypes.INPUT_KEY_PRESS]: InputKeyPressEvent;
  [EventTypes.INPUT_PATH_STARTED]: InputPathStartedEvent;
  [EventTypes.INPUT_PATH_CANCELLED]: InputPathCancelledEvent;
  [EventTypes.INPUT_PATH_COMPLETED]: InputPathCompletedEvent;
  [EventTypes.INPUT_EXIT_REACHED]: InputExitReachedEvent;
  [EventTypes.INPUT_TAP]: InputTapEvent;
  [EventTypes.INPUT_PLAYER_TILE_TAP]: InputPlayerTileTapEvent;

  // Animation Events
  [EventTypes.ANIMATION_REQUESTED]: AnimationRequestedEvent;
  [EventTypes.ANIMATION_COMPLETED]: AnimationCompletedEvent;
  [EventTypes.ANIMATION_HORSE_CHARGE]: AnimationHorseChargeEvent;
  [EventTypes.ANIMATION_ARROW]: AnimationArrowEvent;
  [EventTypes.ANIMATION_POINT]: AnimationPointEvent;
  [EventTypes.ANIMATION_MULTIPLIER]: AnimationMultiplierEvent;
  [EventTypes.ANIMATION_BUMP]: AnimationBumpEvent;
  [EventTypes.ANIMATION_BACKFLIP]: AnimationBackflipEvent;
  [EventTypes.ANIMATION_SMOKE]: AnimationSmokeEvent;
  [EventTypes.ANIMATION_ATTACK]: AnimationAttackEvent;

  // Audio Events
  [EventTypes.SOUND_PLAY]: SoundPlayEvent;
  [EventTypes.MUSIC_CHANGE]: MusicChangeEvent;
}

/**
 * Type-safe event emission helper types
 */

// Extract the payload type for a specific event
export type EventPayload<T extends EventType> = T extends keyof EventDataMap
  ? EventDataMap[T]
  : never;

// Type guard to check if an event has a payload
export function hasEventPayload<T extends EventType>(
  eventType: T
): eventType is T & keyof EventDataMap {
  return eventType in EventTypes;
}

/**
 * Type-safe event emission helper for EventBus
 * Usage: emitTypedEvent(eventBus, EventTypes.TREASURE_FOUND, { itemType: 'gold', quantity: 10, message: 'Found gold!' })
 */
export function emitTypedEvent<T extends EventType>(
  eventBus: { emit: (event: string, data?: any) => void },
  eventType: T,
  ...args: T extends keyof EventDataMap
    ? EventDataMap[T] extends {}
      ? [EventDataMap[T]]
      : []
    : [any?]
): void {
  const payload = args[0];
  eventBus.emit(eventType, payload);
}

/**
 * Type-safe event listener helper for EventBus
 * Usage: onTypedEvent(eventBus, EventTypes.TREASURE_FOUND, (payload) => { ... })
 */
export function onTypedEvent<T extends EventType>(
  eventBus: { on: (event: string, handler: (data?: any) => void) => void },
  eventType: T,
  handler: T extends keyof EventDataMap
    ? (payload: EventDataMap[T]) => void
    : (payload?: any) => void
): void {
  eventBus.on(eventType, handler as (data?: any) => void);
}

/**
 * Type-safe event listener removal helper for EventBus
 * Usage: offTypedEvent(eventBus, EventTypes.TREASURE_FOUND, handler)
 */
export function offTypedEvent<T extends EventType>(
  eventBus: { off: (event: string, handler: (data?: any) => void) => void },
  eventType: T,
  handler: T extends keyof EventDataMap
    ? (payload: EventDataMap[T]) => void
    : (payload?: any) => void
): void {
  eventBus.off(eventType, handler as (data?: any) => void);
}

/**
 * Create a typed event emitter wrapper for better type safety
 * Usage: const typedEmitter = createTypedEventEmitter(eventBus);
 *        typedEmitter.emit(EventTypes.TREASURE_FOUND, { ... });
 */
export function createTypedEventEmitter(eventBus: {
  emit: (event: string, data?: any) => void;
  on: (event: string, handler: (data?: any) => void) => void;
  off: (event: string, handler: (data?: any) => void) => void;
}) {
  return {
    emit: <T extends EventType>(
      eventType: T,
      ...args: T extends keyof EventDataMap
        ? EventDataMap[T] extends {}
          ? [EventDataMap[T]]
          : []
        : [any?]
    ) => emitTypedEvent(eventBus, eventType, ...args),

    on: <T extends EventType>(
      eventType: T,
      handler: T extends keyof EventDataMap
        ? (payload: EventDataMap[T]) => void
        : (payload?: any) => void
    ) => onTypedEvent(eventBus, eventType, handler),

    off: <T extends EventType>(
      eventType: T,
      handler: T extends keyof EventDataMap
        ? (payload: EventDataMap[T]) => void
        : (payload?: any) => void
    ) => offTypedEvent(eventBus, eventType, handler)
  };
}
