/**
 * EventTypes - Centralized event type definitions for the event bus
 * This provides autocomplete support and prevents typos in event names
 */
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

export interface Position {
  x: number;
  y: number;
}

export interface EnemyDefeatedEvent {
  enemy: any; // Will be properly typed when Enemy class is migrated
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
  source: any;
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
  data: any;
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
  item?: any;
  quantity?: number;
}

export interface ItemUsedEvent {
  item: any;
  x: number;
  y: number;
  result?: any;
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
  data?: any;
  persistent?: boolean;
  largeText?: boolean;
  useTypewriter?: boolean;
}

export interface UIConfirmationResponseEvent {
  action: string;
  confirmed: boolean;
  data?: any;
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
  tradeData: any;
  playerPoints: number;
}

export interface TradeCompletedEvent {
  npc: string;
  cost: number;
  reward: any;
  remainingPoints: number;
}

// Type map for event type to event data
export interface EventDataMap {
  [EventTypes.ENEMY_DEFEATED]: EnemyDefeatedEvent;
  [EventTypes.COMBO_ACHIEVED]: ComboAchievedEvent;
  [EventTypes.PLAYER_DAMAGED]: PlayerDamagedEvent;
  [EventTypes.ZONE_CHANGED]: ZoneChangedEvent;
  [EventTypes.PLAYER_STATS_CHANGED]: PlayerStatsChangedEvent;
  [EventTypes.TREASURE_FOUND]: TreasureFoundEvent;
  [EventTypes.ANIMATION_REQUESTED]: AnimationRequestedEvent;
  [EventTypes.UI_SHOW_MESSAGE]: UIShowMessageEvent;
  [EventTypes.INVENTORY_CHANGED]: InventoryChangedEvent;
  [EventTypes.ITEM_USED]: ItemUsedEvent;
  [EventTypes.ANIMATION_HORSE_CHARGE]: AnimationHorseChargeEvent;
  [EventTypes.ANIMATION_ARROW]: AnimationArrowEvent;
  [EventTypes.ANIMATION_POINT]: AnimationPointEvent;
  [EventTypes.ANIMATION_MULTIPLIER]: AnimationMultiplierEvent;
  [EventTypes.INPUT_KEY_PRESS]: InputKeyPressEvent;
  [EventTypes.INPUT_PATH_STARTED]: InputPathStartedEvent;
  [EventTypes.INPUT_EXIT_REACHED]: InputExitReachedEvent;
  [EventTypes.INPUT_TAP]: InputTapEvent;
  [EventTypes.INPUT_PLAYER_TILE_TAP]: InputPlayerTileTapEvent;
  [EventTypes.UI_DIALOG_SHOW]: UIDialogShowEvent;
  [EventTypes.UI_DIALOG_HIDE]: UIDialogHideEvent;
  [EventTypes.UI_CONFIRMATION_SHOW]: UIConfirmationShowEvent;
  [EventTypes.UI_CONFIRMATION_RESPONSE]: UIConfirmationResponseEvent;
  [EventTypes.UI_OVERLAY_MESSAGE_SHOW]: UIOverlayMessageShowEvent;
  [EventTypes.UI_MESSAGE_LOG]: UIMessageLogEvent;
  [EventTypes.UI_REGION_NOTIFICATION_SHOW]: UIRegionNotificationShowEvent;
  [EventTypes.STATS_HEALTH_CHANGED]: StatsHealthChangedEvent;
  [EventTypes.STATS_POINTS_CHANGED]: StatsPointsChangedEvent;
  [EventTypes.STATS_HUNGER_CHANGED]: StatsHungerChangedEvent;
  [EventTypes.STATS_THIRST_CHANGED]: StatsThirstChangedEvent;
  [EventTypes.ANIMATION_BUMP]: AnimationBumpEvent;
  [EventTypes.ANIMATION_BACKFLIP]: AnimationBackflipEvent;
  [EventTypes.ANIMATION_SMOKE]: AnimationSmokeEvent;
  [EventTypes.ANIMATION_ATTACK]: AnimationAttackEvent;
  [EventTypes.PLAYER_KNOCKBACK]: PlayerKnockbackEvent;
  [EventTypes.TRADE_INITIATED]: TradeInitiatedEvent;
  [EventTypes.TRADE_COMPLETED]: TradeCompletedEvent;
}
