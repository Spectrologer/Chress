/**
 * State Actions
 *
 * High-level action creators for common state mutations.
 * These provide a semantic API for updating state that maps to game events.
 */

import { store } from './StateStore.js';

export const StateActions = {
  // ==================== PLAYER ACTIONS ====================

  /**
   * Move player to a new position
   */
  movePlayer(x, y) {
    const current = store.get('persistent.player.position');
    store.batchSet({
      'persistent.player.position.lastX': current.x,
      'persistent.player.position.lastY': current.y,
      'persistent.player.position.x': x,
      'persistent.player.position.y': y
    }, 'move_player');
  },

  /**
   * Update player stats
   */
  updatePlayerStats(updates) {
    const paths = {};
    for (const [key, value] of Object.entries(updates)) {
      paths[`persistent.player.stats.${key}`] = value;
    }
    store.batchSet(paths, 'update_player_stats');
  },

  /**
   * Add item to inventory
   */
  addToInventory(item) {
    const inventory = store.get('persistent.player.inventory') || [];
    store.set('persistent.player.inventory', [...inventory, item], 'add_inventory_item');
  },

  /**
   * Remove item from inventory
   */
  removeFromInventory(itemIndex) {
    const inventory = store.get('persistent.player.inventory') || [];
    const updated = inventory.filter((_, i) => i !== itemIndex);
    store.set('persistent.player.inventory', updated, 'remove_inventory_item');
  },

  /**
   * Update radial inventory
   */
  setRadialInventory(items) {
    store.set('persistent.player.radialInventory', items, 'set_radial_inventory');
  },

  /**
   * Add player ability
   */
  addAbility(ability) {
    const abilities = new Set(store.get('persistent.player.abilities') || []);
    abilities.add(ability);
    store.set('persistent.player.abilities', abilities, 'add_ability');
  },

  /**
   * Remove player ability
   */
  removeAbility(ability) {
    const abilities = new Set(store.get('persistent.player.abilities') || []);
    abilities.delete(ability);
    store.set('persistent.player.abilities', abilities, 'remove_ability');
  },

  /**
   * Change zone
   */
  changeZone(x, y, dimension, depth = 0) {
    const oldZone = store.get('persistent.player.currentZone');
    const newZone = { x, y, dimension, depth };

    // Mark old zone as visited
    const visited = new Set(store.get('persistent.player.visitedZones') || []);
    if (oldZone) {
      const oldKey = `${oldZone.x},${oldZone.y},${oldZone.dimension},${oldZone.depth}`;
      visited.add(oldKey);
    }

    store.batchSet({
      'persistent.player.currentZone': newZone,
      'persistent.player.visitedZones': visited,
      'transient.zoneTransition.justEnteredZone': true
    }, 'change_zone');
  },

  // ==================== ZONE ACTIONS ====================

  /**
   * Set current zone grid
   */
  setCurrentGrid(grid) {
    store.set('session.currentGrid', grid, 'set_current_grid');
  },

  /**
   * Cache a zone
   */
  cacheZone(x, y, dimension, depth, zoneData) {
    const zones = new Map(store.get('persistent.zones') || new Map());
    const key = `${x},${y},${dimension},${depth}`;
    zones.set(key, { ...zoneData, lastVisited: Date.now() });
    store.set('persistent.zones', zones, 'cache_zone');
  },

  /**
   * Mark zone as special
   */
  markZoneAsSpecial(x, y, dimension, depth, specialType) {
    const specialZones = new Map(store.get('persistent.specialZones') || new Map());
    const key = `${x},${y},${dimension},${depth}`;
    specialZones.set(key, specialType);
    store.set('persistent.specialZones', specialZones, 'mark_special_zone');
  },

  // ==================== ENEMY ACTIONS ====================

  /**
   * Set active enemies in current zone
   */
  setEnemies(enemies) {
    store.set('session.enemies', enemies, 'set_enemies');
  },

  /**
   * Add defeated enemy
   */
  addDefeatedEnemy(x, y) {
    const defeated = new Set(store.get('persistent.defeatedEnemies') || []);
    const key = `${x},${y}`;
    defeated.add(key);
    store.set('persistent.defeatedEnemies', defeated, 'add_defeated_enemy');
  },

  // ==================== COMBAT ACTIONS ====================

  /**
   * Mark player as having just attacked
   */
  setPlayerAttacked(attacked = true) {
    store.set('transient.combat.playerJustAttacked', attacked, 'set_player_attacked');
  },

  /**
   * Update consecutive kills
   */
  updateConsecutiveKills(count) {
    store.set('persistent.player.stats.consecutiveKills', count, 'update_consecutive_kills');
  },

  // ==================== INTERACTION ACTIONS ====================

  /**
   * Show sign message
   */
  showSignMessage(message) {
    store.batchSet({
      'transient.interactions.signMessage': message,
      'transient.interactions.lastSignMessage': message
    }, 'show_sign_message');
  },

  /**
   * Clear sign message
   */
  clearSignMessage() {
    store.set('transient.interactions.signMessage', null, 'clear_sign_message');
  },

  /**
   * Set current NPC position
   */
  setCurrentNpcPosition(position) {
    store.set('transient.interactions.currentNpcPosition', position, 'set_npc_position');
  },

  /**
   * Update NPC dialogue
   */
  updateNpcDialogue(npcKey, dialogueIndex) {
    const dialogueState = new Map(store.get('persistent.dialogueState') || new Map());
    dialogueState.set(npcKey, dialogueIndex);
    store.set('persistent.dialogueState', dialogueState, 'update_npc_dialogue');
  },

  // ==================== ITEM ABILITY ACTIONS ====================

  /**
   * Set pending charge state
   */
  setPendingCharge(pending) {
    store.set('transient.itemAbilities.pendingCharge', pending, 'set_pending_charge');
  },

  /**
   * Set bomb placement mode
   */
  setBombPlacementMode(active) {
    store.set('transient.itemAbilities.bombPlacementMode', active, 'set_bomb_placement_mode');
  },

  /**
   * Add bomb position
   */
  addBombPosition(x, y) {
    const positions = store.get('transient.itemAbilities.bombPositions') || [];
    store.set('transient.itemAbilities.bombPositions', [...positions, { x, y }], 'add_bomb_position');
  },

  /**
   * Clear bomb positions
   */
  clearBombPositions() {
    store.set('transient.itemAbilities.bombPositions', [], 'clear_bomb_positions');
  },

  // ==================== TURN ACTIONS ====================

  /**
   * Set turn queue
   */
  setTurnQueue(queue) {
    store.set('transient.turn.turnQueue', queue, 'set_turn_queue');
  },

  /**
   * Set player turn
   */
  setPlayerTurn(isPlayerTurn) {
    store.set('transient.turn.isPlayerTurn', isPlayerTurn, 'set_player_turn');
  },

  /**
   * Set just left exit tile
   */
  setJustLeftExitTile(justLeft) {
    store.set('transient.turn.justLeftExitTile', justLeft, 'set_just_left_exit_tile');
  },

  // ==================== ZONE TRANSITION ACTIONS ====================

  /**
   * Set zone transition data
   */
  setZoneTransitionData(data) {
    store.batchSet({
      'transient.zoneTransition.lastExitSide': data.exitSide || null,
      'transient.zoneTransition.portTransitionData': data.portData || null,
      'transient.zoneTransition.justEnteredZone': true
    }, 'set_zone_transition_data');
  },

  /**
   * Clear zone transition flags
   */
  clearZoneTransitionFlags() {
    store.set('transient.zoneTransition.justEnteredZone', false, 'clear_zone_transition_flags');
  },

  /**
   * Set pitfall zone state
   */
  setPitfallZone(active, turnsRemaining = 0) {
    store.batchSet({
      'transient.zoneTransition.pitfallZoneActive': active,
      'transient.zoneTransition.pitfallTurnsRemaining': turnsRemaining
    }, 'set_pitfall_zone');
  },

  // ==================== UI ACTIONS ====================

  /**
   * Toggle stats panel
   */
  toggleStatsPanel(open) {
    store.set('ui.panels.statsOpen', open, 'toggle_stats_panel');
  },

  /**
   * Toggle config panel
   */
  toggleConfigPanel(open) {
    store.set('ui.panels.configOpen', open, 'toggle_config_panel');
  },

  /**
   * Set preview mode
   */
  setPreviewMode(preview) {
    store.set('ui.panels.previewMode', preview, 'set_preview_mode');
  },

  /**
   * Toggle radial menu
   */
  toggleRadialMenu(open, snapshot = null) {
    store.batchSet({
      'ui.radialMenu.open': open,
      'ui.radialMenu.snapshot': snapshot
    }, 'toggle_radial_menu');
  },

  /**
   * Set shovel mode
   */
  setShovelMode(active) {
    store.set('ui.input.shovelMode', active, 'set_shovel_mode');
  },

  /**
   * Update settings
   */
  updateSettings(updates) {
    const paths = {};
    for (const [key, value] of Object.entries(updates)) {
      paths[`ui.settings.${key}`] = value;
    }
    store.batchSet(paths, 'update_settings');
  },

  // ==================== MESSAGE LOG ACTIONS ====================

  /**
   * Add message to log
   */
  addMessage(message) {
    const log = store.get('persistent.messageLog') || [];
    store.set('persistent.messageLog', [...log, message], 'add_message');
  },

  /**
   * Clear message log
   */
  clearMessageLog() {
    store.set('persistent.messageLog', [], 'clear_message_log');
  },

  // ==================== ZONE GENERATION ACTIONS ====================

  /**
   * Increment zone counter
   */
  incrementZoneCounter() {
    const current = store.get('session.zoneGeneration.zoneCounter') || 0;
    store.set('session.zoneGeneration.zoneCounter', current + 1, 'increment_zone_counter');
  },

  /**
   * Increment enemy counter
   */
  incrementEnemyCounter() {
    const current = store.get('session.zoneGeneration.enemyCounter') || 0;
    store.set('session.zoneGeneration.enemyCounter', current + 1, 'increment_enemy_counter');
  },

  /**
   * Set spawn flag
   */
  setSpawnFlag(flag, value = true) {
    store.set(`session.zoneGeneration.spawnFlags.${flag}`, value, 'set_spawn_flag');
  },

  /**
   * Set spawn zone
   */
  setSpawnZone(key, zoneKey) {
    store.set(`session.zoneGeneration.spawnZones.${key}`, zoneKey, 'set_spawn_zone');
  },

  // ==================== GAME LIFECYCLE ACTIONS ====================

  /**
   * Start game
   */
  startGame() {
    store.set('session.gameStarted', true, 'start_game');
  },

  /**
   * Reset session (game over)
   */
  resetSession() {
    store.resetSession();
  },

  /**
   * Reset transient state (zone transition)
   */
  resetTransient() {
    store.resetTransient();
  },

  /**
   * Reset entire game (new game)
   */
  resetGame() {
    store.reset();
  },

  /**
   * Set entrance animation
   */
  setEntranceAnimation(inProgress, spawnPosition = null) {
    store.batchSet({
      'transient.entrance.animationInProgress': inProgress,
      'transient.entrance.newGameSpawnPosition': spawnPosition
    }, 'set_entrance_animation');
  }
};

export default StateActions;
