import { TILE_TYPES } from '../core/constants/index.js';

/**
 * TileUtils - Centralized tile type checking and normalization
 *
 * Eliminates defensive type-checking anti-pattern scattered across the codebase.
 * Instead of repeating: `tile && typeof tile === 'object' && tile.type === TILE_TYPES.X`
 * Use clean helpers: `isBomb(tile)`, `getTileType(tile)`, etc.
 */

export type Tile = number | { type: number; [key: string]: any } | null | undefined;

/**
 * Normalizes tile to its type value
 * Handles both primitive tile types (numbers) and tile objects
 *
 * @param tile - Tile value or object
 * @returns The tile type number, or undefined if invalid
 */
export function getTileType(tile: Tile): number | undefined {
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
 * @param tile - Value to check
 * @returns True if tile is a valid object with a type property
 */
export function isTileObject(tile: any): tile is { type: number; [key: string]: any } {
    return tile !== null && typeof tile === 'object' && tile.type !== undefined;
}

/**
 * Checks if tile has the specified type
 *
 * @param tile - Tile to check
 * @param tileType - Expected TILE_TYPES value
 * @returns True if tile matches the specified type
 */
export function isTileType(tile: Tile, tileType: number): boolean {
    return getTileType(tile) === tileType;
}

// Specific tile type checkers - eliminates repetitive patterns

export function isBomb(tile: Tile): boolean {
    return isTileType(tile, TILE_TYPES.BOMB);
}

export function isFloor(tile: Tile): boolean {
    return isTileType(tile, TILE_TYPES.FLOOR);
}

export function isWall(tile: Tile): boolean {
    return isTileType(tile, TILE_TYPES.WALL);
}

export function isGrass(tile: Tile): boolean {
    return isTileType(tile, TILE_TYPES.GRASS);
}

export function isExit(tile: Tile): boolean {
    return isTileType(tile, TILE_TYPES.EXIT);
}

export function isRock(tile: Tile): boolean {
    return isTileType(tile, TILE_TYPES.ROCK);
}

export function isHouse(tile: Tile): boolean {
    return isTileType(tile, TILE_TYPES.HOUSE);
}

export function isShack(tile: Tile): boolean {
    return isTileType(tile, TILE_TYPES.SHACK);
}

export function isEnemy(tile: Tile): boolean {
    return isTileType(tile, TILE_TYPES.ENEMY);
}

export function isWater(tile: Tile): boolean {
    return isTileType(tile, TILE_TYPES.WATER);
}

export function isFood(tile: Tile): boolean {
    return isTileType(tile, TILE_TYPES.FOOD);
}

export function isAxe(tile: Tile): boolean {
    return isTileType(tile, TILE_TYPES.AXE);
}

export function isHammer(tile: Tile): boolean {
    return isTileType(tile, TILE_TYPES.HAMMER);
}

export function isBishopSpear(tile: Tile): boolean {
    return isTileType(tile, TILE_TYPES.BISHOP_SPEAR);
}

export function isHorseIcon(tile: Tile): boolean {
    return isTileType(tile, TILE_TYPES.HORSE_ICON);
}

export function isBow(tile: Tile): boolean {
    return isTileType(tile, TILE_TYPES.BOW);
}

export function isShovel(tile: Tile): boolean {
    return isTileType(tile, TILE_TYPES.SHOVEL);
}

export function isShrubbery(tile: Tile): boolean {
    return isTileType(tile, TILE_TYPES.SHRUBBERY);
}

export function isWell(tile: Tile): boolean {
    return isTileType(tile, TILE_TYPES.WELL);
}

export function isDeadTree(tile: Tile): boolean {
    return isTileType(tile, TILE_TYPES.DEADTREE);
}

export function isPenne(tile: Tile): boolean {
    return isTileType(tile, TILE_TYPES.PENNE);
}

export function isSquig(tile: Tile): boolean {
    return isTileType(tile, TILE_TYPES.SQUIG);
}

export function isNib(tile: Tile): boolean {
    return isTileType(tile, TILE_TYPES.NIB);
}

export function isRune(tile: Tile): boolean {
    return isTileType(tile, TILE_TYPES.RUNE);
}

export function isNote(tile: Tile): boolean {
    return isTileType(tile, TILE_TYPES.NOTE);
}

export function isBookOfTimeTravel(tile: Tile): boolean {
    return isTileType(tile, TILE_TYPES.BOOK_OF_TIME_TRAVEL);
}

export function isHeart(tile: Tile): boolean {
    return isTileType(tile, TILE_TYPES.HEART);
}

export function isSign(tile: Tile): boolean {
    return isTileType(tile, TILE_TYPES.SIGN);
}

export function isPort(tile: Tile): boolean {
    return isTileType(tile, TILE_TYPES.PORT);
}

export function isCistern(tile: Tile): boolean {
    return isTileType(tile, TILE_TYPES.CISTERN);
}

export function isPitfall(tile: Tile): boolean {
    return isTileType(tile, TILE_TYPES.PITFALL);
}

export function isTable(tile: Tile): boolean {
    return isTileType(tile, TILE_TYPES.TABLE);
}

/**
 * Check if tile is walkable
 * @param tile - Tile to check
 * @returns True if tile is walkable
 */
export function isWalkable(tile: Tile): boolean {
    const type = getTileType(tile);
    return type !== TILE_TYPES.WALL &&
           type !== TILE_TYPES.ROCK &&
           type !== TILE_TYPES.HOUSE &&
           type !== TILE_TYPES.SHACK &&
           type !== TILE_TYPES.SIGN;
}

/**
 * Check if tile is a collectible item
 * @param tile - Tile to check
 * @returns True if tile is an item
 */
export function isItem(tile: Tile): boolean {
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

/**
 * Check if tile is choppable (requires axe)
 * @param tile - Tile to check
 * @returns True if tile can be chopped
 */
export function isChoppable(tile: Tile): boolean {
    const type = getTileType(tile);
    return type === TILE_TYPES.GRASS || type === TILE_TYPES.SHRUBBERY;
}

/**
 * Check if tile is breakable (requires hammer)
 * @param tile - Tile to check
 * @returns True if tile can be broken
 */
export function isBreakable(tile: Tile): boolean {
    const type = getTileType(tile);
    return type === TILE_TYPES.ROCK;
}
