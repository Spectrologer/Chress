// The project is a simple 2D tactical roguelike for mobile browsers. The premise is a world cursed by Ent, where all inhabitants are forced to move according to the rules of chess as punishment for the actions of the Woodcutters Club. The primary gameplay loop involves exploring a procedurally generated grid map to discover new zones, with the score based on the number of zones found. The ultimate, near-impossible goal is to locate and defeat the Ent in a special endgame zone where enemies break the established chess-movement rules. All design, narrative, and asset creation should align with this core concept of a rigid, ordered world clashing with its chaotic, natural origin, optimized for simple sprites and touch controls.//
import { GRID_SIZE, TILE_SIZE, CANVAS_SIZE, TILE_TYPES, FOOD_ASSETS } from './constants.js';
import { TextureManager } from './TextureManager.js';
import { ConnectionManager } from './ConnectionManager.js';
import { ZoneGenerator } from './ZoneGenerator.js';
import { Player } from './Player.js';
import { Enemy } from './Enemy.js';
import { Sign } from './Sign.js';
import { InputManager } from './InputManager.js';
import { InventoryManager } from './InventoryManager.js';
import { UIManager } from './UIManager.js';

// Game state
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.mapCanvas = document.getElementById('zoneMap');
        this.mapCtx = this.mapCanvas.getContext('2d');
        
        // Set canvas sizes
        this.setupCanvasSize();
        
        // Configure canvases for crisp pixel art
        TextureManager.configureCanvas(this.ctx);
        TextureManager.configureCanvas(this.mapCtx);
        
        // Initialize modules
        this.textureManager = new TextureManager();
        this.connectionManager = new ConnectionManager();
        this.zoneGenerator = new ZoneGenerator();
        this.player = new Player();
        this.inputManager = new InputManager(this);
        this.inventoryManager = new InventoryManager(this);
        this.uiManager = new UIManager(this);

        // Zone management
        this.zones = new Map(); // Stores generated zones by coordinate key
        this.grid = null; // Current zone grid
        this.enemies = []; // Current zone enemies
        this.defeatedEnemies = new Set(); // Tracks defeated enemy positions: "zoneX,zoneY,enemyX,enemyY"
        this.gameStarted = false;
        this.currentRegion = null; // Tracks current region name to avoid repeated notifications

        // Enemy wait mechanism for zone entry
        this.justEnteredZone = false; // Flag to skip enemy movements on zone entry

        // Message Log system
        this.messageLog = [];
        
        // Special zones marked by notes (zoneKey: "x,y" -> items array)
        this.specialZones = new Map();

        // Load assets and start game
        this.loadAssets();
    }
    
    setupCanvasSize() {
        // Set internal canvas size to maintain pixel-perfect rendering
        this.canvas.width = CANVAS_SIZE;
        this.canvas.height = CANVAS_SIZE;
        
        // Set map canvas size dynamically based on CSS
        this.updateMapCanvasSize();
        
        // Handle resize for responsive design
        window.addEventListener('resize', () => this.handleResize());
        this.handleResize();
    }
    
    updateMapCanvasSize() {
        // Get the computed style to match CSS sizing
        const computedStyle = window.getComputedStyle(this.mapCanvas);
        const cssWidth = parseInt(computedStyle.width);
        const cssHeight = parseInt(computedStyle.height);
        
        // Set canvas internal size to match CSS display size for crisp rendering
        this.mapCanvas.width = cssWidth;
        this.mapCanvas.height = cssHeight;
        
        // Reapply canvas configuration for crisp rendering
        TextureManager.configureCanvas(this.mapCtx);
    }
    
    handleResize() {
        // Update map canvas size on resize
        this.updateMapCanvasSize();
        // Re-render the zone map with new size
        if (this.gameStarted) {
            this.uiManager.renderZoneMap();
        }
        // Let CSS handle the display size for responsiveness
        // The main canvas internal size stays fixed for pixel-perfect rendering
    }
    
    async loadAssets() {
        try {
            console.log('Starting asset loading...');
            await this.textureManager.loadAssets();
            console.log('All assets loaded successfully');
            // Filter food assets to only those that loaded successfully
            this.availableFoodAssets = FOOD_ASSETS.filter(foodAsset => {
                const foodKey = foodAsset.replace('.png', '').replace('/', '_');
                return this.textureManager.isImageLoaded(foodKey);
            });
            console.log(`Found ${this.availableFoodAssets.length} available food assets out of ${FOOD_ASSETS.length}`);
            console.log('Available images:', Object.keys(this.textureManager.images));
            this.startGame();
        } catch (error) {
            console.error('Error loading assets:', error);
            this.availableFoodAssets = []; // No foods if loading failed
            this.startGame(); // Start anyway with fallback colors
        }
    }
    
    startGame() {
        if (this.gameStarted) return; // Prevent multiple initializations
        this.gameStarted = true;
        this.init();
    }
    
    init() {
        // Generate initial zone
        this.generateZone();

        // Ensure player starts on a valid tile, but do not overwrite signs
        const startTile = this.grid[this.player.y][this.player.x];
        if (!startTile || (typeof startTile === 'string' && startTile !== TILE_TYPES.SIGN) || (typeof startTile === 'object' && startTile.type !== TILE_TYPES.SIGN)) {
            this.grid[this.player.y][this.player.x] = TILE_TYPES.FLOOR;
        }

        // Set initial region (starting at 0,0 = "Home")
        const initialZone = this.player.getCurrentZone();
        this.currentRegion = this.uiManager.generateRegionName(initialZone.x, initialZone.y);

        // Set up event listeners
        this.inputManager.setupControls();
        this.uiManager.setupGameOverHandler();
        this.uiManager.setupCloseMessageLogHandler();
        this.uiManager.setupMessageLogButton();


        // Start game loop
        this.gameLoop();

        // Expose game instance to console for debugging/cheating
        window.game = this;

        // Import and expose console commands
        import('./consoleCommands.js').then(module => {
            window.consoleCommands = module.default;
        });

        // Update UI
        this.uiManager.updatePlayerPosition();
        this.uiManager.updateZoneDisplay();
        this.uiManager.updatePlayerStats();
    }
    
    generateZone() {
        const currentZone = this.player.getCurrentZone();
        console.log('Generating zone for:', currentZone);

        // Generate chunk connections for current area
        this.connectionManager.generateChunkConnections(currentZone.x, currentZone.y);

        // Generate or load the zone
        let zoneData = this.zoneGenerator.generateZone(
            currentZone.x,
            currentZone.y,
            this.zones,
            this.connectionManager.zoneConnections,
            this.availableFoodAssets
        );

        this.grid = zoneData.grid;
        this.enemies = (zoneData.enemies || []).map(e => new Enemy(e));

        console.log('Generated grid:', this.grid ? `${this.grid.length}x${this.grid[0]?.length}` : 'null');
        console.log('Generated enemies:', this.enemies.length);

        // Save the generated zone
        const zoneKey = `${currentZone.x},${currentZone.y}`;
        this.zones.set(zoneKey, zoneData);
    }
    
    transitionToZone(newZoneX, newZoneY, exitSide, exitX, exitY) {
        // Set flag to skip enemy movements this turn since player just entered zone
        this.justEnteredZone = true;

        // Check if this is a special zone marked by a note
        const zoneKey = `${newZoneX},${newZoneY}`;
        const hasReachedSpecialZone = this.specialZones.has(zoneKey);

        // Check if this is entering a new region category
        const newRegion = this.uiManager.generateRegionName(newZoneX, newZoneY);
        const isNewRegion = newRegion !== this.currentRegion;

        // Update player's current zone
        this.player.setCurrentZone(newZoneX, newZoneY);

        // Show region notification only if entering a new region
        if (isNewRegion) {
            this.uiManager.showRegionNotification(newZoneX, newZoneY);
            this.currentRegion = newRegion; // Update current region
        }

        // Decrease thirst and hunger when moving to a new zone
        this.player.onZoneTransition();

        // Generate or load the new zone
        this.generateZone();

        // Position player based on which exit they used
        this.positionPlayerAfterZoneTransition(exitSide, exitX, exitY);

        // If player spawned on shrubbery, remove it (restore exit)
        const playerPos = this.player.getPosition();
        if (this.grid[playerPos.y][playerPos.x] === TILE_TYPES.SHRUBBERY) {
            this.grid[playerPos.y][playerPos.x] = TILE_TYPES.EXIT;
        }

        // Ensure player is on a walkable tile
        this.player.ensureValidPosition(this.grid);

        // Check for special zone items found message
        if (hasReachedSpecialZone) {
            // Add treasure items to inventory
            this.addTreasureToInventory();

            // Remove the special zone marker since it was used
            this.specialZones.delete(zoneKey);
        }

        // Update UI
        this.uiManager.updateZoneDisplay();
        this.uiManager.updatePlayerPosition();
        this.uiManager.updatePlayerStats();
    }

    positionPlayerAfterZoneTransition(exitSide, exitX, exitY) {
        switch (exitSide) {
            case 'bottom':
                // Came from bottom, enter north side at corresponding x position
                this.grid[0][exitX] = TILE_TYPES.EXIT;
                this.zoneGenerator.clearPathToExit(exitX, 0);
                this.player.setPosition(exitX, 0);
                break;
            case 'top':
                // Came from top, enter south side at corresponding x position
                this.grid[GRID_SIZE - 1][exitX] = TILE_TYPES.EXIT;
                this.zoneGenerator.clearPathToExit(exitX, GRID_SIZE - 1);
                this.player.setPosition(exitX, GRID_SIZE - 1);
                break;
            case 'right':
                // Came from right, enter west side at corresponding y position
                this.grid[exitY][0] = TILE_TYPES.EXIT;
                this.zoneGenerator.clearPathToExit(0, exitY);
                this.player.setPosition(0, exitY);
                break;
            case 'left':
                // Came from left, enter east side at corresponding y position
                this.grid[exitY][GRID_SIZE - 1] = TILE_TYPES.EXIT;
                this.zoneGenerator.clearPathToExit(GRID_SIZE - 1, exitY);
                this.player.setPosition(GRID_SIZE - 1, exitY);
                break;
            default:
                // Fallback to center
                this.player.setPosition(Math.floor(GRID_SIZE / 2), Math.floor(GRID_SIZE / 2));
                break;
        }
    }





    
    resetGame() {
        // Reset all game state
        this.zones.clear();
        this.connectionManager.clear();
        this.zoneGenerator.constructor.zoneCounter = 0; // Reset zone counter for progressive difficulty
        this.zoneGenerator.constructor.axeSpawned = false; // Reset axe spawn
        this.zoneGenerator.constructor.hammerSpawned = false; // Reset hammer spawn
        this.zoneGenerator.constructor.noteSpawned = false; // Reset note spawn
        this.zoneGenerator.constructor.spearSpawned = false; // Reset spear spawn
        this.zoneGenerator.constructor.lionSpawned = false; // Reset lion spawn
        this.zoneGenerator.constructor.squigSpawned = false; // Reset squig spawn
        this.zoneGenerator.constructor.foodWaterRoomSpawned = false; // Reset food/water room spawn
        Sign.spawnedMessages.clear(); // Reset spawned message tracking
        this.player.reset();
        this.enemies = [];
        this.defeatedEnemies = new Set();
        this.currentRegion = null; // Reset region tracking
        this.lastSignMessage = null; // Reset sign message tracking
        this.displayingMessageForSign = null; // Reset sign message display tracking

        // Generate starting zone
        this.generateZone();
        this.grid[this.player.y][this.player.x] = TILE_TYPES.FLOOR;

        // Set initial region
        const initialZone = this.player.getCurrentZone();
        this.currentRegion = this.uiManager.generateRegionName(initialZone.x, initialZone.y);

        // Update UI
        this.uiManager.updatePlayerPosition();
        this.uiManager.updateZoneDisplay();
        this.uiManager.updatePlayerStats();
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        // Draw grid
        this.drawGrid();

        // Draw enemies
        this.drawEnemies();

        // Draw player
        this.drawPlayer();
    }
    
    drawGrid() {
        if (!this.grid) {
            console.error('Grid is null, cannot render');
            return;
        }

        // Calculate zone level for texture rendering
        const zone = this.player.getCurrentZone();
        const dist = Math.max(Math.abs(zone.x), Math.abs(zone.y));
        let zoneLevel = 1;
        if (dist <= 2) zoneLevel = 1;
        else if (dist <= 8) zoneLevel = 2;
        else if (dist <= 16) zoneLevel = 3;
        else zoneLevel = 4;

        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                const tile = this.grid[y][x];
                try {
                    if (tile && tile.type === TILE_TYPES.FOOD) {
                        this.textureManager.renderTile(this.ctx, x, y, tile.type, this.grid, zoneLevel);
                    } else {
                        this.textureManager.renderTile(this.ctx, x, y, tile, this.grid, zoneLevel);
                    }
                } catch (error) {
                    console.error(`Error rendering tile at ${x},${y}:`, error);
                    // Fallback rendering
                    this.ctx.fillStyle = '#ffcb8d';
                    this.ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                }
            }
        }
    }
    
    drawPlayer() {
        const pos = this.player.getPosition();
        let spriteKey = 'SeparateAnim/Special2'; // Default idle sprite
        if (this.player.attackAnimation > 0) {
            spriteKey = 'SeparateAnim/Attack';
        } else if (this.player.isDead()) {
            spriteKey = 'SeparateAnim/dead';
        }
        const playerImage = this.textureManager.getImage(spriteKey);
        if (playerImage && playerImage.complete) {
            this.ctx.drawImage(
                playerImage,
                pos.x * TILE_SIZE + this.player.bumpOffsetX,
                pos.y * TILE_SIZE + this.player.bumpOffsetY + this.player.liftOffsetY,
                TILE_SIZE,
                TILE_SIZE
            );
        } else {
            this.ctx.fillStyle = '#ff4444';
            this.ctx.fillRect(
                pos.x * TILE_SIZE + this.player.bumpOffsetX + 2,
                pos.y * TILE_SIZE + this.player.bumpOffsetY + 2,
                TILE_SIZE - 4,
                TILE_SIZE - 4
            );
        }
    }

    handleEnemyMovements() {
        const plannedMoves = new Map(); // enemy -> intended position
        const playerPos = this.player.getPosition();

        // Phase 1: Plan moves
        for (let enemy of this.enemies) {
            const move = enemy.planMoveTowards(this.player, this.grid, this.enemies, playerPos);
            if (move) {
                const key = `${move.x},${move.y}`;
                // Only add if no other enemy is planning this tile
                if (!plannedMoves.has(key)) {
                    plannedMoves.set(key, enemy);
                }
                // If multiple enemies want the same tile, only the first one gets it
            }
        }

        // Phase 2: Apply valid moves
        for (let [key, enemy] of plannedMoves) {
            const move = key.split(',').map(Number);
            enemy.x = move[0];
            enemy.y = move[1];
            enemy.liftFrames = 15; // Start lift animation
        }
    }

    checkCollisions() {
        // Since attacks are now handled during movement attempts, this is mainly for safety
        // in case of any unexpected overlaps (e.g., from zone loading)
        const playerPos = this.player.getPosition();

        // Check for any remaining overlaps and handle them
        this.enemies = this.enemies.filter(enemy => {
            if (enemy.x === playerPos.x && enemy.y === playerPos.y && !enemy.justAttacked) {
                // If enemy and player are somehow on same tile, enemy attacks and dies
                this.player.takeDamage(enemy.attack);
                console.log(`Unexpected collision: Enemy hit player! Player health: ${this.player.getHealth()}`);
                if (this.player.isDead()) {
                    console.log('Player died!');
                }
                console.log('Enemy removed due to collision');
                return false; // Remove enemy
            }
            return true;
        });
    }

    checkLionInteraction() {
        const playerPos = this.player.getPosition();
    
        // Find all lion positions
        const lions = [];
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                if (this.grid[y][x] === TILE_TYPES.LION) {
                    lions.push({ x, y });
                }
            }
        }
    
        // Check if player is adjacent to any lion
        const isAdjacentToLion = lions.some(lion => {
            const dx = Math.abs(lion.x - playerPos.x);
            const dy = Math.abs(lion.y - playerPos.y);
            return (dx <= 1 && dy <= 1) && !(dx === 0 && dy === 0);
        });
    
        // Check if player has meat
        const hasMeat = this.player.inventory.some(item => item.type === 'food' && item.foodType.includes('meat/'));
    
        if (isAdjacentToLion && !hasMeat) {
            this.uiManager.handleLionInteractionMessage();
        } else {
            this.uiManager.hideLionInteractionMessage();
        }
    }

    checkSquigInteraction() {
        const playerPos = this.player.getPosition();

        // Find all squig positions
        const squigs = [];
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                if (this.grid[y][x] === TILE_TYPES.SQUIG) {
                    squigs.push({ x, y });
                }
            }
        }

        // Check if player is adjacent to any squig
        const isAdjacentToSquig = squigs.some(squig => {
            const dx = Math.abs(squig.x - playerPos.x);
            const dy = Math.abs(squig.y - playerPos.y);
            return (dx <= 1 && dy <= 1) && !(dx === 0 && dy === 0);
        });

        // Check if player has seeds
        const hasSeeds = this.player.inventory.some(item => item.type === 'food' && item.foodType.includes('seeds/'));

        if (isAdjacentToSquig && !hasSeeds) {
            // Show message even if overlay is already showing (allow multiple messages)
            this.uiManager.showOverlayMessageSilent('<span class="character-name">Squig</span><br>Seeds please!', 'Images/fauna/squigface.png');
        }
    }

    // Check if player stepped on any items (notes, food, tools, etc.)
    checkItemPickup() {
        const playerPos = this.player.getPosition();
        const tile = this.grid[playerPos.y][playerPos.x];

        // Check if stepped on a note
        if (tile === TILE_TYPES.NOTE) {
            // Add note to inventory - notes can be picked up even when inventory is full
            // since the player might want to use one for a different destination
            this.player.inventory.push({ type: 'note' });
            this.grid[playerPos.y][playerPos.x] = TILE_TYPES.FLOOR; // Remove the note from the map
            this.uiManager.updatePlayerStats(); // Refresh inventory display
            // Add to message log
            this.uiManager.addMessageToLog('Found an ancient map note.');
            return; // Don't check other item types if note was found
        }

        // Check if stepped on food
        if (tile && tile.type === TILE_TYPES.FOOD) {
            // Add food to inventory and remove from map (don't consume it yet)
            if (this.player.inventory.length < 6) {
                this.player.inventory.push({ type: 'food', foodType: tile.foodType });
                this.grid[playerPos.y][playerPos.x] = TILE_TYPES.FLOOR; // Remove from map
                this.uiManager.updatePlayerStats(); // Refresh inventory display
            }
        }

        // Check if stepped on water
        if (tile === TILE_TYPES.WATER) {
            // Add water to inventory and remove from map (don't drink it yet)
            if (this.player.inventory.length < 6) {
                this.player.inventory.push({ type: 'water' });
                this.grid[playerPos.y][playerPos.x] = TILE_TYPES.FLOOR; // Remove from map
                this.uiManager.updatePlayerStats(); // Refresh inventory display
            }
        }

        // Check for axe drops
        if (tile === TILE_TYPES.AXE) {
            if (this.player.inventory.length < 6) {
                this.player.inventory.push({ type: 'axe' });
                this.grid[playerPos.y][playerPos.x] = TILE_TYPES.FLOOR; // Remove from map
                this.uiManager.updatePlayerStats();
            }
        }

        // Check for hammer drops
        if (tile === TILE_TYPES.HAMMER) {
            if (this.player.inventory.length < 6) {
                this.player.inventory.push({ type: 'hammer' });
                this.grid[playerPos.y][playerPos.x] = TILE_TYPES.FLOOR; // Remove from map
                this.uiManager.updatePlayerStats();
            }
        }

        // Check for spear drops
        if (tile && tile.type === TILE_TYPES.BISHOP_SPEAR) {
            if (this.player.inventory.length < 6) {
                this.player.inventory.push({ type: 'bishop_spear', uses: tile.uses });
                this.grid[playerPos.y][playerPos.x] = TILE_TYPES.FLOOR; // Remove from map
                this.uiManager.updatePlayerStats();
            }
        }

        // Check for bomb drops
        if (tile === TILE_TYPES.BOMB) {
            if (this.player.inventory.length < 6) {
                this.player.inventory.push({ type: 'bomb' });
                this.grid[playerPos.y][playerPos.x] = TILE_TYPES.FLOOR; // Remove from map
                this.uiManager.updatePlayerStats();
            }
        }
    }

    useMapNote() {
        const currentZone = this.player.getCurrentZone();
        const visited = this.player.getVisitedZones();

        // Find all undiscovered zones within a reasonable range
        const candidates = [];
        for (let zoneX = currentZone.x - 50; zoneX <= currentZone.x + 50; zoneX++) {
            for (let zoneY = currentZone.y - 50; zoneY <= currentZone.y + 50; zoneY++) {
                const zoneKey = `${zoneX},${zoneY}`;
                if (!visited.has(zoneKey) && !this.specialZones.has(zoneKey)) {
                    // Calculate Manhattan distance (zones)
                    const distance = Math.max(Math.abs(zoneX - currentZone.x), Math.abs(zoneY - currentZone.y));
                    if (distance >= 20) {
                        candidates.push({ x: zoneX, y: zoneY, distance });
                    }
                }
            }
        }

        if (candidates.length === 0) {
            console.log('No valid undiscovered zones found 20+ zones away');
            return;
        }

        // Pick a random candidate
        const selected = candidates[Math.floor(Math.random() * candidates.length)];
        const zoneKey = `${selected.x},${selected.y}`;
        console.log(`Map note used: marking zone (${selected.x}, ${selected.y}) as special treasure zone from ${Math.max(Math.abs(selected.x - currentZone.x), Math.abs(selected.y - currentZone.y))} zones away`);

        // Mark the zone as a special zone (with treasures)
        this.specialZones.set(zoneKey, [
            'Treasure Found: Bombs Added',
            'Treasure Found: Spears Added',
            'Treasure Found: Food Added'
        ]);

        // Mark the zone as visited (this adds it to the map)
        this.player.markZoneVisited(selected.x, selected.y);

        // Add to message log
        this.uiManager.addMessageToLog(`A distant location has been revealed on your map: (${selected.x}, ${selected.y})`);
        this.uiManager.updatePlayerStats(); // Refresh map display
        this.uiManager.renderZoneMap(); // Immediately render the change
    }

    interactWithLion() {
        // Check if player has meat in inventory
        const meatIndex = this.player.inventory.findIndex(item => item.type === 'food' && item.foodType.includes('meat/'));
        if (meatIndex >= 0) {
            // Consume the meat
            this.player.inventory.splice(meatIndex, 1);
            // Add water to inventory
            this.player.inventory.push({ type: 'water' });
            // Update stats to reflect the change
            this.uiManager.updatePlayerStats();
        }
        // Else: no trade, message already shown automatically
    }

    interactWithSquig() {
        // Check if player has seeds in inventory
        const seedsIndex = this.player.inventory.findIndex(item => item.type === 'food' && item.foodType.includes('seeds/'));
        if (seedsIndex >= 0) {
            // Consume the seeds
            this.player.inventory.splice(seedsIndex, 1);
            // Add water to inventory
            this.player.inventory.push({ type: 'water' });
            // Update stats to reflect the change
            this.uiManager.updatePlayerStats();
        }
        // Else: no trade, message already shown automatically
    }

    drawEnemies() {
        for (let enemy of this.enemies) {
            let enemyKey;
            if (enemy.enemyType === 'lizardo') {
                enemyKey = 'fauna/lizardo';
            } else if (enemy.enemyType === 'lizardeaux') {
                enemyKey = 'fauna/lizardeaux';
            } else {
                enemyKey = 'fauna/lizardy';
            }

            // Determine sprite based on animation state
            if (enemy.deathAnimation > 0) {
                enemyKey = 'SeparateAnim/dead';
            }

                // Dramatic attack animation: scale, flash, shake
                let scale = 1;
                let flash = false;
                let shakeX = 0, shakeY = 0;
                if (enemy.attackAnimation > 0) {
                    // Scale up and flash red for first half, shake for second half
                    if (enemy.attackAnimation > 7) {
                        scale = 1.35;
                        flash = true;
                    } else {
                        scale = 1.15;
                        shakeX = (Math.random() - 0.5) * 8;
                        shakeY = (Math.random() - 0.5) * 8;
                    }
                }

            const enemyImage = this.textureManager.getImage(enemyKey);
            if (enemyImage && enemyImage.complete) {
                    this.ctx.save();
                    // Center scaling on enemy
                    const cx = enemy.x * TILE_SIZE + enemy.bumpOffsetX + TILE_SIZE / 2 + shakeX;
                    const cy = enemy.y * TILE_SIZE + enemy.bumpOffsetY + enemy.liftOffsetY + TILE_SIZE / 2 + shakeY;
                    this.ctx.translate(cx, cy);
                    this.ctx.scale(scale, scale);
                    this.ctx.translate(-TILE_SIZE / 2, -TILE_SIZE / 2);
                    if (flash) {
                        this.ctx.globalAlpha = 0.7;
                        this.ctx.filter = 'brightness(1.5) drop-shadow(0 0 8px red)';
                    }
                this.ctx.drawImage(
                    enemyImage,
                        0,
                        0,
                        TILE_SIZE,
                        TILE_SIZE
                );
                    this.ctx.filter = 'none';
                    this.ctx.globalAlpha = 1.0;
                    this.ctx.restore();
            } else {
                // Fallback
                this.ctx.fillStyle = '#32CD32';
                this.ctx.fillRect(
                        enemy.x * TILE_SIZE + enemy.bumpOffsetX + 2,
                        enemy.y * TILE_SIZE + enemy.bumpOffsetY + 2,
                        TILE_SIZE - 4,
                        TILE_SIZE - 4
                );
            }
        }
    }

    addTreasureToInventory() {
        // Generate 3-5 random treasure items regardless of inventory space
        const numItems = Math.floor(Math.random() * 3) + 3; // 3 to 5 items
        const treasureTypes = ['bomb', 'bishop_spear', 'food'];

        for (let i = 0; i < numItems; i++) {
            const randomType = treasureTypes[Math.floor(Math.random() * treasureTypes.length)];

            if (randomType === 'bomb') {
                this.player.inventory.push({ type: 'bomb' });
                this.uiManager.addMessageToLog('Treasure Found: Bomb added to inventory.');
            } else if (randomType === 'bishop_spear') {
                this.player.inventory.push({ type: 'bishop_spear', uses: 3 });
                this.uiManager.addMessageToLog('Treasure Found: Bishop Spear added to inventory.');
            } else if (randomType === 'food' && this.availableFoodAssets.length > 0) {
                const randomFood = this.availableFoodAssets[Math.floor(Math.random() * this.availableFoodAssets.length)];
                this.player.inventory.push({ type: 'food', foodType: randomFood });
                this.uiManager.addMessageToLog('Treasure Found: Food added to inventory.');
            }
        }

        // Remove excess items beyond inventory limit (6), keeping the most recently added
        if (this.player.inventory.length > 6) {
            const excessItems = this.player.inventory.length - 6;
            this.player.inventory.splice(0, excessItems); // Remove from the beginning
            this.uiManager.addMessageToLog(`Inventory overflow: ${excessItems} item(s) were lost.`);
        }

        this.uiManager.updatePlayerStats(); // Refresh UI
    }

    // Console command to add bomb to inventory
    addBomb() {
        if (this.player.inventory.length < 6) {
            this.player.inventory.push({ type: 'bomb' });
            this.uiManager.updatePlayerStats();
        }
    }

    // Proxy to UIManager
    hideOverlayMessage() {
        this.uiManager.hideOverlayMessage();
    }

    // Proxy to UIManager for sign messages
    showSignMessage(message) {
        this.uiManager.showSignMessage(message);
    }

    updatePlayerPosition() {
        this.uiManager.updatePlayerPosition();
    }

    updatePlayerStats() {
        this.uiManager.updatePlayerStats();
    }

    // Perform bishop spear charge
    performBishopSpearCharge(item, targetX, targetY, enemy, dx, dy) {
        const playerPos = this.player.getPosition();

        // Check if diagonal path is unobstructed
        const steps = Math.abs(dx);
        for (let i = 1; i < steps; i++) {
            const px = playerPos.x + (dx > 0 ? i : -i);
            const py = playerPos.y + (dy > 0 ? i : -i);
            if (!this.player.isWalkable(px, py, this.grid, px, py)) {
                console.log('Bishop spear charge blocked by obstacle');
                return;
            }
        }

        // Decrement uses
        item.uses--;
        if (item.uses <= 0) {
            // Remove item if no uses left
            this.player.inventory = this.player.inventory.filter(invItem => invItem !== item);
        }

        // Move player directly to target position
        this.player.setPosition(targetX, targetY);
        console.log('Bishop Spear charge to (' + targetX + ',' + targetY + ')');

        // If there's an enemy at the target, attack it
        if (enemy) {
            // Attack the enemy (simple bump animation)
            this.player.startBump(dx < 0 ? -1 : 1, dy < 0 ? -1 : 1); // Bump in the direction of charge
            enemy.startBump(this.player.x - enemy.x, this.player.y - enemy.y);
            enemy.takeDamage(999); // Guaranteed kill
            console.log('Bishop Spear charge attack! Enemy defeated.');

            // Record defeat
            const currentZone = this.player.getCurrentZone();
            this.defeatedEnemies.add(`${currentZone.x},${currentZone.y},${enemy.x},${enemy.y}`);

            // Remove enemy
            this.enemies = this.enemies.filter(e => e !== enemy);

            // Update zone data
            const zoneKey = `${currentZone.x},${currentZone.y}`;
            if (this.zones.has(zoneKey)) {
                const zoneData = this.zones.get(zoneKey);
                zoneData.enemies = zoneData.enemies.filter(data => data.id !== enemy.id);
                this.zones.set(zoneKey, zoneData);
            }
        }

        this.uiManager.updatePlayerStats(); // Refresh UI after attack
        // Enemy movements happen after attacks
        this.handleEnemyMovements();
    }

    gameLoop() {
        // Update animations
        this.player.updateAnimations();
        this.enemies.forEach(enemy => enemy.updateAnimations());

        // Remove enemies whose death animation has finished
        this.enemies.forEach(enemy => {
            if (enemy.isDead() && enemy.deathAnimation === 0) {
                enemy.startDeathAnimation();
            }
        });
        this.enemies = this.enemies.filter(enemy => !enemy.isDead() || enemy.deathAnimation > 0);

        if (this.player.isDead()) {
            this.uiManager.showGameOverScreen();
            // Don't continue the game loop logic if dead, just wait for restart.
            // We still need to render to see the final state.
            this.render();
            return;
        }

        // Check lion interaction for automatic message
        this.checkLionInteraction();

        // Check squig interaction for automatic message
        this.checkSquigInteraction();

        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize game when the page loads
window.addEventListener('load', () => {
    new Game();
});
