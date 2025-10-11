import { Player } from '../entities/Player.js';
import { GRID_SIZE, TILE_TYPES } from '../core/constants.js';

// Mock window and game dependencies
const mockGameInstance = {
  incrementBombActions: jest.fn(),
  explodeBomb: jest.fn()
};

const mockSoundManager = {
  playSound: jest.fn()
};

global.window = {
  gameInstance: mockGameInstance,
  soundManager: mockSoundManager
};

describe('Player', () => {
  let player;
  let grid;

  beforeEach(() => {
    jest.clearAllMocks();
    player = new Player();
    // Create a 9x9 grid filled with FLOOR tiles
    grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(TILE_TYPES.FLOOR));
  });

  test('initializes with default values', () => {
    expect(player.x).toBe(1);
    expect(player.y).toBe(1);
    expect(player.getHealth()).toBe(3);
    expect(player.getHunger()).toBe(50);
    expect(player.getThirst()).toBe(50);
  });

  test('move updates position', () => {
    player.move(2, 2, grid);
    expect(player.x).toBe(2);
    expect(player.y).toBe(2);
  });

  test('move respects grid boundaries', () => {
    player.move(GRID_SIZE, GRID_SIZE, grid);
    expect(player.x).toBe(1);
    expect(player.y).toBe(1);
  });

  test('takeDamage reduces health', () => {
    const initialHealth = player.getHealth();
    player.takeDamage(1);
    expect(player.getHealth()).toBe(initialHealth - 1);
  });

  test('decreaseHunger reduces hunger', () => {
    const initialHunger = player.getHunger();
    player.decreaseHunger(10);
    expect(player.getHunger()).toBe(initialHunger - 10);
  });

  test('decreaseThirst reduces thirst', () => {
    const initialThirst = player.getThirst();
    player.decreaseThirst(10);
    expect(player.getThirst()).toBe(initialThirst - 10);
  });

  test('restoreHunger increases hunger', () => {
    player.decreaseHunger(20);
    player.restoreHunger(10);
    expect(player.getHunger()).toBe(40); // 50 -> 30 -> 40
  });

  test('isDead returns true when health is 0', () => {
    player.setHealth(0);
    expect(player.isDead()).toBe(true);
  });

  test('markZoneVisited tracks visited zones', () => {
    expect(player.hasVisitedZone(0, 0)).toBe(true); // Initial zone
    player.markZoneVisited(5, 6);
    expect(player.hasVisitedZone(5, 6)).toBe(true);
    expect(player.hasVisitedZone(1, 1)).toBe(false);
  });

  test('getValidSpawnPosition finds valid position', () => {
    const mockGame = {
      grid,
      enemies: [] // No enemies
    };

    const spawn = player.getValidSpawnPosition(mockGame);
    expect(spawn).toBeDefined();
    expect(spawn.x).toBeGreaterThanOrEqual(0);
    expect(spawn.x).toBeLessThan(GRID_SIZE);
    expect(spawn.y).toBeGreaterThanOrEqual(0);
    expect(spawn.y).toBeLessThan(GRID_SIZE);
  });

  test('pickup water restores thirst when inventory full', () => {
    // Fill inventory to max
    player.inventory = new Array(6).fill({type: 'test'});

    player.move(1, 1, grid); // This shouldn't pick up anything yet

    // Set a water tile
    grid[1][1] = TILE_TYPES.WATER;
    player.move(1, 1, grid); // This should consume water directly

    expect(player.getThirst()).toBe(50); // Should be restored
  });
});
