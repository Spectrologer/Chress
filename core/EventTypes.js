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
};

/**
 * Event data type definitions for documentation
 * These are JSDoc type definitions to help with IDE autocomplete
 */

/**
 * @typedef {Object} EnemyDefeatedEvent
 * @property {Object} enemy - The defeated enemy
 * @property {number} points - Points awarded
 * @property {number} x - Enemy x position
 * @property {number} y - Enemy y position
 * @property {boolean} isComboKill - Whether this was part of a combo
 */

/**
 * @typedef {Object} ComboAchievedEvent
 * @property {number} comboCount - Number of enemies in combo
 * @property {number} multiplier - Current multiplier
 * @property {number} bonusPoints - Bonus points from combo
 */

/**
 * @typedef {Object} PlayerDamagedEvent
 * @property {number} damage - Amount of damage taken
 * @property {number} currentHealth - Player's current health
 * @property {Object} source - Source of the damage
 */

/**
 * @typedef {Object} ZoneChangedEvent
 * @property {number} x - New zone x coordinate
 * @property {number} y - New zone y coordinate
 * @property {number} dimension - Zone dimension (0=surface, 1=interior, 2=underground)
 * @property {string} regionName - Generated region name
 */

/**
 * @typedef {Object} PlayerStatsChangedEvent
 * @property {number} health - Current health
 * @property {number} points - Current points
 * @property {number} hunger - Current hunger level
 * @property {number} thirst - Current thirst level
 */

/**
 * @typedef {Object} TreasureFoundEvent
 * @property {string} itemType - Type of item found
 * @property {number} quantity - Quantity of items
 * @property {string} message - Message to display
 */

/**
 * @typedef {Object} AnimationRequestedEvent
 * @property {string} type - Type of animation (point, multiplier, charge, etc.)
 * @property {number} x - X position for animation
 * @property {number} y - Y position for animation
 * @property {*} data - Additional animation data
 */

/**
 * @typedef {Object} UIShowMessageEvent
 * @property {string} text - Message text (can include HTML)
 * @property {string} [imageSrc] - Optional image source URL
 * @property {boolean} [isPersistent] - Whether message stays until manually dismissed
 * @property {boolean} [isLargeText] - Whether to use large text styling
 * @property {boolean} [useTypewriter] - Whether to use typewriter animation
 */

/**
 * @typedef {Object} InventoryChangedEvent
 * @property {string} action - Type of change (add, remove, use, update)
 * @property {Object} [item] - The affected item
 * @property {number} [quantity] - Quantity changed
 */

/**
 * @typedef {Object} ItemUsedEvent
 * @property {Object} item - The item that was used
 * @property {number} x - X position where used
 * @property {number} y - Y position where used
 * @property {*} [result] - Result of using the item
 */

/**
 * @typedef {Object} AnimationHorseChargeEvent
 * @property {Object} startPos - Starting position {x, y}
 * @property {Object} midPos - Mid-point position {x, y}
 * @property {Object} endPos - End position {x, y}
 */

/**
 * @typedef {Object} AnimationArrowEvent
 * @property {number} startX - Arrow starting X position
 * @property {number} startY - Arrow starting Y position
 * @property {number} endX - Arrow ending X position
 * @property {number} endY - Arrow ending Y position
 */

/**
 * @typedef {Object} AnimationPointEvent
 * @property {number} x - X position for point animation
 * @property {number} y - Y position for point animation
 * @property {number} points - Number of points to display
 * @property {string} [color] - Optional color for the animation
 */

/**
 * @typedef {Object} AnimationMultiplierEvent
 * @property {number} x - X position for multiplier animation
 * @property {number} y - Y position for multiplier animation
 * @property {number} multiplier - Multiplier value to display
 */

/**
 * @typedef {Object} InputKeyPressEvent
 * @property {string} key - The key that was pressed
 * @property {Function} preventDefault - Function to prevent default behavior
 * @property {boolean} [_synthetic] - Whether this is a synthetic event from path execution
 */

/**
 * @typedef {Object} InputPathStartedEvent
 * @property {number} pathLength - Number of steps in the path
 */

/**
 * @typedef {Object} InputExitReachedEvent
 * @property {number} x - X position of the exit
 * @property {number} y - Y position of the exit
 */

/**
 * @typedef {Object} InputTapEvent
 * @property {Object} gridCoords - Grid coordinates {x, y}
 * @property {number} screenX - Screen X coordinate
 * @property {number} screenY - Screen Y coordinate
 * @property {boolean} handled - Whether the tap was handled by a UI component
 */

/**
 * @typedef {Object} InputPlayerTileTapEvent
 * @property {Object} gridCoords - Grid coordinates {x, y}
 * @property {number} tileType - Type of tile the player is on
 * @property {string|null} portKind - Port kind if on a port tile
 */

/**
 * @typedef {Object} UIDialogShowEvent
 * @property {string} type - Dialog type (barter, sign, statue, etc.)
 * @property {string} [npc] - NPC name for barter dialogs
 * @property {string} [message] - Message content for sign dialogs
 * @property {string} [portrait] - Portrait image source
 * @property {string} [name] - NPC or sign name
 * @property {string} [buttonText] - Custom button text
 * @property {Object} [playerPos] - Player position {x, y}
 * @property {Object} [npcPos] - NPC position {x, y}
 */

/**
 * @typedef {Object} UIDialogHideEvent
 * @property {string} type - Dialog type to hide
 */

/**
 * @typedef {Object} UIConfirmationShowEvent
 * @property {string} message - Confirmation message to display
 * @property {string} action - Action identifier (bishop_charge, knight_charge, bow_shot, etc.)
 * @property {*} [data] - Additional data for the action
 * @property {boolean} [persistent] - Whether message stays until manually dismissed
 * @property {boolean} [largeText] - Whether to use large text styling
 * @property {boolean} [useTypewriter] - Whether to use typewriter animation
 */

/**
 * @typedef {Object} UIConfirmationResponseEvent
 * @property {string} action - Action identifier that was confirmed/cancelled
 * @property {boolean} confirmed - Whether the action was confirmed
 * @property {*} [data] - Additional data from the confirmation
 */

/**
 * @typedef {Object} UIOverlayMessageShowEvent
 * @property {string} text - Message text (can include HTML)
 * @property {string} [imageSrc] - Optional image source URL
 * @property {boolean} [persistent] - Whether message stays until manually dismissed
 * @property {boolean} [largeText] - Whether to use large text styling
 * @property {boolean} [useTypewriter] - Whether to use typewriter animation
 */

/**
 * @typedef {Object} UIMessageLogEvent
 * @property {string} text - Message text to log
 * @property {string} [category] - Message category (trade, treasure, combat, etc.)
 * @property {string} [priority] - Message priority (info, warning, error)
 * @property {number} [timestamp] - When the message was created
 */

/**
 * @typedef {Object} UIRegionNotificationShowEvent
 * @property {number} x - Zone x coordinate
 * @property {number} y - Zone y coordinate
 * @property {string} [regionName] - Pre-generated region name (optional)
 */

/**
 * @typedef {Object} StatsHealthChangedEvent
 * @property {number} oldValue - Previous health value
 * @property {number} newValue - New health value
 * @property {number} delta - Change in health (negative for damage)
 * @property {string} [source] - Source of the change (combat, hunger, healing, etc.)
 */

/**
 * @typedef {Object} StatsPointsChangedEvent
 * @property {number} oldValue - Previous points value
 * @property {number} newValue - New points value
 * @property {number} delta - Change in points
 * @property {string} [source] - Source of the change (enemy_defeat, treasure, combo, etc.)
 */

/**
 * @typedef {Object} StatsHungerChangedEvent
 * @property {number} oldValue - Previous hunger value
 * @property {number} newValue - New hunger value
 * @property {number} delta - Change in hunger
 */

/**
 * @typedef {Object} StatsThirstChangedEvent
 * @property {number} oldValue - Previous thirst value
 * @property {number} newValue - New thirst value
 * @property {number} delta - Change in thirst
 */

/**
 * @typedef {Object} AnimationBumpEvent
 * @property {number} dx - Direction X offset for bump
 * @property {number} dy - Direction Y offset for bump
 * @property {number} playerX - Player's current X position
 * @property {number} playerY - Player's current Y position
 */

/**
 * @typedef {Object} AnimationBackflipEvent
 * @property {number} [x] - Optional X position for backflip
 * @property {number} [y] - Optional Y position for backflip
 */

/**
 * @typedef {Object} AnimationSmokeEvent
 * @property {number} x - X position for smoke animation
 * @property {number} y - Y position for smoke animation
 */

/**
 * @typedef {Object} AnimationAttackEvent
 * @property {number} [x] - Optional X position for attack
 * @property {number} [y] - Optional Y position for attack
 */

/**
 * @typedef {Object} PlayerKnockbackEvent
 * @property {number} x - New X position after knockback
 * @property {number} y - New Y position after knockback
 * @property {string} [source] - Source of the knockback (enemy, trap, etc.)
 */

/**
 * @typedef {Object} TradeInitiatedEvent
 * @property {string} npc - NPC name
 * @property {Object} tradeData - Trade data details
 * @property {number} playerPoints - Player's current points
 */

/**
 * @typedef {Object} TradeCompletedEvent
 * @property {string} npc - NPC name
 * @property {number} cost - Cost of the trade
 * @property {Object} reward - Reward received
 * @property {number} remainingPoints - Player's remaining points
 */
