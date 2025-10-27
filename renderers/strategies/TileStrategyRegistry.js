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

/**
 * Registry that maps tile types to their rendering strategies.
 * Implements the Strategy pattern to eliminate massive if/else chains.
 */
export class TileStrategyRegistry {
    constructor(images, tileSize, multiTileHandler, wallRenderer, structureRenderer) {
        this.images = images;
        this.tileSize = tileSize;
        this.multiTileHandler = multiTileHandler;
        this.wallRenderer = wallRenderer;
        this.structureRenderer = structureRenderer;
        this.strategies = new Map();

        this.initializeStrategies();
    }

    initializeStrategies() {
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
        this.register(TILE_TYPES.PENNE, new SimpleOverlayRenderStrategy(
            this.images, this.tileSize, 'penne', TILE_TYPES.PENNE, '🍝', { font: '32px Arial', fillStyle: '#FFD700' }
        ));
        this.register(TILE_TYPES.SQUIG, new SimpleOverlayRenderStrategy(
            this.images, this.tileSize, 'squig', TILE_TYPES.SQUIG, '🐸', null
        ));
        this.register(TILE_TYPES.RUNE, new SimpleOverlayRenderStrategy(
            this.images, this.tileSize, 'rune', TILE_TYPES.RUNE, '🧙', null
        ));
        this.register(TILE_TYPES.NIB, new SimpleOverlayRenderStrategy(
            this.images, this.tileSize, 'nib', TILE_TYPES.NIB, '📖', null
        ));
        this.register(TILE_TYPES.MARK, new SimpleOverlayRenderStrategy(
            this.images, this.tileSize, 'mark', TILE_TYPES.MARK, '🗺️', null
        ));
        this.register(TILE_TYPES.CRAYN, new SimpleOverlayRenderStrategy(
            this.images, this.tileSize, 'crayn', TILE_TYPES.CRAYN, '🦎', null
        ));
        this.register(TILE_TYPES.FELT, new SimpleOverlayRenderStrategy(
            this.images, this.tileSize, 'felt', TILE_TYPES.FELT, '🙋', null
        ));
        this.register(TILE_TYPES.FORGE, new SimpleOverlayRenderStrategy(
            this.images, this.tileSize, 'forge', TILE_TYPES.FORGE, '🛠️', null
        ));
        this.register(TILE_TYPES.AXELOTL, new SimpleOverlayRenderStrategy(
            this.images, this.tileSize, 'axolotl', TILE_TYPES.AXELOTL, 'AXL', { font: '20px Arial', fillStyle: '#000000' }
        ));
        this.register(TILE_TYPES.GOUGE, new SimpleOverlayRenderStrategy(
            this.images, this.tileSize, 'gouge', TILE_TYPES.GOUGE, 'GOU', { font: '20px Arial', fillStyle: '#FFFFFF' }
        ));

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
     * Register a strategy for a tile type.
     */
    register(tileType, strategy) {
        this.strategies.set(tileType, strategy);
    }

    /**
     * Get the strategy for a tile type.
     * Returns null if no strategy is registered.
     */
    getStrategy(tileType) {
        return this.strategies.get(tileType) || null;
    }

    /**
     * Check if a strategy exists for a tile type.
     */
    hasStrategy(tileType) {
        return this.strategies.has(tileType);
    }
}
