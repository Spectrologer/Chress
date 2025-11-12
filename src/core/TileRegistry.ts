import { TILE_TYPES } from './constants/index';
import { getTileType } from '@utils/TileUtils';

/**
 * Centralized registry for tile properties and metadata.
 * Provides a single source of truth for tile interaction, walkability, and behaviors.
 */
export class TileRegistry {
    // ========================================
    // TILE CATEGORIES
    // ========================================

    /**
     * NPC tiles that can be interacted with for barter/dialogue
     */
    static readonly NPC_TYPES: number[] = [
        TILE_TYPES.PENNE,
        TILE_TYPES.NIB,
        TILE_TYPES.RUNE,
        TILE_TYPES.MARK,
        TILE_TYPES.AXELOTL,
        TILE_TYPES.GOUGE,
        TILE_TYPES.CRAYN,
        TILE_TYPES.FELT,
        TILE_TYPES.FORGE
    ];

    /**
     * Enemy statue tiles (lizard variants)
     */
    static readonly ENEMY_STATUE_TYPES: number[] = [
        TILE_TYPES.LIZARDY_STATUE,
        TILE_TYPES.LIZARDO_STATUE,
        TILE_TYPES.LIZARDEAUX_STATUE,
        TILE_TYPES.ZARD_STATUE,
        TILE_TYPES.LAZERD_STATUE,
        TILE_TYPES.LIZORD_STATUE
    ];

    /**
     * Item statue tiles (activated item statues)
     */
    static readonly ITEM_STATUE_TYPES: number[] = [
        TILE_TYPES.BOMB_STATUE,
        TILE_TYPES.SPEAR_STATUE,
        TILE_TYPES.BOW_STATUE,
        TILE_TYPES.HORSE_STATUE,
        TILE_TYPES.BOOK_STATUE,
        TILE_TYPES.SHOVEL_STATUE
    ];

    /**
     * All statue types (enemy + item)
     */
    static readonly ALL_STATUE_TYPES: number[] = [
        ...TileRegistry.ENEMY_STATUE_TYPES,
        ...TileRegistry.ITEM_STATUE_TYPES
    ];

    /**
     * Choppable terrain tiles (requires axe)
     */
    static readonly CHOPPABLE_TYPES: number[] = [
        TILE_TYPES.GRASS,
        TILE_TYPES.SHRUBBERY
    ];

    /**
     * Breakable terrain tiles (requires hammer)
     */
    static readonly BREAKABLE_TYPES: number[] = [
        TILE_TYPES.ROCK
    ];

    /**
     * Tiles that can be walked on
     */
    static readonly WALKABLE_TYPES: number[] = [
        TILE_TYPES.FLOOR,
        TILE_TYPES.EXIT,
        TILE_TYPES.WATER,
        TILE_TYPES.AXE,
        TILE_TYPES.HAMMER,
        TILE_TYPES.BISHOP_SPEAR,
        TILE_TYPES.HORSE_ICON,
        TILE_TYPES.BOMB,
        TILE_TYPES.FOOD,
        TILE_TYPES.NOTE,
        TILE_TYPES.HEART,
        TILE_TYPES.BOOK_OF_TIME_TRAVEL,
        TILE_TYPES.BOW,
        TILE_TYPES.Grate,
        TILE_TYPES.PITFALL,
        TILE_TYPES.PORT,
        TILE_TYPES.SHOVEL,
        TILE_TYPES.FISCHERS_CUBE
    ];

    /**
     * Special interactive tiles (signs, tables, etc.)
     */
    static readonly SPECIAL_INTERACTIVE_TYPES: number[] = [
        TILE_TYPES.SIGN,
        TILE_TYPES.TABLE,
        TILE_TYPES.SIGN_METAL_ALT
    ];

    // ========================================
    // STATUE MAPPING
    // ========================================

    /**
     * Maps statue tile types to their NPC type string
     */
    static readonly STATUE_TO_NPC_TYPE: Record<number, string> = {
        // Enemy statues
        [TILE_TYPES.LIZARDY_STATUE]: 'statue_lizardy',
        [TILE_TYPES.LIZARDO_STATUE]: 'statue_lizardo',
        [TILE_TYPES.LIZARDEAUX_STATUE]: 'statue_lizardeaux',
        [TILE_TYPES.ZARD_STATUE]: 'statue_zard',
        [TILE_TYPES.LAZERD_STATUE]: 'statue_lazerd',
        [TILE_TYPES.LIZORD_STATUE]: 'statue_lizord',
        // Item statues
        [TILE_TYPES.BOMB_STATUE]: 'statue_bomb',
        [TILE_TYPES.SPEAR_STATUE]: 'statue_spear',
        [TILE_TYPES.BOW_STATUE]: 'statue_bow',
        [TILE_TYPES.HORSE_STATUE]: 'statue_horse',
        [TILE_TYPES.BOOK_STATUE]: 'statue_book',
        [TILE_TYPES.SHOVEL_STATUE]: 'statue_shovel'
    };

    // ========================================
    // QUERY METHODS
    // ========================================

    /**
     * Check if a tile is interactive (can be tapped/clicked)
     */
    static isInteractive(tileType: number): boolean {
        return (
            TileRegistry.NPC_TYPES.includes(tileType) ||
            TileRegistry.ALL_STATUE_TYPES.includes(tileType) ||
            TileRegistry.SPECIAL_INTERACTIVE_TYPES.includes(tileType) ||
            TileRegistry.CHOPPABLE_TYPES.includes(tileType) ||
            TileRegistry.BREAKABLE_TYPES.includes(tileType) ||
            tileType === TILE_TYPES.SQUIG // Special case for SQUIG (barter NPC)
        );
    }

    /**
     * Check if a tile is walkable
     * For multi-tile structures like BIG_TREE, position information is needed
     */
    static isWalkable(tile: number | any, x?: number, y?: number, grid?: any): boolean {
        const tileType = getTileType(tile);

        // Signs are explicitly not walkable
        if (tileType === TILE_TYPES.SIGN || tileType === TILE_TYPES.SIGN_METAL_ALT) {
            return false;
        }

        // Special handling for BIG_TREE: only upper 1 row is walkable
        if (tileType === TILE_TYPES.BIG_TREE && x !== undefined && y !== undefined && grid !== undefined) {
            return TileRegistry.isBigTreeWalkable(x, y, grid);
        }

        // Check against walkable types list
        return TileRegistry.WALKABLE_TYPES.includes(tileType);
    }

    /**
     * Check if a BIG_TREE tile at the given position is walkable.
     * BIG_TREE is 2x3 tiles: only the upper 1 row is walkable (row 0 from top),
     * the bottom 2 rows (rows 1-2) are not walkable.
     */
    static isBigTreeWalkable(x: number, y: number, grid: any): boolean {
        // Import MultiTileHandler dynamically to avoid circular dependencies
        const { MultiTileHandler } = require('@renderers/MultiTileHandler');

        const positionInfo = MultiTileHandler.findBigTreePosition(x, y, grid);
        if (!positionInfo) {
            return false; // Not part of a valid big tree structure
        }

        // Calculate position within the 2x3 structure
        const partY = y - positionInfo.startY;

        // Only the top row (0) is walkable, bottom 2 rows (1-2) are not
        return partY === 0;
    }

    /**
     * Check if a tile is choppable (requires axe)
     */
    static isChoppable(tileType: number): boolean {
        return TileRegistry.CHOPPABLE_TYPES.includes(tileType);
    }

    /**
     * Check if a tile is breakable (requires hammer)
     */
    static isBreakable(tileType: number): boolean {
        return TileRegistry.BREAKABLE_TYPES.includes(tileType);
    }

    /**
     * Check if a tile is a statue (any type)
     */
    static isStatue(tileType: number): boolean {
        return TileRegistry.ALL_STATUE_TYPES.includes(tileType);
    }

    /**
     * Check if a tile is an NPC
     */
    static isNPC(tileType: number): boolean {
        return TileRegistry.NPC_TYPES.includes(tileType) || tileType === TILE_TYPES.SQUIG;
    }

    /**
     * Get the NPC type string for a statue tile
     */
    static getStatueNPCType(tileType: number): string | null {
        return TileRegistry.STATUE_TO_NPC_TYPE[tileType] || null;
    }

    /**
     * Get the required tool for a terrain tile
     */
    static getRequiredTool(tileType: number): 'axe' | 'hammer' | null {
        if (TileRegistry.isChoppable(tileType)) {
            return 'axe';
        }
        if (TileRegistry.isBreakable(tileType)) {
            return 'hammer';
        }
        return null;
    }

    /**
     * Get all NPC tile types
     */
    static getNPCTypes(): number[] {
        return [...TileRegistry.NPC_TYPES, TILE_TYPES.SQUIG];
    }

    /**
     * Get all statue tile types
     */
    static getStatueTypes(): number[] {
        return [...TileRegistry.ALL_STATUE_TYPES];
    }

    /**
     * Get all choppable tile types
     */
    static getChoppableTypes(): number[] {
        return [...TileRegistry.CHOPPABLE_TYPES];
    }

    /**
     * Get all breakable tile types
     */
    static getBreakableTypes(): number[] {
        return [...TileRegistry.BREAKABLE_TYPES];
    }
}
