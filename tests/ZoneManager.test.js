import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { ZoneManager } from '@managers/ZoneManager';
import { TILE_TYPES, GRID_SIZE } from '@core/constants/index';
import { eventBus } from '@core/EventBus';
import { EventTypes } from '@core/EventTypes';

describe('ZoneManager', () => {
  let zoneManager;
  let mockGame;
  let mockPlayer;
  let mockUIManager;
  let mockZoneGenerator;
  let mockGrid;

  beforeEach(() => {
    mockPlayer = {
      getCurrentZone: vi.fn().mockReturnValue({ x: 0, y: 0, dimension: 0 }),
      setCurrentZone: vi.fn(),
      onZoneTransition: vi.fn(),
      getPosition: vi.fn().mockReturnValue({ x: 1, y: 1 }),
      ensureValidPosition: vi.fn(),
      setPosition: vi.fn(),
      setLastPosition: vi.fn(),
      getZoneDimension: vi.fn().mockReturnValue(0),
      currentZone: { x: 0, y: 0, dimension: 0 }
    };

    mockUIManager = {
      generateRegionName: vi.fn().mockReturnValue('Forest'),
      showRegionNotification: vi.fn(),
      updateZoneDisplay: vi.fn(),
      updatePlayerPosition: vi.fn(),
      updatePlayerStats: vi.fn(),
      addMessageToLog: vi.fn()
    };

    mockZoneGenerator = {
      clearPathToExit: vi.fn()
    };

    mockGrid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(TILE_TYPES.FLOOR));

    mockGame = {
      player: mockPlayer,
      playerFacade: mockPlayer,  // Add playerFacade reference
      uiManager: mockUIManager,
      zoneGenerator: mockZoneGenerator,
      justEnteredZone: false,
      lastSignMessage: null,
      displayingMessageForSign: null,
      currentRegion: 'Forest',
      specialZones: new Map(),
      zones: new Map(),
      connectionManager: { generateChunkConnections: vi.fn() },
      availableFoodAssets: [],
      defeatedEnemies: new Set(),
      grid: mockGrid,
      generateZone: vi.fn(),
      spawnTreasuresOnGrid: vi.fn(),
      gameStateManager: { saveGameState: vi.fn() },
      transientGameState: {
        clearLastSignMessage: vi.fn(),
        clearDisplayingSignMessage: vi.fn(),
        getPortTransitionData: vi.fn().mockReturnValue(null),
        clearPortTransitionData: vi.fn(),
        exitPitfallZone: vi.fn(),
        enterPitfallZone: vi.fn(),
        setDisplayingSignMessage: vi.fn(),
        clearCurrentNPCPosition: vi.fn(),
        isDisplayingSignMessage: vi.fn().mockReturnValue(false)
      },
      gridManager: {
        setTile: vi.fn(),
        getTile: vi.fn((x, y) => mockGrid[y] && mockGrid[y][x]),
        isTileType: vi.fn((x, y, type) => {
          const tile = mockGrid[y] && mockGrid[y][x];
          return tile === type;
        }),
        findFirst: vi.fn(() => null)
      },
      zoneRepository: {
        getByKey: vi.fn().mockReturnValue(null)
      }
    };

    zoneManager = new ZoneManager(mockGame);
  });

  afterEach(() => {
    vi.clearAllMocks();
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

    test('emits zone changed and player moved events', () => {
      const zoneChangedEvents = [];
      const playerMovedEvents = [];

      // Listen for events
      eventBus.on(EventTypes.ZONE_CHANGED, (data) => zoneChangedEvents.push(data));
      eventBus.on(EventTypes.PLAYER_MOVED, (data) => playerMovedEvents.push(data));

      zoneManager.transitionToZone(1, 0, 'right', 1, 0);

      // Verify ZONE_CHANGED event was emitted
      expect(zoneChangedEvents.length).toBeGreaterThan(0);
      expect(zoneChangedEvents[0].x).toBe(1);
      expect(zoneChangedEvents[0].y).toBe(0);
      expect(zoneChangedEvents[0].dimension).toBe(0);

      // Verify PLAYER_MOVED event was emitted
      expect(playerMovedEvents.length).toBeGreaterThan(0);

      // Clean up listeners
      eventBus.clear(EventTypes.ZONE_CHANGED);
      eventBus.clear(EventTypes.PLAYER_MOVED);
    });

    test('saves game state', () => {
      zoneManager.transitionToZone(1, 0, 'right', 1, 0);

      expect(mockGame.gameStateManager.saveGameState).toHaveBeenCalled();
    });
  });

  describe('positionPlayerAfterTransition', () => {
    test('positions from bottom exit at top', () => {
      zoneManager.transitionCoordinator.positionPlayerAfterTransition('bottom', 2, 8);

      expect(mockPlayer.setPosition).toHaveBeenCalledWith(2, 0);
      expect(mockZoneGenerator.clearPathToExit).toHaveBeenCalledWith(2, 0);
      expect(mockGame.gridManager.setTile).toHaveBeenCalledWith(2, 0, TILE_TYPES.EXIT);
    });

    test('positions from top exit at bottom', () => {
      zoneManager.transitionCoordinator.positionPlayerAfterTransition('top', 3, 0);

      expect(mockPlayer.setPosition).toHaveBeenCalledWith(3, 8);
      expect(mockZoneGenerator.clearPathToExit).toHaveBeenCalledWith(3, 8);
      expect(mockGame.gridManager.setTile).toHaveBeenCalledWith(3, 8, TILE_TYPES.EXIT);
    });

    test('positions from teleport in center', () => {
      zoneManager.transitionCoordinator.positionPlayerAfterTransition('teleport', 0, 0);

      expect(mockPlayer.setPosition).toHaveBeenCalledWith(4, 4);
    });

    test('positions at PORT tile', () => {
      // Mock gridManager methods for port handling
      mockGame.gridManager.getTile = vi.fn().mockReturnValue(null);
      mockGame.gridManager.isTileType = vi.fn((x, y, type) => {
        return x === 5 && y === 5 && type === TILE_TYPES.PORT;
      });
      mockGame.gridManager.findFirst = vi.fn((predicate) => {
        // Simulate finding a PORT tile at position (5, 5)
        const tile = TILE_TYPES.PORT;
        if (predicate(tile)) {
          return { x: 5, y: 5 };
        }
        return null;
      });

      zoneManager.transitionCoordinator.positionPlayerAfterTransition('port', 0, 0);

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
          if (mockGrid[y][x] === TILE_TYPES.BOMB) {
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