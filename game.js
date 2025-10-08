//
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
import { RenderManager } from './RenderManager.js';
import { CombatManager } from './CombatManager.js';
import { InteractionManager } from './InteractionManager.js';
import { ZoneManager } from './ZoneManager.js';
import { GameStateManager } from './GameStateManager.js';
import { SoundManager } from './SoundManager.js';

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

        // Initialize new managers
        this.renderManager = new RenderManager(this);
        this.combatManager = new CombatManager(this);
        this.interactionManager = new InteractionManager(this);
        this.zoneManager = new ZoneManager(this);
        this.gameStateManager = new GameStateManager(this);
        this.soundManager = new SoundManager();

        // Add references to managers for easier access
        this.Enemy = Enemy;

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
            await this.textureManager.loadAssets();
            // Filter food assets to only those that loaded successfully
            this.availableFoodAssets = FOOD_ASSETS.filter(foodAsset => {
                const foodKey = foodAsset.replace('.png', '').replace('/', '_');
                return this.textureManager.isImageLoaded(foodKey);
            });
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
        // Initialize visual effect animations
        this.horseChargeAnimations = [];
        // Bomb placement mode
        this.bombPlacementMode = false;
        this.bombPlacementPositions = [];

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
        this.uiManager.setupBarterHandlers();

        // Make soundManager global for easy access from other classes
        window.soundManager = this.soundManager;

        // Start game loop
        this.gameLoop();

        // Expose game instance to console for debugging/cheating
        window.game = this;
        window.gameInstance = this;

        // Import and expose console commands
        import('./consoleCommands.js').then(module => {
            window.consoleCommands = module.default;
            // Expose individual commands for easier access
            window.tp = (x, y) => module.default.tp(this, x, y);
            window.spawnHorseIcon = () => module.default.spawnHorseIcon(this);
            window.gotoInterior = () => module.default.gotoInterior(this);
            window.gotoWorld = () => module.default.gotoWorld(this);
        });

        // Update UI
        this.uiManager.updatePlayerPosition();
        this.uiManager.updateZoneDisplay();
        this.uiManager.updatePlayerStats();
    }
    
    generateZone() {
        this.zoneManager.generateZone();
    }

    transitionToZone(newZoneX, newZoneY, exitSide, exitX, exitY) {
        this.zoneManager.transitionToZone(newZoneX, newZoneY, exitSide, exitX, exitY);
    }







    
    resetGame() {
        this.gameStateManager.resetGame();
    }
    
    render() {
        this.renderManager.render();
    }
    


    handleEnemyMovements() {
        this.combatManager.handleEnemyMovements();
    }

    checkCollisions() {
        this.combatManager.checkCollisions();
    }

    checkLionInteraction() {
        this.interactionManager.checkLionInteraction();
    }

    checkSquigInteraction() {
        this.interactionManager.checkSquigInteraction();
    }

    checkItemPickup() {
        this.interactionManager.checkItemPickup();
    }

    useMapNote() {
        this.interactionManager.useMapNote();
    }

    interactWithNPC(foodType) {
        this.interactionManager.interactWithNPC(foodType);
    }

    addTreasureToInventory() {
        this.gameStateManager.addTreasureToInventory();
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

    incrementBombActions() {
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                const tile = this.grid[y][x];
                if (tile && typeof tile === 'object' && tile.type === 'BOMB' && tile.actionTimer < 2) {
                    tile.actionTimer++;
                    if (tile.actionTimer >= 2) {
                        this.explodeBomb(x, y);
                    }
                }
            }
        }
    }

    performBishopSpearCharge(item, targetX, targetY, enemy, dx, dy) {
        const playerPos = this.player.getPosition();
        const steps = Math.abs(dx);
        const traveledTiles = [];
        for (let i = 1; i < steps; i++) {
            const px = playerPos.x + (dx > 0 ? i : -i);
            const py = playerPos.y + (dy > 0 ? i : -i);
            if (!this.player.isWalkable(px, py, this.grid, px, py)) return;
            traveledTiles.push({x: px, y: py});
        }
        this.player.smokeAnimations = traveledTiles.map(t => ({x: t.x, y: t.y, frame: 18})); // Smoke at every tile traveled
        item.uses--;
        if (item.uses <= 0) this.player.inventory = this.player.inventory.filter(invItem => invItem !== item);
        this.player.setPosition(targetX, targetY);
        if (enemy) {
            this.player.startBump(dx < 0 ? -1 : 1, dy < 0 ? -1 : 1);
            enemy.startBump(this.player.x - enemy.x, this.player.y - enemy.y);
            enemy.takeDamage(999);
            this.soundManager.playSound('attack');
            const currentZone = this.player.getCurrentZone();
            this.defeatedEnemies.add(`${currentZone.x},${currentZone.y},${enemy.x},${enemy.y}`);
            this.enemies = this.enemies.filter(e => e !== enemy);
            const zoneKey = `${currentZone.x},${currentZone.y}`;
            if (this.zones.has(zoneKey)) {
                const zoneData = this.zones.get(zoneKey);
                zoneData.enemies = zoneData.enemies.filter(data => data.id !== enemy.id);
                this.zones.set(zoneKey, zoneData);
            }
        }
        this.uiManager.updatePlayerStats();
        this.handleEnemyMovements();
    }

    performHorseIconCharge(item, targetX, targetY, enemy, dx, dy) {
        const startPos = this.player.getPosition();

        // Determine the corner of the "L" shape for the animation
        let midPos;
        if (Math.abs(dx) === 2) { // Moved 2 horizontally, 1 vertically
            midPos = { x: startPos.x + dx, y: startPos.y };
        } else { // Moved 1 horizontally, 2 vertically
            midPos = { x: startPos.x, y: startPos.y + dy };
        }

        // Add a new animation object for the zip line effect
        this.horseChargeAnimations.push({
            startPos: startPos,
            midPos: midPos,
            endPos: { x: targetX, y: targetY },
            frame: 20 // Animation duration in frames
        });

        // Play a whoosh sound for the charge
        this.soundManager.playSound('whoosh');

        // Keep the smoke effect at the origin as well
        this.player.smokeAnimations.push({x: this.player.x, y: this.player.y, frame: 18});

        // Use the item
        item.uses--;
        if (item.uses <= 0) this.player.inventory = this.player.inventory.filter(invItem => invItem !== item);
        this.player.setPosition(targetX, targetY);
        if (enemy) {
            this.player.startBump(dx < 0 ? -1 : 1, dy < 0 ? -1 : 1);
            enemy.startBump(this.player.x - enemy.x, this.player.y - enemy.y);
            enemy.takeDamage(999);
            this.soundManager.playSound('attack');
            const currentZone = this.player.getCurrentZone();
            this.defeatedEnemies.add(`${currentZone.x},${currentZone.y},${enemy.x},${enemy.y}`);
            this.enemies = this.enemies.filter(e => e !== enemy);
            const zoneKey = `${currentZone.x},${currentZone.y}`;
            if (this.zones.has(zoneKey)) {
                const zoneData = this.zones.get(zoneKey);
                zoneData.enemies = zoneData.enemies.filter(data => data.id !== enemy.id);
                this.zones.set(zoneKey, zoneData);
            }
        }
        this.uiManager.updatePlayerStats();
        this.handleEnemyMovements();
    }

    explodeBomb(bx, by) {
        // Blast walls 1 tile around the bomb (excluding center) to create exits
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue; // Skip the bomb location itself
                const nx = bx + dx, ny = by + dy;
                if (nx >= 0 && nx < 9 && ny >= 0 && ny < 9 && this.grid[ny][nx] === TILE_TYPES.WALL) {
                    const isBorder = nx === 0 || nx === 8 || ny === 0 || ny === 8;
                    this.grid[ny][nx] = isBorder ? TILE_TYPES.EXIT : TILE_TYPES.FLOOR;
                }
            }
        }

        // Remove bomb
        this.grid[by][bx] = TILE_TYPES.FLOOR;

        // Start animation twice (loop twice)
        this.player.startSplodeAnimation(bx, by);
        this.player.startSplodeAnimation(bx, by);

        // Launch player and enemies away from bomb if in radius
        const px = this.player.x, py = this.player.y;
        const distXPlayer = Math.abs(px - bx);
        const distYPlayer = Math.abs(py - by);
        let traveledTilesPlayer = [];
        let curXPlayer = px, curYPlayer = py;
        let playerLaunched = false;
        if (distXPlayer <= 1 && distYPlayer <= 1) {
            const vX = (bx > px) ? -1 : (bx < px) ? 1 : 0;
            const vY = (by > py) ? -1 : (by < py) ? 1 : 0;
            if (vX === 0 && vY === 0) {} else {
                while (true) {
                    const nextX = curXPlayer + vX, nextY = curYPlayer + vY;
                    if (!this.player.isWalkable(nextX, nextY, this.grid, curXPlayer, curYPlayer)) {
                        break;
                    }
                    // Check if there's an enemy at the next position
                    const enemyAtPos = this.enemies.find(e => e.x === nextX && e.y === nextY);
                    if (enemyAtPos) {
                        // Damage the enemy
                        enemyAtPos.takeDamage(1); // Assume 1 damage, can adjust
                        enemyAtPos.startBump(curXPlayer - nextX, curYPlayer - nextY);
                        this.player.startBump(nextX - curXPlayer, nextY - curYPlayer);
                        const currentZone = this.player.getCurrentZone();
                        if (enemyAtPos.isDead()) {
                            enemyAtPos.startDeathAnimation();
                            this.defeatedEnemies.add(`${currentZone.x},${currentZone.y},${enemyAtPos.x},${enemyAtPos.y}`);
                            this.enemies = this.enemies.filter(e => e !== enemyAtPos);
                            const zoneKey = `${currentZone.x},${currentZone.y}`;
                            if (this.zones.has(zoneKey)) {
                                const zoneData = this.zones.get(zoneKey);
                                zoneData.enemies = zoneData.enemies.filter(data => data.id !== enemyAtPos.id);
                                this.zones.set(zoneKey, zoneData);
                            }
                        }
                        this.soundManager.playSound('attack');
                        // Stop at this position
                        traveledTilesPlayer.push({x: nextX, y: nextY});
                        curXPlayer = nextX;
                        curYPlayer = nextY;
                        break;
                    }

                    curXPlayer = nextX;
                    curYPlayer = nextY;
                    // Collect all tiles traveled (exclude starting position)
                    traveledTilesPlayer.push({x: curXPlayer, y: curYPlayer});
                }
                this.player.smokeAnimations = traveledTilesPlayer.map(t => ({x: t.x, y: t.y, frame: 18})); // Smoke at every tile traveled
                this.player.setPosition(curXPlayer, curYPlayer);
                this.player.ensureValidPosition(this.grid);
                playerLaunched = true;
            }
        }

        // Launch enemies away from bomb
        this.enemies.forEach(enemy => {
            const distX = Math.abs(enemy.x - bx);
            const distY = Math.abs(enemy.y - by);
            if (distX <= 1 && distY <= 1 && distX + distY > 0) { // In radius but not at bomb center (which is now floor)
                const vX = (bx > enemy.x) ? -1 : (bx < enemy.x) ? 1 : 0;
                const vY = (by > enemy.y) ? -1 : (by < enemy.y) ? 1 : 0;
                if (vX !== 0 || vY !== 0) {
                    const traveledTiles = [];
                    let curX = enemy.x, curY = enemy.y;
                    while (true) {
                        const nextX = curX + vX, nextY = curY + vY;
                        if (!this.player.isWalkable(nextX, nextY, this.grid, curX, curY)) {
                            break;
                        }
                        curX = nextX;
                        curY = nextY;
                        traveledTiles.push({x: curX, y: curY});
                    }
                    enemy.smokeAnimations = traveledTiles.map(t => ({x: t.x, y: t.y, frame: 18}));
                    enemy.setPosition(curX, curY);
                }
            }
        });

        // Update enemy movements if player was launched (to prevent immediate attack)
        if (playerLaunched) {
            this.handleEnemyMovements();
        }
    }

    gameLoop() {
        // Update animations
        this.player.updateAnimations();
        this.enemies.forEach(enemy => enemy.updateAnimations());

        // Update and filter horse charge animations
        this.horseChargeAnimations.forEach(anim => anim.frame--);
        this.horseChargeAnimations = this.horseChargeAnimations.filter(anim => anim.frame > 0);

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



        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize game when the page loads
window.addEventListener('load', () => {
    new Game();
});
