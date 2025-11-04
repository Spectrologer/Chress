/**
 * Code Generator for TypeChecks.ts
 *
 * This script generates the repetitive type checker methods based on configuration.
 * Run this whenever you need to add new tile types or modify the type checking structure.
 *
 * Usage: ts-node utils/generateTypeChecks.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ========================================
// CONFIGURATION
// ========================================

/**
 * Define all tile type checkers
 * Format: { methodName: 'TILE_TYPE_CONSTANT' }
 */
const TILE_TYPE_CHECKERS: Record<string, string> = {
    // Basic terrain types
    isFloor: 'FLOOR',
    isWall: 'WALL',
    isGrass: 'GRASS',
    isExit: 'EXIT',
    isRock: 'ROCK',

    // Buildings
    isHouse: 'HOUSE',
    isShack: 'SHACK',

    // Environmental
    isWater: 'WATER',
    isFood: 'FOOD',
    isShrubbery: 'SHRUBBERY',
    isWell: 'WELL',
    isDeadTree: 'DEADTREE',

    // Tools & Equipment
    isAxe: 'AXE',
    isHammer: 'HAMMER',
    isBishopSpear: 'BISHOP_SPEAR',
    isBow: 'BOW',
    isShovel: 'SHOVEL',

    // Special items
    isBomb: 'BOMB',
    isHeart: 'HEART',
    isNote: 'NOTE',
    isBookOfTimeTravel: 'BOOK_OF_TIME_TRAVEL',
    isHorseIcon: 'HORSE_ICON',

    // Interactive objects
    isSign: 'SIGN',
    isPort: 'PORT',
    isCistern: 'CISTERN',
    isPitfall: 'PITFALL',
    isTable: 'TABLE',

    // Item statues
    isBombStatue: 'BOMB_STATUE',
    isSpearStatue: 'SPEAR_STATUE',
    isBowStatue: 'BOW_STATUE',
    isHorseStatue: 'HORSE_STATUE',
    isBookStatue: 'BOOK_STATUE',
    isShovelStatue: 'SHOVEL_STATUE',
};

/**
 * Define all entity type checkers
 */
const ENTITY_TYPE_CHECKERS: Record<string, string> = {
    // NPCs
    isPenne: 'PENNE',
    isSquig: 'SQUIG',
    isNib: 'NIB',
    isRune: 'RUNE',
    isCrayn: 'CRAYN',
    isFelt: 'FELT',
    isForge: 'FORGE',
    isMark: 'MARK',
    isAxolotl: 'AXELOTL',
    isGouge: 'GOUGE',
    isAster: 'ASTER',
    isBlot: 'BLOT',
    isBlotter: 'BLOTTER',
    isBrush: 'BRUSH',
    isBurin: 'BURIN',
    isCalamus: 'CALAMUS',
    isCap: 'CAP',
    isCinnabar: 'CINNABAR',
    isCrock: 'CROCK',
    isFilum: 'FILUM',
    isFork: 'FORK',
    isGel: 'GEL',
    isGouache: 'GOUACHE',
    isHane: 'HANE',
    isKraft: 'KRAFT',
    isMerki: 'MERKI',
    isMicron: 'MICRON',
    isPenni: 'PENNI',
    isPluma: 'PLUMA',
    isPlume: 'PLUME',
    isQuill: 'QUILL',
    isRaddle: 'RADDLE',
    isScritch: 'SCRITCH',
    isSilver: 'SILVER',
    isSine: 'SINE',
    isSlate: 'SLATE',
    isSlick: 'SLICK',
    isSlug: 'SLUG',
    isStylet: 'STYLET',
    isVellum: 'VELLUM',

    // Enemies
    isEnemy: 'ENEMY',

    // Enemy statues
    isLizardyStatue: 'LIZARDY_STATUE',
    isLizardoStatue: 'LIZARDO_STATUE',
    isLizardeauxStatue: 'LIZARDEAUX_STATUE',
    isZardStatue: 'ZARD_STATUE',
    isLazerdStatue: 'LAZERD_STATUE',
    isLizordStatue: 'LIZORD_STATUE',
};

interface CheckerConfig {
    description: string;
    types: string[];
}

/**
 * Define category checkers (groups of types) for TileTypeChecker
 */
const TILE_CATEGORY_CHECKERS: Record<string, CheckerConfig> = {
    isItem: {
        description: 'Checks if a tile is a collectible item.',
        types: ['AXE', 'HAMMER', 'BISHOP_SPEAR', 'HORSE_ICON', 'BOMB', 'HEART', 'WATER', 'FOOD', 'NOTE', 'BOOK_OF_TIME_TRAVEL', 'BOW', 'SHOVEL']
    },
    isChoppable: {
        description: 'Checks if a tile is choppable (requires axe).',
        types: ['GRASS', 'SHRUBBERY']
    },
    isBreakable: {
        description: 'Checks if a tile is breakable (requires hammer).',
        types: ['ROCK']
    },
};

/**
 * Define category checkers for EntityTypeChecker
 */
const ENTITY_CATEGORY_CHECKERS: Record<string, CheckerConfig> = {
    isNPC: {
        description: 'Checks if a tile is an NPC.',
        types: ['PENNE', 'SQUIG', 'NIB', 'RUNE', 'CRAYN', 'FELT', 'FORGE', 'MARK', 'AXELOTL', 'GOUGE',
                'ASTER', 'BLOT', 'BLOTTER', 'BRUSH', 'BURIN', 'CALAMUS', 'CAP', 'CINNABAR', 'CROCK',
                'FILUM', 'FORK', 'GEL', 'GOUACHE', 'HANE', 'KRAFT', 'MERKI', 'MICRON', 'PENNI',
                'PLUMA', 'PLUME', 'QUILL', 'RADDLE', 'SCRITCH', 'SILVER', 'SINE', 'SLATE', 'SLICK',
                'SLUG', 'STYLET', 'VELLUM']
    },
    isEnemyStatue: {
        description: 'Checks if a tile is any type of enemy statue.',
        types: ['LIZARDY_STATUE', 'LIZARDO_STATUE', 'LIZARDEAUX_STATUE', 'ZARD_STATUE', 'LAZERD_STATUE', 'LIZORD_STATUE']
    },
};

/**
 * Combined statue checker for convenience
 */
const COMBINED_CHECKERS: Record<string, CheckerConfig> = {
    isStatue: {
        description: 'Checks if a tile is any type of statue (enemy or item).',
        types: [
            'LIZARDY_STATUE', 'LIZARDO_STATUE', 'LIZARDEAUX_STATUE', 'ZARD_STATUE', 'LAZERD_STATUE', 'LIZORD_STATUE',
            'BOMB_STATUE', 'SPEAR_STATUE', 'BOW_STATUE', 'HORSE_STATUE', 'BOOK_STATUE', 'SHOVEL_STATUE'
        ]
    }
};

// ========================================
// CODE GENERATION FUNCTIONS
// ========================================

function generateSimpleTypeChecker(methodName: string, tileTypeConstant: string): string {
    return `    static ${methodName}(tile: any): boolean {
        return TileTypeChecker.isTileType(tile, TILE_TYPES.${tileTypeConstant});
    }`;
}

function generateCategoryChecker(methodName: string, description: string, types: string[]): string {
    const conditions = types.map(type => `type === TILE_TYPES.${type}`).join(' ||\n               ');

    return `    /**
     * ${description}
     *
     * @param tile - Tile to check
     * @returns True if tile matches the category
     */
    static ${methodName}(tile: any): boolean {
        const type = TileTypeChecker.getTileType(tile);
        return ${conditions};
    }`;
}

function generateCombinedChecker(methodName: string, description: string, types: string[]): string {
    const conditions = types.map(type => `type === TILE_TYPES.${type}`).join(' ||\n           ');

    return `/**
 * ${description}
 *
 * @param tile - Tile to check
 * @returns True if tile matches any of the types
 */
export function ${methodName}(tile: any): boolean {
    const type = TileTypeChecker.getTileType(tile);
    return ${conditions};
}`;
}

function generateBackwardCompatibilityExport(methodName: string): string {
    return `export const ${methodName} = TileTypeChecker.${methodName}.bind(TileTypeChecker);`;
}

function generateEntityBackwardCompatibilityExport(methodName: string): string {
    return `export const ${methodName} = EntityTypeChecker.${methodName}.bind(EntityTypeChecker);`;
}

// ========================================
// MAIN GENERATION
// ========================================

function generateTypeChecksFile(): string {
    const sections: string[] = [];

    // File header
    sections.push(`/**
 * TypeChecks - Standardized type checking utilities for the Chress codebase
 *
 * ⚠️  THIS FILE IS AUTO-GENERATED - DO NOT EDIT DIRECTLY
 * Generated by: utils/generateTypeChecks.ts
 * To modify: Edit the configuration in generateTypeChecks.ts and regenerate
 *
 * PROBLEM SOLVED:
 * This module eliminates 111 instances of inconsistent type checking patterns:
 * - 29 instances of verbose \`typeof tile === 'object' && tile !== null\` checks
 * - 102 instances of direct \`tile === TILE_TYPES.X\` comparisons
 * - 123 instances already using proper \`isTileType()\` pattern
 *
 * RECOMMENDED USAGE:
 * ✅ GOOD: TileTypeChecker.isBomb(tile), TileTypeChecker.isTileObject(tile)
 * ✅ GOOD: EntityTypeChecker.isPenne(tile), EntityTypeChecker.isNPC(tile)
 * ❌ BAD:  typeof tile === 'object' && tile !== null && tile.type === TILE_TYPES.BOMB
 * ❌ BAD:  tile === TILE_TYPES.BOMB (when tile could be an object)
 *
 * Import and use these utilities throughout the codebase for consistent type checking.
 */

import { TILE_TYPES } from '@core/constants/index';

// ========================================
// TILE TYPE CHECKER CLASS
// ========================================

/**
 * TileTypeChecker - Handles all tile-related type checking
 * Includes terrain, items, structures, and interactive objects
 */
export class TileTypeChecker {
    // ========================================
    // CORE TYPE UTILITIES
    // ========================================

    /**
     * Normalizes a tile to its type value.
     * Handles both primitive tile types (numbers) and tile objects.
     *
     * This is the foundation for all type checking in the codebase.
     *
     * @param tile - Tile value or object
     * @returns The tile type number, or undefined if invalid
     *
     * @example
     * TileTypeChecker.getTileType(TILE_TYPES.FLOOR)                    // → 0
     * TileTypeChecker.getTileType({ type: TILE_TYPES.BOMB })           // → 24
     * TileTypeChecker.getTileType(null)                                // → undefined
     */
    static getTileType(tile: any): number | undefined {
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
     * Replaces the verbose pattern: \`typeof tile === 'object' && tile !== null\`
     *
     * USE THIS WHEN:
     * - You need to access tile properties like \`tile.actionsSincePlaced\`
     * - You need to validate a tile is an object before accessing object-specific data
     * - You're performing defensive checks before object property access
     *
     * @param tile - Value to check
     * @returns True if tile is a valid object with a type property
     *
     * @example
     * // ❌ BAD - Verbose pattern
     * if (tapTile && typeof tapTile === 'object' && tapTile !== null) {
     *     return tapTile.actionsSincePlaced > 0;
     * }
     *
     * // ✅ GOOD - Clean pattern
     * if (TileTypeChecker.isTileObject(tapTile)) {
     *     return tapTile.actionsSincePlaced > 0;
     * }
     */
    static isTileObject(tile: any): boolean {
        return tile !== null && typeof tile === 'object' && tile.type !== undefined;
    }

    /**
     * Checks if a tile has the specified type.
     * Handles both primitive tiles and tile objects seamlessly.
     *
     * This is the recommended way to check tile types throughout the codebase.
     *
     * @param tile - Tile to check
     * @param tileType - Expected TILE_TYPES value
     * @returns True if tile matches the specified type
     *
     * @example
     * // Works with primitive tiles
     * TileTypeChecker.isTileType(TILE_TYPES.BOMB, TILE_TYPES.BOMB)                    // → true
     *
     * // Works with object tiles
     * TileTypeChecker.isTileType({ type: TILE_TYPES.BOMB, justPlaced: true }, TILE_TYPES.BOMB)  // → true
     *
     * // Handles null/undefined safely
     * TileTypeChecker.isTileType(null, TILE_TYPES.FLOOR)                             // → false
     */
    static isTileType(tile: any, tileType: number): boolean {
        return TileTypeChecker.getTileType(tile) === tileType;
    }

    /**
     * Checks if a value is a valid tile (either primitive or object).
     *
     * @param tile - Value to check
     * @returns True if the value is a valid tile
     *
     * @example
     * TileTypeChecker.isValidTile(TILE_TYPES.FLOOR)           // → true
     * TileTypeChecker.isValidTile({ type: TILE_TYPES.BOMB })  // → true
     * TileTypeChecker.isValidTile(null)                       // → false
     */
    static isValidTile(tile: any): boolean {
        return TileTypeChecker.getTileType(tile) !== undefined;
    }

    // ========================================
    // SPECIFIC TILE TYPE CHECKERS (GENERATED)
    // ========================================
`);

    // Generate tile type checkers
    const tileCheckers = Object.entries(TILE_TYPE_CHECKERS).map(([method, constant]) =>
        generateSimpleTypeChecker(method, constant)
    );
    sections.push(tileCheckers.join('\n\n'));

    // Category checkers
    sections.push(`

    // ========================================
    // CATEGORY CHECKERS
    // ========================================

    /**
     * Checks if a tile is walkable (not blocking movement).
     * Walls, rocks, houses, and shacks block movement.
     *
     * @param tile - Tile to check
     * @returns True if tile allows movement
     */
    static isWalkable(tile: any): boolean {
        const type = TileTypeChecker.getTileType(tile);
        return type !== TILE_TYPES.WALL &&
               type !== TILE_TYPES.ROCK &&
               type !== TILE_TYPES.HOUSE &&
               type !== TILE_TYPES.SHACK &&
               type !== TILE_TYPES.SIGN;
    }
`);

    const tileCategoryCheckers = Object.entries(TILE_CATEGORY_CHECKERS).map(([method, config]) =>
        generateCategoryChecker(method, config.description, config.types)
    );
    sections.push(tileCategoryCheckers.join('\n\n'));

    // Object property helpers
    sections.push(`

    // ========================================
    // OBJECT PROPERTY HELPERS
    // ========================================

    /**
     * Safely gets a property from a tile object.
     * Returns undefined if the tile is not an object or doesn't have the property.
     *
     * @param tile - Tile to check
     * @param property - Property name to retrieve
     * @returns The property value, or undefined
     *
     * @example
     * TileTypeChecker.getTileProperty({ type: TILE_TYPES.BOMB, actionsSincePlaced: 5 }, 'actionsSincePlaced')  // → 5
     * TileTypeChecker.getTileProperty(TILE_TYPES.FLOOR, 'actionsSincePlaced')                                  // → undefined
     */
    static getTileProperty(tile: any, property: string): any {
        if (TileTypeChecker.isTileObject(tile)) {
            return tile[property];
        }
        return undefined;
    }

    /**
     * Checks if a tile object has a specific property.
     *
     * @param tile - Tile to check
     * @param property - Property name to check for
     * @returns True if the tile is an object and has the property
     *
     * @example
     * TileTypeChecker.hasTileProperty({ type: TILE_TYPES.BOMB, justPlaced: true }, 'justPlaced')  // → true
     * TileTypeChecker.hasTileProperty(TILE_TYPES.FLOOR, 'justPlaced')                             // → false
     */
    static hasTileProperty(tile: any, property: string): boolean {
        return TileTypeChecker.isTileObject(tile) && property in tile;
    }

    /**
     * Checks if a tile is an object with a specific type.
     * Useful for validating before accessing object-specific properties.
     *
     * Replaces: \`typeof tile === 'object' && tile !== null && tile.type === TILE_TYPES.X\`
     *
     * @param tile - Tile to check
     * @param tileType - Expected TILE_TYPES value
     * @returns True if tile is an object of the specified type
     *
     * @example
     * // ❌ BAD - Verbose and repetitive
     * if (tapTile && typeof tapTile === 'object' && tapTile !== null && tapTile.type === TILE_TYPES.BOMB) {
     *     return tapTile.actionsSincePlaced;
     * }
     *
     * // ✅ GOOD - Clean and semantic
     * if (TileTypeChecker.isTileObjectOfType(tapTile, TILE_TYPES.BOMB)) {
     *     return tapTile.actionsSincePlaced;
     * }
     */
    static isTileObjectOfType(tile: any, tileType: number): boolean {
        return TileTypeChecker.isTileObject(tile) && tile.type === tileType;
    }

    /**
     * Checks if a tile object matches a type AND has a specific property value.
     *
     * @param tile - Tile to check
     * @param tileType - Expected TILE_TYPES value
     * @param property - Property name to check
     * @param expectedValue - Expected property value
     * @returns True if all conditions match
     *
     * @example
     * TileTypeChecker.isTileObjectWithProperty({ type: TILE_TYPES.BOMB, justPlaced: true }, TILE_TYPES.BOMB, 'justPlaced', true)  // → true
     */
    static isTileObjectWithProperty(tile: any, tileType: number, property: string, expectedValue: any): boolean {
        return TileTypeChecker.isTileObjectOfType(tile, tileType) && tile[property] === expectedValue;
    }
}

// ========================================
// ENTITY TYPE CHECKER CLASS
// ========================================

/**
 * EntityTypeChecker - Handles all entity-related type checking
 * Includes NPCs, enemies, and enemy statues
 */
export class EntityTypeChecker {
    // ========================================
    // SPECIFIC ENTITY TYPE CHECKERS (GENERATED)
    // ========================================
`);

    // Generate entity type checkers
    const entityCheckers = Object.entries(ENTITY_TYPE_CHECKERS).map(([method, constant]) =>
        generateSimpleTypeChecker(method, constant)
    );
    sections.push(entityCheckers.join('\n\n'));

    // Entity category checkers
    sections.push(`

    // ========================================
    // ENTITY CATEGORY CHECKERS
    // ========================================
`);

    const entityCategoryCheckers = Object.entries(ENTITY_CATEGORY_CHECKERS).map(([method, config]) =>
        generateCategoryChecker(method, config.description, config.types)
    );
    sections.push(entityCategoryCheckers.join('\n\n'));

    sections.push(`
}

// ========================================
// COMBINED CHECKERS (for convenience)
// ========================================
`);

    // Generate combined checkers
    const combinedCheckers = Object.entries(COMBINED_CHECKERS).map(([method, config]) =>
        generateCombinedChecker(method, config.description, config.types)
    );
    sections.push(combinedCheckers.join('\n\n'));

    // Backward compatibility exports
    sections.push(`

// ========================================
// BACKWARD COMPATIBILITY EXPORTS (GENERATED)
// ========================================
// These maintain the original function-based API while using the new class-based implementation

// Core utilities
export const getTileType = TileTypeChecker.getTileType.bind(TileTypeChecker);
export const isTileObject = TileTypeChecker.isTileObject.bind(TileTypeChecker);
export const isTileType = TileTypeChecker.isTileType.bind(TileTypeChecker);
export const isValidTile = TileTypeChecker.isValidTile.bind(TileTypeChecker);

// Tile type checkers
`);

    const tileExports = Object.keys(TILE_TYPE_CHECKERS).map(generateBackwardCompatibilityExport);
    sections.push(tileExports.join('\n'));

    sections.push(`

// Tile category checkers
export const isWalkable = TileTypeChecker.isWalkable.bind(TileTypeChecker);
`);

    const tileCategoryExports = Object.keys(TILE_CATEGORY_CHECKERS).map(generateBackwardCompatibilityExport);
    sections.push(tileCategoryExports.join('\n'));

    sections.push(`

// Tile property helpers
export const getTileProperty = TileTypeChecker.getTileProperty.bind(TileTypeChecker);
export const hasTileProperty = TileTypeChecker.hasTileProperty.bind(TileTypeChecker);
export const isTileObjectOfType = TileTypeChecker.isTileObjectOfType.bind(TileTypeChecker);
export const isTileObjectWithProperty = TileTypeChecker.isTileObjectWithProperty.bind(TileTypeChecker);

// Entity type checkers
`);

    const entityExports = Object.keys(ENTITY_TYPE_CHECKERS).map(generateEntityBackwardCompatibilityExport);
    sections.push(entityExports.join('\n'));

    sections.push(`

// Entity category checkers
`);

    const entityCategoryExports = Object.keys(ENTITY_CATEGORY_CHECKERS).map(generateEntityBackwardCompatibilityExport);
    sections.push(entityCategoryExports.join('\n'));

    // Migration aliases
    sections.push(`

// ========================================
// MIGRATION ALIASES
// ========================================
// For backward compatibility during refactoring

/**
 * @deprecated Use isTileType() instead
 * Alias maintained for backward compatibility during migration
 */
export function checkTileType(tile: any, tileType: number): boolean {
    return TileTypeChecker.isTileType(tile, tileType);
}

/**
 * @deprecated Use isTileObject() instead
 * Alias maintained for backward compatibility during migration
 */
export function isTileObj(tile: any): boolean {
    return TileTypeChecker.isTileObject(tile);
}
`);

    return sections.join('');
}

// ========================================
// SCRIPT EXECUTION
// ========================================

// Run the generator when script is executed directly
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputPath = path.join(__dirname, 'TypeChecks.ts');
const generatedCode = generateTypeChecksFile();

fs.writeFileSync(outputPath, generatedCode, 'utf8');
console.log(`✅ Successfully generated ${outputPath}`);
console.log(`📊 Statistics:`);
console.log(`   - ${Object.keys(TILE_TYPE_CHECKERS).length} tile type checkers`);
console.log(`   - ${Object.keys(ENTITY_TYPE_CHECKERS).length} entity type checkers`);
console.log(`   - ${Object.keys(TILE_CATEGORY_CHECKERS).length} tile category checkers`);
console.log(`   - ${Object.keys(ENTITY_CATEGORY_CHECKERS).length} entity category checkers`);
console.log(`   - ${Object.keys(COMBINED_CHECKERS).length} combined checkers`);
console.log(`   - Total lines: ${generatedCode.split('\n').length}`);
