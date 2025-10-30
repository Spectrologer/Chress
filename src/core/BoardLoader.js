import { TILE_TYPES } from './constants/index.js';
import { logger } from './logger.js';

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
            logger.log(`Loading custom board "${boardName}" from cache`);
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
            logger.log(`Loaded custom board "${boardName}" for zone (${zoneX},${zoneY}) dimension ${dimension}`);

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
     * Convert board data into a game grid
     * @param {Object} boardData - The loaded board JSON
     * @param {Array} foodAssets - Available food assets for random items
     * @returns {Object} { grid, playerSpawn, enemies }
     */
    convertBoardToGrid(boardData, foodAssets = []) {
        const [width, height] = boardData.size;
        const grid = [];

        // Initialize grid from terrain data
        for (let y = 0; y < height; y++) {
            grid[y] = [];
            for (let x = 0; x < width; x++) {
                const index = y * width + x;
                const terrain = boardData.terrain[index];

                // Convert terrain string to tile type
                // null or missing = default walkable floor
                // 'wall' = explicit wall
                // 'floor' = explicit floor
                if (grid[y]) {
                    if (terrain === 'wall') {
                        grid[y][x] = TILE_TYPES.WALL;
                    } else {
                        // Default to floor for null, 'floor', or unknown terrain
                        grid[y][x] = TILE_TYPES.FLOOR;
                    }
                }
            }
        }

        // Place features on the grid
        for (const [posKey, featureType] of Object.entries(boardData.features)) {
            const [x, y] = posKey.split(',').map(Number);

            if (x >= 0 && x < width && y >= 0 && y < height && grid[y]) {
                const tile = this.convertFeatureToTile(featureType, foodAssets);
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

        return {
            grid: grid,
            playerSpawn: playerSpawn,
            enemies: [] // Custom boards don't spawn enemies by default
        };
    }

    /**
     * Convert a feature string to a tile type or object
     * Handles special cases like "random_item", "random_radial_item", "random_food_water"
     */
    convertFeatureToTile(featureType, foodAssets) {
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

        // Handle special port_* format (port_stairup, port_stairdown, port_interior, port_cistern)
        if (featureType.startsWith('port_')) {
            const portKind = featureType.substring(5); // Remove 'port_' prefix
            return { type: TILE_TYPES.PORT, portKind: portKind };
        }

        // Handle exit_* format (exit_up, exit_down, exit_left, exit_right)
        if (featureType.startsWith('exit_')) {
            return TILE_TYPES.EXIT;
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
     * Clear the board cache (useful for development/hot reloading)
     */
    clearCache() {
        this.boardCache.clear();
        logger.log('Board cache cleared');
    }
}

// Create singleton instance
export const boardLoader = new BoardLoader();
