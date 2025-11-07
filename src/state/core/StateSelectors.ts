/**
 * State Selectors
 *
 * Convenient, type-safe accessors for common state queries.
 * These act as a stable API layer between components and the state store.
 */

import { store } from './StateStore';

export const StateSelectors = {
  // ==================== PLAYER ====================

  getPlayer() {
    return store.get('persistent.player');
  },

  getPlayerPosition() {
    return store.get('persistent.player.position');
  },

  getPlayerCurrentZone() {
    return store.get('persistent.player.currentZone');
  },

  getPlayerStats() {
    return store.get('persistent.player.stats');
  },

  getPlayerInventory() {
    return store.get('persistent.player.inventory');
  },

  getPlayerRadialInventory() {
    return store.get('persistent.player.radialInventory');
  },

  getPlayerAbilities() {
    return store.get('persistent.player.abilities');
  },

  hasAbility(ability: string): boolean {
    const abilities = store.get('persistent.player.abilities');
    return abilities ? abilities.has(ability) : false;
  },

  hasItem(itemType: string): boolean {
    const inventory = store.get('persistent.player.inventory');
    return inventory ? inventory.some((item: any) => item.type === itemType) : false;
  },

  // ==================== ZONES ====================

  getZones() {
    return store.get('persistent.zones');
  },

  getZone(x: number, y: number, dimension: string, depth = 0) {
    const zones = store.get('persistent.zones');
    if (!zones) return null;
    const key = `${x},${y},${dimension},${depth}`;
    return zones.get(key);
  },

  getCurrentZone() {
    const currentZone = store.get('persistent.player.currentZone');
    if (!currentZone) return null;
    return this.getZone(currentZone.x, currentZone.y, currentZone.dimension, currentZone.depth);
  },

  getSpecialZones() {
    return store.get('persistent.specialZones');
  },

  isSpecialZone(x: number, y: number, dimension: string, depth = 0): boolean {
    const specialZones = store.get('persistent.specialZones');
    if (!specialZones) return false;
    const key = `${x},${y},${dimension},${depth}`;
    return specialZones.has(key);
  },

  getVisitedZones() {
    return store.get('persistent.player.visitedZones');
  },

  hasVisitedZone(x: number, y: number, dimension: string, depth = 0): boolean {
    const visitedZones = store.get('persistent.player.visitedZones');
    if (!visitedZones) return false;
    const key = `${x},${y},${dimension},${depth}`;
    return visitedZones.has(key);
  },

  // ==================== ENEMIES ====================

  getCurrentEnemies() {
    return store.get('session.enemies');
  },

  getDefeatedEnemies() {
    return store.get('persistent.defeatedEnemies');
  },

  isEnemyDefeated(x: number, y: number): boolean {
    const defeated = store.get('persistent.defeatedEnemies');
    if (!defeated) return false;
    const key = `${x},${y}`;
    return defeated.has(key);
  },

  // ==================== GRID ====================

  getCurrentGrid() {
    return store.get('session.currentGrid');
  },

  getTileAt(x: number, y: number) {
    const grid = store.get('session.currentGrid');
    if (!grid || !grid[y]) return null;
    return grid[y][x];
  },

  // ==================== GAME STATE ====================

  isGameStarted(): boolean {
    return store.get('session.gameStarted');
  },

  getCurrentRegion() {
    return store.get('persistent.currentRegion');
  },

  getMessageLog() {
    return store.get('persistent.messageLog');
  },

  getDialogueState() {
    return store.get('persistent.dialogueState');
  },

  getNpcDialogueIndex(npcKey: string): number {
    const dialogueState = store.get('persistent.dialogueState');
    return dialogueState ? dialogueState.get(npcKey) : 0;
  },

  // ==================== TRANSIENT STATE ====================

  isPendingCharge(): boolean {
    return store.get('transient.itemAbilities.pendingCharge');
  },

  isBombPlacementMode(): boolean {
    return store.get('transient.itemAbilities.bombPlacementMode');
  },

  getBombPositions() {
    return store.get('transient.itemAbilities.bombPositions');
  },

  getSignMessage() {
    return store.get('transient.interactions.signMessage');
  },

  getCurrentNpcPosition() {
    return store.get('transient.interactions.currentNpcPosition');
  },

  hasPlayerJustAttacked(): boolean {
    return store.get('transient.combat.playerJustAttacked');
  },

  isPlayerTurn(): boolean {
    return store.get('transient.turn.isPlayerTurn');
  },

  justLeftExitTile(): boolean {
    return store.get('transient.turn.justLeftExitTile');
  },

  justEnteredZone(): boolean {
    return store.get('transient.zoneTransition.justEnteredZone');
  },

  getLastExitSide() {
    return store.get('transient.zoneTransition.lastExitSide');
  },

  getPortTransitionData() {
    return store.get('transient.zoneTransition.portTransitionData');
  },

  isPitfallZoneActive(): boolean {
    return store.get('transient.zoneTransition.pitfallZoneActive');
  },

  isEntranceAnimationInProgress(): boolean {
    return store.get('transient.entrance.animationInProgress');
  },

  getTurnQueue() {
    return store.get('transient.turn.turnQueue');
  },

  // ==================== UI STATE ====================

  isStatsPanelOpen(): boolean {
    return store.get('ui.panels.statsOpen');
  },

  isConfigPanelOpen(): boolean {
    return store.get('ui.panels.configOpen');
  },

  isPreviewMode(): boolean {
    return store.get('ui.panels.previewMode');
  },

  isRadialMenuOpen(): boolean {
    return store.get('ui.radialMenu.open');
  },

  isShovelMode(): boolean {
    return store.get('ui.input.shovelMode');
  },

  getSettings() {
    return store.get('ui.settings');
  },

  isMusicEnabled(): boolean {
    return store.get('ui.settings.musicEnabled');
  },

  isSfxEnabled(): boolean {
    return store.get('ui.settings.sfxEnabled');
  },

  isVerboseAnimations(): boolean {
    return store.get('ui.settings.verboseAnimations');
  },

  // ==================== ZONE GENERATION ====================

  getZoneCounter(): number {
    return store.get('session.zoneGeneration.zoneCounter');
  },

  getEnemyCounter(): number {
    return store.get('session.zoneGeneration.enemyCounter');
  },

  getSpawnFlags() {
    return store.get('session.zoneGeneration.spawnFlags');
  },

  hasSpawned(flag: string): boolean {
    const flags = store.get('session.zoneGeneration.spawnFlags');
    return flags ? flags[flag] : false;
  },

  getSpawnZones() {
    return store.get('session.zoneGeneration.spawnZones');
  },

  // ==================== METADATA ====================

  getStateVersion(): number {
    return store.get('meta.version');
  },

  getLastSaved(): number | null {
    return store.get('meta.lastSaved');
  },

  getSaveCount(): number {
    return store.get('meta.saveCount');
  }
};

export default StateSelectors;
