import { TILE_TYPES } from '../../core/constants/index.js';

// Import all strategies
import { FloorRenderStrategy } from './FloorRenderStrategy.js';
import { ExitRenderStrategy } from './ExitRenderStrategy.js';
import { WaterRenderStrategy } from './WaterRenderStrategy.js';
import { WallRenderStrategy } from './WallRenderStrategy.js';
import { RockRenderStrategy } from './RockRenderStrategy.js';
import { GrassRenderStrategy } from './GrassRenderStrategy.js';
import { HouseRenderStrategy } from './HouseRenderStrategy.js';
import { ShackRenderStrategy } from './ShackRenderStrategy.js';
import { WellRenderStrategy } from './WellRenderStrategy.js';
import { DeadTreeRenderStrategy } from './DeadTreeRenderStrategy.js';
import { StatueRenderStrategy } from './StatueRenderStrategy.js';
import { SimpleOverlayRenderStrategy } from './SimpleOverlayRenderStrategy.js';
import { FoodRenderStrategy } from './FoodRenderStrategy.js';
import { BombRenderStrategy } from './BombRenderStrategy.js';
import { SimpleItemRenderStrategy } from './SimpleItemRenderStrategy.js';
import { PortRenderStrategy } from './PortRenderStrategy.js';
import { CisternRenderStrategy } from './CisternRenderStrategy.js';
import { PitfallRenderStrategy } from './PitfallRenderStrategy.js';
import type { TileRenderStrategy } from './TileRenderStrategy.js';
import type { ImageCache } from '../types.js';
import type { MultiTileHandler } from '../MultiTileHandler.js';
import type { WallTileRenderer } from '../WallTileRenderer.js';
import type { StructureTileRenderer } from '../StructureTileRenderer.js';

/**
 * Registry that maps tile types to their rendering strategies.
 * Implements the Strategy pattern to eliminate massive if/else chains.
 */
export class TileStrategyRegistry {
    private images: ImageCache;
    private tileSize: number;
    private multiTileHandler: typeof MultiTileHandler;
    private wallRenderer: WallTileRenderer;
    private structureRenderer: StructureTileRenderer;
    private strategies: Map<number, TileRenderStrategy>;

    constructor(
        images: ImageCache,
        tileSize: number,
        multiTileHandler: typeof MultiTileHandler,
        wallRenderer: WallTileRenderer,
        structureRenderer: StructureTileRenderer
    ) {
        this.images = images;
        this.tileSize = tileSize;
        this.multiTileHandler = multiTileHandler;
        this.wallRenderer = wallRenderer;
        this.structureRenderer = structureRenderer;
        this.strategies = new Map();

        this.initializeStrategies();
    }

    private initializeStrategies(): void {
        // Base tiles
        this.register(TILE_TYPES.FLOOR, new FloorRenderStrategy(this.images, this.tileSize));
        this.register(TILE_TYPES.EXIT, new ExitRenderStrategy(this.images, this.tileSize));
        this.register(TILE_TYPES.WATER, new WaterRenderStrategy(this.images, this.tileSize));
        this.register(TILE_TYPES.PORT, new PortRenderStrategy(this.images, this.tileSize, this.multiTileHandler));

        // Wall and grass tiles
        this.register(TILE_TYPES.WALL, new WallRenderStrategy(this.images, this.tileSize, this.wallRenderer));
        this.register(TILE_TYPES.ROCK, new RockRenderStrategy(this.images, this.tileSize, this.wallRenderer));
        this.register(TILE_TYPES.GRASS, new GrassRenderStrategy(this.images, this.tileSize, this.wallRenderer));
        this.register(TILE_TYPES.SHRUBBERY, new GrassRenderStrategy(this.images, this.tileSize, this.wallRenderer));

        // Structure tiles
        this.register(TILE_TYPES.HOUSE, new HouseRenderStrategy(this.images, this.tileSize, this.multiTileHandler));
        this.register(TILE_TYPES.SHACK, new ShackRenderStrategy(this.images, this.tileSize, this.multiTileHandler));
        this.register(TILE_TYPES.WELL, new WellRenderStrategy(this.images, this.tileSize, this.multiTileHandler));
        this.register(TILE_TYPES.DEADTREE, new DeadTreeRenderStrategy(this.images, this.tileSize, this.multiTileHandler));

        // Statues
        const statueStrategy = new StatueRenderStrategy(this.images, this.tileSize);
        this.register(TILE_TYPES.LIZARDY_STATUE, statueStrategy);
        this.register(TILE_TYPES.LIZARDO_STATUE, statueStrategy);
        this.register(TILE_TYPES.LIZARDEAUX_STATUE, statueStrategy);
        this.register(TILE_TYPES.LIZORD_STATUE, statueStrategy);
        this.register(TILE_TYPES.ZARD_STATUE, statueStrategy);
        this.register(TILE_TYPES.LAZERD_STATUE, statueStrategy);
        this.register(TILE_TYPES.BOMB_STATUE, statueStrategy);
        this.register(TILE_TYPES.SPEAR_STATUE, statueStrategy);
        this.register(TILE_TYPES.BOW_STATUE, statueStrategy);
        this.register(TILE_TYPES.HORSE_STATUE, statueStrategy);
        this.register(TILE_TYPES.BOOK_STATUE, statueStrategy);
        this.register(TILE_TYPES.SHOVEL_STATUE, statueStrategy);

        // Enemies and NPCs
        this.register(TILE_TYPES.ENEMY, new SimpleOverlayRenderStrategy(
            this.images, this.tileSize, 'lizardy', TILE_TYPES.ENEMY, '🦎', { font: '32px Arial', fillStyle: '#FF1493' }
        ));
        // Merchant NPCs (in merchant/ subdirectory)
        this.register(TILE_TYPES.PENNE, new SimpleOverlayRenderStrategy(
            this.images, this.tileSize, 'merchant/penne', TILE_TYPES.PENNE, '🍝', { font: '32px Arial', fillStyle: '#FFD700' }
        ));
        this.register(TILE_TYPES.SQUIG, new SimpleOverlayRenderStrategy(
            this.images, this.tileSize, 'merchant/squig', TILE_TYPES.SQUIG, '🐸', null
        ));
        this.register(TILE_TYPES.RUNE, new SimpleOverlayRenderStrategy(
            this.images, this.tileSize, 'merchant/rune', TILE_TYPES.RUNE, '🧙', null
        ));
        this.register(TILE_TYPES.NIB, new SimpleOverlayRenderStrategy(
            this.images, this.tileSize, 'merchant/nib', TILE_TYPES.NIB, '📖', null
        ));
        this.register(TILE_TYPES.MARK, new SimpleOverlayRenderStrategy(
            this.images, this.tileSize, 'merchant/mark', TILE_TYPES.MARK, '🗺️', null
        ));
        this.register(TILE_TYPES.AXELOTL, new SimpleOverlayRenderStrategy(
            this.images, this.tileSize, 'merchant/axolotl', TILE_TYPES.AXELOTL, 'AXL', { font: '20px Arial', fillStyle: '#000000' }
        ));
        this.register(TILE_TYPES.GOUGE, new SimpleOverlayRenderStrategy(
            this.images, this.tileSize, 'merchant/gouge', TILE_TYPES.GOUGE, 'GOU', { font: '20px Arial', fillStyle: '#FFFFFF' }
        ));

        // Tutorial NPCs (in tutorial/ subdirectory)
        this.register(TILE_TYPES.CRAYN, new SimpleOverlayRenderStrategy(
            this.images, this.tileSize, 'tutorial/crayn', TILE_TYPES.CRAYN, '🦎', null
        ));
        this.register(TILE_TYPES.FELT, new SimpleOverlayRenderStrategy(
            this.images, this.tileSize, 'tutorial/felt', TILE_TYPES.FELT, '🙋', null
        ));
        this.register(TILE_TYPES.FORGE, new SimpleOverlayRenderStrategy(
            this.images, this.tileSize, 'tutorial/forge', TILE_TYPES.FORGE, '🛠️', null
        ));

        // Gossip NPCs - register all gossip NPC tile types dynamically
        this.registerGossipNPCs();

        // Items
        this.register(TILE_TYPES.FOOD, new FoodRenderStrategy(this.images, this.tileSize));
        this.register(TILE_TYPES.BOMB, new BombRenderStrategy(this.images, this.tileSize));

        this.register(TILE_TYPES.AXE, new SimpleItemRenderStrategy(
            this.images, this.tileSize, 'axe', TILE_TYPES.AXE, '🪓', { scale: 1.0 }
        ));
        this.register(TILE_TYPES.HAMMER, new SimpleItemRenderStrategy(
            this.images, this.tileSize, 'hammer', TILE_TYPES.HAMMER, '🔨', { scale: 1.0 }
        ));
        this.register(TILE_TYPES.BISHOP_SPEAR, new SimpleItemRenderStrategy(
            this.images, this.tileSize, 'spear', TILE_TYPES.SPEAR, '🔱',
            { scaleToFit: true, fallbackFontSize: 24 }
        ));
        this.register(TILE_TYPES.HORSE_ICON, new SimpleItemRenderStrategy(
            this.images, this.tileSize, 'horse', TILE_TYPES.HORSE_ICON, '🐎',
            { scaleToFit: true, scale: 0.7, fallbackFontSize: 24 }
        ));
        this.register(TILE_TYPES.HEART, new SimpleItemRenderStrategy(
            this.images, this.tileSize, 'heart', TILE_TYPES.HEART, '💖',
            { scale: 0.65, disableSmoothing: true }
        ));
        this.register(TILE_TYPES.NOTE, new SimpleItemRenderStrategy(
            this.images, this.tileSize, 'note', TILE_TYPES.NOTE, '📄',
            { scaleToFit: true, scale: 0.7, fallbackFontSize: 24 }
        ));
        this.register(TILE_TYPES.SIGN, new SimpleItemRenderStrategy(
            this.images, this.tileSize, 'sign', TILE_TYPES.SIGN, 'S',
            { scale: 1.0, fallbackFontSize: 24 }
        ));
        this.register(TILE_TYPES.BOOK_OF_TIME_TRAVEL, new SimpleItemRenderStrategy(
            this.images, this.tileSize, 'book', TILE_TYPES.BOOK_OF_TIME_TRAVEL, '📖',
            { scaleToFit: true, scale: 0.7 }
        ));
        this.register(TILE_TYPES.BOW, new SimpleItemRenderStrategy(
            this.images, this.tileSize, 'bow', TILE_TYPES.BOW, '🏹',
            { rotation: -Math.PI / 2 }
        ));
        this.register(TILE_TYPES.SHOVEL, new SimpleItemRenderStrategy(
            this.images, this.tileSize, 'shovel', TILE_TYPES.SHOVEL, '⛏️', { scale: 1.0 }
        ));

        // Special tiles
        this.register(TILE_TYPES.TABLE, new SimpleOverlayRenderStrategy(
            this.images, this.tileSize, 'doodads/table', TILE_TYPES.TABLE, null, null
        ));
        this.register(TILE_TYPES.CISTERN, new CisternRenderStrategy(this.images, this.tileSize, this.structureRenderer));
        this.register(TILE_TYPES.PITFALL, new PitfallRenderStrategy(this.images, this.tileSize, this.structureRenderer));
    }

    /**
     * Register all gossip NPC tile types dynamically.
     * Gossip NPCs are stored in characters/npcs/gossip/ and use the pattern "gossip/name" for sprite keys.
     */
    private registerGossipNPCs(): void {
        // List of all gossip NPC names (matching the tile type names in TILE_TYPES)
        const gossipNPCs = [
            'ASTER', 'BLOT', 'BLOTTER', 'BRUSH', 'BURIN', 'CALAMUS', 'CAP', 'CINNABAR',
            'CROCK', 'FILUM', 'FORK', 'GEL', 'GOUACHE', 'HANE', 'KRAFT', 'MERKI',
            'MICRON', 'PENNI', 'PLUMA', 'PLUME', 'QUILL', 'RADDLE', 'SCRITCH',
            'SILVER', 'SINE', 'SLATE', 'SLICK', 'SLUG', 'STYLET', 'VELLUM'
        ];

        gossipNPCs.forEach(npcName => {
            const tileType = (TILE_TYPES as any)[npcName];
            if (tileType !== undefined) {
                // Sprite key is "gossip/lowercase-name" (e.g., "gossip/aster")
                const spriteKey = `gossip/${npcName.toLowerCase()}`;
                // Use the first 3 letters as fallback text
                const fallbackText = npcName.substring(0, 3).toUpperCase();

                this.register(tileType, new SimpleOverlayRenderStrategy(
                    this.images, this.tileSize, spriteKey, tileType, fallbackText,
                    { font: '12px Arial', fillStyle: '#FFFFFF' }
                ));
            }
        });
    }

    /**
     * Register a strategy for a tile type.
     */
    register(tileType: number, strategy: TileRenderStrategy): void {
        this.strategies.set(tileType, strategy);
    }

    /**
     * Get the strategy for a tile type.
     * Returns null if no strategy is registered.
     */
    getStrategy(tileType: number): TileRenderStrategy | null {
        return this.strategies.get(tileType) || null;
    }

    /**
     * Check if a strategy exists for a tile type.
     */
    hasStrategy(tileType: number): boolean {
        return this.strategies.has(tileType);
    }
}
