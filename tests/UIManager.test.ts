import { UIManager } from '../src/ui/UIManager';
import { eventBus } from '@core/EventBus';
import { EventTypes } from '@core/EventTypes';
import { createMockGame, createMockPlayer, setupDOMFixture, teardownDOMFixture } from './helpers/mocks';

describe('UIManager', () => {
  let uiManager;
  let mockGame;
  let mockPlayer;

  beforeEach(() => {
    // Setup DOM
    setupDOMFixture();

    // Add specific UI elements that UIManager and its sub-managers use
    document.body.innerHTML += `
      <div class="player-points">
        <span class="points-value">0</span>
      </div>
      <div id="map-info"></div>
      <div id="messageOverlay"></div>
      <div id="barter-window"></div>
      <div id="statue-info-window"></div>
      <canvas id="zoneMap" width="100" height="100"></canvas>
      <div id="expandedMapOverlay">
        <canvas id="expandedMapCanvas" width="400" height="400"></canvas>
      </div>
      <div id="stats-panel-overlay"></div>
      <div id="records-overlay"></div>
    `;

    // Create mock player with additional methods
    mockPlayer = createMockPlayer({
      getPoints: vi.fn().mockReturnValue(100),
      getVisitedZones: vi.fn().mockReturnValue(new Set(['0,0,0', '1,0,0'])),
      getSpentDiscoveries: vi.fn().mockReturnValue(0),
      undergroundDepth: 1,
    });

    mockGame = createMockGame({ player: mockPlayer });

    // Mock canvas context for MiniMap
    const expandedCanvas = document.getElementById('expandedMapCanvas') as any;
    const zoneMapCanvas = document.getElementById('zoneMap') as any;
    const mockCtx = {
      canvas: expandedCanvas,
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      fillText: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
    };
    const zoneMapCtx = {
      canvas: zoneMapCanvas,
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      fillText: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
    };
    if (expandedCanvas) {
      expandedCanvas.getContext = vi.fn().mockReturnValue(mockCtx);
    }
    if (zoneMapCanvas) {
      zoneMapCanvas.getContext = vi.fn().mockReturnValue(zoneMapCtx);
    }

    // Add mapCtx to mockGame for MiniMap
    mockGame.mapCtx = zoneMapCtx;

    // Add specialZones for MiniMap
    mockGame.specialZones = new Set();

    // Add textureManager for MiniMap
    mockGame.textureManager = {
      getImage: vi.fn().mockReturnValue(null)
    };

    // Clear event bus
    (eventBus as any).clear?.() || (eventBus as any).offAll?.();

    // Create UIManager
    uiManager = new UIManager(mockGame);
  });

  afterEach(() => {
    teardownDOMFixture();
    // Clear event listeners
    (eventBus as any).clear?.() || (eventBus as any).offAll?.();
  });

  describe('Initialization', () => {
    test('should initialize all sub-managers', () => {
      expect(uiManager.messageManager).toBeDefined();
      expect(uiManager.panelManager).toBeDefined();
      expect(uiManager.playerStatsUI).toBeDefined();
      expect(uiManager.miniMap).toBeDefined();
      expect(uiManager.eventCoordinator).toBeDefined();
    });

    test('should set up event listeners', () => {
      const emitSpy = vi.spyOn(eventBus, 'emit');

      // Trigger PLAYER_STATS_CHANGED event
      eventBus.emit(EventTypes.PLAYER_STATS_CHANGED, {});

      // Should emit UI_UPDATE_STATS
      expect(emitSpy).toHaveBeenCalledWith(
        EventTypes.UI_UPDATE_STATS,
        expect.any(Object)
      );
    });
  });

  describe('Player Stats Updates', () => {
    test('should update points display when UI_UPDATE_STATS is emitted', () => {
      const pointsElement = document.querySelector('.player-points .points-value');

      // Emit stats update event
      eventBus.emit(EventTypes.UI_UPDATE_STATS, {});

      // Points should be updated
      expect(pointsElement?.textContent).toBe('100');
    });

    test('should update stats when player stats change', () => {
      const emitSpy = vi.spyOn(eventBus, 'emit');

      // Trigger player stats changed
      eventBus.emit(EventTypes.PLAYER_STATS_CHANGED, {});

      // Should trigger UI_UPDATE_STATS
      expect(emitSpy).toHaveBeenCalledWith(
        EventTypes.UI_UPDATE_STATS,
        expect.any(Object)
      );
    });

    test('should update stats when enemy is defeated', () => {
      const emitSpy = vi.spyOn(eventBus, 'emit');

      // Trigger enemy defeated
      eventBus.emit(EventTypes.ENEMY_DEFEATED, {
        enemyId: 'enemy123',
        points: 50,
      });

      // Should trigger UI_UPDATE_STATS
      expect(emitSpy).toHaveBeenCalledWith(
        EventTypes.UI_UPDATE_STATS,
        expect.any(Object)
      );
    });
  });

  describe('Treasure Found', () => {
    test('should add message to log when treasure is found', () => {
      const addMessageSpy = vi.spyOn(uiManager, 'addMessageToLog');

      // Trigger treasure found event
      eventBus.emit(EventTypes.TREASURE_FOUND, {
        message: 'Found a treasure chest!',
      });

      // Should add message
      expect(addMessageSpy).toHaveBeenCalledWith('Found a treasure chest!');
    });

    test('should update stats when treasure is found', () => {
      const emitSpy = vi.spyOn(eventBus, 'emit');

      // Trigger treasure found
      eventBus.emit(EventTypes.TREASURE_FOUND, {
        message: 'Found gold!',
      });

      // Should trigger UI_UPDATE_STATS
      expect(emitSpy).toHaveBeenCalledWith(
        EventTypes.UI_UPDATE_STATS,
        expect.any(Object)
      );
    });
  });

  describe('updatePlayerPosition', () => {
    test('should close barter window when player moves', () => {
      const hideSpy = vi.spyOn(uiManager.panelManager, 'hideBarterWindow');

      uiManager.updatePlayerPosition();

      expect(hideSpy).toHaveBeenCalled();
    });

    test('should close statue window when player moves', () => {
      const hideSpy = vi.spyOn(uiManager.panelManager, 'hideStatueInfoWindow');

      uiManager.updatePlayerPosition();

      expect(hideSpy).toHaveBeenCalled();
    });

    test('should respond to PLAYER_MOVED event', () => {
      const updateSpy = vi.spyOn(uiManager, 'updatePlayerPosition');

      eventBus.emit(EventTypes.PLAYER_MOVED, {});

      expect(updateSpy).toHaveBeenCalled();
    });
  });

  describe('updateZoneDisplay', () => {
    test('should render minimap when zone changes', () => {
      const renderSpy = vi.spyOn(uiManager.miniMap, 'renderZoneMap');

      uiManager.updateZoneDisplay();

      expect(renderSpy).toHaveBeenCalled();
    });

    test('should display "Museum" for zone (0,0) dimension 1', () => {
      mockPlayer.getCurrentZone.mockReturnValue({ x: 0, y: 0, dimension: 1 });

      uiManager.updateZoneDisplay();

      const mapInfo = document.getElementById('map-info');
      expect(mapInfo?.innerHTML).toContain("Museum");
    });

    test('should display underground depth info for dimension 2', () => {
      mockPlayer.getCurrentZone.mockReturnValue({ x: 3, y: 4, dimension: 2 });
      mockPlayer.undergroundDepth = 5;
      mockPlayer.getVisitedZones.mockReturnValue(new Set(['0,0,0', '1,0,0', '3,4,2']));
      mockPlayer.getSpentDiscoveries.mockReturnValue(1);

      uiManager.updateZoneDisplay();

      const mapInfo = document.getElementById('map-info');
      expect(mapInfo?.innerHTML).toContain('Z-5');
      expect(mapInfo?.innerHTML).toContain('3,4');
      expect(mapInfo?.innerHTML).toContain('DISCOVERIES: 2'); // 3 visited - 1 spent
    });

    test('should respond to ZONE_CHANGED event', () => {
      const updateSpy = vi.spyOn(uiManager, 'updateZoneDisplay');

      eventBus.emit(EventTypes.ZONE_CHANGED, {});

      expect(updateSpy).toHaveBeenCalled();
    });
  });

  describe('Game Reset', () => {
    test('should update UI on game reset', () => {
      const updatePositionSpy = vi.spyOn(uiManager, 'updatePlayerPosition');
      const updateZoneSpy = vi.spyOn(uiManager, 'updateZoneDisplay');
      const emitSpy = vi.spyOn(eventBus, 'emit');

      eventBus.emit(EventTypes.GAME_RESET, {});

      expect(updatePositionSpy).toHaveBeenCalled();
      expect(updateZoneSpy).toHaveBeenCalled();
      expect(emitSpy).toHaveBeenCalledWith(
        EventTypes.UI_UPDATE_STATS,
        expect.any(Object)
      );
    });
  });

  describe('Message Management', () => {
    test('should have addMessageToLog method', () => {
      expect(typeof uiManager.addMessageToLog).toBe('function');
    });

    test('should delegate to messageManager for adding messages', () => {
      if (uiManager.messageManager && uiManager.messageManager.addMessage) {
        const addSpy = vi.spyOn(uiManager.messageManager, 'addMessage');

        uiManager.addMessageToLog('Test message');

        expect(addSpy).toHaveBeenCalledWith('Test message');
      }
    });
  });

  describe('Integration with Sub-managers', () => {
    test('should have MessageManager instance', () => {
      expect(uiManager.messageManager).toBeDefined();
      expect(uiManager.messageManager.constructor.name).toBe('MessageManager');
    });

    test('should have PanelManager instance', () => {
      expect(uiManager.panelManager).toBeDefined();
      expect(uiManager.panelManager.constructor.name).toBe('PanelManager');
    });

    test('should have PlayerStatsUI instance', () => {
      expect(uiManager.playerStatsUI).toBeDefined();
      expect(uiManager.playerStatsUI.constructor.name).toBe('PlayerStatsUI');
    });

    test('should have MiniMap instance', () => {
      expect(uiManager.miniMap).toBeDefined();
      expect(uiManager.miniMap.constructor.name).toBe('MiniMap');
    });

    test('should have UIEventCoordinator instance', () => {
      expect(uiManager.eventCoordinator).toBeDefined();
      expect(uiManager.eventCoordinator.constructor.name).toBe('UIEventCoordinator');
    });
  });
});
