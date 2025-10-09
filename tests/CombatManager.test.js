import { CombatManager } from '../CombatManager.js';
import { GRID_SIZE, TILE_TYPES } from '../constants.js';

// Mock Game dependencies
jest.mock('../SoundManager.js');
jest.mock('../UIManager.js');

const mockSoundManager = {
  playSound: jest.fn()
};

const mockUIManager = {
  updatePlayerStats: jest.fn()
};

describe('CombatManager', () => {
  let combatManager;
  let mockGame;
  let mockPlayer;
  let mockEnemy;

  beforeEach(() => {
    mockPlayer = {
      x: 1,
      y: 1,
      getPosition: jest.fn().mockReturnValue({ x: 1, y: 1 }),
      takeDamage: jest.fn(),
      startBump: jest.fn(),
      getCurrentZone: jest.fn().mockReturnValue({ x: 0, y: 0, dimension: 0 }),
      isWalkable: jest.fn().mockReturnValue(true),
      setPosition: jest.fn()
    };

    mockEnemy = {
      x: 3,
      y: 3,
      planMoveTowards: jest.fn().mockReturnValue({ x: 2, y: 2 }),
      takeDamage: jest.fn(),
      startBump: jest.fn(),
      id: 'enemy1',
      attack: 1,
      justAttacked: false
    };

    mockGame = {
      player: mockPlayer,
      enemies: [mockEnemy],
      grid: Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(TILE_TYPES.FLOOR)),
      soundManager: mockSoundManager,
      uiManager: mockUIManager,
      zones: new Map(),
      defeatedEnemies: new Set(),
      explodeBomb: jest.fn()
    };

    combatManager = new CombatManager(mockGame);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('initializes with game reference', () => {
    expect(combatManager.game).toBe(mockGame);
  });

  test('handleEnemyMovements plans and executes enemy moves', () => {
    combatManager.handleEnemyMovements();

    expect(mockEnemy.planMoveTowards).toHaveBeenCalledWith(
      mockGame.player,
      mockGame.grid,
      mockGame.enemies,
      { x: 1, y: 1 }
    );
    expect(mockEnemy.x).toBe(2);
    expect(mockEnemy.y).toBe(2);
    expect(mockEnemy.liftFrames).toBe(15);
  });

  test('handleEnemyMovements prevents multiple enemies on same tile', () => {
    const mockEnemy2 = {
      x: 4,
      y: 4,
      planMoveTowards: jest.fn().mockReturnValue({ x: 2, y: 2 }), // Same position as enemy1
      takeDamage: jest.fn(),
      id: 'enemy2'
    };

    mockGame.enemies.push(mockEnemy2);

    combatManager.handleEnemyMovements();

    // Only first enemy moves to the conflicting position
    expect(mockEnemy.x).toBe(2);
    expect(mockEnemy.y).toBe(2);
    expect(mockEnemy2.x).toBe(4); // Second enemy stays in place
    expect(mockEnemy2.y).toBe(4);
  });

  test('checkCollisions handles enemy-player collision', () => {
    mockEnemy.x = 1;
    mockEnemy.y = 1; // Enemy at player's position

    combatManager.checkCollisions();

    expect(mockPlayer.takeDamage).toHaveBeenCalledWith(1);
    expect(mockGame.soundManager.playSound).toHaveBeenCalledWith('attack');
    expect(mockGame.enemies).toHaveLength(0);
  });

  test('checkCollisions removes enemy from zone data on defeat', () => {
    mockEnemy.x = 1;
    mockEnemy.y = 1;
    mockGame.zones.set('0,0:0', { enemies: [{ id: 'enemy1' }] });

    combatManager.checkCollisions();

    const zoneData = mockGame.zones.get('0,0:0');
    expect(zoneData.enemies).toHaveLength(0);
  });

  test('checkCollisions triggers bomb explosion when timer >= 2', () => {
    // Place bomb adjacent to player
    mockGame.grid[1][2] = { type: 'BOMB', actionTimer: 2 };

    combatManager.checkCollisions();

    expect(mockGame.explodeBomb).toHaveBeenCalledWith(2, 1);
  });

  test('performBishopSpearCharge damages enemy and moves player', () => {
    const item = { uses: 3 };
    const targetX = 3;
    const targetY = 3;

    combatManager.performBishopSpearCharge(item, targetX, targetY, mockEnemy, 1, 1);

    expect(item.uses).toBe(2);
    expect(mockPlayer.setPosition).toHaveBeenCalledWith(3, 3);
    expect(mockEnemy.takeDamage).toHaveBeenCalledWith(999);
    expect(mockGame.enemies).toHaveLength(0);
  });
});
