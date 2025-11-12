import { MiniMap } from '@ui/MiniMap';

describe('MiniMap highlights cycling', () => {
  let miniMap;
  const currentZone = { x: 10, y: 20, dimension: 0 };

  beforeEach(() => {
    const mockGame = {
      playerFacade: {
        getCurrentZone: () => ({ ...currentZone })
      }
    };

    miniMap = new MiniMap(mockGame);

    // Provide a fake expanded canvas with predictable size and bounding rect
    miniMap.expandedCanvas = {
      width: 600,
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 600, height: 600 })
    };

    // Avoid running real render code during these unit tests
    miniMap.renderExpanded = vi.fn();
    miniMap.renderZoneMap = vi.fn();

    // Ensure pan is zero so clicks map to center tile
    miniMap.panX = 0;
    miniMap.panY = 0;
    miniMap.viewZOffset = 0;
  });

  test('cycles through shapes in expected order and then clears', () => {
    const centerClick = { clientX: 300, clientY: 300 };
    const key = `${currentZone.x},${currentZone.y},${currentZone.dimension}`;

    // First click -> circle
    miniMap.handleExpandedClick(centerClick);
    expect(miniMap.highlights[key]).toBe('circle');

    // Second click -> triangle
    miniMap.handleExpandedClick(centerClick);
    expect(miniMap.highlights[key]).toBe('triangle');

    // Third click -> star
    miniMap.handleExpandedClick(centerClick);
    expect(miniMap.highlights[key]).toBe('star');

    // Fourth click -> diamond
    miniMap.handleExpandedClick(centerClick);
    expect(miniMap.highlights[key]).toBe('diamond');

    // Fifth click -> heart
    miniMap.handleExpandedClick(centerClick);
    expect(miniMap.highlights[key]).toBe('heart');

    // Sixth click -> museum
    miniMap.handleExpandedClick(centerClick);
    expect(miniMap.highlights[key]).toBe('museum');

    // Seventh click -> removed (blank)
    miniMap.handleExpandedClick(centerClick);
    expect(miniMap.highlights[key]).toBeUndefined();
  });

  test('renders are triggered after cycling', () => {
    const centerClick = { clientX: 300, clientY: 300 };

    miniMap.handleExpandedClick(centerClick);

    // Expect both expanded and small minimap render methods to be called
    expect(miniMap.renderExpanded).toHaveBeenCalled();
    expect(miniMap.renderZoneMap).toHaveBeenCalled();
  });
});
