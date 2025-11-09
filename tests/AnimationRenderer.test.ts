import { AnimationRenderer } from '@renderers/AnimationRenderer';
import { TILE_SIZE } from '@core/constants/index';

describe('AnimationRenderer - splode', () => {
  let mockGame;
  let ctx;

  beforeEach(() => {
    ctx = {
      drawImage: vi.fn(),
    };

    const fakeImage = { complete: true };
    const textureManager = { getImage: vi.fn(() => fakeImage) };

    mockGame = {
      ctx,
      textureManager,
      player: {
        animations: {
          splodeAnimations: [],
        },
      },
      playerFacade: {
        getSplodeAnimations: () => mockGame.player.animations.splodeAnimations,
      },
    };
  });

  test('drawSplodeAnimation draws a 3x3 splode image centered on bomb', () => {
    const anim = { x: 5, y: 6, frame: 1, totalFrames: 8 };
    mockGame.player.animations.splodeAnimations.push(anim);

    const renderer = new AnimationRenderer(mockGame);
    renderer.drawSplodeAnimation();

    // Expect drawImage called once with image and pixel coordinates covering 3 tiles
    expect(mockGame.textureManager.getImage).toHaveBeenCalled();
    expect(ctx.drawImage).toHaveBeenCalledTimes(1);

    const size = TILE_SIZE * 3;
    const expectedX = anim.x * TILE_SIZE - TILE_SIZE;
    const expectedY = anim.y * TILE_SIZE - TILE_SIZE;

    expect(ctx.drawImage).toHaveBeenCalledWith(expect.any(Object), expectedX, expectedY, size, size);
  });
});
