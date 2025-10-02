// Game constants
const GRID_SIZE = 12;
const TILE_SIZE = 16;
const CANVAS_SIZE = GRID_SIZE * TILE_SIZE; // 192x192 pixels

// Tile types
const TILE_TYPES = {
    FLOOR: 0,
    WALL: 1,
    GRASS: 2,
    EXIT: 3,
    ROCK: 4
};

// Colors for different tile types (fallback when images don't load)
const TILE_COLORS = {
    [TILE_TYPES.FLOOR]: '#ffcb8d',
    [TILE_TYPES.WALL]: '#8B4513',
    [TILE_TYPES.GRASS]: '#228B22',
    [TILE_TYPES.EXIT]: '#ffcb8d',  // Same as floor - opening is indicator enough
    [TILE_TYPES.ROCK]: '#666666'
};

// Game state
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.mapCanvas = document.getElementById('zoneMap');
        this.mapCtx = this.mapCanvas.getContext('2d');
        
        // Disable image smoothing for crisp pixel art
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.webkitImageSmoothingEnabled = false;
        this.ctx.mozImageSmoothingEnabled = false;
        this.ctx.msImageSmoothingEnabled = false;
        
        this.mapCtx.imageSmoothingEnabled = false;
        this.mapCtx.webkitImageSmoothingEnabled = false;
        this.mapCtx.mozImageSmoothingEnabled = false;
        this.mapCtx.msImageSmoothingEnabled = false;
        
        // Image assets
        this.images = {};
        this.imagesLoaded = 0;
        this.totalImages = 9;
        
        // Zone management with chunk-based loading
        this.zones = new Map(); // Stores generated zones by coordinate key
        this.zoneConnections = new Map(); // Stores exit connections between zones
        this.currentZone = { x: 0, y: 0 }; // Current zone coordinates
        this.visitedZones = new Set(); // Track visited zones
        
        this.grid = [];
        this.player = {
            x: 0,
            y: 0
        };
        
        this.loadAssets();
    }
    
    loadAssets() {
        // Try to load dirt texture from Images folder
        this.images.dirt = new Image();
        this.images.dirt.onload = () => {
            console.log('Dirt texture loaded successfully');
            this.imagesLoaded++;
            if (this.imagesLoaded === this.totalImages) {
                this.startGame();
            }
        };
        this.images.dirt.onerror = () => {
            console.log('Could not load Images/dirt.png, using fallback colors');
            this.imagesLoaded++;
            if (this.imagesLoaded === this.totalImages) {
                this.startGame();
            }
        };
        this.images.dirt.src = 'Images/dirt.png';
        
        // Try to load rock texture from Images folder
        this.images.rock = new Image();
        this.images.rock.onload = () => {
            console.log('Rock texture loaded successfully');
            this.imagesLoaded++;
            if (this.imagesLoaded === this.totalImages) {
                this.startGame();
            }
        };
        this.images.rock.onerror = () => {
            console.log('Could not load Images/rock.png, using fallback colors');
            this.imagesLoaded++;
            if (this.imagesLoaded === this.totalImages) {
                this.startGame();
            }
        };
        this.images.rock.src = 'Images/rock.png';
        
        // Try to load dirt_north texture from Images folder
        this.images.dirt_north = new Image();
        this.images.dirt_north.onload = () => {
            console.log('Dirt north texture loaded successfully');
            this.imagesLoaded++;
            if (this.imagesLoaded === this.totalImages) {
                this.startGame();
            }
        };
        this.images.dirt_north.onerror = () => {
            console.log('Could not load Images/dirt_north.png, using fallback');
            this.imagesLoaded++;
            if (this.imagesLoaded === this.totalImages) {
                this.startGame();
            }
        };
        this.images.dirt_north.src = 'Images/dirt_north.png';
        
        // Try to load dirt_corner texture from Images folder
        this.images.dirt_corner = new Image();
        this.images.dirt_corner.onload = () => {
            console.log('Dirt corner texture loaded successfully');
            this.imagesLoaded++;
            if (this.imagesLoaded === this.totalImages) {
                this.startGame();
            }
        };
        this.images.dirt_corner.onerror = () => {
            console.log('Could not load Images/dirt_corner.png, using fallback');
            this.imagesLoaded++;
            if (this.imagesLoaded === this.totalImages) {
                this.startGame();
            }
        };
        this.images.dirt_corner.src = 'Images/dirt_corner.png';
        
        // Try to load dirt_tunnel texture from Images folder
        this.images.dirt_tunnel = new Image();
        this.images.dirt_tunnel.onload = () => {
            console.log('Dirt tunnel texture loaded successfully');
            this.imagesLoaded++;
            if (this.imagesLoaded === this.totalImages) {
                this.startGame();
            }
        };
        this.images.dirt_tunnel.onerror = () => {
            console.log('Could not load Images/dirt_tunnel.png, using fallback');
            this.imagesLoaded++;
            if (this.imagesLoaded === this.totalImages) {
                this.startGame();
            }
        };
        this.images.dirt_tunnel.src = 'Images/dirt_tunnel.png';
        
        // Try to load dirt_corner2 texture from Images folder
        this.images.dirt_corner2 = new Image();
        this.images.dirt_corner2.onload = () => {
            console.log('Dirt corner2 texture loaded successfully');
            this.imagesLoaded++;
            if (this.imagesLoaded === this.totalImages) {
                this.startGame();
            }
        };
        this.images.dirt_corner2.onerror = () => {
            console.log('Could not load Images/dirt_corner2.png, using fallback');
            this.imagesLoaded++;
            if (this.imagesLoaded === this.totalImages) {
                this.startGame();
            }
        };
        this.images.dirt_corner2.src = 'Images/dirt_corner2.png';
        
        // Try to load shrubbery texture from Images folder
        this.images.shrubbery = new Image();
        this.images.shrubbery.onload = () => {
            console.log('Shrubbery texture loaded successfully');
            this.imagesLoaded++;
            if (this.imagesLoaded === this.totalImages) {
                this.startGame();
            }
        };
        this.images.shrubbery.onerror = () => {
            console.log('Could not load Images/shrubbery.png, using fallback');
            this.imagesLoaded++;
            if (this.imagesLoaded === this.totalImages) {
                this.startGame();
            }
        };
        this.images.shrubbery.src = 'Images/shrubbery.png';
        
        // Try to load bush texture from Images folder
        this.images.bush = new Image();
        this.images.bush.onload = () => {
            console.log('Bush texture loaded successfully');
            this.imagesLoaded++;
            if (this.imagesLoaded === this.totalImages) {
                this.startGame();
            }
        };
        this.images.bush.onerror = () => {
            console.log('Could not load Images/bush.png, using fallback');
            this.imagesLoaded++;
            if (this.imagesLoaded === this.totalImages) {
                this.startGame();
            }
        };
        this.images.bush.src = 'Images/bush.png';
        
        // Try to load dircle texture from Images folder
        this.images.dircle = new Image();
        this.images.dircle.onload = () => {
            console.log('Dircle texture loaded successfully');
            this.imagesLoaded++;
            if (this.imagesLoaded === this.totalImages) {
                this.startGame();
            }
        };
        this.images.dircle.onerror = () => {
            console.log('Could not load Images/dircle.png, using fallback');
            this.imagesLoaded++;
            if (this.imagesLoaded === this.totalImages) {
                this.startGame();
            }
        };
        this.images.dircle.src = 'Images/dircle.png';
        
        // Also start game after a short delay in case images take too long
        setTimeout(() => {
            if (this.imagesLoaded < this.totalImages) {
                console.log('Image loading timeout, starting with fallback colors');
                this.imagesLoaded = this.totalImages;
                this.startGame();
            }
        }, 2000);
    }
    
    startGame() {
        if (this.gameStarted) return; // Prevent multiple initializations
        this.gameStarted = true;
        this.init();
    }
    
    init() {
        // Generate initial zone
        this.generateZone();
        
        // Mark starting zone as visited
        this.markZoneVisited(this.currentZone.x, this.currentZone.y);
        
        // Set up event listeners
        this.setupControls();
        
        // Start game loop
        this.gameLoop();
        
        // Update UI
        this.updatePlayerPosition();
        this.updateZoneDisplay();
    }
    
    generateZone() {
        // Check if this zone already exists
        const zoneKey = `${this.currentZone.x},${this.currentZone.y}`;
        if (this.zones.has(zoneKey)) {
            // Load existing zone
            this.grid = this.zones.get(zoneKey);
            return;
        }
        
        // Generate zone structure with pre-determined exits
        this.initializeGrid();
        this.addWallBorders();
        
        // Generate exits using chunk loading approach
        this.generateChunkExits();
        
        // Add random features
        this.addRandomFeatures();
        
        // Ensure exit accessibility
        this.ensureExitAccess();
        
        // Save the generated zone AFTER creating proper exits
        this.zones.set(zoneKey, JSON.parse(JSON.stringify(this.grid)));
        
        // Reset player position to a safe starting location if this is initial generation
        if (this.currentZone.x === 0 && this.currentZone.y === 0 && this.zones.size === 1) {
            this.player.x = 1;
            this.player.y = 1;
            // Ensure starting position is walkable
            this.grid[this.player.y][this.player.x] = TILE_TYPES.FLOOR;
        }
    }
    
    initializeGrid() {
        // Initialize grid with floor tiles
        this.grid = [];
        for (let y = 0; y < GRID_SIZE; y++) {
            this.grid[y] = [];
            for (let x = 0; x < GRID_SIZE; x++) {
                this.grid[y][x] = TILE_TYPES.FLOOR;
            }
        }
    }
    
    addWallBorders() {
        // Add some walls around the borders
        for (let i = 0; i < GRID_SIZE; i++) {
            this.grid[0][i] = TILE_TYPES.WALL; // Top border
            this.grid[GRID_SIZE - 1][i] = TILE_TYPES.WALL; // Bottom border
            this.grid[i][0] = TILE_TYPES.WALL; // Left border
            this.grid[i][GRID_SIZE - 1] = TILE_TYPES.WALL; // Right border
        }
    }
    
    getZoneKey(x, y) {
        return `${x},${y}`;
    }
    
    generateChunkExits() {
        // Generate a 3x3 chunk of zone connections centered on current zone
        // This ensures all adjacent zones have consistent exits
        this.generateChunkConnections(this.currentZone.x, this.currentZone.y);
        
        // Apply the predetermined exits to current zone
        const zoneKey = this.getZoneKey(this.currentZone.x, this.currentZone.y);
        const connections = this.zoneConnections.get(zoneKey);
        
        if (connections) {
            // Apply exits based on pre-generated connections
            if (connections.north !== null) {
                this.grid[0][connections.north] = TILE_TYPES.EXIT;
            }
            if (connections.south !== null) {
                this.grid[GRID_SIZE - 1][connections.south] = TILE_TYPES.EXIT;
            }
            if (connections.west !== null) {
                this.grid[connections.west][0] = TILE_TYPES.EXIT;
            }
            if (connections.east !== null) {
                this.grid[connections.east][GRID_SIZE - 1] = TILE_TYPES.EXIT;
            }
        }
    }
    
    generateChunkConnections(centerX, centerY) {
        // Generate connections for a 3x3 chunk centered on the given coordinates
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const zoneX = centerX + dx;
                const zoneY = centerY + dy;
                const zoneKey = this.getZoneKey(zoneX, zoneY);
                
                // Skip if connections already exist for this zone
                if (this.zoneConnections.has(zoneKey)) {
                    continue;
                }
                
                // Generate deterministic exits for this zone (some may be null)
                const connections = {
                    north: this.getDeterministicExit('north', zoneX, zoneY),
                    south: this.getDeterministicExit('south', zoneX, zoneY),
                    west: this.getDeterministicExit('west', zoneX, zoneY),
                    east: this.getDeterministicExit('east', zoneX, zoneY)
                };
                
                // Ensure minimum connectivity - every zone needs at least one connection
                this.ensureMinimumConnectivity(zoneX, zoneY, connections);
                
                // Store the connections
                this.zoneConnections.set(zoneKey, connections);
                
                // Ensure adjacent zones have matching connections
                this.ensureAdjacentConnections(zoneX, zoneY, connections);
            }
        }
    }
    
    ensureMinimumConnectivity(zoneX, zoneY, connections) {
        // Count existing connections
        const hasConnections = [
            connections.north !== null,
            connections.south !== null, 
            connections.west !== null,
            connections.east !== null
        ].filter(Boolean).length;
        
        // If no connections exist, force at least one
        if (hasConnections === 0) {
            // Choose a direction based on zone coordinates to ensure deterministic behavior
            const seed = (zoneX * 137 + zoneY * 149) % 4;
            const directions = ['north', 'south', 'west', 'east'];
            const forcedDirection = directions[seed];
            
            // Force an exit in the chosen direction
            const validRange = GRID_SIZE - 4;
            const position = ((zoneX * 73 + zoneY * 97) % validRange) + 2;
            connections[forcedDirection] = position;
        }
        
        // Special case: ensure the starting zone (0,0) has multiple connections
        if (zoneX === 0 && zoneY === 0 && hasConnections < 2) {
            // Force at least 2 connections for the starting zone
            if (connections.east === null) {
                connections.east = Math.floor(GRID_SIZE / 2);
            }
            if (connections.south === null) {
                connections.south = Math.floor(GRID_SIZE / 2);
            }
        }
    }
    
    ensureAdjacentConnections(zoneX, zoneY, connections) {
        // Ensure adjacent zones have matching exit positions
        // Only create connections where both zones agree to have an exit
        
        // North connection
        if (connections.north !== null) {
            const northKey = this.getZoneKey(zoneX, zoneY - 1);
            let northConnections = this.zoneConnections.get(northKey);
            if (!northConnections) {
                northConnections = {
                    north: this.getDeterministicExit('north', zoneX, zoneY - 1),
                    south: connections.north, // Match this zone's north exit
                    west: this.getDeterministicExit('west', zoneX, zoneY - 1),
                    east: this.getDeterministicExit('east', zoneX, zoneY - 1)
                };
                this.zoneConnections.set(northKey, northConnections);
            } else {
                // Both zones want a connection here
                northConnections.south = connections.north;
            }
        }
        
        // South connection
        if (connections.south !== null) {
            const southKey = this.getZoneKey(zoneX, zoneY + 1);
            let southConnections = this.zoneConnections.get(southKey);
            if (!southConnections) {
                southConnections = {
                    north: connections.south, // Match this zone's south exit
                    south: this.getDeterministicExit('south', zoneX, zoneY + 1),
                    west: this.getDeterministicExit('west', zoneX, zoneY + 1),
                    east: this.getDeterministicExit('east', zoneX, zoneY + 1)
                };
                this.zoneConnections.set(southKey, southConnections);
            } else {
                southConnections.north = connections.south;
            }
        }
        
        // West connection
        if (connections.west !== null) {
            const westKey = this.getZoneKey(zoneX - 1, zoneY);
            let westConnections = this.zoneConnections.get(westKey);
            if (!westConnections) {
                westConnections = {
                    north: this.getDeterministicExit('north', zoneX - 1, zoneY),
                    south: this.getDeterministicExit('south', zoneX - 1, zoneY),
                    west: this.getDeterministicExit('west', zoneX - 1, zoneY),
                    east: connections.west // Match this zone's west exit
                };
                this.zoneConnections.set(westKey, westConnections);
            } else {
                westConnections.east = connections.west;
            }
        }
        
        // East connection
        if (connections.east !== null) {
            const eastKey = this.getZoneKey(zoneX + 1, zoneY);
            let eastConnections = this.zoneConnections.get(eastKey);
            if (!eastConnections) {
                eastConnections = {
                    north: this.getDeterministicExit('north', zoneX + 1, zoneY),
                    south: this.getDeterministicExit('south', zoneX + 1, zoneY),
                    west: connections.east, // Match this zone's east exit
                    east: this.getDeterministicExit('east', zoneX + 1, zoneY)
                };
                this.zoneConnections.set(eastKey, eastConnections);
            } else {
                eastConnections.west = connections.east;
            }
        }
    }
    
    markZoneVisited(zoneX, zoneY) {
        this.visitedZones.add(this.getZoneKey(zoneX, zoneY));
    }
    
    transitionToZone(newZoneX, newZoneY, exitSide) {
        // Update current zone
        this.currentZone.x = newZoneX;
        this.currentZone.y = newZoneY;
        
        // Mark new zone as visited
        this.markZoneVisited(newZoneX, newZoneY);
        
        // Generate or load the new zone
        this.generateZone();
        
        // Position player based on which exit they used
        this.positionPlayerAfterTransition(exitSide);
        
        // Update UI
        this.updateZoneDisplay();
        this.updatePlayerPosition();
    }
    
    addRandomFeatures() {
        // Add some random rocks, dirt, and grass patches
        const featureCount = Math.floor(Math.random() * 15) + 10;
        
        for (let i = 0; i < featureCount; i++) {
            const x = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
            const y = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
            
            // Skip if this would block the starting position
            if (x === 1 && y === 1) continue;
            
            const featureType = Math.random();
            if (featureType < 0.4) {
                this.grid[y][x] = TILE_TYPES.ROCK; // Use rock instead of wall for interior obstacles
            } else if (featureType < 0.7) {
                // Leave as dirt (TILE_TYPES.DIRT) - this will use directional textures
                continue;
            } else {
                this.grid[y][x] = TILE_TYPES.GRASS;
            }
        }
    }
    
    createZoneExits() {
        // Check if adjacent zones exist and get their connecting exits
        const topZone = this.zones.get(this.getZoneKey(this.currentZone.x, this.currentZone.y - 1));
        const bottomZone = this.zones.get(this.getZoneKey(this.currentZone.x, this.currentZone.y + 1));
        const leftZone = this.zones.get(this.getZoneKey(this.currentZone.x - 1, this.currentZone.y));
        const rightZone = this.zones.get(this.getZoneKey(this.currentZone.x + 1, this.currentZone.y));
        
        const exits = [];
        
        // Top side exit - connect to zone above
        if (topZone) {
            // Find existing bottom exits in the zone above and create matching top exits
            const topZoneExits = this.findExitsOnEdge(topZone, 'bottom');
            topZoneExits.forEach(exitX => {
                this.grid[0][exitX] = TILE_TYPES.EXIT;
                exits.push({ x: exitX, y: 0, side: 'top' });
            });
        } else {
            // Create deterministic exit based on zone coordinates for consistency
            const topExitX = this.getDeterministicExit('top', this.currentZone.x, this.currentZone.y);
            this.grid[0][topExitX] = TILE_TYPES.EXIT;
            exits.push({ x: topExitX, y: 0, side: 'top' });
        }
        
        // Bottom side exit - connect to zone below
        if (bottomZone) {
            const bottomZoneExits = this.findExitsOnEdge(bottomZone, 'top');
            bottomZoneExits.forEach(exitX => {
                this.grid[GRID_SIZE - 1][exitX] = TILE_TYPES.EXIT;
                exits.push({ x: exitX, y: GRID_SIZE - 1, side: 'bottom' });
            });
        } else {
            const bottomExitX = this.getDeterministicExit('bottom', this.currentZone.x, this.currentZone.y);
            this.grid[GRID_SIZE - 1][bottomExitX] = TILE_TYPES.EXIT;
            exits.push({ x: bottomExitX, y: GRID_SIZE - 1, side: 'bottom' });
        }
        
        // Left side exit - connect to zone left
        if (leftZone) {
            const leftZoneExits = this.findExitsOnEdge(leftZone, 'right');
            leftZoneExits.forEach(exitY => {
                this.grid[exitY][0] = TILE_TYPES.EXIT;
                exits.push({ x: 0, y: exitY, side: 'left' });
            });
        } else {
            const leftExitY = this.getDeterministicExit('left', this.currentZone.x, this.currentZone.y);
            this.grid[leftExitY][0] = TILE_TYPES.EXIT;
            exits.push({ x: 0, y: leftExitY, side: 'left' });
        }
        
        // Right side exit - connect to zone right
        if (rightZone) {
            const rightZoneExits = this.findExitsOnEdge(rightZone, 'left');
            rightZoneExits.forEach(exitY => {
                this.grid[exitY][GRID_SIZE - 1] = TILE_TYPES.EXIT;
                exits.push({ x: GRID_SIZE - 1, y: exitY, side: 'right' });
            });
        } else {
            const rightExitY = this.getDeterministicExit('right', this.currentZone.x, this.currentZone.y);
            this.grid[rightExitY][GRID_SIZE - 1] = TILE_TYPES.EXIT;
            exits.push({ x: GRID_SIZE - 1, y: rightExitY, side: 'right' });
        }
        
        // Store exits for future zone transition logic
        this.zoneExits = exits;
    }
    
    getDeterministicExit(side, zoneX, zoneY) {
        // Create deterministic exit positions based on zone coordinates
        // Not all sides will have exits - some zones may be dead ends or have limited connections
        let seed;
        
        switch (side) {
            case 'north':
                seed = (zoneX * 73 + (zoneY - 1) * 97) % 1000;
                break;
            case 'south':
                seed = (zoneX * 73 + (zoneY + 1) * 97) % 1000;
                break;
            case 'west':
                seed = ((zoneX - 1) * 73 + zoneY * 97) % 1000;
                break;
            case 'east':
                seed = ((zoneX + 1) * 73 + zoneY * 97) % 1000;
                break;
        }
        
        // 70% chance of having an exit on this side
        if ((seed % 100) < 30) {
            return null; // No exit on this side
        }
        
        // Convert seed to valid exit position (avoiding corners and edges)
        const validRange = GRID_SIZE - 4; // Avoid 2 tiles from each edge
        const position = (seed % validRange) + 2;
        
        return position;
    }
    
    findExitsOnEdge(zoneGrid, edge) {
        const exits = [];
        
        switch (edge) {
            case 'top':
                for (let x = 0; x < GRID_SIZE; x++) {
                    if (zoneGrid[0][x] === TILE_TYPES.EXIT) {
                        exits.push(x);
                    }
                }
                break;
            case 'bottom':
                for (let x = 0; x < GRID_SIZE; x++) {
                    if (zoneGrid[GRID_SIZE - 1][x] === TILE_TYPES.EXIT) {
                        exits.push(x);
                    }
                }
                break;
            case 'left':
                for (let y = 0; y < GRID_SIZE; y++) {
                    if (zoneGrid[y][0] === TILE_TYPES.EXIT) {
                        exits.push(y);
                    }
                }
                break;
            case 'right':
                for (let y = 0; y < GRID_SIZE; y++) {
                    if (zoneGrid[y][GRID_SIZE - 1] === TILE_TYPES.EXIT) {
                        exits.push(y);
                    }
                }
                break;
        }
        
        return exits;
    }
    
    ensureExitAccess() {
        // Find all exit tiles and ensure they have clear paths
        const exits = [];
        
        // Collect all exits
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                if (this.grid[y][x] === TILE_TYPES.EXIT) {
                    exits.push({ x, y });
                }
            }
        }
        
        // For each exit, ensure there's a clear path inward
        exits.forEach(exit => {
            this.clearPathToExit(exit.x, exit.y);
        });
    }
    
    clearPathToExit(exitX, exitY) {
        // Clear at least one adjacent tile inward from the exit
        let inwardX = exitX;
        let inwardY = exitY;
        
        // Determine inward direction based on exit position
        if (exitY === 0) {
            // Top edge - clear downward
            inwardY = 1;
        } else if (exitY === GRID_SIZE - 1) {
            // Bottom edge - clear upward
            inwardY = GRID_SIZE - 2;
        } else if (exitX === 0) {
            // Left edge - clear rightward
            inwardX = 1;
        } else if (exitX === GRID_SIZE - 1) {
            // Right edge - clear leftward
            inwardX = GRID_SIZE - 2;
        }
        
        // Clear the adjacent tile
        this.grid[inwardY][inwardX] = TILE_TYPES.FLOOR;
        
        // Also clear a path toward the center to ensure connectivity
        this.clearPathToCenter(inwardX, inwardY);
    }
    
    clearPathToCenter(startX, startY) {
        // Clear a simple path toward the center area
        const centerX = Math.floor(GRID_SIZE / 2);
        const centerY = Math.floor(GRID_SIZE / 2);
        
        let currentX = startX;
        let currentY = startY;
        
        // Clear tiles along a path toward center (simplified pathfinding)
        while (Math.abs(currentX - centerX) > 1 || Math.abs(currentY - centerY) > 1) {
            // Move toward center one step at a time
            if (currentX < centerX) {
                currentX++;
            } else if (currentX > centerX) {
                currentX--;
            } else if (currentY < centerY) {
                currentY++;
            } else if (currentY > centerY) {
                currentY--;
            }
            
            // Clear this tile if it's not already floor or exit
            if (this.grid[currentY][currentX] === TILE_TYPES.WALL || this.grid[currentY][currentX] === TILE_TYPES.ROCK) {
                this.grid[currentY][currentX] = TILE_TYPES.FLOOR;
            }
            
            // Prevent infinite loops
            if (currentX === centerX && currentY === centerY) {
                break;
            }
        }
    }
    
    setupControls() {
        // Keyboard controls
        document.addEventListener('keydown', (event) => {
            this.handleKeyPress(event);
        });
        
        // Generate new zone button
        document.getElementById('generate-zone').addEventListener('click', () => {
            // Reset to starting zone with fresh generation
            this.currentZone.x = 0;
            this.currentZone.y = 0;
            this.zones.clear();
            this.visitedZones.clear();
            this.generateZone();
            this.player.x = 1;
            this.player.y = 1;
            this.grid[this.player.y][this.player.x] = TILE_TYPES.FLOOR;
            this.markZoneVisited(0, 0);
            this.updatePlayerPosition();
            this.updateZoneDisplay();
        });
    }
    
    handleKeyPress(event) {
        let newX = this.player.x;
        let newY = this.player.y;
        
        switch(event.key.toLowerCase()) {
            case 'w':
            case 'arrowup':
                newY--;
                break;
            case 's':
            case 'arrowdown':
                newY++;
                break;
            case 'a':
            case 'arrowleft':
                newX--;
                break;
            case 'd':
            case 'arrowright':
                newX++;
                break;
            default:
                return; // Don't prevent default for other keys
        }
        
        // Prevent default behavior for movement keys
        event.preventDefault();
        
        // Check if the new position is off-grid while player is on an exit tile
        if ((newX < 0 || newX >= GRID_SIZE || newY < 0 || newY >= GRID_SIZE)) {
            // Only allow off-grid movement if player is currently on an exit tile
            if (this.grid[this.player.y][this.player.x] === TILE_TYPES.EXIT) {
                this.handleOffGridMovement(newX, newY);
                return;
            } else {
                // Prevent off-grid movement if not on an exit tile
                return;
            }
        }
        
        // Check if the new position is valid (on-grid movement)
        if (this.isValidMove(newX, newY)) {
            this.player.x = newX;
            this.player.y = newY;
            this.updatePlayerPosition();
        }
    }
    
    handleOffGridMovement(attemptedX, attemptedY) {
        // Determine which direction the player is trying to go and calculate new zone coordinates
        let newZoneX = this.currentZone.x;
        let newZoneY = this.currentZone.y;
        let exitSide = '';
        
        if (attemptedY < 0) {
            // Trying to move north (off the top)
            newZoneY--;
            exitSide = 'top';
        } else if (attemptedY >= GRID_SIZE) {
            // Trying to move south (off the bottom)
            newZoneY++;
            exitSide = 'bottom';
        } else if (attemptedX < 0) {
            // Trying to move west (off the left)
            newZoneX--;
            exitSide = 'left';
        } else if (attemptedX >= GRID_SIZE) {
            // Trying to move east (off the right)
            newZoneX++;
            exitSide = 'right';
        }
        
        // Transition to the new zone
        this.transitionToZone(newZoneX, newZoneY, exitSide);
        
        // Visual feedback
        document.getElementById('zone-info').textContent = 'Entered New Zone!';
        setTimeout(() => {
            document.getElementById('zone-info').textContent = 'Exploring';
        }, 1500);
    }
    
    isValidMove(x, y) {
        // Check bounds
        if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) {
            return false;
        }
        
        // Check if tile is walkable (not a wall, rock, or grass)
        return this.grid[y][x] !== TILE_TYPES.WALL && 
               this.grid[y][x] !== TILE_TYPES.ROCK && 
               this.grid[y][x] !== TILE_TYPES.GRASS;
    }
    
    positionPlayerAfterTransition(exitSide) {
        // Get the predetermined connections for this zone
        const zoneKey = this.getZoneKey(this.currentZone.x, this.currentZone.y);
        const connections = this.zoneConnections.get(zoneKey);
        
        let targetX, targetY;
        
        switch (exitSide) {
            case 'top':
                // Came from top, place at south exit
                targetY = GRID_SIZE - 1;
                targetX = connections ? connections.south : Math.floor(GRID_SIZE / 2);
                break;
            case 'bottom':
                // Came from bottom, place at north exit
                targetY = 0;
                targetX = connections ? connections.north : Math.floor(GRID_SIZE / 2);
                break;
            case 'left':
                // Came from left, place at east exit
                targetX = GRID_SIZE - 1;
                targetY = connections ? connections.east : Math.floor(GRID_SIZE / 2);
                break;
            case 'right':
                // Came from right, place at west exit
                targetX = 0;
                targetY = connections ? connections.west : Math.floor(GRID_SIZE / 2);
                break;
        }
        
        // Ensure the position is an exit tile
        if (this.grid[targetY][targetX] !== TILE_TYPES.EXIT) {
            this.grid[targetY][targetX] = TILE_TYPES.EXIT;
        }
        
        // Clear any obstacles from the exit tile and ensure it's passable
        this.clearExitTile(targetX, targetY);
        
        // Set player position
        this.player.x = targetX;
        this.player.y = targetY;
        
        // Double-check that the position is valid, if not, find nearest valid position
        if (!this.isValidMove(this.player.x, this.player.y)) {
            const nearestValid = this.findNearestValidPosition(this.player.x, this.player.y);
            this.player.x = nearestValid.x;
            this.player.y = nearestValid.y;
        }
    }
    
    findNearestExit(preferredPosition, edgePosition) {
        // Find the nearest exit on the specified edge
        let nearestExit = preferredPosition;
        let minDistance = Infinity;
        
        if (edgePosition === 0 || edgePosition === GRID_SIZE - 1) {
            // Horizontal edge (top or bottom)
            for (let x = 0; x < GRID_SIZE; x++) {
                if (this.grid[edgePosition][x] === TILE_TYPES.EXIT) {
                    const distance = Math.abs(x - preferredPosition);
                    if (distance < minDistance) {
                        minDistance = distance;
                        nearestExit = x;
                    }
                }
            }
        } else {
            // Vertical edge (left or right)
            for (let y = 0; y < GRID_SIZE; y++) {
                if (this.grid[y][edgePosition] === TILE_TYPES.EXIT) {
                    const distance = Math.abs(y - preferredPosition);
                    if (distance < minDistance) {
                        minDistance = distance;
                        nearestExit = y;
                    }
                }
            }
        }
        
        return nearestExit;
    }
    
    clearExitTile(x, y) {
        // Ensure the exit tile is passable
        this.grid[y][x] = TILE_TYPES.EXIT;
        
        // Also clear adjacent tiles inward to ensure player can move
        let inwardX = x;
        let inwardY = y;
        
        // Determine inward direction based on exit position
        if (y === 0) {
            // Top edge - clear downward
            inwardY = 1;
        } else if (y === GRID_SIZE - 1) {
            // Bottom edge - clear upward
            inwardY = GRID_SIZE - 2;
        } else if (x === 0) {
            // Left edge - clear rightward
            inwardX = 1;
        } else if (x === GRID_SIZE - 1) {
            // Right edge - clear leftward
            inwardX = GRID_SIZE - 2;
        }
        
        // Clear the adjacent tile to ensure movement is possible
        if (this.grid[inwardY][inwardX] === TILE_TYPES.ROCK || 
            this.grid[inwardY][inwardX] === TILE_TYPES.GRASS) {
            this.grid[inwardY][inwardX] = TILE_TYPES.DIRT;
        }
    }
    
    findNearestValidPosition(startX, startY) {
        // Find the nearest walkable position using breadth-first search
        const queue = [{ x: startX, y: startY, distance: 0 }];
        const visited = new Set();
        
        while (queue.length > 0) {
            const { x, y, distance } = queue.shift();
            const key = `${x},${y}`;
            
            if (visited.has(key)) continue;
            visited.add(key);
            
            // Check if this position is valid
            if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE && this.isValidMove(x, y)) {
                return { x, y };
            }
            
            // Add adjacent positions to the queue
            const directions = [
                { x: x + 1, y },
                { x: x - 1, y },
                { x, y: y + 1 },
                { x, y: y - 1 }
            ];
            
            for (const dir of directions) {
                const dirKey = `${dir.x},${dir.y}`;
                if (!visited.has(dirKey) && 
                    dir.x >= 0 && dir.x < GRID_SIZE && 
                    dir.y >= 0 && dir.y < GRID_SIZE) {
                    queue.push({ x: dir.x, y: dir.y, distance: distance + 1 });
                }
            }
        }
        
        // Fallback - return the starting position and force it to be walkable
        this.grid[startY][startX] = TILE_TYPES.DIRT;
        return { x: startX, y: startY };
    }
    
    hasWallToNorth(x, y) {
        // Check if there's a wall directly north of this tile
        if (y === 0) return false; // Can't have wall to north if we're at top edge
        return this.grid[y - 1][x] === TILE_TYPES.WALL;
    }
    
    shouldUseDirtNorth(x, y) {
        // Use dirt_north if: wall to N and (NW OR NE), with passable tiles otherwise
        if (y === 0) return false; // Can't check north if at top edge
        
        // Must have a wall to the north
        const hasNorthWall = this.grid[y - 1][x] === TILE_TYPES.WALL;
        if (!hasNorthWall) {
            return false;
        }
        
        // Must have a wall to either northwest OR northeast (not necessarily both)
        const hasNorthEastWall = (x < GRID_SIZE - 1 && y > 0) ? this.grid[y - 1][x + 1] === TILE_TYPES.WALL : false;
        const hasNorthWestWall = (x > 0 && y > 0) ? this.grid[y - 1][x - 1] === TILE_TYPES.WALL : false;
        
        if (!hasNorthEastWall && !hasNorthWestWall) {
            return false;
        }
        
        // Check that other adjacent tiles are passable (not walls)
        const directions = [
            { dx: -1, dy: 0 },  // West
            { dx: 1, dy: 0 },   // East
            { dx: 0, dy: 1 },   // South
            { dx: -1, dy: 1 },  // Southwest
            { dx: 1, dy: 1 }    // Southeast
        ];
        
        for (let dir of directions) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            
            // Skip if out of bounds
            if (newX < 0 || newX >= GRID_SIZE || newY < 0 || newY >= GRID_SIZE) {
                continue;
            }
            
            // If any of these directions has a wall, don't use dirt_north
            if (this.grid[newY][newX] === TILE_TYPES.WALL) {
                return false;
            }
        }
        
        return true;
    }
    
    shouldUseDirtSouth(x, y) {
        // Use dirt_south (flipped dirt_north) if: wall to S and (SW OR SE), with passable tiles otherwise
        if (y === GRID_SIZE - 1) return false; // Can't check south if at bottom edge
        
        // Must have a wall to the south
        const hasSouthWall = this.grid[y + 1][x] === TILE_TYPES.WALL;
        if (!hasSouthWall) {
            return false;
        }
        
        // Must have a wall to either southwest OR southeast (not necessarily both)
        const hasSouthEastWall = (x < GRID_SIZE - 1 && y < GRID_SIZE - 1) ? this.grid[y + 1][x + 1] === TILE_TYPES.WALL : false;
        const hasSouthWestWall = (x > 0 && y < GRID_SIZE - 1) ? this.grid[y + 1][x - 1] === TILE_TYPES.WALL : false;
        
        if (!hasSouthEastWall && !hasSouthWestWall) {
            return false;
        }
        
        // Check that other adjacent tiles are passable (not walls)
        const directions = [
            { dx: -1, dy: 0 },  // West
            { dx: 1, dy: 0 },   // East
            { dx: 0, dy: -1 },  // North
            { dx: -1, dy: -1 }, // Northwest
            { dx: 1, dy: -1 }   // Northeast
        ];
        
        for (let dir of directions) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            
            // Skip if out of bounds
            if (newX < 0 || newX >= GRID_SIZE || newY < 0 || newY >= GRID_SIZE) {
                continue;
            }
            
            // If any of these directions has a wall, don't use dirt_south
            if (this.grid[newY][newX] === TILE_TYPES.WALL) {
                return false;
            }
        }
        
        return true;
    }
    
    shouldUseDirtEast(x, y) {
        // Use dirt_east (90° rotated dirt_north) if: wall to E and (NE OR SE), with passable tiles otherwise
        if (x === GRID_SIZE - 1) return false; // Can't check east if at right edge
        
        // Must have a wall to the east
        const hasEastWall = this.grid[y][x + 1] === TILE_TYPES.WALL;
        if (!hasEastWall) {
            return false;
        }
        
        // Must have a wall to either northeast OR southeast (not necessarily both)
        const hasNorthEastWall = (x < GRID_SIZE - 1 && y > 0) ? this.grid[y - 1][x + 1] === TILE_TYPES.WALL : false;
        const hasSouthEastWall = (x < GRID_SIZE - 1 && y < GRID_SIZE - 1) ? this.grid[y + 1][x + 1] === TILE_TYPES.WALL : false;
        
        if (!hasNorthEastWall && !hasSouthEastWall) {
            return false;
        }
        
        // Check that other adjacent tiles are passable (not walls)
        const directions = [
            { dx: 0, dy: -1 },  // North
            { dx: 0, dy: 1 },   // South
            { dx: -1, dy: 0 },  // West
            { dx: -1, dy: -1 }, // Northwest
            { dx: -1, dy: 1 }   // Southwest
        ];
        
        for (let dir of directions) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            
            // Skip if out of bounds
            if (newX < 0 || newX >= GRID_SIZE || newY < 0 || newY >= GRID_SIZE) {
                continue;
            }
            
            // If any of these directions has a wall, don't use dirt_east
            if (this.grid[newY][newX] === TILE_TYPES.WALL) {
                return false;
            }
        }
        
        return true;
    }
    
    shouldUseDirtWest(x, y) {
        // Use dirt_west (-90° rotated dirt_north) if: wall to W and (NW OR SW), with passable tiles otherwise
        if (x === 0) return false; // Can't check west if at left edge
        
        // Must have a wall to the west
        const hasWestWall = this.grid[y][x - 1] === TILE_TYPES.WALL;
        if (!hasWestWall) {
            return false;
        }
        
        // Must have a wall to either northwest OR southwest (not necessarily both)
        const hasNorthWestWall = (x > 0 && y > 0) ? this.grid[y - 1][x - 1] === TILE_TYPES.WALL : false;
        const hasSouthWestWall = (x > 0 && y < GRID_SIZE - 1) ? this.grid[y + 1][x - 1] === TILE_TYPES.WALL : false;
        
        if (!hasNorthWestWall && !hasSouthWestWall) {
            return false;
        }
        
        // Check that other adjacent tiles are passable (not walls)
        const directions = [
            { dx: 0, dy: -1 },  // North
            { dx: 0, dy: 1 },   // South
            { dx: 1, dy: 0 },   // East
            { dx: 1, dy: -1 },  // Northeast
            { dx: 1, dy: 1 }    // Southeast
        ];
        
        for (let dir of directions) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            
            // Skip if out of bounds
            if (newX < 0 || newX >= GRID_SIZE || newY < 0 || newY >= GRID_SIZE) {
                continue;
            }
            
            // If any of these directions has a wall, don't use dirt_west
            if (this.grid[newY][newX] === TILE_TYPES.WALL) {
                return false;
            }
        }
        
        return true;
    }
    
    shouldUseDirtCornerNE(x, y) {
        // Use dirt_corner for northeast corner: walls to N and E, passable tiles to S and W
        if (x === GRID_SIZE - 1 || y === 0) return false; // Can't check if at edges
        
        // Must have walls to the north and east
        const hasNorthWall = this.grid[y - 1][x] === TILE_TYPES.WALL;
        const hasEastWall = this.grid[y][x + 1] === TILE_TYPES.WALL;
        
        if (!hasNorthWall || !hasEastWall) {
            return false;
        }
        
        // Must have passable tiles to the south and west
        const hasSouthPassable = (y < GRID_SIZE - 1) ? this.grid[y + 1][x] !== TILE_TYPES.WALL : true;
        const hasWestPassable = (x > 0) ? this.grid[y][x - 1] !== TILE_TYPES.WALL : true;
        
        return hasSouthPassable && hasWestPassable;
    }
    
    shouldUseDirtCornerSE(x, y) {
        // Use dirt_corner rotated 90° for southeast corner: walls to S and E, passable tiles to N and W
        if (x === GRID_SIZE - 1 || y === GRID_SIZE - 1) return false; // Can't check if at edges
        
        // Must have walls to the south and east
        const hasSouthWall = this.grid[y + 1][x] === TILE_TYPES.WALL;
        const hasEastWall = this.grid[y][x + 1] === TILE_TYPES.WALL;
        
        if (!hasSouthWall || !hasEastWall) {
            return false;
        }
        
        // Must have passable tiles to the north and west
        const hasNorthPassable = (y > 0) ? this.grid[y - 1][x] !== TILE_TYPES.WALL : true;
        const hasWestPassable = (x > 0) ? this.grid[y][x - 1] !== TILE_TYPES.WALL : true;
        
        return hasNorthPassable && hasWestPassable;
    }
    
    shouldUseDirtCornerSW(x, y) {
        // Use dirt_corner rotated 180° for southwest corner: walls to S and W, passable tiles to N and E
        if (x === 0 || y === GRID_SIZE - 1) return false; // Can't check if at edges
        
        // Must have walls to the south and west
        const hasSouthWall = this.grid[y + 1][x] === TILE_TYPES.WALL;
        const hasWestWall = this.grid[y][x - 1] === TILE_TYPES.WALL;
        
        if (!hasSouthWall || !hasWestWall) {
            return false;
        }
        
        // Must have passable tiles to the north and east
        const hasNorthPassable = (y > 0) ? this.grid[y - 1][x] !== TILE_TYPES.WALL : true;
        const hasEastPassable = (x < GRID_SIZE - 1) ? this.grid[y][x + 1] !== TILE_TYPES.WALL : true;
        
        return hasNorthPassable && hasEastPassable;
    }
    
    shouldUseDirtCornerNW(x, y) {
        // Use dirt_corner rotated 270° for northwest corner: walls to N and W, passable tiles to S and E
        if (x === 0 || y === 0) return false; // Can't check if at edges
        
        // Must have walls to the north and west
        const hasNorthWall = this.grid[y - 1][x] === TILE_TYPES.WALL;
        const hasWestWall = this.grid[y][x - 1] === TILE_TYPES.WALL;
        
        if (!hasNorthWall || !hasWestWall) {
            return false;
        }
        
        // Must have passable tiles to the south and east
        const hasSouthPassable = (y < GRID_SIZE - 1) ? this.grid[y + 1][x] !== TILE_TYPES.WALL : true;
        const hasEastPassable = (x < GRID_SIZE - 1) ? this.grid[y][x + 1] !== TILE_TYPES.WALL : true;
        
        return hasSouthPassable && hasEastPassable;
    }
    
    shouldUseDirtTunnelHorizontal(x, y) {
        // Use dirt_tunnel for horizontal tunnels: walls to E and W, passable tiles to N and S
        if (x === 0 || x === GRID_SIZE - 1) return false; // Can't check if at edges
        
        // Must have walls to the east and west
        const hasEastWall = this.grid[y][x + 1] === TILE_TYPES.WALL;
        const hasWestWall = this.grid[y][x - 1] === TILE_TYPES.WALL;
        
        if (!hasEastWall || !hasWestWall) {
            return false;
        }
        
        // Must have passable tiles to the north and south
        const hasNorthPassable = (y > 0) ? this.grid[y - 1][x] !== TILE_TYPES.WALL : true;
        const hasSouthPassable = (y < GRID_SIZE - 1) ? this.grid[y + 1][x] !== TILE_TYPES.WALL : true;
        
        return hasNorthPassable && hasSouthPassable;
    }
    
    shouldUseDirtTunnelVertical(x, y) {
        // Use dirt_tunnel rotated 90° for vertical tunnels: walls to N and S, passable tiles to E and W
        if (y === 0 || y === GRID_SIZE - 1) return false; // Can't check if at edges
        
        // Must have walls to the north and south
        const hasNorthWall = this.grid[y - 1][x] === TILE_TYPES.WALL;
        const hasSouthWall = this.grid[y + 1][x] === TILE_TYPES.WALL;
        
        if (!hasNorthWall || !hasSouthWall) {
            return false;
        }
        
        // Must have passable tiles to the east and west
        const hasEastPassable = (x < GRID_SIZE - 1) ? this.grid[y][x + 1] !== TILE_TYPES.WALL : true;
        const hasWestPassable = (x > 0) ? this.grid[y][x - 1] !== TILE_TYPES.WALL : true;
        
        return hasEastPassable && hasWestPassable;
    }
    
    shouldUseDirtCorner2NorthSouth(x, y) {
        // Use dirt_corner2 for north-south diagonal: walls to NE and NW, passable tiles otherwise
        if (x === 0 || x === GRID_SIZE - 1 || y === 0) return false; // Can't check if at edges
        
        // Must have walls to the northeast and northwest
        const hasNorthEastWall = this.grid[y - 1][x + 1] === TILE_TYPES.WALL;
        const hasNorthWestWall = this.grid[y - 1][x - 1] === TILE_TYPES.WALL;
        
        if (!hasNorthEastWall || !hasNorthWestWall) {
            return false;
        }
        
        // Check that other adjacent tiles are passable (N, E, S, W, SE, SW)
        const passableDirections = [
            { dx: 0, dy: -1 },  // N
            { dx: 1, dy: 0 },   // E
            { dx: 0, dy: 1 },   // S
            { dx: -1, dy: 0 },  // W
            { dx: 1, dy: 1 },   // SE
            { dx: -1, dy: 1 }   // SW
        ];
        
        for (let dir of passableDirections) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            
            // Skip if out of bounds
            if (newX < 0 || newX >= GRID_SIZE || newY < 0 || newY >= GRID_SIZE) {
                continue;
            }
            
            // Must be passable in these directions
            if (this.grid[newY][newX] === TILE_TYPES.WALL) {
                return false;
            }
        }
        
        return true;
    }
    
    shouldUseDirtCorner2EastWest(x, y) {
        // Use dirt_corner2 rotated 90° for east-west diagonal: walls to SE and NE, passable tiles otherwise
        if (y === 0 || y === GRID_SIZE - 1 || x === GRID_SIZE - 1) return false; // Can't check if at edges
        
        // Must have walls to the southeast and northeast
        const hasSouthEastWall = this.grid[y + 1][x + 1] === TILE_TYPES.WALL;
        const hasNorthEastWall = this.grid[y - 1][x + 1] === TILE_TYPES.WALL;
        
        if (!hasSouthEastWall || !hasNorthEastWall) {
            return false;
        }
        
        // Check that other adjacent tiles are passable (N, E, S, W, NW, SW)
        const passableDirections = [
            { dx: 0, dy: -1 },  // N
            { dx: 1, dy: 0 },   // E
            { dx: 0, dy: 1 },   // S
            { dx: -1, dy: 0 },  // W
            { dx: -1, dy: -1 }, // NW
            { dx: -1, dy: 1 }   // SW
        ];
        
        for (let dir of passableDirections) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            
            // Skip if out of bounds
            if (newX < 0 || newX >= GRID_SIZE || newY < 0 || newY >= GRID_SIZE) {
                continue;
            }
            
            // Must be passable in these directions
            if (this.grid[newY][newX] === TILE_TYPES.WALL) {
                return false;
            }
        }
        
        return true;
    }
    
    shouldUseDirtCorner2SouthNorth(x, y) {
        // Use dirt_corner2 rotated 180° for south-north diagonal: walls to SE and SW, passable tiles otherwise
        if (x === 0 || x === GRID_SIZE - 1 || y === GRID_SIZE - 1) return false; // Can't check if at edges
        
        // Must have walls to the southeast and southwest
        const hasSouthEastWall = this.grid[y + 1][x + 1] === TILE_TYPES.WALL;
        const hasSouthWestWall = this.grid[y + 1][x - 1] === TILE_TYPES.WALL;
        
        if (!hasSouthEastWall || !hasSouthWestWall) {
            return false;
        }
        
        // Check that other adjacent tiles are passable (N, E, S, W, NE, NW)
        const passableDirections = [
            { dx: 0, dy: -1 },  // N
            { dx: 1, dy: 0 },   // E
            { dx: 0, dy: 1 },   // S
            { dx: -1, dy: 0 },  // W
            { dx: 1, dy: -1 },  // NE
            { dx: -1, dy: -1 }  // NW
        ];
        
        for (let dir of passableDirections) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            
            // Skip if out of bounds
            if (newX < 0 || newX >= GRID_SIZE || newY < 0 || newY >= GRID_SIZE) {
                continue;
            }
            
            // Must be passable in these directions
            if (this.grid[newY][newX] === TILE_TYPES.WALL) {
                return false;
            }
        }
        
        return true;
    }
    
    shouldUseDirtCorner2WestEast(x, y) {
        // Use dirt_corner2 rotated 270° for west-east diagonal: walls to SW and NW, passable tiles otherwise
        if (y === 0 || y === GRID_SIZE - 1 || x === 0) return false; // Can't check if at edges
        
        // Must have walls to the southwest and northwest
        const hasSouthWestWall = this.grid[y + 1][x - 1] === TILE_TYPES.WALL;
        const hasNorthWestWall = this.grid[y - 1][x - 1] === TILE_TYPES.WALL;
        
        if (!hasSouthWestWall || !hasNorthWestWall) {
            return false;
        }
        
        // Check that other adjacent tiles are passable (N, E, S, W, NE, SE)
        const passableDirections = [
            { dx: 0, dy: -1 },  // N
            { dx: 1, dy: 0 },   // E
            { dx: 0, dy: 1 },   // S
            { dx: -1, dy: 0 },  // W
            { dx: 1, dy: -1 },  // NE
            { dx: 1, dy: 1 }    // SE
        ];
        
        for (let dir of passableDirections) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            
            // Skip if out of bounds
            if (newX < 0 || newX >= GRID_SIZE || newY < 0 || newY >= GRID_SIZE) {
                continue;
            }
            
            // Must be passable in these directions
            if (this.grid[newY][newX] === TILE_TYPES.WALL) {
                return false;
            }
        }
        
        return true;
    }
    
    updatePlayerPosition() {
        document.getElementById('player-pos').textContent = `${this.player.x}, ${this.player.y}`;
    }
    
    updateZoneDisplay() {
        document.getElementById('current-zone').textContent = `${this.currentZone.x}, ${this.currentZone.y}`;
        this.renderZoneMap();
    }
    
    renderZoneMap() {
        const mapSize = 200;
        const zoneSize = 20; // Size of each zone square on the map
        const centerX = mapSize / 2;
        const centerY = mapSize / 2;
        
        // Clear the map
        this.mapCtx.fillStyle = '#222222';
        this.mapCtx.fillRect(0, 0, mapSize, mapSize);
        
        // Calculate visible range around current zone
        const range = 5; // Show 5 zones in each direction
        
        for (let dy = -range; dy <= range; dy++) {
            for (let dx = -range; dx <= range; dx++) {
                const zoneX = this.currentZone.x + dx;
                const zoneY = this.currentZone.y + dy;
                const zoneKey = this.getZoneKey(zoneX, zoneY);
                
                const mapX = centerX + dx * zoneSize - zoneSize / 2;
                const mapY = centerY + dy * zoneSize - zoneSize / 2;
                
                // Determine zone color
                let color = '#444444'; // Unexplored
                if (this.visitedZones.has(zoneKey)) {
                    color = '#87CEEB'; // Visited
                }
                if (zoneX === this.currentZone.x && zoneY === this.currentZone.y) {
                    color = '#FFD700'; // Current
                }
                
                // Draw zone square
                this.mapCtx.fillStyle = color;
                this.mapCtx.fillRect(mapX, mapY, zoneSize - 2, zoneSize - 2);
                
                // Draw border
                this.mapCtx.strokeStyle = '#666666';
                this.mapCtx.lineWidth = 1;
                this.mapCtx.strokeRect(mapX, mapY, zoneSize - 2, zoneSize - 2);
                
                // Draw coordinates for current zone
                if (zoneX === this.currentZone.x && zoneY === this.currentZone.y) {
                    this.mapCtx.fillStyle = '#000000';
                    this.mapCtx.font = '8px monospace';
                    this.mapCtx.textAlign = 'center';
                    this.mapCtx.fillText(`${zoneX},${zoneY}`, mapX + zoneSize / 2 - 1, mapY + zoneSize / 2 + 1);
                }
            }
        }
        
        // Draw center crosshairs
        this.mapCtx.strokeStyle = '#4a9eff';
        this.mapCtx.lineWidth = 1;
        this.mapCtx.beginPath();
        this.mapCtx.moveTo(centerX - 5, centerY);
        this.mapCtx.lineTo(centerX + 5, centerY);
        this.mapCtx.moveTo(centerX, centerY - 5);
        this.mapCtx.lineTo(centerX, centerY + 5);
        this.mapCtx.stroke();
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        
        // Draw grid
        this.drawGrid();
        
        // Draw player
        this.drawPlayer();
    }
    
    drawGrid() {
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                const tileType = this.grid[y][x];
                
                // For exit tiles, prioritize tunnel textures, then use other directional textures
                if (tileType === TILE_TYPES.EXIT) {
                    if (this.shouldUseDirtTunnelHorizontal(x, y) && 
                        this.images.dirt_tunnel && this.images.dirt_tunnel.complete && this.images.dirt_tunnel.naturalWidth > 0) {
                        // Use dirt_tunnel for horizontal tunnels (walls E & W)
                        this.ctx.drawImage(
                            this.images.dirt_tunnel,
                            x * TILE_SIZE,
                            y * TILE_SIZE,
                            TILE_SIZE,
                            TILE_SIZE
                        );
                    } else if (this.shouldUseDirtTunnelVertical(x, y) && 
                        this.images.dirt_tunnel && this.images.dirt_tunnel.complete && this.images.dirt_tunnel.naturalWidth > 0) {
                        // Use 90° rotated dirt_tunnel for vertical tunnels (walls N & S)
                        this.ctx.save();
                        this.ctx.translate((x + 0.5) * TILE_SIZE, (y + 0.5) * TILE_SIZE);
                        this.ctx.rotate(Math.PI / 2);
                        this.ctx.drawImage(
                            this.images.dirt_tunnel,
                            -TILE_SIZE / 2,
                            -TILE_SIZE / 2,
                            TILE_SIZE,
                            TILE_SIZE
                        );
                        this.ctx.restore();
                    } else if (this.shouldUseDirtCorner2NorthSouth(x, y) && 
                        this.images.dirt_corner2 && this.images.dirt_corner2.complete && this.images.dirt_corner2.naturalWidth > 0) {
                        // Use dirt_corner2 for north-south diagonal (walls NE & NW)
                        this.ctx.drawImage(
                            this.images.dirt_corner2,
                            x * TILE_SIZE,
                            y * TILE_SIZE,
                            TILE_SIZE,
                            TILE_SIZE
                        );
                    } else if (this.shouldUseDirtCorner2EastWest(x, y) && 
                        this.images.dirt_corner2 && this.images.dirt_corner2.complete && this.images.dirt_corner2.naturalWidth > 0) {
                        // Use 90° rotated dirt_corner2 for east-west diagonal (walls NE & SE)
                        this.ctx.save();
                        this.ctx.translate((x + 0.5) * TILE_SIZE, (y + 0.5) * TILE_SIZE);
                        this.ctx.rotate(Math.PI / 2);
                        this.ctx.drawImage(
                            this.images.dirt_corner2,
                            -TILE_SIZE / 2,
                            -TILE_SIZE / 2,
                            TILE_SIZE,
                            TILE_SIZE
                        );
                        this.ctx.restore();
                    } else if (this.shouldUseDirtCorner2SouthNorth(x, y) && 
                        this.images.dirt_corner2 && this.images.dirt_corner2.complete && this.images.dirt_corner2.naturalWidth > 0) {
                        // Use 180° rotated dirt_corner2 for south-north diagonal (walls SE & SW)
                        this.ctx.save();
                        this.ctx.translate((x + 0.5) * TILE_SIZE, (y + 0.5) * TILE_SIZE);
                        this.ctx.rotate(Math.PI);
                        this.ctx.drawImage(
                            this.images.dirt_corner2,
                            -TILE_SIZE / 2,
                            -TILE_SIZE / 2,
                            TILE_SIZE,
                            TILE_SIZE
                        );
                        this.ctx.restore();
                    } else if (this.shouldUseDirtCorner2WestEast(x, y) && 
                        this.images.dirt_corner2 && this.images.dirt_corner2.complete && this.images.dirt_corner2.naturalWidth > 0) {
                        // Use 270° rotated dirt_corner2 for west-east diagonal (walls NW & SW)
                        this.ctx.save();
                        this.ctx.translate((x + 0.5) * TILE_SIZE, (y + 0.5) * TILE_SIZE);
                        this.ctx.rotate(-Math.PI / 2);
                        this.ctx.drawImage(
                            this.images.dirt_corner2,
                            -TILE_SIZE / 2,
                            -TILE_SIZE / 2,
                            TILE_SIZE,
                            TILE_SIZE
                        );
                        this.ctx.restore();
                    } else if (this.shouldUseDirtNorth(x, y) && 
                        this.images.dirt_north && this.images.dirt_north.complete && this.images.dirt_north.naturalWidth > 0) {
                        // Use dirt_north texture for tiles with walls to N, NE, NW
                        this.ctx.drawImage(
                            this.images.dirt_north,
                            x * TILE_SIZE,
                            y * TILE_SIZE,
                            TILE_SIZE,
                            TILE_SIZE
                        );
                    } else if (this.shouldUseDirtSouth(x, y) && 
                        this.images.dirt_north && this.images.dirt_north.complete && this.images.dirt_north.naturalWidth > 0) {
                        // Use vertically flipped dirt_north for tiles with walls to S, SE, SW
                        this.ctx.save();
                        this.ctx.scale(1, -1);
                        this.ctx.drawImage(
                            this.images.dirt_north,
                            x * TILE_SIZE,
                            -(y + 1) * TILE_SIZE,
                            TILE_SIZE,
                            TILE_SIZE
                        );
                        this.ctx.restore();
                    } else if (this.shouldUseDirtEast(x, y) && 
                        this.images.dirt_north && this.images.dirt_north.complete && this.images.dirt_north.naturalWidth > 0) {
                        // Use 90° rotated dirt_north for tiles with walls to E, NE, SE
                        this.ctx.save();
                        this.ctx.translate((x + 0.5) * TILE_SIZE, (y + 0.5) * TILE_SIZE);
                        this.ctx.rotate(Math.PI / 2);
                        this.ctx.drawImage(
                            this.images.dirt_north,
                            -TILE_SIZE / 2,
                            -TILE_SIZE / 2,
                            TILE_SIZE,
                            TILE_SIZE
                        );
                        this.ctx.restore();
                    } else if (this.shouldUseDirtWest(x, y) && 
                        this.images.dirt_north && this.images.dirt_north.complete && this.images.dirt_north.naturalWidth > 0) {
                        // Use -90° rotated dirt_north for tiles with walls to W, NW, SW
                        this.ctx.save();
                        this.ctx.translate((x + 0.5) * TILE_SIZE, (y + 0.5) * TILE_SIZE);
                        this.ctx.rotate(-Math.PI / 2);
                        this.ctx.drawImage(
                            this.images.dirt_north,
                            -TILE_SIZE / 2,
                            -TILE_SIZE / 2,
                            TILE_SIZE,
                            TILE_SIZE
                        );
                        this.ctx.restore();
                    } else if (this.shouldUseDirtCornerNE(x, y) && 
                        this.images.dirt_corner && this.images.dirt_corner.complete && this.images.dirt_corner.naturalWidth > 0) {
                        // Use dirt_corner for northeast corner (no rotation needed)
                        this.ctx.drawImage(
                            this.images.dirt_corner,
                            x * TILE_SIZE,
                            y * TILE_SIZE,
                            TILE_SIZE,
                            TILE_SIZE
                        );
                    } else if (this.shouldUseDirtCornerSE(x, y) && 
                        this.images.dirt_corner && this.images.dirt_corner.complete && this.images.dirt_corner.naturalWidth > 0) {
                        // Use 90° rotated dirt_corner for southeast corner
                        this.ctx.save();
                        this.ctx.translate((x + 0.5) * TILE_SIZE, (y + 0.5) * TILE_SIZE);
                        this.ctx.rotate(Math.PI / 2);
                        this.ctx.drawImage(
                            this.images.dirt_corner,
                            -TILE_SIZE / 2,
                            -TILE_SIZE / 2,
                            TILE_SIZE,
                            TILE_SIZE
                        );
                        this.ctx.restore();
                    } else if (this.shouldUseDirtCornerSW(x, y) && 
                        this.images.dirt_corner && this.images.dirt_corner.complete && this.images.dirt_corner.naturalWidth > 0) {
                        // Use 180° rotated dirt_corner for southwest corner
                        this.ctx.save();
                        this.ctx.translate((x + 0.5) * TILE_SIZE, (y + 0.5) * TILE_SIZE);
                        this.ctx.rotate(Math.PI);
                        this.ctx.drawImage(
                            this.images.dirt_corner,
                            -TILE_SIZE / 2,
                            -TILE_SIZE / 2,
                            TILE_SIZE,
                            TILE_SIZE
                        );
                        this.ctx.restore();
                    } else if (this.shouldUseDirtCornerNW(x, y) && 
                        this.images.dirt_corner && this.images.dirt_corner.complete && this.images.dirt_corner.naturalWidth > 0) {
                        // Use 270° rotated dirt_corner for northwest corner
                        this.ctx.save();
                        this.ctx.translate((x + 0.5) * TILE_SIZE, (y + 0.5) * TILE_SIZE);
                        this.ctx.rotate(-Math.PI / 2);
                        this.ctx.drawImage(
                            this.images.dirt_corner,
                            -TILE_SIZE / 2,
                            -TILE_SIZE / 2,
                            TILE_SIZE,
                            TILE_SIZE
                        );
                        this.ctx.restore();
                    } else if (this.images.dirt && this.images.dirt.complete && this.images.dirt.naturalWidth > 0) {
                        // Use regular dirt texture
                        this.ctx.drawImage(
                            this.images.dirt,
                            x * TILE_SIZE,
                            y * TILE_SIZE,
                            TILE_SIZE,
                            TILE_SIZE
                        );
                    } else {
                        // Fallback to dirt color
                        this.ctx.fillStyle = TILE_COLORS[TILE_TYPES.FLOOR];
                        this.ctx.fillRect(
                            x * TILE_SIZE,
                            y * TILE_SIZE,
                            TILE_SIZE,
                            TILE_SIZE
                        );
                    }
                }
                // For floor tiles, choose between dirt, dirt_north, dirt_south, dirt_east, dirt_west, corners, and corner2
                else if (tileType === TILE_TYPES.FLOOR) {
                    if (this.shouldUseDirtCorner2NorthSouth(x, y) && 
                        this.images.dirt_corner2 && this.images.dirt_corner2.complete && this.images.dirt_corner2.naturalWidth > 0) {
                        // Use dirt_corner2 for north-south diagonal (walls NE & NW)
                        this.ctx.drawImage(
                            this.images.dirt_corner2,
                            x * TILE_SIZE,
                            y * TILE_SIZE,
                            TILE_SIZE,
                            TILE_SIZE
                        );
                    } else if (this.shouldUseDirtCorner2EastWest(x, y) && 
                        this.images.dirt_corner2 && this.images.dirt_corner2.complete && this.images.dirt_corner2.naturalWidth > 0) {
                        // Use 90° rotated dirt_corner2 for east-west diagonal (walls NE & SE)
                        this.ctx.save();
                        this.ctx.translate((x + 0.5) * TILE_SIZE, (y + 0.5) * TILE_SIZE);
                        this.ctx.rotate(Math.PI / 2);
                        this.ctx.drawImage(
                            this.images.dirt_corner2,
                            -TILE_SIZE / 2,
                            -TILE_SIZE / 2,
                            TILE_SIZE,
                            TILE_SIZE
                        );
                        this.ctx.restore();
                    } else if (this.shouldUseDirtCorner2SouthNorth(x, y) && 
                        this.images.dirt_corner2 && this.images.dirt_corner2.complete && this.images.dirt_corner2.naturalWidth > 0) {
                        // Use 180° rotated dirt_corner2 for south-north diagonal (walls SE & SW)
                        this.ctx.save();
                        this.ctx.translate((x + 0.5) * TILE_SIZE, (y + 0.5) * TILE_SIZE);
                        this.ctx.rotate(Math.PI);
                        this.ctx.drawImage(
                            this.images.dirt_corner2,
                            -TILE_SIZE / 2,
                            -TILE_SIZE / 2,
                            TILE_SIZE,
                            TILE_SIZE
                        );
                        this.ctx.restore();
                    } else if (this.shouldUseDirtCorner2WestEast(x, y) && 
                        this.images.dirt_corner2 && this.images.dirt_corner2.complete && this.images.dirt_corner2.naturalWidth > 0) {
                        // Use 270° rotated dirt_corner2 for west-east diagonal (walls NW & SW)
                        this.ctx.save();
                        this.ctx.translate((x + 0.5) * TILE_SIZE, (y + 0.5) * TILE_SIZE);
                        this.ctx.rotate(-Math.PI / 2);
                        this.ctx.drawImage(
                            this.images.dirt_corner2,
                            -TILE_SIZE / 2,
                            -TILE_SIZE / 2,
                            TILE_SIZE,
                            TILE_SIZE
                        );
                        this.ctx.restore();
                    } else if (this.shouldUseDirtNorth(x, y) && 
                        this.images.dirt_north && this.images.dirt_north.complete && this.images.dirt_north.naturalWidth > 0) {
                        // Use dirt_north texture for tiles with walls to N, NE, NW
                        this.ctx.drawImage(
                            this.images.dirt_north,
                            x * TILE_SIZE,
                            y * TILE_SIZE,
                            TILE_SIZE,
                            TILE_SIZE
                        );
                    } else if (this.shouldUseDirtSouth(x, y) && 
                        this.images.dirt_north && this.images.dirt_north.complete && this.images.dirt_north.naturalWidth > 0) {
                        // Use vertically flipped dirt_north for tiles with walls to S, SE, SW
                        this.ctx.save();
                        this.ctx.scale(1, -1);
                        this.ctx.drawImage(
                            this.images.dirt_north,
                            x * TILE_SIZE,
                            -(y + 1) * TILE_SIZE,
                            TILE_SIZE,
                            TILE_SIZE
                        );
                        this.ctx.restore();
                    } else if (this.shouldUseDirtEast(x, y) && 
                        this.images.dirt_north && this.images.dirt_north.complete && this.images.dirt_north.naturalWidth > 0) {
                        // Use 90° rotated dirt_north for tiles with walls to E, NE, SE
                        this.ctx.save();
                        this.ctx.translate((x + 0.5) * TILE_SIZE, (y + 0.5) * TILE_SIZE);
                        this.ctx.rotate(Math.PI / 2);
                        this.ctx.drawImage(
                            this.images.dirt_north,
                            -TILE_SIZE / 2,
                            -TILE_SIZE / 2,
                            TILE_SIZE,
                            TILE_SIZE
                        );
                        this.ctx.restore();
                    } else if (this.shouldUseDirtWest(x, y) && 
                        this.images.dirt_north && this.images.dirt_north.complete && this.images.dirt_north.naturalWidth > 0) {
                        // Use -90° rotated dirt_north for tiles with walls to W, NW, SW
                        this.ctx.save();
                        this.ctx.translate((x + 0.5) * TILE_SIZE, (y + 0.5) * TILE_SIZE);
                        this.ctx.rotate(-Math.PI / 2);
                        this.ctx.drawImage(
                            this.images.dirt_north,
                            -TILE_SIZE / 2,
                            -TILE_SIZE / 2,
                            TILE_SIZE,
                            TILE_SIZE
                        );
                        this.ctx.restore();
                    } else if (this.shouldUseDirtCornerNE(x, y) && 
                        this.images.dirt_corner && this.images.dirt_corner.complete && this.images.dirt_corner.naturalWidth > 0) {
                        // Use dirt_corner for northeast corner (no rotation needed)
                        this.ctx.drawImage(
                            this.images.dirt_corner,
                            x * TILE_SIZE,
                            y * TILE_SIZE,
                            TILE_SIZE,
                            TILE_SIZE
                        );
                    } else if (this.shouldUseDirtCornerSE(x, y) && 
                        this.images.dirt_corner && this.images.dirt_corner.complete && this.images.dirt_corner.naturalWidth > 0) {
                        // Use 90° rotated dirt_corner for southeast corner
                        this.ctx.save();
                        this.ctx.translate((x + 0.5) * TILE_SIZE, (y + 0.5) * TILE_SIZE);
                        this.ctx.rotate(Math.PI / 2);
                        this.ctx.drawImage(
                            this.images.dirt_corner,
                            -TILE_SIZE / 2,
                            -TILE_SIZE / 2,
                            TILE_SIZE,
                            TILE_SIZE
                        );
                        this.ctx.restore();
                    } else if (this.shouldUseDirtCornerSW(x, y) && 
                        this.images.dirt_corner && this.images.dirt_corner.complete && this.images.dirt_corner.naturalWidth > 0) {
                        // Use 180° rotated dirt_corner for southwest corner
                        this.ctx.save();
                        this.ctx.translate((x + 0.5) * TILE_SIZE, (y + 0.5) * TILE_SIZE);
                        this.ctx.rotate(Math.PI);
                        this.ctx.drawImage(
                            this.images.dirt_corner,
                            -TILE_SIZE / 2,
                            -TILE_SIZE / 2,
                            TILE_SIZE,
                            TILE_SIZE
                        );
                        this.ctx.restore();
                    } else if (this.shouldUseDirtCornerNW(x, y) && 
                        this.images.dirt_corner && this.images.dirt_corner.complete && this.images.dirt_corner.naturalWidth > 0) {
                        // Use 270° rotated dirt_corner for northwest corner
                        this.ctx.save();
                        this.ctx.translate((x + 0.5) * TILE_SIZE, (y + 0.5) * TILE_SIZE);
                        this.ctx.rotate(-Math.PI / 2);
                        this.ctx.drawImage(
                            this.images.dirt_corner,
                            -TILE_SIZE / 2,
                            -TILE_SIZE / 2,
                            TILE_SIZE,
                            TILE_SIZE
                        );
                        this.ctx.restore();
                    } else if (this.images.dirt && this.images.dirt.complete && this.images.dirt.naturalWidth > 0) {
                        // Use regular dirt texture
                        this.ctx.drawImage(
                            this.images.dirt,
                            x * TILE_SIZE,
                            y * TILE_SIZE,
                            TILE_SIZE,
                            TILE_SIZE
                        );
                    } else {
                        // Fallback to dirt color
                        this.ctx.fillStyle = TILE_COLORS[TILE_TYPES.FLOOR];
                        this.ctx.fillRect(
                            x * TILE_SIZE,
                            y * TILE_SIZE,
                            TILE_SIZE,
                            TILE_SIZE
                        );
                    }
                }
                // For rock tiles, draw dirt background first, then rock on top
                else if (tileType === TILE_TYPES.ROCK) {
                    // Draw dirt background first (choose between dirt, dirt_north, dirt_south, dirt_east, dirt_west, corners, and corner2)
                    if (this.shouldUseDirtCorner2NorthSouth(x, y) && 
                        this.images.dirt_corner2 && this.images.dirt_corner2.complete && this.images.dirt_corner2.naturalWidth > 0) {
                        // Use dirt_corner2 for north-south diagonal (walls NE & NW)
                        this.ctx.drawImage(
                            this.images.dirt_corner2,
                            x * TILE_SIZE,
                            y * TILE_SIZE,
                            TILE_SIZE,
                            TILE_SIZE
                        );
                    } else if (this.shouldUseDirtCorner2EastWest(x, y) && 
                        this.images.dirt_corner2 && this.images.dirt_corner2.complete && this.images.dirt_corner2.naturalWidth > 0) {
                        // Use 90° rotated dirt_corner2 for east-west diagonal (walls NE & SE)
                        this.ctx.save();
                        this.ctx.translate((x + 0.5) * TILE_SIZE, (y + 0.5) * TILE_SIZE);
                        this.ctx.rotate(Math.PI / 2);
                        this.ctx.drawImage(
                            this.images.dirt_corner2,
                            -TILE_SIZE / 2,
                            -TILE_SIZE / 2,
                            TILE_SIZE,
                            TILE_SIZE
                        );
                        this.ctx.restore();
                    } else if (this.shouldUseDirtCorner2SouthNorth(x, y) && 
                        this.images.dirt_corner2 && this.images.dirt_corner2.complete && this.images.dirt_corner2.naturalWidth > 0) {
                        // Use 180° rotated dirt_corner2 for south-north diagonal (walls SE & SW)
                        this.ctx.save();
                        this.ctx.translate((x + 0.5) * TILE_SIZE, (y + 0.5) * TILE_SIZE);
                        this.ctx.rotate(Math.PI);
                        this.ctx.drawImage(
                            this.images.dirt_corner2,
                            -TILE_SIZE / 2,
                            -TILE_SIZE / 2,
                            TILE_SIZE,
                            TILE_SIZE
                        );
                        this.ctx.restore();
                    } else if (this.shouldUseDirtCorner2WestEast(x, y) && 
                        this.images.dirt_corner2 && this.images.dirt_corner2.complete && this.images.dirt_corner2.naturalWidth > 0) {
                        // Use 270° rotated dirt_corner2 for west-east diagonal (walls NW & SW)
                        this.ctx.save();
                        this.ctx.translate((x + 0.5) * TILE_SIZE, (y + 0.5) * TILE_SIZE);
                        this.ctx.rotate(-Math.PI / 2);
                        this.ctx.drawImage(
                            this.images.dirt_corner2,
                            -TILE_SIZE / 2,
                            -TILE_SIZE / 2,
                            TILE_SIZE,
                            TILE_SIZE
                        );
                        this.ctx.restore();
                    } else if (this.shouldUseDirtNorth(x, y) && 
                        this.images.dirt_north && this.images.dirt_north.complete && this.images.dirt_north.naturalWidth > 0) {
                        this.ctx.drawImage(
                            this.images.dirt_north,
                            x * TILE_SIZE,
                            y * TILE_SIZE,
                            TILE_SIZE,
                            TILE_SIZE
                        );
                    } else if (this.shouldUseDirtSouth(x, y) && 
                        this.images.dirt_north && this.images.dirt_north.complete && this.images.dirt_north.naturalWidth > 0) {
                        // Use vertically flipped dirt_north
                        this.ctx.save();
                        this.ctx.scale(1, -1);
                        this.ctx.drawImage(
                            this.images.dirt_north,
                            x * TILE_SIZE,
                            -(y + 1) * TILE_SIZE,
                            TILE_SIZE,
                            TILE_SIZE
                        );
                        this.ctx.restore();
                    } else if (this.shouldUseDirtEast(x, y) && 
                        this.images.dirt_north && this.images.dirt_north.complete && this.images.dirt_north.naturalWidth > 0) {
                        // Use 90° rotated dirt_north for tiles with walls to E, NE, SE
                        this.ctx.save();
                        this.ctx.translate((x + 0.5) * TILE_SIZE, (y + 0.5) * TILE_SIZE);
                        this.ctx.rotate(Math.PI / 2);
                        this.ctx.drawImage(
                            this.images.dirt_north,
                            -TILE_SIZE / 2,
                            -TILE_SIZE / 2,
                            TILE_SIZE,
                            TILE_SIZE
                        );
                        this.ctx.restore();
                    } else if (this.shouldUseDirtWest(x, y) && 
                        this.images.dirt_north && this.images.dirt_north.complete && this.images.dirt_north.naturalWidth > 0) {
                        // Use -90° rotated dirt_north for tiles with walls to W, NW, SW
                        this.ctx.save();
                        this.ctx.translate((x + 0.5) * TILE_SIZE, (y + 0.5) * TILE_SIZE);
                        this.ctx.rotate(-Math.PI / 2);
                        this.ctx.drawImage(
                            this.images.dirt_north,
                            -TILE_SIZE / 2,
                            -TILE_SIZE / 2,
                            TILE_SIZE,
                            TILE_SIZE
                        );
                        this.ctx.restore();
                    } else if (this.shouldUseDirtCornerNE(x, y) && 
                        this.images.dirt_corner && this.images.dirt_corner.complete && this.images.dirt_corner.naturalWidth > 0) {
                        // Use dirt_corner for northeast corner (no rotation needed)
                        this.ctx.drawImage(
                            this.images.dirt_corner,
                            x * TILE_SIZE,
                            y * TILE_SIZE,
                            TILE_SIZE,
                            TILE_SIZE
                        );
                    } else if (this.shouldUseDirtCornerSE(x, y) && 
                        this.images.dirt_corner && this.images.dirt_corner.complete && this.images.dirt_corner.naturalWidth > 0) {
                        // Use 90° rotated dirt_corner for southeast corner
                        this.ctx.save();
                        this.ctx.translate((x + 0.5) * TILE_SIZE, (y + 0.5) * TILE_SIZE);
                        this.ctx.rotate(Math.PI / 2);
                        this.ctx.drawImage(
                            this.images.dirt_corner,
                            -TILE_SIZE / 2,
                            -TILE_SIZE / 2,
                            TILE_SIZE,
                            TILE_SIZE
                        );
                        this.ctx.restore();
                    } else if (this.shouldUseDirtCornerSW(x, y) && 
                        this.images.dirt_corner && this.images.dirt_corner.complete && this.images.dirt_corner.naturalWidth > 0) {
                        // Use 180° rotated dirt_corner for southwest corner
                        this.ctx.save();
                        this.ctx.translate((x + 0.5) * TILE_SIZE, (y + 0.5) * TILE_SIZE);
                        this.ctx.rotate(Math.PI);
                        this.ctx.drawImage(
                            this.images.dirt_corner,
                            -TILE_SIZE / 2,
                            -TILE_SIZE / 2,
                            TILE_SIZE,
                            TILE_SIZE
                        );
                        this.ctx.restore();
                    } else if (this.shouldUseDirtCornerNW(x, y) && 
                        this.images.dirt_corner && this.images.dirt_corner.complete && this.images.dirt_corner.naturalWidth > 0) {
                        // Use 270° rotated dirt_corner for northwest corner
                        this.ctx.save();
                        this.ctx.translate((x + 0.5) * TILE_SIZE, (y + 0.5) * TILE_SIZE);
                        this.ctx.rotate(-Math.PI / 2);
                        this.ctx.drawImage(
                            this.images.dirt_corner,
                            -TILE_SIZE / 2,
                            -TILE_SIZE / 2,
                            TILE_SIZE,
                            TILE_SIZE
                        );
                        this.ctx.restore();
                    } else if (this.images.dirt && this.images.dirt.complete && this.images.dirt.naturalWidth > 0) {
                        this.ctx.drawImage(
                            this.images.dirt,
                            x * TILE_SIZE,
                            y * TILE_SIZE,
                            TILE_SIZE,
                            TILE_SIZE
                        );
                    } else {
                        // Fallback dirt color
                        this.ctx.fillStyle = TILE_COLORS[TILE_TYPES.FLOOR];
                        this.ctx.fillRect(
                            x * TILE_SIZE,
                            y * TILE_SIZE,
                            TILE_SIZE,
                            TILE_SIZE
                        );
                    }
                    
                    // Draw rock on top if available
                    if (this.images.rock && this.images.rock.complete && this.images.rock.naturalWidth > 0) {
                        this.ctx.drawImage(
                            this.images.rock,
                            x * TILE_SIZE,
                            y * TILE_SIZE,
                            TILE_SIZE,
                            TILE_SIZE
                        );
                    } else {
                        // Fallback rock color
                        this.ctx.fillStyle = TILE_COLORS[TILE_TYPES.ROCK];
                        this.ctx.fillRect(
                            x * TILE_SIZE,
                            y * TILE_SIZE,
                            TILE_SIZE,
                            TILE_SIZE
                        );
                    }
                }
                // For grass tiles, draw dirt background first, then shrubbery on top
                else if (tileType === TILE_TYPES.GRASS) {
                    // Draw dirt background first (choose between dirt, dirt_north, dirt_south, dirt_east, dirt_west, corners, and corner2)
                    if (this.shouldUseDirtCorner2NorthSouth(x, y) && 
                        this.images.dirt_corner2 && this.images.dirt_corner2.complete && this.images.dirt_corner2.naturalWidth > 0) {
                        // Use dirt_corner2 for north-south diagonal (walls NE & NW)
                        this.ctx.drawImage(
                            this.images.dirt_corner2,
                            x * TILE_SIZE,
                            y * TILE_SIZE,
                            TILE_SIZE,
                            TILE_SIZE
                        );
                    } else if (this.shouldUseDirtCorner2EastWest(x, y) && 
                        this.images.dirt_corner2 && this.images.dirt_corner2.complete && this.images.dirt_corner2.naturalWidth > 0) {
                        // Use 90° rotated dirt_corner2 for east-west diagonal (walls NE & SE)
                        this.ctx.save();
                        this.ctx.translate((x + 0.5) * TILE_SIZE, (y + 0.5) * TILE_SIZE);
                        this.ctx.rotate(Math.PI / 2);
                        this.ctx.drawImage(
                            this.images.dirt_corner2,
                            -TILE_SIZE / 2,
                            -TILE_SIZE / 2,
                            TILE_SIZE,
                            TILE_SIZE
                        );
                        this.ctx.restore();
                    } else if (this.shouldUseDirtCorner2SouthNorth(x, y) && 
                        this.images.dirt_corner2 && this.images.dirt_corner2.complete && this.images.dirt_corner2.naturalWidth > 0) {
                        // Use 180° rotated dirt_corner2 for south-north diagonal (walls SE & SW)
                        this.ctx.save();
                        this.ctx.translate((x + 0.5) * TILE_SIZE, (y + 0.5) * TILE_SIZE);
                        this.ctx.rotate(Math.PI);
                        this.ctx.drawImage(
                            this.images.dirt_corner2,
                            -TILE_SIZE / 2,
                            -TILE_SIZE / 2,
                            TILE_SIZE,
                            TILE_SIZE
                        );
                        this.ctx.restore();
                    } else if (this.shouldUseDirtCorner2WestEast(x, y) && 
                        this.images.dirt_corner2 && this.images.dirt_corner2.complete && this.images.dirt_corner2.naturalWidth > 0) {
                        // Use 270° rotated dirt_corner2 for west-east diagonal (walls NW & SW)
                        this.ctx.save();
                        this.ctx.translate((x + 0.5) * TILE_SIZE, (y + 0.5) * TILE_SIZE);
                        this.ctx.rotate(-Math.PI / 2);
                        this.ctx.drawImage(
                            this.images.dirt_corner2,
                            -TILE_SIZE / 2,
                            -TILE_SIZE / 2,
                            TILE_SIZE,
                            TILE_SIZE
                        );
                        this.ctx.restore();
                    } else if (this.shouldUseDirtNorth(x, y) && 
                        this.images.dirt_north && this.images.dirt_north.complete && this.images.dirt_north.naturalWidth > 0) {
                        this.ctx.drawImage(
                            this.images.dirt_north,
                            x * TILE_SIZE,
                            y * TILE_SIZE,
                            TILE_SIZE,
                            TILE_SIZE
                        );
                    } else if (this.shouldUseDirtSouth(x, y) && 
                        this.images.dirt_north && this.images.dirt_north.complete && this.images.dirt_north.naturalWidth > 0) {
                        // Use vertically flipped dirt_north
                        this.ctx.save();
                        this.ctx.scale(1, -1);
                        this.ctx.drawImage(
                            this.images.dirt_north,
                            x * TILE_SIZE,
                            -(y + 1) * TILE_SIZE,
                            TILE_SIZE,
                            TILE_SIZE
                        );
                        this.ctx.restore();
                    } else if (this.shouldUseDirtEast(x, y) && 
                        this.images.dirt_north && this.images.dirt_north.complete && this.images.dirt_north.naturalWidth > 0) {
                        // Use 90° rotated dirt_north for tiles with walls to E, NE, SE
                        this.ctx.save();
                        this.ctx.translate((x + 0.5) * TILE_SIZE, (y + 0.5) * TILE_SIZE);
                        this.ctx.rotate(Math.PI / 2);
                        this.ctx.drawImage(
                            this.images.dirt_north,
                            -TILE_SIZE / 2,
                            -TILE_SIZE / 2,
                            TILE_SIZE,
                            TILE_SIZE
                        );
                        this.ctx.restore();
                    } else if (this.shouldUseDirtWest(x, y) && 
                        this.images.dirt_north && this.images.dirt_north.complete && this.images.dirt_north.naturalWidth > 0) {
                        // Use -90° rotated dirt_north for tiles with walls to W, NW, SW
                        this.ctx.save();
                        this.ctx.translate((x + 0.5) * TILE_SIZE, (y + 0.5) * TILE_SIZE);
                        this.ctx.rotate(-Math.PI / 2);
                        this.ctx.drawImage(
                            this.images.dirt_north,
                            -TILE_SIZE / 2,
                            -TILE_SIZE / 2,
                            TILE_SIZE,
                            TILE_SIZE
                        );
                        this.ctx.restore();
                    } else if (this.shouldUseDirtCornerNE(x, y) && 
                        this.images.dirt_corner && this.images.dirt_corner.complete && this.images.dirt_corner.naturalWidth > 0) {
                        this.ctx.drawImage(
                            this.images.dirt_corner,
                            x * TILE_SIZE,
                            y * TILE_SIZE,
                            TILE_SIZE,
                            TILE_SIZE
                        );
                    } else if (this.shouldUseDirtCornerSE(x, y) && 
                        this.images.dirt_corner && this.images.dirt_corner.complete && this.images.dirt_corner.naturalWidth > 0) {
                        // Use 90° rotated dirt_corner for southeast corner
                        this.ctx.save();
                        this.ctx.translate((x + 0.5) * TILE_SIZE, (y + 0.5) * TILE_SIZE);
                        this.ctx.rotate(Math.PI / 2);
                        this.ctx.drawImage(
                            this.images.dirt_corner,
                            -TILE_SIZE / 2,
                            -TILE_SIZE / 2,
                            TILE_SIZE,
                            TILE_SIZE
                        );
                        this.ctx.restore();
                    } else if (this.shouldUseDirtCornerSW(x, y) && 
                        this.images.dirt_corner && this.images.dirt_corner.complete && this.images.dirt_corner.naturalWidth > 0) {
                        // Use 180° rotated dirt_corner for southwest corner
                        this.ctx.save();
                        this.ctx.translate((x + 0.5) * TILE_SIZE, (y + 0.5) * TILE_SIZE);
                        this.ctx.rotate(Math.PI);
                        this.ctx.drawImage(
                            this.images.dirt_corner,
                            -TILE_SIZE / 2,
                            -TILE_SIZE / 2,
                            TILE_SIZE,
                            TILE_SIZE
                        );
                        this.ctx.restore();
                    } else if (this.shouldUseDirtCornerNW(x, y) && 
                        this.images.dirt_corner && this.images.dirt_corner.complete && this.images.dirt_corner.naturalWidth > 0) {
                        // Use 270° rotated dirt_corner for northwest corner
                        this.ctx.save();
                        this.ctx.translate((x + 0.5) * TILE_SIZE, (y + 0.5) * TILE_SIZE);
                        this.ctx.rotate(-Math.PI / 2);
                        this.ctx.drawImage(
                            this.images.dirt_corner,
                            -TILE_SIZE / 2,
                            -TILE_SIZE / 2,
                            TILE_SIZE,
                            TILE_SIZE
                        );
                        this.ctx.restore();
                    } else if (this.images.dirt && this.images.dirt.complete && this.images.dirt.naturalWidth > 0) {
                        this.ctx.drawImage(
                            this.images.dirt,
                            x * TILE_SIZE,
                            y * TILE_SIZE,
                            TILE_SIZE,
                            TILE_SIZE
                        );
                    } else {
                        // Fallback dirt color
                        this.ctx.fillStyle = TILE_COLORS[TILE_TYPES.FLOOR];
                        this.ctx.fillRect(
                            x * TILE_SIZE,
                            y * TILE_SIZE,
                            TILE_SIZE,
                            TILE_SIZE
                        );
                    }
                    
                    // Draw shrubbery on top if available
                    if (this.images.shrubbery && this.images.shrubbery.complete && this.images.shrubbery.naturalWidth > 0) {
                        this.ctx.drawImage(
                            this.images.shrubbery,
                            x * TILE_SIZE,
                            y * TILE_SIZE,
                            TILE_SIZE,
                            TILE_SIZE
                        );
                    } else {
                        // Fallback grass color
                        this.ctx.fillStyle = TILE_COLORS[TILE_TYPES.GRASS];
                        this.ctx.fillRect(
                            x * TILE_SIZE,
                            y * TILE_SIZE,
                            TILE_SIZE,
                            TILE_SIZE
                        );
                    }
                }
                // For wall tiles, draw dircle background first, then tree on top
                else if (tileType === TILE_TYPES.WALL) {
                    // Draw dircle background first
                    if (this.images.dircle && this.images.dircle.complete && this.images.dircle.naturalWidth > 0) {
                        this.ctx.drawImage(
                            this.images.dircle,
                            x * TILE_SIZE,
                            y * TILE_SIZE,
                            TILE_SIZE,
                            TILE_SIZE
                        );
                    } else {
                        // Fallback wall color as background
                        this.ctx.fillStyle = TILE_COLORS[TILE_TYPES.WALL];
                        this.ctx.fillRect(
                            x * TILE_SIZE,
                            y * TILE_SIZE,
                            TILE_SIZE,
                            TILE_SIZE
                        );
                    }
                    
                    // Draw bush on top if available
                    if (this.images.bush && this.images.bush.complete && this.images.bush.naturalWidth > 0) {
                        this.ctx.drawImage(
                            this.images.bush,
                            x * TILE_SIZE,
                            y * TILE_SIZE,
                            TILE_SIZE,
                            TILE_SIZE
                        );
                    }
                }
                else {
                    // Use solid color fallback for other tiles
                    const color = TILE_COLORS[tileType];
                    this.ctx.fillStyle = color;
                    this.ctx.fillRect(
                        x * TILE_SIZE,
                        y * TILE_SIZE,
                        TILE_SIZE,
                        TILE_SIZE
                    );
                }
                
                // Draw grid lines
                this.ctx.strokeStyle = '#000000';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(
                    x * TILE_SIZE,
                    y * TILE_SIZE,
                    TILE_SIZE,
                    TILE_SIZE
                );
            }
        }
    }
    
    drawPlayer() {
        const centerX = this.player.x * TILE_SIZE + TILE_SIZE / 2;
        const centerY = this.player.y * TILE_SIZE + TILE_SIZE / 2;
        const radius = TILE_SIZE * 0.25; // Smaller for 16x16 tiles
        
        // Draw player as a circle
        this.ctx.fillStyle = '#FFD700'; // Gold color
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // Add a black outline
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
    }
    
    gameLoop() {
        // Render the game
        this.render();
        
        // Render the zone map
        this.renderZoneMap();
        
        // Request next frame
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new Game();
});
