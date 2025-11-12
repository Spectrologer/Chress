import { TILE_TYPES, DIMENSION_CONSTANTS } from './constants/index';
import { logger } from './logger';
import type { Tile } from './SharedTypes';
import type { EnemyData } from '@entities/Enemy';

interface BoardData {
    size: [number, number];
    terrain: string[];
    features: Record<string, string>;
    overlays?: Record<string, string>;
    rotations?: Record<string, number>;
    overlayRotations?: Record<string, number>;
    signMessages?: Record<string, string>;
    metadata?: {
        dimension?: number;
        playerSpawn?: { x: number; y: number };
        gameMode?: string;
    };
}

interface BoardResult {
    grid: Tile[][];
    playerSpawn: { x: number; y: number };
    enemies: EnemyData[];
    terrainTextures: Record<string, string>;
    overlayTextures?: Record<string, string>;
    rotations: Record<string, number>;
    overlayRotations: Record<string, number>;
    metadata?: {
        playerSpawn?: { x: number; y: number };
        gameMode?: string;
    };
}

/**
 * BoardLoader - Loads custom board definitions from JSON files
 * Allows for hand-crafted zones instead of procedural generation
 */
export class BoardLoader {
    private boardCache: Map<string, BoardData>;
    private boardRegistry: Map<string, string>;

    constructor() {
        this.boardCache = new Map();
        this.boardRegistry = new Map();
    }

    /**
     * Register a board for a specific zone location
     */
    registerBoard(zoneX: number, zoneY: number, dimension: number, boardName: string, type = 'custom'): void {
        const key = this.createBoardKey(zoneX, zoneY, dimension);
        const boardPath = `${type}/${boardName}`;
        this.boardRegistry.set(key, boardPath);
        logger.log(`Registered ${type} board "${boardName}" for zone (${zoneX},${zoneY}) dimension ${dimension}`);
    }

    /**
     * Create a unique key for a zone location
     */
    createBoardKey(zoneX: number, zoneY: number, dimension: number): string {
        return `${zoneX},${zoneY}:${dimension}`;
    }

    /**
     * Check if a custom board exists for the given zone
     */
    hasBoard(zoneX: number, zoneY: number, dimension: number): boolean {
        const key = this.createBoardKey(zoneX, zoneY, dimension);
        return this.boardRegistry.has(key);
    }

    /**
     * Get a custom board synchronously (board must be pre-loaded)
     */
    getBoardSync(zoneX: number, zoneY: number, dimension: number): BoardData | null {
        const key = this.createBoardKey(zoneX, zoneY, dimension);

        // Check if board is registered for this location
        if (!this.boardRegistry.has(key)) {
            return null;
        }

        const boardName = this.boardRegistry.get(key)!;

        // Return from cache if available
        if (this.boardCache.has(boardName)) {
            return this.boardCache.get(boardName)!;
        }

        logger.warn(`Board "${boardName}" not pre-loaded. Call preloadAllBoards() first.`);
        return null;
    }

    /**
     * Load a custom board asynchronously
     */
    async loadBoard(zoneX: number, zoneY: number, dimension: number): Promise<BoardData | null> {
        const key = this.createBoardKey(zoneX, zoneY, dimension);

        // Check if board is registered for this location
        if (!this.boardRegistry.has(key)) {
            return null;
        }

        const boardName = this.boardRegistry.get(key)!;

        // Check cache first
        if (this.boardCache.has(boardName)) {
            return this.boardCache.get(boardName)!;
        }

        // Load from file
        try {
            // Add cache-busting parameter in development
            const cacheBust = `?v=${Date.now()}`;
            const response = await fetch(`boards/${boardName}.json${cacheBust}`);
            if (!response.ok) {
                logger.error(`Failed to load board "${boardName}": ${response.status}`);
                return null;
            }

            const boardData: BoardData = await response.json();

            // Validate board structure
            if (!this.validateBoard(boardData)) {
                logger.error(`Invalid board structure in "${boardName}"`);
                return null;
            }

            // Cache the board
            this.boardCache.set(boardName, boardData);

            return boardData;
        } catch (error) {
            logger.error(`Error loading board "${boardName}":`, error);
            return null;
        }
    }

    /**
     * Pre-load all registered boards
     * Call this during game initialization
     */
    async preloadAllBoards(): Promise<void> {
        const promises: Promise<BoardData | null>[] = [];
        for (const [key, boardName] of this.boardRegistry.entries()) {
            if (!this.boardCache.has(boardName)) {
                const [coords, dim] = key.split(':');
                const [x, y] = coords.split(',').map(Number);
                const dimension = parseInt(dim);
                promises.push(this.loadBoard(x, y, dimension));
            }
        }
        await Promise.all(promises);
        logger.log(`Pre-loaded ${promises.length} custom boards`);
    }

    /**
     * Validate board structure
     */
    validateBoard(board: BoardData): boolean {
        if (!board.size || !Array.isArray(board.size) || board.size.length !== 2) {
            logger.error('Board missing valid size array [width, height]');
            return false;
        }

        if (!board.terrain || !Array.isArray(board.terrain)) {
            logger.error('Board missing terrain array');
            return false;
        }

        const [width, height] = board.size;
        const expectedLength = width * height;

        if (board.terrain.length !== expectedLength) {
            logger.error(`Board terrain length ${board.terrain.length} doesn't match size ${width}x${height} (expected ${expectedLength})`);
            return false;
        }

        if (!board.features || typeof board.features !== 'object') {
            logger.error('Board missing features object');
            return false;
        }

        return true;
    }

    /**
     * Determine if a terrain value is a wall (non-walkable) based on folder path
     */
    isWallTerrain(terrain: string): boolean {
        if (!terrain) return false;

        // Check if terrain includes folder path
        if (terrain.includes('/')) {
            const folder = terrain.split('/')[0];

            // Special case: aqua tiles are non-walkable (water)
            if (terrain === 'floors/aqua') return true;

            // trim/* is walkable, so it's not a wall
            if (folder === 'trim') return false;
            return folder === 'walls' || folder === 'obstacles';
        }

        // Legacy format without folder - use lookup table
        const wallFolderItems = [
            '90s', 'astrocrag', 'blocklily', 'boulder', 'bush',
            'chargedwall', 'clubwall', 'clubwall1', 'clubwall2', 'clubwall4', 'clubwall5', 'clubwall6',
            'cobble', 'coralwall', 'deco', 'fortwall', 'heartstone',
            'lavawall', 'rockwall', 'stump', 'succulent', 'wall', 'zydeco'
        ];

        const obstacleFolderItems = ['rock', 'shrubbery'];
        const blockingDoodads = ['teleport_branch', 'hole', 'pitfall'];
        const nonWalkableFloors = ['aqua'];

        return wallFolderItems.includes(terrain) ||
               obstacleFolderItems.includes(terrain) ||
               blockingDoodads.includes(terrain) ||
               nonWalkableFloors.includes(terrain);
    }

    /**
     * Convert board data into a game grid
     */
    convertBoardToGrid(boardData: BoardData, foodAssets: string[] = []): BoardResult {
        const [width, height] = boardData.size;
        const grid: Tile[][] = [];
        const terrainTextures: Record<string, string> = {};
        const overlayTextures: Record<string, string> = {};
        const rotations: Record<string, number> = {};
        const overlayRotations: Record<string, number> = {};
        const signMessages = boardData.signMessages || {};
        const enemies: EnemyData[] = [];

        // Initialize grid from terrain data
        for (let y = 0; y < height; y++) {
            grid[y] = [];
            for (let x = 0; x < width; x++) {
                const index = y * width + x;
                const terrain = boardData.terrain[index];

                // Determine if this terrain is a wall (non-walkable) based on naming
                if (this.isWallTerrain(terrain)) {
                    grid[y][x] = TILE_TYPES.WALL;
                } else {
                    grid[y][x] = TILE_TYPES.FLOOR;
                }

                // Store terrain texture if present
                if (terrain) {
                    terrainTextures[`${x},${y}`] = terrain;
                }
            }
        }

        // Load overlay data (trim tiles)
        if (boardData.overlays) {
            Object.entries(boardData.overlays).forEach(([coord, overlay]) => {
                overlayTextures[coord] = overlay;
            });
        }

        // Apply automatic rotations for corner wall pieces
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const coord = `${x},${y}`;
                const terrain = terrainTextures[coord];

                if (terrain && !rotations[coord]) {
                    const isTopLeft = (x === 0 && y === 0);
                    const isTopRight = (x === width - 1 && y === 0);
                    const isBottomLeft = (x === 0 && y === height - 1);
                    const isBottomRight = (x === width - 1 && y === height - 1);

                    const terrainName = terrain.includes('/') ? terrain.split('/')[1] : terrain;

                    if (terrainName === 'clubwall5') {
                        if (isTopRight) rotations[coord] = 90;
                        else if (isBottomRight) rotations[coord] = 180;
                        else if (isBottomLeft) rotations[coord] = 270;
                    }
                    else if (terrainName === 'clubwall6') {
                        if (isBottomRight) rotations[coord] = 90;
                        else if (isBottomLeft) rotations[coord] = 180;
                        else if (isTopLeft) rotations[coord] = 270;
                    }
                }
            }
        }

        // Load rotation data from board (these override automatic rotations)
        if (boardData.rotations) {
            Object.entries(boardData.rotations).forEach(([coord, rotation]) => {
                if (terrainTextures[coord]) {
                    rotations[coord] = rotation;
                }
            });
        }

        // Support separate overlay rotations
        if (boardData.overlayRotations) {
            Object.entries(boardData.overlayRotations).forEach(([coord, rotation]) => {
                overlayRotations[coord] = rotation;
            });
        }

        // Check if this is a chess board
        const isChessBoard = boardData.metadata?.gameMode?.toUpperCase() === 'CHESS';

        // Place features on the grid
        let enemyIdCounter = 0;
        for (const [posKey, featureType] of Object.entries(boardData.features)) {
            const [x, y] = posKey.split(',').map(Number);

            if (x >= 0 && x < width && y >= 0 && y < height && grid[y]) {
                // Check if this feature is an enemy type
                const enemyType = this.getEnemyType(featureType);
                if (enemyType) {
                    // Determine team for chess boards
                    const team = isChessBoard && !enemyType.startsWith('black_') ? 'player' : 'enemy';

                    // Add to enemies array instead of grid
                    enemies.push({
                        x: x,
                        y: y,
                        enemyType: enemyType,
                        id: `custom_board_${enemyIdCounter++}`,
                        team: team
                    } as any);
                } else {
                    // Non-enemy feature, place on grid
                    let tile = this.convertFeatureToTile(featureType, foodAssets, signMessages, posKey);

                    // Special handling: port_grate features in underground zones should be converted to stairup
                    // This makes the port under the grate appear as stairs leading up to the surface (like an UPSTAIR)
                    if (featureType === 'port_grate' && boardData.metadata?.dimension === DIMENSION_CONSTANTS.UNDERGROUND) {
                        // Convert grate to stairup for underground zones
                        tile = { type: TILE_TYPES.PORT, portKind: 'stairup' };
                        terrainTextures[posKey] = 'floors/graytile';
                    }

                    if (tile !== null) {
                        grid[y][x] = tile;
                    }
                }
            }
        }

        // Find player spawn (default to center if not specified)
        let playerSpawn = {
            x: Math.floor(width / 2),
            y: Math.floor(height / 2)
        };

        // Check if board metadata specifies a spawn point
        if (boardData.metadata && boardData.metadata.playerSpawn) {
            playerSpawn = boardData.metadata.playerSpawn;
        }

        // Special handling for home zone (0,0,0) - spawn on random EXIT tile
        if (boardData.metadata &&
            boardData.metadata.dimension === 0 &&
            !boardData.metadata.playerSpawn) {
            const exitTiles: { x: number; y: number }[] = [];
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    if (grid[y][x] === TILE_TYPES.EXIT) {
                        exitTiles.push({ x, y });
                    }
                }
            }

            if (exitTiles.length > 0) {
                playerSpawn = exitTiles[Math.floor(Math.random() * exitTiles.length)];
                logger.debug(`[BoardLoader] Home zone: spawning on EXIT tile at (${playerSpawn.x},${playerSpawn.y}) out of ${exitTiles.length} exits`);
            } else {
                logger.warn(`[BoardLoader] Home zone: no EXIT tiles found, using center spawn`);
            }
        }

        return {
            grid: grid,
            playerSpawn: playerSpawn,
            enemies: enemies,
            terrainTextures: terrainTextures,
            overlayTextures: overlayTextures,
            rotations: rotations,
            overlayRotations: overlayRotations,
            metadata: {
                playerSpawn: boardData.metadata?.playerSpawn ? playerSpawn : undefined,
                gameMode: boardData.metadata?.gameMode
            }
        };
    }

    /**
     * Check if a feature type is an enemy and return the enemy type string
     */
    private getEnemyType(featureType: string): string | null {
        const enemyTypes = [
            'lizardy', 'lizardo', 'lizardeaux', 'zard', 'lizord', 'lazerd',
            'black_lizardy', 'black_lizardo', 'black_lizardeaux',
            'black_zard', 'black_lizord', 'black_lazerd'
        ];

        const lowerFeature = featureType.toLowerCase();
        if (enemyTypes.includes(lowerFeature)) {
            return lowerFeature;
        }

        return null;
    }

    /**
     * Convert a feature string to a tile type or object
     */
    convertFeatureToTile(featureType: string, foodAssets: string[], signMessages: Record<string, string> = {}, posKey: string | null = null): Tile {
        // Handle special random item placeholders
        if (featureType === 'random_item') {
            return this.generateRandomItem(foodAssets);
        }
        if (featureType === 'random_radial_item') {
            return this.generateRandomRadialItem();
        }
        if (featureType === 'random_food_water') {
            return this.generateRandomFoodWater(foodAssets);
        }
        if (featureType === 'random_merchant') {
            return this.generateRandomMerchant();
        }
        if (featureType === 'random_gossip_npc') {
            return this.generateRandomGossipNPC();
        }

        // Handle special port_* format
        if (featureType.startsWith('port_')) {
            const portKind = featureType.substring(5);
            return { type: TILE_TYPES.PORT, portKind: portKind };
        }

        // Handle exit_* format
        if (featureType.startsWith('exit_')) {
            return TILE_TYPES.EXIT;
        }

        // Handletextbox with message
        if (featureType === 'sign' || featureType.toUpperCase() === 'SIGN') {
            const message = posKey ? signMessages[posKey] : undefined;
            if (!message) {
                logger.warn(`Sign at ${posKey} has no message defined in signMessages`);
                return { type: TILE_TYPES.SIGN, message: 'A blank sign.' };
            }
            return { type: TILE_TYPES.SIGN, message: message };
        }

        // Convert feature name to TILE_TYPES constant
        const tileTypeName = featureType.toUpperCase();

        if (tileTypeName in TILE_TYPES) {
            const tileType = (TILE_TYPES as Record<string, number>)[tileTypeName];
            // Add uses property for items that need it
            if (tileType === TILE_TYPES.BISHOP_SPEAR || tileType === TILE_TYPES.HORSE_ICON ||
                tileType === TILE_TYPES.BOW || tileType === TILE_TYPES.SHOVEL ||
                tileType === TILE_TYPES.BOOK_OF_TIME_TRAVEL || tileType === TILE_TYPES.FISCHERS_CUBE ||
                tileType === TILE_TYPES.TELEPORT_BRANCH) {
                return { type: tileType, uses: 3 };
            }
            return tileType;
        }

        // Try with underscores converted
        const normalizedName = featureType.replace(/-/g, '_').toUpperCase();
        if (normalizedName in TILE_TYPES) {
            const tileType = (TILE_TYPES as Record<string, number>)[normalizedName];
            // Add uses property for items that need it
            if (tileType === TILE_TYPES.BISHOP_SPEAR || tileType === TILE_TYPES.HORSE_ICON ||
                tileType === TILE_TYPES.BOW || tileType === TILE_TYPES.SHOVEL ||
                tileType === TILE_TYPES.BOOK_OF_TIME_TRAVEL || tileType === TILE_TYPES.FISCHERS_CUBE ||
                tileType === TILE_TYPES.TELEPORT_BRANCH) {
                return { type: tileType, uses: 3 };
            }
            return tileType;
        }

        logger.warn(`Unknown feature type: ${featureType}`);
        return null;
    }

    /**
     * Generate a random item from the full starter item pool
     */
    private generateRandomItem(foodAssets: string[]): Tile {
        const itemPool: Tile[] = [
            { type: TILE_TYPES.FOOD, foodType: foodAssets[Math.floor(Math.random() * foodAssets.length)] },
            TILE_TYPES.WATER,
            TILE_TYPES.BOMB,
            { type: TILE_TYPES.BISHOP_SPEAR, uses: 3 },
            { type: TILE_TYPES.HORSE_ICON, uses: 3 },
            { type: TILE_TYPES.BOW, uses: 3 },
            { type: TILE_TYPES.BOOK_OF_TIME_TRAVEL, uses: 3 },
            { type: TILE_TYPES.FISCHERS_CUBE, uses: 1 },
            TILE_TYPES.NOTE,
        ];

        const itemToSpawn = itemPool[Math.floor(Math.random() * itemPool.length)];

        // Handle food case where no assets are available
        if (typeof itemToSpawn === 'object' && itemToSpawn !== null && 'type' in itemToSpawn && itemToSpawn.type === TILE_TYPES.FOOD && (!foodAssets || foodAssets.length === 0)) {
            return TILE_TYPES.WATER;
        }

        return itemToSpawn;
    }

    /**
     * Generate a random radial item (weapons/activated items)
     */
    private generateRandomRadialItem(): Tile {
        const radialItems: Tile[] = [
            TILE_TYPES.BOMB,
            { type: TILE_TYPES.BISHOP_SPEAR, uses: 3 },
            { type: TILE_TYPES.HORSE_ICON, uses: 3 },
            { type: TILE_TYPES.BOW, uses: 3 },
            { type: TILE_TYPES.SHOVEL, uses: 3 },
            { type: TILE_TYPES.BOOK_OF_TIME_TRAVEL, uses: 3 },
            { type: TILE_TYPES.FISCHERS_CUBE, uses: 1 },
        ];

        return radialItems[Math.floor(Math.random() * radialItems.length)];
    }

    /**
     * Generate a random food or water item
     */
    private generateRandomFoodWater(foodAssets: string[]): Tile {
        const isWater = Math.random() < 0.5;

        if (isWater) {
            return TILE_TYPES.WATER;
        } else {
            if (foodAssets && foodAssets.length > 0) {
                return {
                    type: TILE_TYPES.FOOD,
                    foodType: foodAssets[Math.floor(Math.random() * foodAssets.length)]
                };
            } else {
                return TILE_TYPES.WATER;
            }
        }
    }

    /**
     * Generate a random merchant NPC
     */
    private generateRandomMerchant(): number {
        const merchants = [
            TILE_TYPES.MARK,
            TILE_TYPES.NIB,
            TILE_TYPES.RUNE,
            TILE_TYPES.PENNE,
            TILE_TYPES.SQUIG
        ];
        return merchants[Math.floor(Math.random() * merchants.length)];
    }

    /**
     * Generate a random gossip NPC
     */
    private generateRandomGossipNPC(): number {
        const gossipNPCs = [
            TILE_TYPES.ASTER,
            TILE_TYPES.BLOT,
            TILE_TYPES.BLOTTER,
            TILE_TYPES.BRUSH,
            TILE_TYPES.BURIN,
            TILE_TYPES.CALAMUS,
            TILE_TYPES.CAP,
            TILE_TYPES.CINNABAR,
            TILE_TYPES.CROCK,
            TILE_TYPES.FILUM,
            TILE_TYPES.FORK,
            TILE_TYPES.GEL,
            TILE_TYPES.GOUACHE,
            TILE_TYPES.HANE,
            TILE_TYPES.KRAFT,
            TILE_TYPES.MERKI,
            TILE_TYPES.MICRON,
            TILE_TYPES.PENNI,
            TILE_TYPES.PLUMA,
            TILE_TYPES.PLUME,
            TILE_TYPES.QUILL,
            TILE_TYPES.RADDLE,
            TILE_TYPES.SCRITCH,
            TILE_TYPES.SILVER,
            TILE_TYPES.SINE,
            TILE_TYPES.SLATE,
            TILE_TYPES.SLICK,
            TILE_TYPES.SLUG,
            TILE_TYPES.STYLET,
            TILE_TYPES.VELLUM
        ];
        return gossipNPCs[Math.floor(Math.random() * gossipNPCs.length)];
    }

    /**
     * Clear the board cache (useful for development/hot reloading)
     */
    clearCache(): void {
        this.boardCache.clear();
        logger.log('Board cache cleared');
    }
}

// Create singleton instance
export const boardLoader = new BoardLoader();
