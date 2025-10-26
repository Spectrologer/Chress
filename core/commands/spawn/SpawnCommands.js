import { TILE_TYPES } from '../../constants.js';
import { BaseSpawnCommand } from './BaseSpawnCommand.js';
import { SpawnPositionHelper } from '../SpawnPositionHelper.js';
import logger from '../../logger.js';

/**
 * Simple spawn commands for basic items
 */

export class SpawnBombCommand extends BaseSpawnCommand {
    getTileToSpawn() { return TILE_TYPES.BOMB; }
    getItemName() { return 'bomb'; }
}

export class SpawnHorseIconCommand extends BaseSpawnCommand {
    getTileToSpawn() { return { type: TILE_TYPES.HORSE_ICON, uses: 3 }; }
    getItemName() { return 'horse icon'; }
}

export class SpawnHammerCommand extends BaseSpawnCommand {
    getTileToSpawn() { return TILE_TYPES.HAMMER; }
    getItemName() { return 'hammer'; }
}

export class SpawnBishopSpearCommand extends BaseSpawnCommand {
    getTileToSpawn() { return { type: TILE_TYPES.BISHOP_SPEAR, uses: 3 }; }
    getItemName() { return 'bishop spear'; }
}

export class SpawnNoteCommand extends BaseSpawnCommand {
    getTileToSpawn() { return TILE_TYPES.NOTE; }
    getItemName() { return 'note'; }
}

export class SpawnHeartCommand extends BaseSpawnCommand {
    getTileToSpawn() { return TILE_TYPES.HEART; }
    getItemName() { return 'heart'; }
}

export class SpawnBookCommand extends BaseSpawnCommand {
    getTileToSpawn() { return { type: TILE_TYPES.BOOK_OF_TIME_TRAVEL, uses: 3 }; }
    getItemName() { return 'Book of Time Travel'; }
}

export class SpawnBowCommand extends BaseSpawnCommand {
    getTileToSpawn() { return { type: TILE_TYPES.BOW, uses: 3 }; }
    getItemName() { return 'bow'; }
}

export class SpawnWaterCommand extends BaseSpawnCommand {
    getTileToSpawn() { return TILE_TYPES.WATER; }
    getItemName() { return 'water'; }
}

export class SpawnFoodMeatCommand extends BaseSpawnCommand {
    getTileToSpawn() { return { type: TILE_TYPES.FOOD, foodType: 'food/meat/beaf.png' }; }
    getItemName() { return 'meat'; }
}

export class SpawnFoodNutCommand extends BaseSpawnCommand {
    getTileToSpawn() { return { type: TILE_TYPES.FOOD, foodType: 'food/veg/nut.png' }; }
    getItemName() { return 'nut'; }
}

export class SpawnPenneCommand extends BaseSpawnCommand {
    getTileToSpawn() { return TILE_TYPES.PENNE; }
    getItemName() { return 'Penne'; }
}

export class SpawnSquigCommand extends BaseSpawnCommand {
    getTileToSpawn() { return TILE_TYPES.SQUIG; }
    getItemName() { return 'squig'; }
}

export class SpawnRuneCommand extends BaseSpawnCommand {
    getTileToSpawn() { return TILE_TYPES.RUNE; }
    getItemName() { return 'rune'; }
}

export class SpawnNibCommand extends BaseSpawnCommand {
    getTileToSpawn() { return TILE_TYPES.NIB; }
    getItemName() { return 'nib'; }
}

export class SpawnMarkCommand extends BaseSpawnCommand {
    getTileToSpawn() { return TILE_TYPES.MARK; }
    getItemName() { return 'Mark'; }
}

export class SpawnGougeCommand extends BaseSpawnCommand {
    getTileToSpawn() { return TILE_TYPES.GOUGE; }
    getItemName() { return 'Gouge'; }
}

export class SpawnShovelCommand extends BaseSpawnCommand {
    getTileToSpawn() { return { type: TILE_TYPES.SHOVEL, uses: 3 }; }
    getItemName() { return 'shovel'; }
}

export class SpawnPitfallCommand extends BaseSpawnCommand {
    getTileToSpawn() { return TILE_TYPES.PITFALL; }
    getItemName() { return 'pitfall'; }
}

/**
 * Complex spawn commands requiring custom logic
 */

export class SpawnShackCommand extends BaseSpawnCommand {
    getSpawnPosition(game) {
        return SpawnPositionHelper.findShackSpawnPosition(game);
    }

    execute(game) {
        const pos = this.getSpawnPosition(game);
        if (pos) {
            // Place the 3x3 shack
            for (let dy = 0; dy < 3; dy++) {
                for (let dx = 0; dx < 3; dx++) {
                    if (dy === 2 && dx === 1) { // Middle bottom tile
                        game.grid[pos.y + dy][pos.x + dx] = TILE_TYPES.PORT;
                    } else {
                        game.grid[pos.y + dy][pos.x + dx] = TILE_TYPES.SHACK;
                    }
                }
            }
            logger.log('Spawned shack at', pos);
        } else {
            logger.log('No valid spawn position found for shack');
        }
    }
}

export class SpawnCisternCommand extends BaseSpawnCommand {
    getSpawnPosition(game) {
        return SpawnPositionHelper.findCisternSpawnPosition(game);
    }

    execute(game) {
        const pos = this.getSpawnPosition(game);
        if (pos) {
            // Place the 1x2 cistern
            game.grid[pos.y][pos.x] = TILE_TYPES.PORT;
            game.grid[pos.y + 1][pos.x] = TILE_TYPES.CISTERN;
            logger.log('Spawned cistern at', pos);
        } else {
            logger.log('No valid spawn position found for cistern');
        }
    }
}

export class SpawnStairdownCommand extends BaseSpawnCommand {
    execute(game) {
        // Try to place at player's position first
        const playerPos = game.player.getPosition();
        const tileAtPlayer = game.grid[playerPos.y]?.[playerPos.x];
        const canPlaceAtPlayer = tileAtPlayer === TILE_TYPES.FLOOR ||
            (tileAtPlayer && tileAtPlayer.type === TILE_TYPES.FLOOR);

        if (canPlaceAtPlayer) {
            game.grid[playerPos.y][playerPos.x] = { type: TILE_TYPES.PORT, portKind: 'stairdown' };
            logger.log('Placed stairdown at player position', playerPos);
            return;
        }

        // Otherwise find random position
        const pos = this.getSpawnPosition(game);
        if (pos) {
            game.grid[pos.y][pos.x] = { type: TILE_TYPES.PORT, portKind: 'stairdown' };
            logger.log('Spawned stairdown at', pos);
        } else {
            logger.log('No valid spawn position found for stairdown');
        }
    }
}
