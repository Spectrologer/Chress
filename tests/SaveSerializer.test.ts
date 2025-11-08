import { describe, test, expect, beforeEach, vi } from 'vitest';
import { SaveSerializer } from '../src/core/SaveSerializer\.ts';
import { TILE_TYPES, GRID_SIZE } from '@core/constants/index';
import type { GameContext } from '@core/context/GameContextCore';
import type { Player } from '@entities/Player';
import type { Enemy } from '@entities/Enemy';

describe('SaveSerializer', () => {
    test('simple test', () => {
        expect(1 + 1).toBe(2);
    });
});
