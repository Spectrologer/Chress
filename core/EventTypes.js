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

  // Animation Events
  ANIMATION_REQUESTED: 'animation:requested',
  ANIMATION_COMPLETED: 'animation:completed',

  // Audio Events
  SOUND_PLAY: 'audio:sound:play',
  MUSIC_CHANGE: 'audio:music:change',
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
