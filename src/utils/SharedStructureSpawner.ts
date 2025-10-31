import { TILE_TYPES, GRID_SIZE } from '../core/constants/index.js';
import { logger } from '../core/logger.js';
import { isWithinGrid } from './GridUtils.js';

interface Position {
  x: number;
  y: number;
}

interface GridManager {
  getTile(x: number, y: number): number;
  setTile(x: number, y: number, value: number): void;
}

interface EnemyCollection {
  hasEnemyAt(x: number, y: number): boolean;
}

interface GameInstance {
  gridManager: GridManager;
  enemyCollection: EnemyCollection;
  [key: string]: any; // Allow additional properties for Game compatibility
}

/**
 * SharedStructureSpawner - Centralized logic for spawning multi-tile structures
 *
 * Eliminates code duplication for structure spawning (shacks, cisterns, etc.)
 * across consoleCommands.js and SpawnCommands.js
 *
 * @example
 * // Spawn a shack
 * SharedStructureSpawner.spawnShack(game);
 *
 * @example
 * // Spawn a cistern
 * SharedStructureSpawner.spawnCistern(game);
 */
export class SharedStructureSpawner {
  /**
   * Spawn a 3x3 shack with entrance at bottom-middle
   * @param game - Game instance with gridManager and enemyCollection
   * @returns True if shack was spawned successfully
   */
  static spawnShack(game: GameInstance): boolean {
    const pos = this.findShackSpawnPosition(game);
    if (!pos) {
      logger.log('No valid spawn position found for shack');
      return false;
    }

    // Place the 3x3 shack
    for (let dy = 0; dy < 3; dy++) {
      for (let dx = 0; dx < 3; dx++) {
        if (dy === 2 && dx === 1) { // Middle bottom tile
          game.gridManager.setTile(pos.x + dx, pos.y + dy, TILE_TYPES.PORT); // Entrance
        } else {
          game.gridManager.setTile(pos.x + dx, pos.y + dy, TILE_TYPES.SHACK);
        }
      }
    }

    logger.log('Spawned shack at', pos);
    return true;
  }

  /**
   * Spawn a 1x2 vertical cistern with entrance at top
   * @param game - Game instance with gridManager and enemyCollection
   * @returns True if cistern was spawned successfully
   */
  static spawnCistern(game: GameInstance): boolean {
    const pos = this.findCisternSpawnPosition(game);
    if (!pos) {
      logger.log('No valid spawn position found for cistern');
      return false;
    }

    // Place the 1x2 cistern
    game.gridManager.setTile(pos.x, pos.y, TILE_TYPES.PORT);    // Top part (entrance)
    game.gridManager.setTile(pos.x, pos.y + 1, TILE_TYPES.CISTERN); // Bottom part

    logger.log('Spawned cistern at', pos);
    return true;
  }

  // ==========================================
  // Position Finding
  // ==========================================

  /**
   * Find a valid position for a 3x3 shack + front space
   * @param game - Game instance
   * @returns Position or undefined if no valid position found
   */
  static findShackSpawnPosition(game: GameInstance): Position | undefined {
    const availablePositions: Position[] = [];

    // Scan the entire grid for available 3x3 areas with front space
    for (let y = 1; y < GRID_SIZE - 4; y++) { // Leave space for shack (3) + front (1) + border
      for (let x = 1; x < GRID_SIZE - 3; x++) {
        if (this.isValidShackPosition(game, x, y)) {
          availablePositions.push({ x, y });
        }
      }
    }

    if (availablePositions.length === 0) {
      return undefined; // No valid positions
    }

    // Pick a random available position
    const randomIndex = Math.floor(Math.random() * availablePositions.length);
    return availablePositions[randomIndex];
  }

  /**
   * Find a valid position for a 1x2 vertical cistern
   * @param game - Game instance
   * @returns Position or undefined if no valid position found
   */
  static findCisternSpawnPosition(game: GameInstance): Position | undefined {
    const availablePositions: Position[] = [];

    // Scan for available 1x2 vertical space
    for (let y = 1; y < GRID_SIZE - 2; y++) { // y from 1 to GRID_SIZE - 3
      for (let x = 1; x < GRID_SIZE - 1; x++) { // x from 1 to GRID_SIZE - 2
        if (this.isValidCisternPosition(game, x, y)) {
          availablePositions.push({ x, y });
        }
      }
    }

    if (availablePositions.length === 0) {
      return undefined;
    }

    const randomIndex = Math.floor(Math.random() * availablePositions.length);
    return availablePositions[randomIndex];
  }

  // ==========================================
  // Validation
  // ==========================================

  /**
   * Check if a 3x3 shack can be placed at position
   * @param game - Game instance
   * @param x - Top-left X coordinate
   * @param y - Top-left Y coordinate
   * @returns True if shack can be placed
   */
  static isValidShackPosition(game: GameInstance, x: number, y: number): boolean {
    // Check 3x3 area
    for (let dy = 0; dy < 3; dy++) {
      for (let dx = 0; dx < 3; dx++) {
        const tileX = x + dx;
        const tileY = y + dy;
        if (!isWithinGrid(tileX, tileY)) {
          return false;
        }
        const tile = game.gridManager.getTile(tileX, tileY);
        if (tile !== TILE_TYPES.FLOOR) {
          return false;
        }
        // Check if any enemy is at this position
        if (game.enemyCollection.hasEnemyAt(tileX, tileY)) {
          return false;
        }
      }
    }

    // Check front space (south of shack, middle)
    const frontX = x + 1;
    const frontY = y + 3;
    if (!isWithinGrid(frontX, frontY)) return false;
    const frontTile = game.gridManager.getTile(frontX, frontY);
    if (frontTile !== TILE_TYPES.FLOOR) {
      return false;
    }
    if (game.enemyCollection.hasEnemyAt(frontX, frontY)) {
      return false;
    }

    return true;
  }

  /**
   * Check if a 1x2 cistern can be placed at position
   * @param game - Game instance
   * @param x - Top X coordinate
   * @param y - Top Y coordinate
   * @returns True if cistern can be placed
   */
  static isValidCisternPosition(game: GameInstance, x: number, y: number): boolean {
    // Check 1x2 vertical area
    for (let dy = 0; dy < 2; dy++) {
      const tileX = x;
      const tileY = y + dy;
      if (!isWithinGrid(tileX, tileY)) {
        return false;
      }
      if (game.gridManager.getTile(tileX, tileY) !== TILE_TYPES.FLOOR) {
        return false;
      }
    }
    return true;
  }
}

export default SharedStructureSpawner;
