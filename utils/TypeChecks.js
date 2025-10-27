/**
 * TypeChecks - Standardized type checking utilities for the Chress codebase
 *
 * PROBLEM SOLVED:
 * This module eliminates 111 instances of inconsistent type checking patterns:
 * - 29 instances of verbose `typeof tile === 'object' && tile !== null` checks
 * - 102 instances of direct `tile === TILE_TYPES.X` comparisons
 * - 123 instances already using proper `isTileType()` pattern
 *
 * RECOMMENDED USAGE:
 * ✅ GOOD: isBomb(tile), isTileObject(tile), getTileType(tile)
 * ❌ BAD:  typeof tile === 'object' && tile !== null && tile.type === TILE_TYPES.BOMB
 * ❌ BAD:  tile === TILE_TYPES.BOMB (when tile could be an object)
 *
 * Import and use these utilities throughout the codebase for consistent type checking.
 */

import { TILE_TYPES } from '../core/constants/index.js';

// ========================================
// CORE TYPE UTILITIES
// ========================================

/**
 * Normalizes a tile to its type value.
 * Handles both primitive tile types (numbers) and tile objects.
 *
 * This is the foundation for all type checking in the codebase.
 *
 * @param {number|Object|null|undefined} tile - Tile value or object
 * @returns {number|undefined} The tile type number, or undefined if invalid
 *
 * @example
 * getTileType(TILE_TYPES.FLOOR)                    // → 0
 * getTileType({ type: TILE_TYPES.BOMB })           // → 24
 * getTileType(null)                                // → undefined
 * getTileType(undefined)                           // → undefined
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
 * Checks if a tile is a valid tile object (not just a primitive type).
 * Replaces the verbose pattern: `typeof tile === 'object' && tile !== null`
 *
 * USE THIS WHEN:
 * - You need to access tile properties like `tile.actionsSincePlaced`
 * - You need to validate a tile is an object before accessing object-specific data
 * - You're performing defensive checks before object property access
 *
 * @param {*} tile - Value to check
 * @returns {boolean} True if tile is a valid object with a type property
 *
 * @example
 * // ❌ BAD - Verbose pattern
 * if (tapTile && typeof tapTile === 'object' && tapTile !== null) {
 *     return tapTile.actionsSincePlaced > 0;
 * }
 *
 * // ✅ GOOD - Clean pattern
 * if (isTileObject(tapTile)) {
 *     return tapTile.actionsSincePlaced > 0;
 * }
 */
export function isTileObject(tile) {
    return tile !== null && typeof tile === 'object' && tile.type !== undefined;
}

/**
 * Checks if a tile has the specified type.
 * Handles both primitive tiles and tile objects seamlessly.
 *
 * This is the recommended way to check tile types throughout the codebase.
 *
 * @param {number|Object|null|undefined} tile - Tile to check
 * @param {number} tileType - Expected TILE_TYPES value
 * @returns {boolean} True if tile matches the specified type
 *
 * @example
 * // Works with primitive tiles
 * isTileType(TILE_TYPES.BOMB, TILE_TYPES.BOMB)                    // → true
 *
 * // Works with object tiles
 * isTileType({ type: TILE_TYPES.BOMB, justPlaced: true }, TILE_TYPES.BOMB)  // → true
 *
 * // Handles null/undefined safely
 * isTileType(null, TILE_TYPES.FLOOR)                             // → false
 */
export function isTileType(tile, tileType) {
    return getTileType(tile) === tileType;
}

/**
 * Checks if a value is a valid tile (either primitive or object).
 *
 * @param {*} tile - Value to check
 * @returns {boolean} True if the value is a valid tile
 *
 * @example
 * isValidTile(TILE_TYPES.FLOOR)           // → true
 * isValidTile({ type: TILE_TYPES.BOMB })  // → true
 * isValidTile(null)                       // → false
 * isValidTile(undefined)                  // → false
 * isValidTile("invalid")                  // → false
 */
export function isValidTile(tile) {
    return getTileType(tile) !== undefined;
}

// ========================================
// SPECIFIC TILE TYPE CHECKERS
// ========================================
// These eliminate repetitive `isTileType(tile, TILE_TYPES.X)` patterns
// and provide semantic, readable code throughout the codebase.

// Basic terrain types
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

// Buildings
export function isHouse(tile) {
    return isTileType(tile, TILE_TYPES.HOUSE);
}

export function isShack(tile) {
    return isTileType(tile, TILE_TYPES.SHACK);
}

// Environmental
export function isWater(tile) {
    return isTileType(tile, TILE_TYPES.WATER);
}

export function isFood(tile) {
    return isTileType(tile, TILE_TYPES.FOOD);
}

export function isEnemy(tile) {
    return isTileType(tile, TILE_TYPES.ENEMY);
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

// Tools & Equipment
export function isAxe(tile) {
    return isTileType(tile, TILE_TYPES.AXE);
}

export function isHammer(tile) {
    return isTileType(tile, TILE_TYPES.HAMMER);
}

export function isBishopSpear(tile) {
    return isTileType(tile, TILE_TYPES.BISHOP_SPEAR);
}

export function isBow(tile) {
    return isTileType(tile, TILE_TYPES.BOW);
}

export function isShovel(tile) {
    return isTileType(tile, TILE_TYPES.SHOVEL);
}

// Special items
export function isBomb(tile) {
    return isTileType(tile, TILE_TYPES.BOMB);
}

export function isHeart(tile) {
    return isTileType(tile, TILE_TYPES.HEART);
}

export function isNote(tile) {
    return isTileType(tile, TILE_TYPES.NOTE);
}

export function isBookOfTimeTravel(tile) {
    return isTileType(tile, TILE_TYPES.BOOK_OF_TIME_TRAVEL);
}

export function isHorseIcon(tile) {
    return isTileType(tile, TILE_TYPES.HORSE_ICON);
}

// Interactive objects
export function isSign(tile) {
    return isTileType(tile, TILE_TYPES.SIGN);
}

export function isPort(tile) {
    return isTileType(tile, TILE_TYPES.PORT);
}

export function isCistern(tile) {
    return isTileType(tile, TILE_TYPES.CISTERN);
}

export function isPitfall(tile) {
    return isTileType(tile, TILE_TYPES.PITFALL);
}

export function isTable(tile) {
    return isTileType(tile, TILE_TYPES.TABLE);
}

// NPCs
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

export function isCrayn(tile) {
    return isTileType(tile, TILE_TYPES.CRAYN);
}

export function isFelt(tile) {
    return isTileType(tile, TILE_TYPES.FELT);
}

export function isForge(tile) {
    return isTileType(tile, TILE_TYPES.FORGE);
}

export function isMark(tile) {
    return isTileType(tile, TILE_TYPES.MARK);
}

export function isAxolotl(tile) {
    return isTileType(tile, TILE_TYPES.AXELOTL);
}

export function isGouge(tile) {
    return isTileType(tile, TILE_TYPES.GOUGE);
}

// Enemy statues
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

// Item statues
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

// ========================================
// CATEGORY CHECKERS
// ========================================

/**
 * Checks if a tile is any type of statue (enemy or item).
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
 * Checks if a tile is walkable (not blocking movement).
 * Walls, rocks, houses, and shacks block movement.
 *
 * @param {number|Object|null|undefined} tile - Tile to check
 * @returns {boolean} True if tile allows movement
 */
export function isWalkable(tile) {
    const type = getTileType(tile);
    return type !== TILE_TYPES.WALL &&
           type !== TILE_TYPES.ROCK &&
           type !== TILE_TYPES.HOUSE &&
           type !== TILE_TYPES.SHACK &&
           type !== TILE_TYPES.SIGN;
}

/**
 * Checks if a tile is a collectible item.
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

/**
 * Checks if a tile is an NPC.
 *
 * @param {number|Object|null|undefined} tile - Tile to check
 * @returns {boolean} True if tile is an NPC
 */
export function isNPC(tile) {
    const type = getTileType(tile);
    return type === TILE_TYPES.PENNE ||
           type === TILE_TYPES.SQUIG ||
           type === TILE_TYPES.NIB ||
           type === TILE_TYPES.RUNE ||
           type === TILE_TYPES.CRAYN ||
           type === TILE_TYPES.FELT ||
           type === TILE_TYPES.FORGE ||
           type === TILE_TYPES.MARK ||
           type === TILE_TYPES.AXELOTL ||
           type === TILE_TYPES.GOUGE;
}

/**
 * Checks if a tile is choppable (requires axe).
 *
 * @param {number|Object|null|undefined} tile - Tile to check
 * @returns {boolean} True if tile can be chopped with an axe
 */
export function isChoppable(tile) {
    const type = getTileType(tile);
    return type === TILE_TYPES.GRASS ||
           type === TILE_TYPES.SHRUBBERY;
}

/**
 * Checks if a tile is breakable (requires hammer).
 *
 * @param {number|Object|null|undefined} tile - Tile to check
 * @returns {boolean} True if tile can be broken with a hammer
 */
export function isBreakable(tile) {
    const type = getTileType(tile);
    return type === TILE_TYPES.ROCK;
}

// ========================================
// OBJECT PROPERTY HELPERS
// ========================================

/**
 * Safely gets a property from a tile object.
 * Returns undefined if the tile is not an object or doesn't have the property.
 *
 * @param {number|Object|null|undefined} tile - Tile to check
 * @param {string} property - Property name to retrieve
 * @returns {*} The property value, or undefined
 *
 * @example
 * getTileProperty({ type: TILE_TYPES.BOMB, actionsSincePlaced: 5 }, 'actionsSincePlaced')  // → 5
 * getTileProperty(TILE_TYPES.FLOOR, 'actionsSincePlaced')                                  // → undefined
 */
export function getTileProperty(tile, property) {
    if (isTileObject(tile)) {
        return tile[property];
    }
    return undefined;
}

/**
 * Checks if a tile object has a specific property.
 *
 * @param {number|Object|null|undefined} tile - Tile to check
 * @param {string} property - Property name to check for
 * @returns {boolean} True if the tile is an object and has the property
 *
 * @example
 * hasTileProperty({ type: TILE_TYPES.BOMB, justPlaced: true }, 'justPlaced')  // → true
 * hasTileProperty(TILE_TYPES.FLOOR, 'justPlaced')                             // → false
 */
export function hasTileProperty(tile, property) {
    return isTileObject(tile) && property in tile;
}

// ========================================
// COMBINED CONDITION HELPERS
// ========================================

/**
 * Checks if a tile is an object with a specific type.
 * Useful for validating before accessing object-specific properties.
 *
 * Replaces: `typeof tile === 'object' && tile !== null && tile.type === TILE_TYPES.X`
 *
 * @param {*} tile - Tile to check
 * @param {number} tileType - Expected TILE_TYPES value
 * @returns {boolean} True if tile is an object of the specified type
 *
 * @example
 * // ❌ BAD - Verbose and repetitive
 * if (tapTile && typeof tapTile === 'object' && tapTile !== null && tapTile.type === TILE_TYPES.BOMB) {
 *     return tapTile.actionsSincePlaced;
 * }
 *
 * // ✅ GOOD - Clean and semantic
 * if (isTileObjectOfType(tapTile, TILE_TYPES.BOMB)) {
 *     return tapTile.actionsSincePlaced;
 * }
 */
export function isTileObjectOfType(tile, tileType) {
    return isTileObject(tile) && tile.type === tileType;
}

/**
 * Checks if a tile object matches a type AND has a specific property value.
 *
 * @param {*} tile - Tile to check
 * @param {number} tileType - Expected TILE_TYPES value
 * @param {string} property - Property name to check
 * @param {*} expectedValue - Expected property value
 * @returns {boolean} True if all conditions match
 *
 * @example
 * isTileObjectWithProperty({ type: TILE_TYPES.BOMB, justPlaced: true }, TILE_TYPES.BOMB, 'justPlaced', true)  // → true
 */
export function isTileObjectWithProperty(tile, tileType, property, expectedValue) {
    return isTileObjectOfType(tile, tileType) && tile[property] === expectedValue;
}

// ========================================
// MIGRATION ALIASES
// ========================================
// For backward compatibility during refactoring

/**
 * @deprecated Use isTileType() instead
 * Alias maintained for backward compatibility during migration
 */
export function checkTileType(tile, tileType) {
    return isTileType(tile, tileType);
}

/**
 * @deprecated Use isTileObject() instead
 * Alias maintained for backward compatibility during migration
 */
export function isTileObj(tile) {
    return isTileObject(tile);
}
