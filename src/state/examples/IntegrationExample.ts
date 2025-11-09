/**
 * Integration Example
 *
 * Shows how to integrate the new state management system
 * into the existing Chress game.
 */

import { store, StateActions, StateSelectors, persistence } from '../index';
import { EventBus } from '@core/EventBus';
import { EventTypes } from '@core/EventTypes';

// =============================================================================
// EXAMPLE 1: Game Initialization
// =============================================================================

export async function initializeGame() {
  console.log('🎮 Initializing game with centralized state...');

  // Check if saved game exists
  const hasSave = await persistence.hasSavedState();

  if (hasSave) {
    console.log('📦 Loading saved game...');
    const loaded = await persistence.load();

    if (loaded) {
      console.log('✅ Game loaded successfully!');

      // Restore UI state from loaded data
      const player = StateSelectors.getPlayer();
      console.log(`Player at (${player.position.x}, ${player.position.y})`);
      console.log(`Health: ${player.stats.health}/${player.stats.maxHealth}`);

      return true;
    }
  }

  console.log('🆕 Starting new game...');

  // Initialize new game state
  StateActions.startGame();
  StateActions.movePlayer(0, 0);
  StateActions.changeZone(0, 0, 'overworld', 0);

  return false;
}

// =============================================================================
// EXAMPLE 2: Player Movement
// =============================================================================

export function handlePlayerMove(targetX: number, targetY: number): void {
  // Get current position
  const currentPos = StateSelectors.getPlayerPosition();

  console.log(`Moving from (${currentPos.x}, ${currentPos.y}) to (${targetX}, ${targetY})`);

  // Update position in state
  StateActions.movePlayer(targetX, targetY);

  // Check if zone boundary crossed
  const grid = StateSelectors.getCurrentGrid();
  const GRID_SIZE = 16; // Example

  if (targetX >= GRID_SIZE || targetX < 0 || targetY >= GRID_SIZE || targetY < 0) {
    // Handle zone transition
    const currentZone = StateSelectors.getPlayerCurrentZone();
    const newX = targetX >= GRID_SIZE ? currentZone.x + 1 : targetX < 0 ? currentZone.x - 1 : currentZone.x;
    const newY = targetY >= GRID_SIZE ? currentZone.y + 1 : targetY < 0 ? currentZone.y - 1 : currentZone.y;

    handleZoneTransition(newX, newY, currentZone.dimension);
  }

  // Schedule autosave
  scheduleAutosave();
}

// =============================================================================
// EXAMPLE 3: Zone Transition
// =============================================================================

export function handleZoneTransition(newX: number, newY: number, dimension: string = 'overworld', depth: number = 0): void {
  console.log(`🌍 Transitioning to zone (${newX}, ${newY}, ${dimension}, ${depth})`);

  // Update zone
  StateActions.changeZone(newX, newY, dimension, depth);

  // Check if zone is already cached
  let zone = StateSelectors.getZone(newX, newY, dimension, depth);

  if (!zone) {
    console.log('🔨 Generating new zone...');

    // Generate zone (example)
    zone = generateZone(newX, newY, dimension, depth);

    // Cache it
    StateActions.cacheZone(newX, newY, dimension, depth, zone);
  } else {
    console.log('♻️ Loaded cached zone');
  }

  // Set as current grid
  StateActions.setCurrentGrid(zone.grid);

  // Load enemies for this zone
  StateActions.setEnemies(zone.enemies || []);

  // Reset transient state for new zone
  StateActions.resetTransient();

  // Save after zone change
  scheduleAutosave();
}

// =============================================================================
// EXAMPLE 4: Combat
// =============================================================================

export function handlePlayerAttack(enemyX: number, enemyY: number): void {
  console.log(`⚔️ Player attacks enemy at (${enemyX}, ${enemyY})`);

  // Mark player as having attacked
  StateActions.setPlayerAttacked(true);

  // Get enemy at position
  const enemies = StateSelectors.getCurrentEnemies();
  const enemyIndex = enemies.findIndex((e: { x: number; y: number }) => e.x === enemyX && e.y === enemyY);

  if (enemyIndex !== -1) {
    const enemy = enemies[enemyIndex];

    // Defeat enemy
    const currentZone = StateSelectors.getPlayerCurrentZone();
    StateActions.addDefeatedEnemy(
      currentZone.x * 16 + enemyX,
      currentZone.y * 16 + enemyY
    );

    // Remove from active enemies
    const updatedEnemies = enemies.filter((_: unknown, i: number) => i !== enemyIndex);
    StateActions.setEnemies(updatedEnemies);

    // Update consecutive kills
    const currentKills = StateSelectors.getPlayerStats().consecutiveKills;
    StateActions.updateConsecutiveKills(currentKills + 1);

    // Add points
    const currentPoints = StateSelectors.getPlayerStats().points;
    StateActions.updatePlayerStats({ points: currentPoints + 10 });

    console.log(`💀 Enemy defeated! Combo: ${currentKills + 1}`);
  }

  // Schedule autosave
  scheduleAutosave();
}

// =============================================================================
// EXAMPLE 5: Inventory Management
// =============================================================================

export function handleItemPickup(item: { type: string; name: string; grantsAbility?: string; [key: string]: unknown }): void {
  console.log(`📦 Picking up ${item.type}`);

  // Add to inventory
  StateActions.addToInventory(item);

  // If it's an ability item
  if (item.grantsAbility) {
    StateActions.addAbility(item.grantsAbility);
    console.log(`✨ Gained ability: ${item.grantsAbility}`);
  }

  // Update spawn flags if special item
  if (item.type === 'axe') {
    StateActions.setSpawnFlag('axeSpawned', true);
  }

  // Add message to log
  StateActions.addMessage(`Found ${item.name}!`);

  scheduleAutosave();
}

export function handleItemUse(itemIndex: number): void {
  const inventory = StateSelectors.getPlayerInventory();
  const item = inventory[itemIndex];

  if (!item) return;

  console.log(`🔧 Using ${item.type}`);

  // Use item effect
  if (item.type === 'health_potion') {
    const stats = StateSelectors.getPlayerStats();
    const newHealth = Math.min(stats.health + 50, stats.maxHealth);
    StateActions.updatePlayerStats({ health: newHealth });
  }

  // Remove consumable item
  if (item.consumable) {
    StateActions.removeFromInventory(itemIndex);
  }

  scheduleAutosave();
}

// =============================================================================
// EXAMPLE 6: UI State Management
// =============================================================================

export function toggleStatsPanel() {
  const isOpen = StateSelectors.isStatsPanelOpen();
  StateActions.toggleStatsPanel(!isOpen);

  console.log(`📊 Stats panel ${!isOpen ? 'opened' : 'closed'}`);
}

export function updateGameSettings(settings: Record<string, unknown>): void {
  StateActions.updateSettings(settings);

  // Apply settings immediately
  if (settings.hasOwnProperty('musicEnabled')) {
    if (settings.musicEnabled) {
      // Start music
    } else {
      // Stop music
    }
  }

  if (settings.hasOwnProperty('sfxEnabled')) {
    // Update SFX state
  }

  console.log('⚙️ Settings updated:', settings);
}

// =============================================================================
// EXAMPLE 7: Autosave
// =============================================================================

let autosaveTimeout: ReturnType<typeof setTimeout> | undefined;
let autosaveInterval: ReturnType<typeof setInterval> | undefined;

export function setupAutosave(): void {
  // Debounced autosave on state changes
  store.subscribe('persistent', () => {
    scheduleAutosave();
  });

  // Periodic autosave every 30 seconds
  autosaveInterval = setInterval(() => {
    console.log('⏰ Periodic autosave...');
    persistence.save();
  }, 30000);
}

function scheduleAutosave(): void {
  clearTimeout(autosaveTimeout);
  autosaveTimeout = setTimeout(async () => {
    console.log('💾 Autosaving...');
    const success = await persistence.save();
    if (success) {
      console.log('✅ Autosave complete');
    } else {
      console.error('❌ Autosave failed');
    }
  }, 2000);
}

export function cleanupAutosave(): void {
  clearTimeout(autosaveTimeout);
  clearInterval(autosaveInterval);
}

// =============================================================================
// EXAMPLE 8: Manual Save/Load
// =============================================================================

export async function saveGame() {
  console.log('💾 Saving game...');

  const success = await persistence.save();

  if (success) {
    const saveCount = StateSelectors.getSaveCount();
    console.log(`✅ Game saved! (Save #${saveCount})`);
    StateActions.addMessage('Game saved!');
    return true;
  } else {
    console.error('❌ Save failed!');
    StateActions.addMessage('Save failed!');
    return false;
  }
}

export async function loadGame() {
  console.log('📂 Loading game...');

  const success = await persistence.load();

  if (success) {
    console.log('✅ Game loaded!');

    // Restore game UI from loaded state
    const player = StateSelectors.getPlayer();
    const currentZone = StateSelectors.getPlayerCurrentZone();

    console.log(`Loaded: Player at (${player.position.x}, ${player.position.y})`);
    console.log(`Zone: (${currentZone.x}, ${currentZone.y}, ${currentZone.dimension})`);

    StateActions.addMessage('Game loaded!');
    return true;
  } else {
    console.error('❌ Load failed!');
    StateActions.addMessage('No saved game found!');
    return false;
  }
}

// =============================================================================
// EXAMPLE 9: Game Reset
// =============================================================================

export async function resetGame() {
  console.log('🔄 Resetting game...');

  // Clear saved state
  await persistence.clear();

  // Reset store
  StateActions.resetGame();

  // Reinitialize
  await initializeGame();

  console.log('✅ Game reset complete');
}

// =============================================================================
// EXAMPLE 10: State Debugging
// =============================================================================

export function debugState() {
  console.group('🐛 State Debug');

  // Print entire state
  store.debugPrint();

  // Get statistics
  const stats = store.getStats();
  console.log('Statistics:', stats);

  // Recent mutations
  const mutations = store.getMutations(10);
  console.log('Recent mutations:', mutations);

  // Player info
  const player = StateSelectors.getPlayer();
  console.log('Player:', player);

  // Current zone
  const zone = StateSelectors.getCurrentZone();
  console.log('Current zone:', zone);

  console.groupEnd();
}

// =============================================================================
// HELPER: Zone Generation (Example)
// =============================================================================

function generateZone(x: number, y: number, dimension: string, depth: number): {
  x: number;
  y: number;
  dimension: string;
  depth: number;
  grid: unknown[][];
  enemies: unknown[];
  generated: number;
} {
  // Example zone generation
  const grid = Array(16).fill(null).map(() =>
    Array(16).fill(null).map(() => ({ type: 'grass' }))
  );

  const enemies: unknown[] = [];

  // Increment zone counter
  StateActions.incrementZoneCounter();

  return {
    x,
    y,
    dimension,
    depth,
    grid,
    enemies,
    generated: Date.now()
  };
}

// =============================================================================
// USAGE EXAMPLE
// =============================================================================

/**
 * How to use in your game:
 *
 * // In game initialization:
 * import { initializeGame, setupAutosave } from './state/examples/IntegrationExample';
 *
 * async function startGame() {
 *   await initializeGame();
 *   setupAutosave();
 *   gameLoop();
 * }
 *
 * // In game loop:
 * import { handlePlayerMove, handlePlayerAttack } from './state/examples/IntegrationExample';
 *
 * function handleInput(input) {
 *   if (input.type === 'move') {
 *     handlePlayerMove(input.x, input.y);
 *   } else if (input.type === 'attack') {
 *     handlePlayerAttack(input.targetX, input.targetY);
 *   }
 * }
 *
 * // Access state for rendering:
 * import { StateSelectors } from './state/index';
 *
 * function render() {
 *   const player = StateSelectors.getPlayer();
 *   const grid = StateSelectors.getCurrentGrid();
 *   const enemies = StateSelectors.getCurrentEnemies();
 *
 *   // Render game...
 * }
 */
