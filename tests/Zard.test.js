import { EnemyMoveCalculatorFactory } from '@enemy/MoveCalculators';
import { GRID_SIZE, TILE_TYPES } from '@core/constants/index';

describe('Zard movement and attack behavior', () => {
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
      enemyType: 'zard',
      attack: 5,
      justAttacked: false,
      liftFrames: 0,
      smokeAnimations: [],
      startBump: jest.fn(),
      isWalkable: function (x, y, g) {
        // Respect grid bounds and treat only FLOOR as walkable in tests
        if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return false;
        return (g[y] && g[y][x]) === TILE_TYPES.FLOOR;
      }
    };

    grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(TILE_TYPES.FLOOR));
  });

  test('diagonal adjacent attack damages player', () => {
    const calculator = EnemyMoveCalculatorFactory.getCalculator('zard');
    // Place player diagonally adjacent to enemy
    mockPlayer.x = 4;
    mockPlayer.y = 4; // enemy at 3,3 -> diagonal

    const result = calculator.calculateMove(mockEnemy, mockPlayer, { x: mockPlayer.x, y: mockPlayer.y }, grid, [mockEnemy], false, { playerJustAttacked: false });

    // Calculator performs the attack and returns null (attack consumed turn)
    expect(result).toBeNull();
    expect(mockPlayer.takeDamage).toHaveBeenCalledWith(5);
  });

  test('orthogonal adjacent does not perform diagonal attack', () => {
    const calculator = EnemyMoveCalculatorFactory.getCalculator('zard');
    // Place player orthogonally adjacent to enemy
    mockPlayer.x = 4;
    mockPlayer.y = 3; // enemy at 3,3 -> orthogonal

    const result = calculator.calculateMove(mockEnemy, mockPlayer, { x: mockPlayer.x, y: mockPlayer.y }, grid, [mockEnemy], false, { playerJustAttacked: false });

    // Zard should NOT perform a diagonal attack on orthogonal adjacency
    expect(mockPlayer.takeDamage).not.toHaveBeenCalled();
    // The result may be a move (or null if charge/defensive happened), but important is no damage
    expect(result === null || typeof result === 'object').toBeTruthy();
  });
});
