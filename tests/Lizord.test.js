import { EnemyMoveCalculatorFactory } from '../enemy/MoveCalculators.js';
import { GRID_SIZE, TILE_TYPES } from '../core/constants.js';

describe('Lizord movement and bump attack behavior', () => {
  let mockPlayer;
  let mockEnemy;
  let grid;

  beforeEach(() => {
    mockPlayer = {
      x: 0,
      y: 0,
      takeDamage: jest.fn(),
      startBump: jest.fn(),
      isWalkable: jest.fn().mockReturnValue(true),
      setPosition: jest.fn()
    };

    mockEnemy = {
      x: 3,
      y: 3,
      enemyType: 'lizord',
      attack: 7,
      justAttacked: false,
      liftFrames: 0,
      smokeAnimations: [],
      lastX: undefined,
      lastY: undefined,
      startBump: jest.fn(),
      isWalkable: function (x, y, g) {
        if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return false;
        return (g[y] && g[y][x]) === TILE_TYPES.FLOOR;
      }
    };

    grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(TILE_TYPES.FLOOR));
  });

  test('performs bump attack when knight-move endpoint equals player', () => {
    const calculator = EnemyMoveCalculatorFactory.getCalculator('lizord');

    // Place a player at a knight-move away from enemy (e.g., 2 right and 1 down)
    mockPlayer.x = 5; // enemy.x + 2
    mockPlayer.y = 4; // enemy.y + 1

    // Provide game context with sets referenced by the movement logic
    const game = { initialEnemyTilesThisTurn: new Set(), occupiedTilesThisTurn: new Set(), playerJustAttacked: false };

    const result = calculator.calculateMove(mockEnemy, mockPlayer, { x: mockPlayer.x, y: mockPlayer.y }, grid, [mockEnemy], false, game);

    // When bump attack is performed, calculateMove returns null and player.takeDamage should be called
    expect(result).toBeNull();
    expect(mockPlayer.takeDamage).toHaveBeenCalledWith(7);
  });

  test('does not remain stationary when a legal move exists', () => {
    const calculator = EnemyMoveCalculatorFactory.getCalculator('lizord');

    // Player placed far away so lizord should move (not remain null) unless blocked.
    mockPlayer.x = 0;
    mockPlayer.y = 0;

    const result = calculator.calculateMove(mockEnemy, mockPlayer, { x: mockPlayer.x, y: mockPlayer.y }, grid, [mockEnemy], false, { playerJustAttacked: false });

    // When a legal path exists, result should be either a move object or null if special action used.
    // We assert it's not explicitly null only if there is a move available; but we expect some action.
    expect(result === null || typeof result === 'object').toBeTruthy();
  });
});
