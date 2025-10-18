import { GRID_SIZE, TILE_TYPES } from '../core/constants.js';

export class BombManager {
    constructor(game) {
        this.game = game;
    }

    tickBombsAndExplode() {
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                const tile = this.game.grid[y][x];
                if (tile && typeof tile === 'object' && tile.type === TILE_TYPES.BOMB) {
                    if (tile.actionsSincePlaced >= 2) {
                        if (typeof this.game.explodeBomb === 'function') this.game.explodeBomb(x, y);
                    }
                }
            }
        }
    }
}
