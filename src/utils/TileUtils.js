// @ts-check
import { TILE_TYPES } from '../core/constants/index.js';

/**
 * TileUtils - Centralized tile type checking and normalization
 *
 * Eliminates defensive type-checking anti-pattern scattered across the codebase.
 * Instead of repeating: `tile && typeof tile === 'object' && tile.type === TILE_TYPES.X`
 * Use clean helpers: `isBomb(tile)`, `getTileType(tile)`, etc.
 */

/**
 * @typedef {number|{type: number, [key: string]: any}|null|undefined} Tile
 * A tile can be either a primitive number (tile type) or an object with a type property and additional properties
 */

/**
 * Normalizes tile to its type value
 * Handles both primitive tile types (numbers) and tile objects
 *
 * @param {Tile} tile - Tile value or object
 * @returns {number|undefined} The tile type number, or undefined if invalid
 */
export function getTileType(tile) {
    if (tile === null || tile === undefined) {
        return undefined;
    }

    if (typeof tile === 'object') {
        return tile.type;
    }

    return tile;
}

/**
 * Checks if tile is a valid tile object (not just a primitive type)
 *
 * @param {*} tile - Value to check
 * @returns {boolean} True if tile is a valid object with a type property
 */
export function isTileObject(tile) {
    return tile !== null && typeof tile === 'object' && tile.type !== undefined;
}

/**
 * Checks if tile has the specified type
 *
 * @param {number|Object|null|undefined} tile - Tile to check
 * @param {number} tileType - Expected TILE_TYPES value
 * @returns {boolean} True if tile matches the specified type
 */
export function isTileType(tile, tileType) {
    return getTileType(tile) === tileType;
}

// Specific tile type checkers - eliminates repetitive patterns

export function isBomb(tile) {
    return isTileType(tile, TILE_TYPES.BOMB);
}

export function isFloor(tile) {
    return isTileType(tile, TILE_TYPES.FLOOR);
}

export function isWall(tile) {
    return isTileType(tile, TILE_TYPES.WALL);
}

export function isGrass(tile) {
    return isTileType(tile, TILE_TYPES.GRASS);
}

export function isExit(tile) {
    return isTileType(tile, TILE_TYPES.EXIT);
}

export function isRock(tile) {
    return isTileType(tile, TILE_TYPES.ROCK);
}

export function isHouse(tile) {
    return isTileType(tile, TILE_TYPES.HOUSE);
}

export function isShack(tile) {
    return isTileType(tile, TILE_TYPES.SHACK);
}

export function isWater(tile) {
    return isTileType(tile, TILE_TYPES.WATER);
}

export function isFood(tile) {
    return isTileType(tile, TILE_TYPES.FOOD);
}

export function isEnemy(tile) {
    return isTileType(tile, TILE_TYPES.ENEMY);
}

export function isAxe(tile) {
    return isTileType(tile, TILE_TYPES.AXE);
}

export function isHammer(tile) {
    return isTileType(tile, TILE_TYPES.HAMMER);
}

export function isNote(tile) {
    return isTileType(tile, TILE_TYPES.NOTE);
}

export function isBishopSpear(tile) {
    return isTileType(tile, TILE_TYPES.BISHOP_SPEAR);
}

export function isHorseIcon(tile) {
    return isTileType(tile, TILE_TYPES.HORSE_ICON);
}

export function isShrubbery(tile) {
    return isTileType(tile, TILE_TYPES.SHRUBBERY);
}

export function isWell(tile) {
    return isTileType(tile, TILE_TYPES.WELL);
}

export function isDeadTree(tile) {
    return isTileType(tile, TILE_TYPES.DEADTREE);
}

export function isPenne(tile) {
    return isTileType(tile, TILE_TYPES.PENNE);
}

export function isSquig(tile) {
    return isTileType(tile, TILE_TYPES.SQUIG);
}

export function isNib(tile) {
    return isTileType(tile, TILE_TYPES.NIB);
}

export function isRune(tile) {
    return isTileType(tile, TILE_TYPES.RUNE);
}

export function isHeart(tile) {
    return isTileType(tile, TILE_TYPES.HEART);
}

export function isSign(tile) {
    return isTileType(tile, TILE_TYPES.SIGN);
}

export function isPort(tile) {
    return isTileType(tile, TILE_TYPES.PORT);
}

export function isCrayn(tile) {
    return isTileType(tile, TILE_TYPES.CRAYN);
}

export function isFelt(tile) {
    return isTileType(tile, TILE_TYPES.FELT);
}

export function isForge(tile) {
    return isTileType(tile, TILE_TYPES.FORGE);
}

export function isBookOfTimeTravel(tile) {
    return isTileType(tile, TILE_TYPES.BOOK_OF_TIME_TRAVEL);
}

export function isBow(tile) {
    return isTileType(tile, TILE_TYPES.BOW);
}

export function isMark(tile) {
    return isTileType(tile, TILE_TYPES.MARK);
}

export function isShovel(tile) {
    return isTileType(tile, TILE_TYPES.SHOVEL);
}

export function isCistern(tile) {
    return isTileType(tile, TILE_TYPES.CISTERN);
}

export function isAxolotl(tile) {
    return isTileType(tile, TILE_TYPES.AXELOTL);
}

export function isGouge(tile) {
    return isTileType(tile, TILE_TYPES.GOUGE);
}

export function isPitfall(tile) {
    return isTileType(tile, TILE_TYPES.PITFALL);
}

export function isTable(tile) {
    return isTileType(tile, TILE_TYPES.TABLE);
}

// Statue checkers
export function isLizardyStatue(tile) {
    return isTileType(tile, TILE_TYPES.LIZARDY_STATUE);
}

export function isLizardoStatue(tile) {
    return isTileType(tile, TILE_TYPES.LIZARDO_STATUE);
}

export function isLizardeauxStatue(tile) {
    return isTileType(tile, TILE_TYPES.LIZARDEAUX_STATUE);
}

export function isZardStatue(tile) {
    return isTileType(tile, TILE_TYPES.ZARD_STATUE);
}

export function isLazerdStatue(tile) {
    return isTileType(tile, TILE_TYPES.LAZERD_STATUE);
}

export function isLizordStatue(tile) {
    return isTileType(tile, TILE_TYPES.LIZORD_STATUE);
}

export function isBombStatue(tile) {
    return isTileType(tile, TILE_TYPES.BOMB_STATUE);
}

export function isSpearStatue(tile) {
    return isTileType(tile, TILE_TYPES.SPEAR_STATUE);
}

export function isBowStatue(tile) {
    return isTileType(tile, TILE_TYPES.BOW_STATUE);
}

export function isHorseStatue(tile) {
    return isTileType(tile, TILE_TYPES.HORSE_STATUE);
}

export function isBookStatue(tile) {
    return isTileType(tile, TILE_TYPES.BOOK_STATUE);
}

export function isShovelStatue(tile) {
    return isTileType(tile, TILE_TYPES.SHOVEL_STATUE);
}

/**
 * Checks if tile is any type of statue (enemy or item)
 *
 * @param {number|Object|null|undefined} tile - Tile to check
 * @returns {boolean} True if tile is any statue type
 */
export function isStatue(tile) {
    const type = getTileType(tile);
    return type === TILE_TYPES.LIZARDY_STATUE ||
           type === TILE_TYPES.LIZARDO_STATUE ||
           type === TILE_TYPES.LIZARDEAUX_STATUE ||
           type === TILE_TYPES.ZARD_STATUE ||
           type === TILE_TYPES.LAZERD_STATUE ||
           type === TILE_TYPES.LIZORD_STATUE ||
           type === TILE_TYPES.BOMB_STATUE ||
           type === TILE_TYPES.SPEAR_STATUE ||
           type === TILE_TYPES.BOW_STATUE ||
           type === TILE_TYPES.HORSE_STATUE ||
           type === TILE_TYPES.BOOK_STATUE ||
           type === TILE_TYPES.SHOVEL_STATUE;
}

/**
 * Checks if tile is walkable (not blocking movement)
 *
 * @param {number|Object|null|undefined} tile - Tile to check
 * @returns {boolean} True if tile allows movement
 */
export function isWalkable(tile) {
    const type = getTileType(tile);
    // Walls, rocks, houses, shacks block movement
    return type !== TILE_TYPES.WALL &&
           type !== TILE_TYPES.ROCK &&
           type !== TILE_TYPES.HOUSE &&
           type !== TILE_TYPES.SHACK;
}

/**
 * Checks if tile is an item that can be picked up
 *
 * @param {number|Object|null|undefined} tile - Tile to check
 * @returns {boolean} True if tile is a collectible item
 */
export function isItem(tile) {
    const type = getTileType(tile);
    return type === TILE_TYPES.AXE ||
           type === TILE_TYPES.HAMMER ||
           type === TILE_TYPES.BISHOP_SPEAR ||
           type === TILE_TYPES.HORSE_ICON ||
           type === TILE_TYPES.BOMB ||
           type === TILE_TYPES.HEART ||
           type === TILE_TYPES.WATER ||
           type === TILE_TYPES.FOOD ||
           type === TILE_TYPES.NOTE ||
           type === TILE_TYPES.BOOK_OF_TIME_TRAVEL ||
           type === TILE_TYPES.BOW ||
           type === TILE_TYPES.SHOVEL;
}
