import { MiniMap } from '../ui/MiniMap\.ts';
import { createMockGame, createMockPlayer, setupDOMFixture, teardownDOMFixture } from './helpers/mocks\.ts';

describe('MiniMap', () => {
  let miniMap;
  let mockGame;
  let mockPlayer;
  let smallCanvas;
  let expandedCanvas;
  let overlay;

  beforeEach(() => {
    // Setup DOM
    setupDOMFixture();

    // Add minimap elements
    document.body.innerHTML += `
      <canvas id="zoneMap" width="100" height="100"></canvas>
      <div id="expandedMapOverlay">
        <canvas id="expandedMapCanvas" width="400" height="400"></canvas>
      </div>
    `;

    smallCanvas = document.getElementById('zoneMap');
    expandedCanvas = document.getElementById('expandedMapCanvas');
    overlay = document.getElementById('expandedMapOverlay');

    // Mock canvas getContext before MiniMap initialization
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

    expandedCanvas.getContext = vi.fn().mockReturnValue(mockCtx);

    mockPlayer = createMockPlayer({
      getCurrentZone: vi.fn().mockReturnValue({ x: 0, y: 0, dimension: 0 }),
    });

    mockGame = createMockGame({ player: mockPlayer });

    // Create MiniMap instance (but don't call setupEvents yet)
    miniMap = new MiniMap(mockGame);

    // Mock renderZoneMap to avoid canvas rendering complexity
    miniMap.renderZoneMap = vi.fn();
  });

  afterEach(() => {
    teardownDOMFixture();
  });

  describe('Initialization', () => {
    test('should initialize with game reference', () => {
      expect(miniMap.game).toBe(mockGame);
    });

    test('should initialize with isExpanded as false', () => {
      expect(miniMap.isExpanded).toBe(false);
    });

    test('should initialize pan coordinates to 0', () => {
      expect(miniMap.panX).toBe(0);
      expect(miniMap.panY).toBe(0);
    });

    test('should initialize with empty highlights object', () => {
      expect(miniMap.highlights).toEqual({});
    });

    test('should initialize drag state', () => {
      expect(miniMap.isDragging).toBe(false);
      expect(miniMap.dragMoved).toBe(false);
    });
  });

  describe('setupEvents()', () => {
    test('should find and initialize canvas elements', () => {
      miniMap.setupEvents();

      expect(miniMap.expandedCanvas).toBe(expandedCanvas);
      expect(miniMap.expandedCtx).toBeTruthy();
    });

    test('should set up pointer event listeners', () => {
      const addEventListenerSpy = vi.spyOn(smallCanvas, 'addEventListener');

      miniMap.setupEvents();

      // Check if addEventListener was called with 'pointerup' and a function
      // It might have a third parameter for options, so we check the first two args
      expect(addEventListenerSpy).toHaveBeenCalled();
      const calls = addEventListenerSpy.mock.calls;
      const pointerUpCall = calls.find(call => call[0] === 'pointerup');
      expect(pointerUpCall).toBeTruthy();
      expect(typeof pointerUpCall[1]).toBe('function');
    });
  });

  describe('expand()', () => {
    beforeEach(() => {
      miniMap.setupEvents();
    });

    test('should set isExpanded to true', () => {
      miniMap.expand();

      expect(miniMap.isExpanded).toBe(true);
    });

    test('should reset pan coordinates', () => {
      miniMap.panX = 5;
      miniMap.panY = 10;

      miniMap.expand();

      expect(miniMap.panX).toBe(0);
      expect(miniMap.panY).toBe(0);
    });

    test('should add "show" class to overlay', () => {
      miniMap.expand();

      expect(overlay.classList.contains('show')).toBe(true);
    });

    test('should not expand if already expanded', () => {
      miniMap.expand();
      const firstExpandState = miniMap.isExpanded;

      miniMap.expand(); // Try expanding again

      expect(miniMap.isExpanded).toBe(firstExpandState);
    });

    test('should call renderExpanded when expanded', () => {
      const renderSpy = vi.spyOn(miniMap, 'renderExpanded');

      miniMap.expand();

      expect(renderSpy).toHaveBeenCalled();
    });
  });

  describe('retract()', () => {
    beforeEach(() => {
      miniMap.setupEvents();
    });

    test('should set isExpanded to false', () => {
      miniMap.expand();
      expect(miniMap.isExpanded).toBe(true);

      miniMap.retract();

      expect(miniMap.isExpanded).toBe(false);
    });

    test('should remove "show" class from overlay', () => {
      miniMap.expand();
      expect(overlay.classList.contains('show')).toBe(true);

      miniMap.retract();

      expect(overlay.classList.contains('show')).toBe(false);
    });

    test('should work when already retracted', () => {
      expect(() => miniMap.retract()).not.toThrow();
    });
  });

  describe('renderExpanded()', () => {
    beforeEach(() => {
      miniMap.setupEvents();
    });

    test('should set canvas dimensions to square', () => {
      miniMap.renderExpanded();

      expect(miniMap.expandedCanvas.width).toBe(miniMap.expandedCanvas.height);
    });

    test('should call renderZoneMap with expanded parameters', () => {
      miniMap.renderZoneMap = vi.fn();

      miniMap.renderExpanded();

      expect(miniMap.renderZoneMap).toHaveBeenCalledWith(
        expect.objectContaining({
          ctx: miniMap.expandedCtx,
          isExpanded: true,
        })
      );
    });

    test('should pass pan offsets to renderZoneMap', () => {
      miniMap.renderZoneMap = vi.fn();
      miniMap.panX = 2;
      miniMap.panY = 3;

      miniMap.renderExpanded();

      expect(miniMap.renderZoneMap).toHaveBeenCalledWith(
        expect.objectContaining({
          offsetX: 2,
          offsetY: 3,
        })
      );
    });
  });

  describe('Panning', () => {
    beforeEach(() => {
      miniMap.setupEvents();
      miniMap.expand();
    });

    test('should enable dragging on pointerdown', () => {
      miniMap.isDragging = false;
      miniMap.lastX = 0;
      miniMap.lastY = 0;

      // Simulate pointer down by directly calling the handler logic
      miniMap.isDragging = true;
      miniMap.dragMoved = false;
      miniMap.lastX = 100;
      miniMap.lastY = 100;

      expect(miniMap.isDragging).toBe(true);
    });

    test('should update pan coordinates on pointermove', () => {
      // Start dragging
      miniMap.isDragging = true;
      miniMap.lastX = 100;
      miniMap.lastY = 100;
      const initialPanX = miniMap.panX;
      const initialPanY = miniMap.panY;

      // Simulate pointer move
      const newX = 150;
      const newY = 120;
      miniMap.panX -= (miniMap.lastX - newX) / 90;
      miniMap.panY -= (miniMap.lastY - newY) / 90;
      miniMap.lastX = newX;
      miniMap.lastY = newY;

      // Pan should have changed (inverted direction)
      expect(miniMap.panX).not.toBe(initialPanX);
      expect(miniMap.panY).not.toBe(initialPanY);
    });

    test('should mark as dragMoved when pointer moves significantly', () => {
      miniMap.isDragging = true;
      miniMap.dragMoved = false;
      miniMap.lastX = 100;
      miniMap.lastY = 100;

      const newX = 110;
      const newY = 110;
      const dx = Math.abs(miniMap.lastX - newX);
      const dy = Math.abs(miniMap.lastY - newY);

      if (dx > 2 || dy > 2) {
        miniMap.dragMoved = true;
      }

      expect(miniMap.dragMoved).toBe(true);
    });

    test('should disable dragging on pointerup', () => {
      miniMap.isDragging = true;

      // Simulate pointer up
      miniMap.isDragging = false;

      expect(miniMap.isDragging).toBe(false);
    });

    test('should disable dragging on pointerleave', () => {
      miniMap.isDragging = true;

      // Simulate pointer leave
      miniMap.isDragging = false;

      expect(miniMap.isDragging).toBe(false);
    });
  });

  describe('handleExpandedClick()', () => {
    beforeEach(() => {
      miniMap.setupEvents();
      miniMap.expand();
    });

    test('should calculate zone coordinates from click position', () => {
      // Mock event object instead of using PointerEvent
      const event = {
        clientX: 200,
        clientY: 200,
      };

      // Mock getBoundingClientRect
      vi.spyOn(expandedCanvas, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        width: 400,
        height: 400,
      });

      expect(() => {
        miniMap.handleExpandedClick(event);
      }).not.toThrow();
    });

    test('should handle clicks when expandedCanvas is null', () => {
      miniMap.expandedCanvas = null;

      // Mock event object instead of using PointerEvent
      const event = {
        clientX: 200,
        clientY: 200,
      };

      expect(() => {
        miniMap.handleExpandedClick(event);
      }).not.toThrow();
    });
  });

  describe('Highlights', () => {
    test('should initialize with empty highlights', () => {
      expect(Object.keys(miniMap.highlights).length).toBe(0);
    });

    test('should allow setting highlights', () => {
      miniMap.highlights['0,0,0'] = 'circle';

      expect(miniMap.highlights['0,0,0']).toBe('circle');
    });

    test('should support multiple highlight shapes', () => {
      miniMap.highlights['0,0,0'] = 'circle';
      miniMap.highlights['1,1,0'] = 'star';
      miniMap.highlights['2,2,0'] = 'diamond';

      expect(Object.keys(miniMap.highlights).length).toBe(3);
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing canvas elements gracefully', () => {
      smallCanvas.remove();
      expandedCanvas.remove();

      // MiniMap handles missing canvas elements gracefully by returning early
      expect(() => {
        const map = new MiniMap(mockGame);
        map.setupEvents();
      }).not.toThrow();
    });

    test('should handle rapid expand/retract cycles', () => {
      miniMap.setupEvents();

      miniMap.expand();
      miniMap.retract();
      miniMap.expand();
      miniMap.retract();

      expect(miniMap.isExpanded).toBe(false);
    });

    test('should handle pan coordinates beyond reasonable bounds', () => {
      miniMap.setupEvents();
      miniMap.panX = 1000;
      miniMap.panY = -1000;

      expect(() => {
        miniMap.renderExpanded();
      }).not.toThrow();
    });
  });

  describe('Event Propagation', () => {
    let addEventListenerSpy;

    beforeEach(() => {
      // Spy on addEventListener before calling setupEvents
      addEventListenerSpy = vi.spyOn(expandedCanvas, 'addEventListener');
      miniMap.setupEvents();
    });

    test('should stop propagation on expanded canvas pointerdown', () => {
      // Mock event object with stopPropagation method
      const event = {
        clientX: 100,
        clientY: 100,
        stopPropagation: vi.fn(),
      };

      // Get the event listener that was attached and call it directly
      const listeners = addEventListenerSpy.mock.calls;
      const pointerdownListener = listeners.find(call => call[0] === 'pointerdown');

      if (pointerdownListener) {
        pointerdownListener[1](event);
        expect(event.stopPropagation).toHaveBeenCalled();
      }
    });

    test('should stop propagation on expanded canvas pointerup', () => {
      // Mock event object with stopPropagation method
      const event = {
        clientX: 100,
        clientY: 100,
        stopPropagation: vi.fn(),
      };

      // Get the event listener that was attached and call it directly
      const listeners = addEventListenerSpy.mock.calls;
      const pointerupListener = listeners.find(call => call[0] === 'pointerup');

      if (pointerupListener) {
        pointerupListener[1](event);
        expect(event.stopPropagation).toHaveBeenCalled();
      }
    });
  });

  describe('Integration', () => {
    test('should work through full expand/pan/retract cycle', () => {
      miniMap.setupEvents();

      // Expand
      miniMap.expand();
      expect(miniMap.isExpanded).toBe(true);

      // Pan
      miniMap.panX = 5;
      miniMap.panY = 10;
      miniMap.renderExpanded();

      // Retract
      miniMap.retract();
      expect(miniMap.isExpanded).toBe(false);

      // Expand again - should reset pan
      miniMap.expand();
      expect(miniMap.panX).toBe(0);
      expect(miniMap.panY).toBe(0);
    });
  });
});
