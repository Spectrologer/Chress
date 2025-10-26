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

  // Inventory Events
  INVENTORY_CHANGED: 'inventory:changed',
  ITEM_USED: 'inventory:item:used',

  // Input Events
  INPUT_KEY_PRESS: 'input:key:press',
  INPUT_PATH_STARTED: 'input:path:started',
  INPUT_PATH_CANCELLED: 'input:path:cancelled',
  INPUT_PATH_COMPLETED: 'input:path:completed',
  INPUT_EXIT_REACHED: 'input:exit:reached',

  // Animation Events
  ANIMATION_REQUESTED: 'animation:requested',
  ANIMATION_COMPLETED: 'animation:completed',
  ANIMATION_HORSE_CHARGE: 'animation:horse:charge',
  ANIMATION_ARROW: 'animation:arrow',
  ANIMATION_POINT: 'animation:point',
  ANIMATION_MULTIPLIER: 'animation:multiplier',

  // Audio Events
  SOUND_PLAY: 'audio:sound:play',
  MUSIC_CHANGE: 'audio:music:change',

  // Game Mode Events
  GAME_EXIT_SHOVEL_MODE: 'game:exit:shovel_mode',
  GAME_INCREMENT_BOMB_ACTIONS: 'game:increment:bomb_actions',
  GAME_DECREMENT_ZONE_ENTRY_COUNT: 'game:decrement:zone_entry_count',
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
