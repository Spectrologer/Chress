import { FogRenderer } from '../renderers/FogRenderer.js';

describe('FogRenderer', () => {
  let originalCreateElement;
  let game;
  let mockCtx;
  let fakeImage;

  beforeEach(() => {
    // Minimal mock rendering context used by FogRenderer
    mockCtx = {
      save: jest.fn(),
      restore: jest.fn(),
      translate: jest.fn(),
      setTransform: jest.fn(),
      fillRect: jest.fn(),
      createPattern: jest.fn(() => ({ isPattern: true })),
      // allow properties to be set
      globalAlpha: 1.0,
      fillStyle: null,
      strokeStyle: null,
      lineWidth: 1,
      setLineDash: jest.fn(),
      // setLineDash alias used in some environments
      getImageData: jest.fn()
    };

    // Provide a fake image object with width/height that TextureLoader would return
    fakeImage = { width: 320, height: 180 };

    // Mock document.createElement('canvas') so FogRenderer can create scaled canvas
    originalCreateElement = document.createElement.bind(document);
    document.createElement = (tag) => {
      if (tag === 'canvas') {
        // return a simple object that receives width/height and a 2D context
        const c = { width: 0, height: 0 };
        c.getContext = () => ({
          drawImage: jest.fn(),
          putImageData: jest.fn(),
          getImageData: jest.fn(() => ({ data: new Uint8ClampedArray(4) }))
        });
        return c;
      }
      return originalCreateElement(tag);
    };

    // Minimal player stub
    const player = {
      undergroundDepth: 1,
      getCurrentZone: () => ({ x: 0, y: 0, dimension: 2, depth: 1 })
    };

    // Game stub used by FogRenderer
    game = {
      ctx: mockCtx,
      textureManager: { getImage: jest.fn(() => fakeImage) },
      player
    };
  });

  afterEach(() => {
    // restore createElement
    document.createElement = originalCreateElement;
  });

  test('creates a pattern for numeric underground dimension', () => {
    const fr = new FogRenderer(game);
    fr.updateAndDrawFog();
    expect(fr._scaledCanvas).toBeTruthy();
    expect(fr._pattern).toBeTruthy();
    expect(mockCtx.createPattern).toHaveBeenCalled();
  });

  test('creates a pattern for stringified underground dimension', () => {
    game.player.getCurrentZone = () => ({ x: 0, y: 0, dimension: '2', depth: 1 });
    const fr = new FogRenderer(game);
    fr.updateAndDrawFog();
    expect(fr._scaledCanvas).toBeTruthy();
    expect(fr._pattern).toBeTruthy();
    expect(mockCtx.createPattern).toHaveBeenCalled();
  });

  test('preserves/recreates pattern across zone changes', () => {
    const fr = new FogRenderer(game);
    // initial create
    fr.updateAndDrawFog();
    expect(fr._pattern).toBeTruthy();
    const prevPattern = fr._pattern;

    // simulate zone change: change player's zone so lastZoneKey differs
    game.player.getCurrentZone = () => ({ x: 1, y: 0, dimension: 2, depth: 1 });
    // Clear pattern to simulate an earlier code path that might have cleared it
    fr._pattern = null;
    fr.updateAndDrawFog();
    // pattern should be recreated from existing scaled canvas
    expect(fr._pattern).toBeTruthy();
    expect(mockCtx.createPattern).toHaveBeenCalled();
  });
});
