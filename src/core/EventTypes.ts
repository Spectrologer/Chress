/**
 * EventTypes - Centralized event type definitions for the event bus
 * This provides autocomplete support and prevents typos in event names
 */

import type { Position } from './Position';
import type {
    Enemy,
    InventoryItem,
    SaveGameData,
    Grid,
    AnimationData,
    TradeData,
    GameStatistics,
    ChargeStateData,
    SavedEnemyData
} from './SharedTypes';

export const EventTypes = {
  // Combat Events
  ENEMY_DEFEATED: 'enemy:defeated',
  COMBO_ACHIEVED: 'combat:combo',
  PLAYER_DAMAGED: 'player:damaged',
  POINT_AWARDED: 'points:awarded',
  MULTIPLIER_CHANGED: 'multiplier:changed',

  // Game State Events
  GAME_RESET: 'game:reset',
  GAME_INITIALIZED: 'game:initialized',
  GAME_OVER: 'game:over',
  GAME_STATE_LOADED: 'game:loaded',
  GAME_STATE_SAVED: 'game:saved',

  // Zone Events
  ZONE_CHANGED: 'zone:changed',
  ZONE_INITIALIZED: 'zone:initialized',
  REGION_CHANGED: 'region:changed',
  PORT_TRANSITION_DATA_SET: 'zone:port:transition:set',
  PORT_TRANSITION_DATA_CLEARED: 'zone:port:transition:cleared',
  PITFALL_ZONE_ENTERED: 'zone:pitfall:entered',
  PITFALL_ZONE_EXITED: 'zone:pitfall:exited',
  PITFALL_TURN_SURVIVED: 'zone:pitfall:turn:survived',

  // Player Events
  PLAYER_MOVED: 'player:moved',
  PLAYER_STATS_CHANGED: 'player:stats:changed',
  PLAYER_POSITION_CHANGED: 'player:position:changed',

  // Treasure Events
  TREASURE_FOUND: 'treasure:found',
  ITEM_ADDED: 'inventory:item:added',

  // UI Events
  MESSAGE_LOGGED: 'ui:message:logged',
  PANEL_OPENED: 'ui:panel:opened',
  PANEL_CLOSED: 'ui:panel:closed',
  UI_UPDATE_STATS: 'ui:update:stats',
  UI_SHOW_MESSAGE: 'ui:show:message',
  UI_CLOSE_PANEL: 'ui:close:panel',

  // UI Dialog Events (new)
  UI_DIALOG_SHOW: 'ui:dialog:show',
  UI_DIALOG_HIDE: 'ui:dialog:hide',
  UI_CONFIRMATION_SHOW: 'ui:confirmation:show',
  UI_CONFIRMATION_RESPONSE: 'ui:confirmation:response',
  UI_OVERLAY_MESSAGE_SHOW: 'ui:overlay:message:show',
  UI_OVERLAY_MESSAGE_HIDE: 'ui:overlay:message:hide',

  // Specific UI Message Events (new)
  UI_MESSAGE_LOG: 'ui:message:log',
  UI_REGION_NOTIFICATION_SHOW: 'ui:region:notification:show',

  // Specific Stats Events (new - to replace UI_UPDATE_STATS)
  STATS_HEALTH_CHANGED: 'stats:health:changed',
  STATS_POINTS_CHANGED: 'stats:points:changed',
  STATS_HUNGER_CHANGED: 'stats:hunger:changed',
  STATS_THIRST_CHANGED: 'stats:thirst:changed',

  // Inventory Events
  INVENTORY_CHANGED: 'inventory:changed',
  RADIAL_INVENTORY_CHANGED: 'inventory:radial:changed',
  ITEM_USED: 'inventory:item:used',
  BOMB_PLACEMENT_POSITION_ADDED: 'inventory:bomb:placement:added',
  BOMB_PLACEMENT_POSITION_REMOVED: 'inventory:bomb:placement:removed',

  // Ability Events (new)
  ABILITY_GAINED: 'ability:gained',
  ABILITY_LOST: 'ability:lost',

  // Stats Events (new)
  STATS_CHANGED: 'stats:changed',
  POINTS_CHANGED: 'points:changed',

  // Input Events
  INPUT_KEY_PRESS: 'input:key:press',
  INPUT_PATH_STARTED: 'input:path:started',
  INPUT_PATH_CANCELLED: 'input:path:cancelled',
  INPUT_PATH_COMPLETED: 'input:path:completed',
  INPUT_EXIT_REACHED: 'input:exit:reached',
  INPUT_TAP: 'input:tap',
  INPUT_PLAYER_TILE_TAP: 'input:player:tile:tap',

  // Animation Events
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

  // Audio Events
  SOUND_PLAY: 'audio:sound:play',
  MUSIC_CHANGE: 'audio:music:change',

  // Game Mode Events
  GAME_EXIT_SHOVEL_MODE: 'game:exit:shovel_mode',
  GAME_INCREMENT_BOMB_ACTIONS: 'game:increment:bomb_actions',
  GAME_DECREMENT_ZONE_ENTRY_COUNT: 'game:decrement:zone_entry_count',

  // Combat State Events
  COMBAT_STARTED: 'combat:started',
  COMBAT_ENDED: 'combat:ended',
  PLAYER_KNOCKBACK: 'player:knockback',

  // Trade Events
  TRADE_INITIATED: 'trade:initiated',
  TRADE_COMPLETED: 'trade:completed',

  // Enemy Collection Events
  ENEMY_SPAWNED: 'enemy:spawned',
  ENEMY_REMOVED: 'enemy:removed',
  ENEMIES_CLEARED: 'enemies:cleared',
  ENEMIES_REPLACED: 'enemies:replaced',

  // Transient State Events (charge state tracking)
  CHARGE_STATE_CHANGED: 'charge:state:changed',

  // Additional State Events
  BOMB_PLACEMENT_MODE_CHANGED: 'bomb:placement:mode:changed',
  SIGN_MESSAGE_DISPLAYED: 'sign:message:displayed',
  SIGN_MESSAGE_CLEARED: 'sign:message:cleared',
  PLAYER_ATTACKED: 'player:attacked',
  TRANSIENT_STATE_RESET: 'transient:state:reset',
} as const;

export type EventType = typeof EventTypes[keyof typeof EventTypes];

/**
 * Event data type definitions for documentation and type safety
 */

// Re-export Position for other modules
export type { Position };

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

export interface ZoneChangedEvent {
  x: number;
  y: number;
  dimension: number;
  regionName: string;
}

export interface PlayerStatsChangedEvent {
  health: number;
  points: number;
  hunger: number;
  thirst: number;
}

export interface TreasureFoundEvent {
  itemType: string;
  quantity: number;
  message: string;
}

export interface AnimationRequestedEvent {
  type: string;
  x: number;
  y: number;
  data: AnimationData;
}

export interface UIShowMessageEvent {
  text: string;
  imageSrc?: string;
  isPersistent?: boolean;
  isLargeText?: boolean;
  useTypewriter?: boolean;
}

export interface InventoryChangedEvent {
  action: string;
  item?: InventoryItem;
  quantity?: number;
}

export interface ItemUsedEvent {
  item: InventoryItem;
  x: number;
  y: number;
  result?: { success: boolean; message?: string };
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

export interface InputKeyPressEvent {
  key: string;
  preventDefault: () => void;
  _synthetic?: boolean;
}

export interface InputPathStartedEvent {
  pathLength: number;
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

export interface UIDialogShowEvent {
  type: string;
  npc?: string;
  message?: string;
  portrait?: string;
  name?: string;
  buttonText?: string;
  playerPos?: Position;
  npcPos?: Position;
}

export interface UIDialogHideEvent {
  type: string;
}

export interface UIConfirmationShowEvent {
  message: string;
  action: string;
  data?: Record<string, any>;
  persistent?: boolean;
  largeText?: boolean;
  useTypewriter?: boolean;
}

export interface UIConfirmationResponseEvent {
  action: string;
  confirmed: boolean;
  data?: Record<string, any>;
}

export interface UIOverlayMessageShowEvent {
  text: string;
  imageSrc?: string;
  persistent?: boolean;
  largeText?: boolean;
  useTypewriter?: boolean;
}

export interface UIMessageLogEvent {
  text: string;
  category?: string;
  priority?: string;
  timestamp?: number;
}

export interface UIRegionNotificationShowEvent {
  x: number;
  y: number;
  regionName?: string;
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

export interface PlayerKnockbackEvent {
  x: number;
  y: number;
  source?: string;
}

export interface TradeInitiatedEvent {
  npc: string;
  tradeData: TradeData;
  playerPoints: number;
}

export interface TradeCompletedEvent {
  npc: string;
  cost: number;
  reward: InventoryItem | number;
  remainingPoints: number;
}

// Additional event interfaces for missing event types

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

export interface PlayerPositionChangedEvent {
  oldX: number;
  oldY: number;
  newX: number;
  newY: number;
}

export interface ItemAddedEvent {
  item: InventoryItem;
  quantity: number;
  source: string;
}

export interface MessageLoggedEvent {
  message: string;
  type: string;
  timestamp: number;
}

export interface PanelOpenedEvent {
  panelId: string;
  panelType: string;
}

export interface PanelClosedEvent {
  panelId: string;
  panelType: string;
}

export interface UIUpdateStatsEvent {
  // Empty payload - used as trigger for UI updates
}

export interface UIClosePanelEvent {
  panelId?: string;
}

export interface AbilityLostEvent {
  ability: string;
  abilities: string[];
}

export interface StatsChangedEvent {
  stat: string;
  value: number | boolean | string;
  stats: Record<string, any>;
}

export interface PointsChangedEvent {
  points: number;
}

export interface InputPathCancelledEvent {
  pathLength?: number;
  reason?: string;
}

export interface InputPathCompletedEvent {
  pathLength?: number;
  endPosition?: Position;
}

export interface AnimationCompletedEvent {
  type: string;
  x?: number;
  y?: number;
}

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

export interface GameExitShovelModeEvent {
  itemsCollected?: number;
}

export interface GameIncrementBombActionsEvent {
  currentCount: number;
}

export interface GameDecrementZoneEntryCountEvent {
  currentCount: number;
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

export interface ChargeStateChangedEvent {
  isPending: boolean;
  data: ChargeStateData | null;
}

export interface BombPlacementModeChangedEvent {
  active: boolean;
  positions: Position[];
}

export interface SignMessageDisplayedEvent {
  message?: string;
  x?: number;
  y?: number;
}

export interface SignMessageClearedEvent {
  // Empty payload
}

export interface PlayerAttackedEvent {
  damage?: number;
  attacker?: Enemy | string;
}

export interface TransientStateResetEvent {
  // Empty payload
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

// Events discovered in code but not in EventTypes
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

export interface BombPlacementPositionAddedEvent {
  position: Position;
  totalPositions: number;
}

export interface BombPlacementPositionRemovedEvent {
  position: Position;
  totalPositions: number;
}

// Type map for event type to event data
export interface EventDataMap {
  // Combat Events
  [EventTypes.ENEMY_DEFEATED]: EnemyDefeatedEvent;
  [EventTypes.COMBO_ACHIEVED]: ComboAchievedEvent;
  [EventTypes.PLAYER_DAMAGED]: PlayerDamagedEvent;
  [EventTypes.POINT_AWARDED]: PointAwardedEvent;
  [EventTypes.MULTIPLIER_CHANGED]: MultiplierChangedEvent;

  // Game State Events
  [EventTypes.GAME_RESET]: { zone: { x: number; y: number; dimension: number }; regionName: string };
  [EventTypes.GAME_INITIALIZED]: GameInitializedEvent;
  [EventTypes.GAME_OVER]: GameOverEvent;
  [EventTypes.GAME_STATE_LOADED]: GameStateLoadedEvent;
  [EventTypes.GAME_STATE_SAVED]: GameStateSavedEvent;

  // Zone Events
  [EventTypes.ZONE_CHANGED]: ZoneChangedEvent;
  [EventTypes.ZONE_INITIALIZED]: ZoneInitializedEvent;
  [EventTypes.REGION_CHANGED]: RegionChangedEvent;

  // Player Events
  [EventTypes.PLAYER_MOVED]: { x: number; y: number };
  [EventTypes.PLAYER_STATS_CHANGED]: PlayerStatsChangedEvent;
  [EventTypes.PLAYER_POSITION_CHANGED]: PlayerPositionChangedEvent;

  // Treasure Events
  [EventTypes.TREASURE_FOUND]: TreasureFoundEvent;
  [EventTypes.ITEM_ADDED]: ItemAddedEvent;

  // UI Events
  [EventTypes.MESSAGE_LOGGED]: MessageLoggedEvent;
  [EventTypes.PANEL_OPENED]: PanelOpenedEvent;
  [EventTypes.PANEL_CLOSED]: PanelClosedEvent;
  [EventTypes.UI_UPDATE_STATS]: UIUpdateStatsEvent;
  [EventTypes.UI_SHOW_MESSAGE]: UIShowMessageEvent;
  [EventTypes.UI_CLOSE_PANEL]: UIClosePanelEvent;

  // UI Dialog Events
  [EventTypes.UI_DIALOG_SHOW]: UIDialogShowEvent;
  [EventTypes.UI_DIALOG_HIDE]: UIDialogHideEvent;
  [EventTypes.UI_CONFIRMATION_SHOW]: UIConfirmationShowEvent;
  [EventTypes.UI_CONFIRMATION_RESPONSE]: UIConfirmationResponseEvent;
  [EventTypes.UI_OVERLAY_MESSAGE_SHOW]: UIOverlayMessageShowEvent;
  [EventTypes.UI_OVERLAY_MESSAGE_HIDE]: {};

  // UI Message Events
  [EventTypes.UI_MESSAGE_LOG]: UIMessageLogEvent;
  [EventTypes.UI_REGION_NOTIFICATION_SHOW]: UIRegionNotificationShowEvent;

  // Stats Events
  [EventTypes.STATS_HEALTH_CHANGED]: StatsHealthChangedEvent;
  [EventTypes.STATS_POINTS_CHANGED]: StatsPointsChangedEvent;
  [EventTypes.STATS_HUNGER_CHANGED]: StatsHungerChangedEvent;
  [EventTypes.STATS_THIRST_CHANGED]: StatsThirstChangedEvent;
  [EventTypes.STATS_CHANGED]: StatsChangedEvent;
  [EventTypes.POINTS_CHANGED]: PointsChangedEvent;

  // Inventory Events
  [EventTypes.INVENTORY_CHANGED]: InventoryChangedEvent;
  [EventTypes.RADIAL_INVENTORY_CHANGED]: { inventory: InventoryItem[] };
  [EventTypes.ITEM_USED]: ItemUsedEvent;

  // Ability Events
  [EventTypes.ABILITY_GAINED]: { ability: string; abilities: string[] };
  [EventTypes.ABILITY_LOST]: AbilityLostEvent;

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

  // Game Mode Events
  [EventTypes.GAME_EXIT_SHOVEL_MODE]: GameExitShovelModeEvent;
  [EventTypes.GAME_INCREMENT_BOMB_ACTIONS]: GameIncrementBombActionsEvent;
  [EventTypes.GAME_DECREMENT_ZONE_ENTRY_COUNT]: GameDecrementZoneEntryCountEvent;

  // Combat State Events
  [EventTypes.COMBAT_STARTED]: CombatStartedEvent;
  [EventTypes.COMBAT_ENDED]: CombatEndedEvent;
  [EventTypes.PLAYER_KNOCKBACK]: PlayerKnockbackEvent;

  // Trade Events
  [EventTypes.TRADE_INITIATED]: TradeInitiatedEvent;
  [EventTypes.TRADE_COMPLETED]: TradeCompletedEvent;

  // Enemy Collection Events
  [EventTypes.ENEMY_SPAWNED]: EnemySpawnedEvent;
  [EventTypes.ENEMY_REMOVED]: EnemyRemovedEvent;
  [EventTypes.ENEMIES_CLEARED]: EnemiesClearedEvent;
  [EventTypes.ENEMIES_REPLACED]: EnemiesReplacedEvent;

  // Transient State Events
  [EventTypes.CHARGE_STATE_CHANGED]: ChargeStateChangedEvent;
  [EventTypes.BOMB_PLACEMENT_MODE_CHANGED]: BombPlacementModeChangedEvent;
  [EventTypes.SIGN_MESSAGE_DISPLAYED]: SignMessageDisplayedEvent;
  [EventTypes.SIGN_MESSAGE_CLEARED]: SignMessageClearedEvent;
  [EventTypes.PLAYER_ATTACKED]: PlayerAttackedEvent;
  [EventTypes.TRANSIENT_STATE_RESET]: TransientStateResetEvent;
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
