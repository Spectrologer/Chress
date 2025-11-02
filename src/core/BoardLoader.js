import { TILE_TYPES } from './constants/index.js';
import { logger } from './logger.ts';

/**
 * BoardLoader - Loads custom board definitions from JSON files
 * Allows for hand-crafted zones instead of procedural generation
 */
export class BoardLoader {
    constructor() {
        this.boardCache = new Map();
        this.boardRegistry = new Map();
    }

    /**
     * Register a board for a specific zone location
     * @param {number} zoneX - Zone X coordinate
     * @param {number} zoneY - Zone Y coordinate
     * @param {number} dimension - Dimension (0=surface, 1=interior, 2=underground)
     * @param {string} boardName - Name of the board file (without .json extension)
     * @param {string} type - Type of board: 'canon' or 'custom' (default: 'custom')
     */
    registerBoard(zoneX, zoneY, dimension, boardName, type = 'custom') {
        const key = this.createBoardKey(zoneX, zoneY, dimension);
        const boardPath = `${type}/${boardName}`;
        this.boardRegistry.set(key, boardPath);
        logger.log(`Registered ${type} board "${boardName}" for zone (${zoneX},${zoneY}) dimension ${dimension}`);
    }

    /**
     * Create a unique key for a zone location
     */
    createBoardKey(zoneX, zoneY, dimension) {
        return `${zoneX},${zoneY}:${dimension}`;
    }

    /**
     * Check if a custom board exists for the given zone
     */
    hasBoard(zoneX, zoneY, dimension) {
        const key = this.createBoardKey(zoneX, zoneY, dimension);
        return this.boardRegistry.has(key);
    }

    /**
     * Get a custom board synchronously (board must be pre-loaded)
     * @returns {Object|null} Board data or null if not found
     */
    getBoardSync(zoneX, zoneY, dimension) {
        const key = this.createBoardKey(zoneX, zoneY, dimension);

        // Check if board is registered for this location
        if (!this.boardRegistry.has(key)) {
            return null;
        }

        const boardName = this.boardRegistry.get(key);

        // Return from cache if available
        if (this.boardCache.has(boardName)) {
            return this.boardCache.get(boardName);
        }

        logger.warn(`Board "${boardName}" not pre-loaded. Call preloadAllBoards() first.`);
        return null;
    }

    /**
     * Load a custom board asynchronously
     * @returns {Promise<Object|null>} Board data or null if not found
     */
    async loadBoard(zoneX, zoneY, dimension) {
        const key = this.createBoardKey(zoneX, zoneY, dimension);

        // Check if board is registered for this location
        if (!this.boardRegistry.has(key)) {
            return null;
        }

        const boardName = this.boardRegistry.get(key);

        // Check cache first
        if (this.boardCache.has(boardName)) {
            // logger.log(`Loading custom board "${boardName}" from cache`);
            return this.boardCache.get(boardName);
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

            const boardData = await response.json();

            // Validate board structure
            if (!this.validateBoard(boardData)) {
                logger.error(`Invalid board structure in "${boardName}"`);
                return null;
            }

            // Cache the board
            this.boardCache.set(boardName, boardData);
            // logger.log(`Loaded custom board "${boardName}" for zone (${zoneX},${zoneY}) dimension ${dimension}`);

            return boardData;
        } catch (error) {
            logger.error(`Error loading board "${boardName}":`, error);
            return null;
        }
    }

    /**
     * Pre-load all registered boards
     * Call this during game initialization
     * @returns {Promise<void>}
     */
    async preloadAllBoards() {
        const promises = [];
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
    validateBoard(board) {
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
     *
     * Format can be either:
     * - 'walls/clubwall5' (with folder prefix - preferred)
     * - 'clubwall5' (legacy format - falls back to lookup)
     *
     * Rules:
     * - walls/* = non-walkable
     * - obstacles/* = non-walkable
     * - floors/* = walkable (except floors/aqua which is a special case)
     * - trim/* = walkable (decorative overlay)
     */
    isWallTerrain(terrain) {
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
        // Items in the walls/ folder (non-walkable)
        const wallFolderItems = [
            '90s', 'astrocrag', 'blocklily', 'boulder', 'bush',
            'chargedwall', 'clubwall', 'clubwall1', 'clubwall2', 'clubwall4', 'clubwall5', 'clubwall6',
            'cobble', 'coralwall', 'cube', 'deco', 'fortwall', 'heartstone',
            'lavawall', 'rockwall', 'stump', 'succulent', 'wall', 'zydeco'
        ];

        // Items in the obstacles/ folder (non-walkable)
        const obstacleFolderItems = ['rock', 'shrubbery'];

        // Items in doodads/ that block movement
        const blockingDoodads = ['hole', 'pitfall'];

        // Special floor tiles that are non-walkable
        const nonWalkableFloors = ['aqua'];

        return wallFolderItems.includes(terrain) ||
               obstacleFolderItems.includes(terrain) ||
               blockingDoodads.includes(terrain) ||
               nonWalkableFloors.includes(terrain);
    }

    /**
     * Convert board data into a game grid
     * @param {Object} boardData - The loaded board JSON
     * @param {Array} foodAssets - Available food assets for random items
     * @returns {Object} { grid, playerSpawn, enemies, terrainTextures, rotations, overlayRotations }
     */
    convertBoardToGrid(boardData, foodAssets = []) {
        const [width, height] = boardData.size;
        const grid = [];
        const terrainTextures = {}; // Store terrain texture names
        const overlayTextures = {}; // Store overlay texture names (trim, etc.)
        const rotations = {}; // Store rotation data for terrain
        const overlayRotations = {}; // Store rotation data for overlays
        const signMessages = boardData.signMessages || {}; // Map of coordinate -> message for signs

        // Initialize grid from terrain data
        // NOTE: The zone editor exports terrain in row-major order where:
        // index = row * width + col (i.e., y * width + x)
        for (let y = 0; y < height; y++) {
            grid[y] = [];
            for (let x = 0; x < width; x++) {
                const index = y * width + x;
                const terrain = boardData.terrain[index];

                // Determine if this terrain is a wall (non-walkable) based on naming
                if (this.isWallTerrain(terrain)) {
                    grid[y][x] = TILE_TYPES.WALL;
                } else {
                    // Default to floor for null, floor types, or unknown terrain
                    grid[y][x] = TILE_TYPES.FLOOR;
                }

                // Store terrain texture if present
                if (terrain) {
                    terrainTextures[`${x},${y}`] = terrain;
                    if (terrain.includes('clubwall6')) {
                        logger.log(`[BoardLoader] Found clubwall6 at [${x},${y}]: ${terrain}`);
                    }
                }
            }
        }

        // Load overlay data (trim tiles) - these render on top of terrain but don't affect walkability
        if (boardData.overlays) {
            Object.entries(boardData.overlays).forEach(([coord, overlay]) => {
                overlayTextures[coord] = overlay;
            });
        }

        // Apply automatic rotations for corner wall pieces based on their position
        // clubwall5 = top-left corner piece, clubwall6 = top-right corner piece
        // These need to be rotated when placed in other corner positions
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const coord = `${x},${y}`;
                const terrain = terrainTextures[coord];

                if (terrain && !rotations[coord]) { // Only auto-rotate if no explicit rotation
                    const isTopLeft = (x === 0 && y === 0);
                    const isTopRight = (x === width - 1 && y === 0);
                    const isBottomLeft = (x === 0 && y === height - 1);
                    const isBottomRight = (x === width - 1 && y === height - 1);

                    const terrainName = terrain.includes('/') ? terrain.split('/')[1] : terrain;

                    // clubwall5 is designed for top-left corner
                    if (terrainName === 'clubwall5') {
                        if (isTopRight) rotations[coord] = 90;
                        else if (isBottomRight) rotations[coord] = 180;
                        else if (isBottomLeft) rotations[coord] = 270;
                    }
                    // clubwall6 is designed for top-right corner
                    else if (terrainName === 'clubwall6') {
                        if (isBottomRight) rotations[coord] = 90;
                        else if (isBottomLeft) rotations[coord] = 180;
                        else if (isTopLeft) rotations[coord] = 270;
                    }
                }
            }
        }

        // Load rotation data from board (these override automatic rotations)
        // Apply terrain rotations only to terrain tiles
        if (boardData.rotations) {
            Object.entries(boardData.rotations).forEach(([coord, rotation]) => {
                // Apply to terrain if it exists at this position
                if (terrainTextures[coord]) {
                    rotations[coord] = rotation;
                    logger.log(`[BoardLoader] Applied rotation ${rotation}° to terrain ${terrainTextures[coord]} at ${coord}`);
                }
            });
        }

        // Support separate overlay rotations for backward compatibility
        if (boardData.overlayRotations) {
            Object.entries(boardData.overlayRotations).forEach(([coord, rotation]) => {
                overlayRotations[coord] = rotation;
            });
        }


        // Place features on the grid
        for (const [posKey, featureType] of Object.entries(boardData.features)) {
            const [x, y] = posKey.split(',').map(Number);

            if (x >= 0 && x < width && y >= 0 && y < height && grid[y]) {
                const tile = this.convertFeatureToTile(featureType, foodAssets, signMessages, posKey);
                if (tile !== null) {
                    grid[y][x] = tile;
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

        // Special handling for home zone (0,0,0) - spawn on random EXIT tile for entrance animation
        // Only do this if metadata doesn't explicitly set playerSpawn
        if (boardData.metadata &&
            boardData.metadata.dimension === 0 &&
            !boardData.metadata.playerSpawn) {
            // Find all EXIT tiles in the grid
            const exitTiles = [];
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    if (grid[y][x] === TILE_TYPES.EXIT) {
                        exitTiles.push({ x, y });
                    }
                }
            }

            // If EXIT tiles exist, spawn on a random one
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
            enemies: [], // Custom boards don't spawn enemies by default
            terrainTextures: terrainTextures, // Terrain texture names
            overlayTextures: overlayTextures, // Overlay texture names (trim, etc.)
            rotations: rotations, // Rotation data for terrain tiles
            overlayRotations: overlayRotations // Rotation data for overlay tiles
        };
    }

    /**
     * Convert a feature string to a tile type or object
     * Handles special cases like "random_item", "random_radial_item", "random_food_water", "random_gossip_npc", and "sign"
     * @param {string} featureType - The feature type string
     * @param {Array} foodAssets - Available food assets
     * @param {Object} signMessages - Map of coordinates to sign messages
     * @param {string} posKey - Position key (e.g., "2,4") for looking up sign messages
     */
    convertFeatureToTile(featureType, foodAssets, signMessages = {}, posKey = null) {
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

        // Handle special port_* format (port_stairup, port_stairdown, port_interior, port_cistern)
        if (featureType.startsWith('port_')) {
            const portKind = featureType.substring(5); // Remove 'port_' prefix
            return { type: TILE_TYPES.PORT, portKind: portKind };
        }

        // Handle exit_* format (exit_up, exit_down, exit_left, exit_right)
        if (featureType.startsWith('exit_')) {
            return TILE_TYPES.EXIT;
        }

        // Handle sign with message
        if (featureType === 'sign' || featureType.toUpperCase() === 'SIGN') {
            const message = signMessages[posKey];
            if (!message) {
                logger.warn(`Sign at ${posKey} has no message defined in signMessages`);
                return { type: TILE_TYPES.SIGN, message: 'A blank sign.' };
            }
            return { type: TILE_TYPES.SIGN, message: message };
        }

        // Convert feature name to TILE_TYPES constant
        const tileTypeName = featureType.toUpperCase();

        if (tileTypeName in TILE_TYPES) {
            return TILE_TYPES[tileTypeName];
        }

        // Try with underscores converted
        const normalizedName = featureType.replace(/-/g, '_').toUpperCase();
        if (normalizedName in TILE_TYPES) {
            return TILE_TYPES[normalizedName];
        }

        logger.warn(`Unknown feature type: ${featureType}`);
        return null;
    }

    /**
     * Generate a random item from the full starter item pool
     * Includes food, water, radial items (weapons), and notes
     */
    generateRandomItem(foodAssets) {
        const itemPool = [
            { type: TILE_TYPES.FOOD, foodType: foodAssets[Math.floor(Math.random() * foodAssets.length)] },
            TILE_TYPES.WATER,
            TILE_TYPES.BOMB,
            { type: TILE_TYPES.BISHOP_SPEAR, uses: 3 },
            { type: TILE_TYPES.HORSE_ICON, uses: 3 },
            { type: TILE_TYPES.BOW, uses: 3 },
            { type: TILE_TYPES.BOOK_OF_TIME_TRAVEL, uses: 3 },
            TILE_TYPES.NOTE,
        ];

        const itemToSpawn = itemPool[Math.floor(Math.random() * itemPool.length)];

        // Handle food case where no assets are available
        if (itemToSpawn.type === TILE_TYPES.FOOD && (!foodAssets || foodAssets.length === 0)) {
            return TILE_TYPES.WATER;
        }

        return itemToSpawn;
    }

    /**
     * Generate a random radial item (weapons/activated items)
     */
    generateRandomRadialItem() {
        const radialItems = [
            TILE_TYPES.BOMB,
            { type: TILE_TYPES.BISHOP_SPEAR, uses: 3 },
            { type: TILE_TYPES.HORSE_ICON, uses: 3 },
            { type: TILE_TYPES.BOW, uses: 3 },
            { type: TILE_TYPES.SHOVEL, uses: 3 },
            { type: TILE_TYPES.BOOK_OF_TIME_TRAVEL, uses: 3 },
        ];

        return radialItems[Math.floor(Math.random() * radialItems.length)];
    }

    /**
     * Generate a random food or water item
     */
    generateRandomFoodWater(foodAssets) {
        const isWater = Math.random() < 0.5;

        if (isWater) {
            return TILE_TYPES.WATER;
        } else {
            // Return food if assets available, otherwise water
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
    generateRandomMerchant() {
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
    generateRandomGossipNPC() {
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
    clearCache() {
        this.boardCache.clear();
        logger.log('Board cache cleared');
    }
}

// Create singleton instance
export const boardLoader = new BoardLoader();
