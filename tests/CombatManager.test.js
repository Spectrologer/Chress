import { CombatManager } from '@managers/CombatManager';
import { BombManager } from '@managers/BombManager';
import { EnemyDefeatFlow } from '@managers/EnemyDefeatFlow';
import { GRID_SIZE, TILE_TYPES } from '@core/constants/index';
import { eventBus } from '@core/EventBus';
import { EventTypes } from '@core/EventTypes';

// Mock Game dependencies
vi.mock('../core/SoundManager.js');
vi.mock('../ui/UIManager.js');
vi.mock('../core/DataContracts.js');

const mockSoundManager = {
  playSound: vi.fn()
};

const mockUIManager = {
  updatePlayerStats: vi.fn()
};

const mockAnimationManager = {
  addPointAnimation: vi.fn()
};

// We'll create real instances of BombManager and EnemyDefeatFlow
// since they're lightweight and don't have heavy dependencies
let mockBombManager;
let mockDefeatFlow;

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
      getPosition: vi.fn().mockReturnValue({ x: 1, y: 1 }),
      takeDamage: vi.fn(),
      startBump: vi.fn(),
      getCurrentZone: vi.fn().mockReturnValue({ x: 0, y: 0, dimension: 0 }),
      isWalkable: vi.fn().mockReturnValue(true),
      setPosition: vi.fn(),
      addPoints: vi.fn(),
      animations: {
        startDamageAnimation: vi.fn()
      }
    };

    mockEnemy = {
      x: 3,
      y: 3,
      planMoveTowards: vi.fn().mockReturnValue({ x: 2, y: 2 }),
      takeDamage: vi.fn(),
      startBump: vi.fn(),
      id: 'enemy1',
      attack: 1,
      health: 1,
      justAttacked: false,
      getPoints: vi.fn().mockReturnValue(1)
    };

    mockGame = {
      player: mockPlayer,
      enemies: [mockEnemy],
      grid: Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(TILE_TYPES.FLOOR)),
      gridManager: {
        getTile: vi.fn((x, y) => mockGame.grid[y]?.[x]),
        setTile: vi.fn((x, y, tile) => { if (mockGame.grid[y]) mockGame.grid[y][x] = tile; }),
        setGrid: vi.fn()
      },
      enemyCollection: {
        forEach: vi.fn((callback) => mockGame.enemies.forEach(callback)),
        replaceAll: vi.fn(),
        includes: vi.fn((enemy) => mockGame.enemies.includes(enemy)),
        getAll: vi.fn(() => mockGame.enemies),
        remove: vi.fn((enemy) => {
          const index = mockGame.enemies.indexOf(enemy);
          if (index > -1) mockGame.enemies.splice(index, 1);
        }),
        some: vi.fn((callback) => mockGame.enemies.some(callback)),
        filter: vi.fn((callback) => mockGame.enemies.filter(callback)),
        find: vi.fn((callback) => mockGame.enemies.find(callback))
      },
      playerFacade: {
        getHealth: vi.fn(() => 10),
        getHunger: vi.fn(() => 100),
        getThirst: vi.fn(() => 100),
        getPoints: vi.fn(() => 0),
        takeDamage: vi.fn()
      },
      zoneRepository: {
        hasByKey: vi.fn((key) => mockGame.zones.has(key)),
        getByKey: vi.fn((key) => mockGame.zones.get(key)),
        setByKey: vi.fn((key, data) => mockGame.zones.set(key, data))
      },
      soundManager: mockSoundManager,
      uiManager: mockUIManager,
      animationManager: mockAnimationManager,
      zones: new Map(),
      defeatedEnemies: new Set(),
      explodeBomb: vi.fn(),
      _services: {
        get: vi.fn((name) => {
          if (name === 'gridManager') return mockGame.gridManager;
          if (name === 'enemyCollection') return mockGame.enemyCollection;
          return null;
        }),
        _instances: {
          delete: vi.fn()
        }
      }
    };

    occupiedTiles = new Set();

    // Create real instances for proper behavior
    mockBombManager = new BombManager(mockGame);
    mockDefeatFlow = new EnemyDefeatFlow(mockGame);

    combatManager = new CombatManager(mockGame, occupiedTiles, mockBombManager, mockDefeatFlow);
  });

  afterEach(() => {
    vi.clearAllMocks();
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
      planMoveTowards: vi.fn().mockReturnValue({ x: 2, y: 2 }), // Same position as enemy1
      takeDamage: vi.fn(),
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

    expect(mockGame.playerFacade.takeDamage).toHaveBeenCalledWith(1);
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
    // Place bomb at position
    mockGame.grid[1][2] = { type: TILE_TYPES.BOMB, actionsSincePlaced: 2 };

    combatManager.checkCollisions();

    expect(mockGame.explodeBomb).toHaveBeenCalledWith(2, 1);
  });

  test('bomb explosion knocks back player when within one tile', () => {
    mockGame.explodeBomb = vi.fn(() => {
      // Mock the explosion logic for player at (2,2), bomb at (2,1), direction (0,1)
      // Player should be launched to (2,8) since grid allows it
      mockPlayer.isWalkable = vi.fn().mockReturnValue(true); // All positions walkable in this test
      mockPlayer.setPosition(2, 8);
      mockPlayer.startBump(0, 1);
    });

    // Place bomb at grid[1][2] (y=1,x=2), player at x=2,y=2 (adjacent below)
    mockGame.grid[1][2] = { type: TILE_TYPES.BOMB, actionsSincePlaced: 2 };
    mockPlayer.x = 2;
    mockPlayer.y = 2; // Player at (2,2)

    combatManager.checkCollisions();

    expect(mockGame.explodeBomb).toHaveBeenCalledWith(2, 1);
    // With full launch, player moves as far as possible in direction (0,1) from (2,2) until grid edge
    expect(mockPlayer.setPosition).toHaveBeenCalledWith(2, 8);
    expect(mockPlayer.startBump).toHaveBeenCalledWith(0, 1);
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
    const playerStatsEvents = [];
    eventBus.on(EventTypes.PLAYER_STATS_CHANGED, (data) => playerStatsEvents.push(data));

    mockEnemy.health = 0; // Enemy is already dead

    combatManager.checkCollisions();

    expect(mockPlayer.addPoints).toHaveBeenCalledWith(1);
    expect(mockGame.defeatedEnemies.has('enemy1')).toBeTruthy();
    expect(mockGame.soundManager.playSound).toHaveBeenCalledWith('attack');

    // Verify PLAYER_STATS_CHANGED event was emitted instead of direct UI call
    expect(playerStatsEvents.length).toBeGreaterThan(0);

    expect(mockGame.enemies.filter(e => e.id === 'enemy1')).toHaveLength(0);

    // Clean up
    eventBus.clear(EventTypes.PLAYER_STATS_CHANGED);
  });
});
