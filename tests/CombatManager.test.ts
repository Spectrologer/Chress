import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { CombatManager } from '@managers/CombatManager';
import { Position } from '@core/Position';
import { TILE_TYPES } from '@core/constants/index';

describe('CombatManager', () => {
  let combatManager: any;
  let mockGame: any;

  beforeEach(() => {
    const mockPlayer = {
      x: 5,
      y: 5,
      getCurrentZone: vi.fn().mockReturnValue({ x: 0, y: 0, dimension: 0, depth: 0 }),
      currentZone: { x: 0, y: 0, dimension: 0, depth: 0 },
      getPosition: vi.fn().mockReturnValue(new Position(5, 5)),
    };
    mockGame = {
      player: mockPlayer,
      grid: [],
      enemyCollection: { getAll: vi.fn().mockReturnValue([]), includes: vi.fn(), removeById: vi.fn(), some: vi.fn() },
      gridManager: { getTile: vi.fn().mockReturnValue(TILE_TYPES.FLOOR), setTile: vi.fn() },
      playerFacade: { getUndergroundDepth: vi.fn().mockReturnValue(1), setAction: vi.fn(), hasAbility: vi.fn() },
      zoneRepository: { hasByKey: vi.fn(), getByKey: vi.fn() },
      turnManager: { initialEnemyTilesThisTurn: new Set() },
      initialEnemyTilesThisTurn: new Set(),
    };
    const mockDefeatFlow = {
      executeDefeat: vi.fn().mockReturnValue({ defeated: true, consecutiveKills: 1 }),
      addPointAnimation: vi.fn(),
    };
    combatManager = new CombatManager(mockGame, new Set(), { getBomb: vi.fn(), explodeBomb: vi.fn() }, mockDefeatFlow);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('getCurrentZone returns zone', () => {
    expect(combatManager.getCurrentZone()).toEqual({ x: 0, y: 0, dimension: 0, depth: 0 });
  });

  test('defeatEnemy with player initiator', () => {
    const result = combatManager.defeatEnemy({ id: 1, x: 5, y: 6 }, 'player');
    expect(result).toEqual({ defeated: true, consecutiveKills: 1 });
  });

  test('checkCollisions delegates correctly', () => {
    vi.spyOn(combatManager.collisionSystem, 'checkCollisions').mockReturnValue(true);
    expect(combatManager.checkCollisions()).toBe(true);
  });
});
