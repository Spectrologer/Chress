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
  let occupiedTiles;
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
      setPosition: jest.fn(),
      addPoints: jest.fn()
    };

    mockEnemy = {
      x: 3,
      y: 3,
      planMoveTowards: jest.fn().mockReturnValue({ x: 2, y: 2 }),
      takeDamage: jest.fn(),
      startBump: jest.fn(),
      id: 'enemy1',
      attack: 1,
      health: 1,
      justAttacked: false,
      getPoints: jest.fn().mockReturnValue(1)
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

    occupiedTiles = new Set();
    combatManager = new CombatManager(mockGame, occupiedTiles);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('initializes with game reference', () => {
    expect(combatManager.game).toBe(mockGame);
  });

  test('handleSingleEnemyMovement plans and executes a single enemy move', () => {
    occupiedTiles.add(`${mockPlayer.x},${mockPlayer.y}`);

    combatManager.handleSingleEnemyMovement(mockEnemy);

    expect(mockEnemy.planMoveTowards).toHaveBeenCalledWith(
      mockGame.player,
      mockGame.grid,
      mockGame.enemies,
      { x: 1, y: 1 },
      false, mockGame
    );
    expect(mockEnemy.x).toBe(2);
    expect(mockEnemy.y).toBe(2);
    expect(mockEnemy.liftFrames).toBe(15);
  });

  test('handleSingleEnemyMovement prevents moving to an occupied tile', () => {
    const mockEnemy2 = {
      x: 4,
      y: 4,
      planMoveTowards: jest.fn().mockReturnValue({ x: 2, y: 2 }), // Same position as enemy1
      takeDamage: jest.fn(),
      id: 'enemy2'
    };

    occupiedTiles.add('2,2'); // Pretend the first enemy already claimed this tile
    mockGame.enemies.push(mockEnemy2);

    combatManager.handleSingleEnemyMovement(mockEnemy2);

    // The second enemy should not move because the tile is occupied
    expect(mockEnemy2.planMoveTowards).toHaveBeenCalled();
    expect(mockEnemy2.x).toBe(4);
    expect(mockEnemy2.y).toBe(4);
  });

  test('checkCollisions handles enemy-player collision', () => {
    mockEnemy.x = 1;
    mockEnemy.y = 1; // Enemy at player's position
    mockEnemy.justAttacked = false;

    combatManager.checkCollisions();

    expect(mockPlayer.takeDamage).toHaveBeenCalledWith(1);
    expect(mockGame.soundManager.playSound).toHaveBeenCalledWith('attack');
    expect(mockGame.enemies.filter(e => e.id !== 'enemy1')).toHaveLength(0);
  });

  test('checkCollisions removes enemy from zone data on defeat', () => {
    mockEnemy.x = 1;
    mockEnemy.y = 1;
    mockGame.zones.set('0,0:0', { enemies: [{ id: 'enemy1' }] });
    mockEnemy.justAttacked = false;

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
    expect(mockPlayer.addPoints).toHaveBeenCalledWith(1);
    expect(mockEnemy.takeDamage).toHaveBeenCalledWith(999);
    expect(mockGame.enemies.filter(e => e.id !== 'enemy1')).toHaveLength(0);
  });

  test('checkCollisions does not damage player if enemy just attacked', () => {
    mockEnemy.x = 1;
    mockEnemy.y = 1; // Enemy at player's position
    mockEnemy.justAttacked = true; // This enemy already attacked this turn

    combatManager.checkCollisions();

    // Player should not take damage, and enemy should not be removed
    expect(mockPlayer.takeDamage).not.toHaveBeenCalled();
    expect(mockGame.soundManager.playSound).not.toHaveBeenCalledWith('attack');
    expect(mockGame.enemies).toHaveLength(1);
  });

  test('checkCollisions awards points and removes dead enemies', () => {
    mockEnemy.health = 0; // Enemy is already dead

    combatManager.checkCollisions();

    expect(mockPlayer.addPoints).toHaveBeenCalledWith(1);
    expect(mockGame.defeatedEnemies.has('0,0,3,3')).toBeTruthy();
    expect(mockGame.soundManager.playSound).toHaveBeenCalledWith('attack');
    expect(mockUIManager.updatePlayerStats).toHaveBeenCalled();
    expect(mockGame.enemies.filter(e => e.id === 'enemy1')).toHaveLength(0);
  });
});
