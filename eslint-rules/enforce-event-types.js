/**
 * ESLint rule to enforce EventTypes constants usage in eventBus calls
 *
 * This rule ensures that all eventBus.emit(), eventBus.on(), eventBus.once(),
 * and eventBus.off() calls use constants from EventTypes instead of string literals.
 *
 * ❌ Bad:
 *   eventBus.emit('player:moved', data)
 *   eventBus.on('enemy:defeated', handler)
 *
 * ✅ Good:
 *   eventBus.emit(EventTypes.PLAYER_MOVED, data)
 *   eventBus.on(EventTypes.ENEMY_DEFEATED, handler)
 */
export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce EventTypes constants instead of string literals in eventBus calls',
      category: 'Best Practices',
      recommended: true
    },
    fixable: null, // We could add auto-fix in the future
    schema: [], // no options
    messages: {
      useEventTypes: 'Use EventTypes.{{constant}} instead of string literal \'{{eventName}}\' in eventBus.{{method}}()',
      unknownEvent: 'Unknown event \'{{eventName}}\' in eventBus.{{method}}(). Add it to EventTypes or use a constant.',
      useConstant: 'eventBus.{{method}}() should use EventTypes constants instead of string literals'
    }
  },

  create(context) {
    // Map of event strings to their EventTypes constant names
    const eventNameToConstant = {
      // Combat Events
      'enemy:defeated': 'ENEMY_DEFEATED',
      'combat:combo': 'COMBO_ACHIEVED',
      'player:damaged': 'PLAYER_DAMAGED',
      'points:awarded': 'POINT_AWARDED',
      'multiplier:changed': 'MULTIPLIER_CHANGED',

      // Game State Events
      'game:reset': 'GAME_RESET',
      'game:initialized': 'GAME_INITIALIZED',
      'game:over': 'GAME_OVER',
      'game:loaded': 'GAME_STATE_LOADED',
      'game:saved': 'GAME_STATE_SAVED',

      // Zone Events
      'zone:changed': 'ZONE_CHANGED',
      'zone:initialized': 'ZONE_INITIALIZED',
      'region:changed': 'REGION_CHANGED',

      // Player Events
      'player:moved': 'PLAYER_MOVED',
      'player:stats:changed': 'PLAYER_STATS_CHANGED',
      'player:position:changed': 'PLAYER_POSITION_CHANGED',

      // Treasure Events
      'treasure:found': 'TREASURE_FOUND',
      'inventory:item:added': 'ITEM_ADDED',

      // UI Events
      'ui:message:logged': 'MESSAGE_LOGGED',
      'ui:panel:opened': 'PANEL_OPENED',
      'ui:panel:closed': 'PANEL_CLOSED',
      'ui:update:stats': 'UI_UPDATE_STATS',
      'ui:show:message': 'UI_SHOW_MESSAGE',
      'ui:close:panel': 'UI_CLOSE_PANEL',

      // UI Dialog Events
      'ui:dialog:show': 'UI_DIALOG_SHOW',
      'ui:dialog:hide': 'UI_DIALOG_HIDE',
      'ui:confirmation:show': 'UI_CONFIRMATION_SHOW',
      'ui:confirmation:response': 'UI_CONFIRMATION_RESPONSE',
      'ui:overlay:message:show': 'UI_OVERLAY_MESSAGE_SHOW',
      'ui:overlay:message:hide': 'UI_OVERLAY_MESSAGE_HIDE',

      // Specific UI Message Events
      'ui:message:log': 'UI_MESSAGE_LOG',
      'ui:region:notification:show': 'UI_REGION_NOTIFICATION_SHOW',

      // Specific Stats Events
      'stats:health:changed': 'STATS_HEALTH_CHANGED',
      'stats:points:changed': 'STATS_POINTS_CHANGED',
      'stats:hunger:changed': 'STATS_HUNGER_CHANGED',
      'stats:thirst:changed': 'STATS_THIRST_CHANGED',

      // Inventory Events
      'inventory:changed': 'INVENTORY_CHANGED',
      'inventory:radial:changed': 'RADIAL_INVENTORY_CHANGED',
      'inventory:item:used': 'ITEM_USED',

      // Ability Events
      'ability:gained': 'ABILITY_GAINED',
      'ability:lost': 'ABILITY_LOST',

      // Stats Events
      'stats:changed': 'STATS_CHANGED',
      'points:changed': 'POINTS_CHANGED',

      // Input Events
      'input:key:press': 'INPUT_KEY_PRESS',
      'input:path:started': 'INPUT_PATH_STARTED',
      'input:path:cancelled': 'INPUT_PATH_CANCELLED',
      'input:path:completed': 'INPUT_PATH_COMPLETED',
      'input:exit:reached': 'INPUT_EXIT_REACHED',
      'input:tap': 'INPUT_TAP',
      'input:player:tile:tap': 'INPUT_PLAYER_TILE_TAP',

      // Animation Events
      'animation:requested': 'ANIMATION_REQUESTED',
      'animation:completed': 'ANIMATION_COMPLETED',
      'animation:horse:charge': 'ANIMATION_HORSE_CHARGE',
      'animation:arrow': 'ANIMATION_ARROW',
      'animation:point': 'ANIMATION_POINT',
      'animation:multiplier': 'ANIMATION_MULTIPLIER',
      'animation:bump': 'ANIMATION_BUMP',
      'animation:backflip': 'ANIMATION_BACKFLIP',
      'animation:smoke': 'ANIMATION_SMOKE',
      'animation:attack': 'ANIMATION_ATTACK',

      // Audio Events
      'audio:sound:play': 'SOUND_PLAY',
      'audio:music:change': 'MUSIC_CHANGE',

      // Game Mode Events
      'game:exit:shovel_mode': 'GAME_EXIT_SHOVEL_MODE',
      'game:increment:bomb_actions': 'GAME_INCREMENT_BOMB_ACTIONS',
      'game:decrement:zone_entry_count': 'GAME_DECREMENT_ZONE_ENTRY_COUNT',

      // Combat State Events
      'combat:started': 'COMBAT_STARTED',
      'combat:ended': 'COMBAT_ENDED',
      'player:knockback': 'PLAYER_KNOCKBACK',

      // Trade Events
      'trade:initiated': 'TRADE_INITIATED',
      'trade:completed': 'TRADE_COMPLETED',

      // Enemy Collection Events
      'enemy:spawned': 'ENEMY_SPAWNED',
      'enemy:removed': 'ENEMY_REMOVED',
      'enemies:cleared': 'ENEMIES_CLEARED',
      'enemies:replaced': 'ENEMIES_REPLACED',

      // Transient State Events
      'charge:state:changed': 'CHARGE_STATE_CHANGED'
    };

    return {
      CallExpression(node) {
        // Check if this is an eventBus method call
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.object.type === 'Identifier' &&
          (node.callee.object.name === 'eventBus' ||
           (node.callee.object.type === 'MemberExpression' &&
            node.callee.object.property.name === 'eventBus')) &&
          node.callee.property.type === 'Identifier' &&
          ['emit', 'on', 'once', 'off'].includes(node.callee.property.name)
        ) {
          const method = node.callee.property.name;
          const firstArg = node.arguments[0];

          // Skip if this is in EventBus.js (the implementation file)
          const filename = context.getFilename();
          if (filename.includes('EventBus.js')) {
            return;
          }

          // Check if the first argument is a string literal
          if (firstArg && firstArg.type === 'Literal' && typeof firstArg.value === 'string') {
            const eventName = firstArg.value;
            const constantName = eventNameToConstant[eventName];

            if (constantName) {
              context.report({
                node: firstArg,
                messageId: 'useEventTypes',
                data: {
                  constant: constantName,
                  eventName: eventName,
                  method: method
                }
              });
            } else {
              context.report({
                node: firstArg,
                messageId: 'unknownEvent',
                data: {
                  eventName: eventName,
                  method: method
                }
              });
            }
          }
        }
      }
    };
  }
};
