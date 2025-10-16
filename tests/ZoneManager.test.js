import { ZoneManager } from '../managers/ZoneManager.js';
import { TILE_TYPES, GRID_SIZE } from '../core/constants.js';

describe('ZoneManager', () => {
  let zoneManager;
  let mockGame;
  let mockPlayer;
  let mockUIManager;
  let mockZoneGenerator;

  beforeEach(() => {
    mockPlayer = {
      getCurrentZone: jest.fn().mockReturnValue({ x: 0, y: 0, dimension: 0 }),
      setCurrentZone: jest.fn(),
      onZoneTransition: jest.fn(),
      getPosition: jest.fn().mockReturnValue({ x: 1, y: 1 }),
      ensureValidPosition: jest.fn(),
      setPosition: jest.fn(),
      currentZone: { x: 0, y: 0, dimension: 0 }
    };

    mockUIManager = {
      generateRegionName: jest.fn().mockReturnValue('Forest'),
      showRegionNotification: jest.fn(),
      updateZoneDisplay: jest.fn(),
      updatePlayerPosition: jest.fn(),
      updatePlayerStats: jest.fn(),
      addMessageToLog: jest.fn()
    };

    mockZoneGenerator = {
      clearPathToExit: jest.fn()
    };

    mockGame = {
      player: mockPlayer,
      uiManager: mockUIManager,
      zoneGenerator: mockZoneGenerator,
      justEnteredZone: false,
      lastSignMessage: null,
      displayingMessageForSign: null,
      currentRegion: 'Forest',
      specialZones: new Map(),
      zones: new Map(),
      connectionManager: { generateChunkConnections: jest.fn() },
      availableFoodAssets: [],
      defeatedEnemies: new Set(),
      grid: Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(TILE_TYPES.FLOOR)),
      generateZone: jest.fn(),
      spawnTreasuresOnGrid: jest.fn(),
      gameStateManager: { saveGameState: jest.fn() }
    };

    zoneManager = new ZoneManager(mockGame);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('transitionToZone', () => {
    test('marks player as just entered zone', () => {
      zoneManager.transitionToZone(1, 0, 'right', 1, 0);

      expect(mockGame.justEnteredZone).toBe(true);
    });

    test('updates player zone', () => {
      zoneManager.transitionToZone(1, 0, 'right', 1, 0);

      expect(mockPlayer.setCurrentZone).toHaveBeenCalledWith(1, 0);
    });

    test('shows region notification for new region', () => {
      mockUIManager.generateRegionName.mockReturnValue('Desert');

      zoneManager.transitionToZone(1, 0, 'right', 1, 0);

      expect(mockUIManager.showRegionNotification).toHaveBeenCalledWith(1, 0);
      expect(mockGame.currentRegion).toBe('Desert');
    });

    test('does not show notification for same region', () => {
      zoneManager.transitionToZone(1, 0, 'right', 1, 0);

      expect(mockUIManager.showRegionNotification).not.toHaveBeenCalled();
    });

    test('calls player zone transition', () => {
      zoneManager.transitionToZone(1, 0, 'right', 1, 0);

      expect(mockPlayer.onZoneTransition).toHaveBeenCalled();
    });

    test('generates new zone', () => {
      zoneManager.transitionToZone(1, 0, 'right', 1, 0);

      expect(mockGame.generateZone).toHaveBeenCalled();
    });

    test('positions player based on exit side', () => {
      zoneManager.transitionToZone(1, 0, 'right', 1, 0);

      expect(mockPlayer.setPosition).toHaveBeenLastCalledWith(0, 0);
      expect(mockZoneGenerator.clearPathToExit).toHaveBeenCalledWith(0, 0);
    });

    test('spawns treasures for special zones', () => {
      mockGame.specialZones.set('1,0', [TILE_TYPES.BOMB]);

      zoneManager.transitionToZone(1, 0, 'right', 1, 0);

      expect(mockGame.spawnTreasuresOnGrid).toHaveBeenCalledWith([TILE_TYPES.BOMB]);
      expect(mockGame.specialZones.has('1,0')).toBe(false);
    });

    test('updates UI elements', () => {
      zoneManager.transitionToZone(1, 0, 'right', 1, 0);

      expect(mockUIManager.updateZoneDisplay).toHaveBeenCalled();
      expect(mockUIManager.updatePlayerPosition).toHaveBeenCalled();
      expect(mockUIManager.updatePlayerStats).toHaveBeenCalled();
    });

    test('saves game state', () => {
      zoneManager.transitionToZone(1, 0, 'right', 1, 0);

      expect(mockGame.gameStateManager.saveGameState).toHaveBeenCalled();
    });
  });

  describe('positionPlayerAfterTransition', () => {
    test('positions from bottom exit at top', () => {
      zoneManager.positionPlayerAfterTransition('bottom', 2, 8);

      expect(mockPlayer.setPosition).toHaveBeenCalledWith(2, 0);
      expect(mockZoneGenerator.clearPathToExit).toHaveBeenCalledWith(2, 0);
      expect(mockGame.grid[0][2]).toBe(TILE_TYPES.EXIT);
    });

    test('positions from top exit at bottom', () => {
      zoneManager.positionPlayerAfterTransition('top', 3, 0);

      expect(mockPlayer.setPosition).toHaveBeenCalledWith(3, 8);
      expect(mockZoneGenerator.clearPathToExit).toHaveBeenCalledWith(3, 8);
      expect(mockGame.grid[8][3]).toBe(TILE_TYPES.EXIT);
    });

    test('positions from teleport in center', () => {
      zoneManager.positionPlayerAfterTransition('teleport', 0, 0);

      expect(mockPlayer.setPosition).toHaveBeenCalledWith(4, 4);
    });

    test('positions at PORT tile', () => {
      mockGame.grid[5][5] = TILE_TYPES.PORT;

      zoneManager.positionPlayerAfterTransition('port', 0, 0);

      expect(mockPlayer.setPosition).toHaveBeenCalledWith(5, 5);
    });
  });

  describe('spawnTreasuresOnGrid', () => {
    test('spawns treasures on valid floor tiles', () => {
      const treasures = [TILE_TYPES.BOMB];

      zoneManager.spawnTreasuresOnGrid(treasures);

      // Find placed treasure
      let treasurePlaced = false;
      for (let y = 1; y < GRID_SIZE - 1; y++) {
        for (let x = 1; x < GRID_SIZE - 1; x++) {
          if (mockGame.grid[y][x] === TILE_TYPES.BOMB) {
            treasurePlaced = true;
            break;
          }
        }
      }

      expect(treasurePlaced).toBe(true);
      expect(mockUIManager.addMessageToLog).toHaveBeenCalledWith('Treasures found scattered throughout the zone!');
    });
  });
});
