/**
 * TileUtils - Compatibility layer for TypeChecks
 *
 * This file now re-exports from TypeChecks.ts to ensure consistency
 * and eliminate duplication of type checking logic.
 *
 * MIGRATION NOTE: All functions now use the centralized TypeChecks library.
 * This eliminates ad-hoc type checking patterns like:
 * - `typeof tile === 'object' && tile !== null && tile.type === TILE_TYPES.X`
 * - `tile && typeof tile === 'object' && 'type' in tile`
 *
 * These have been replaced with standardized utilities from TypeChecks.ts
 */

import {
    TileTypeChecker,
    type Tile as TypeChecksTile,
    getTileType as getType,
    isTileObject as isTileObj,
    isTileType as checkTileType
} from './TypeChecks';

// Re-export the Tile type
export type Tile = TypeChecksTile;

// Re-export core utilities
export const getTileType = getType;
export const isTileObject = isTileObj;
export const isTileType = checkTileType;

// Re-export specific tile type checkers from TypeChecks
export {
    isFloor,
    isWall,
    isGrass,
    isExit,
    isRock,
    isHouse,
    isShack,
    isWater,
    isFood,
    isShrubbery,
    isWell,
    isDeadTree,
    isAxe,
    isHammer,
    isBishopSpear,
    isBow,
    isShovel,
    isBomb,
    isHeart,
    isNote,
    isBookOfTimeTravel,
    isHorseIcon,
    isSign,
    isPort,
    isCistern,
    isPitfall,
    isTable,
    isPenne,
    isSquig,
    isNib,
    isRune,
    isWalkable,
    isItem,
    isChoppable,
    isBreakable
} from './TypeChecks';

// Re-export enemy checking (although isEnemy is in EntityTypeChecker)
export { isEnemy } from './TypeChecks';
