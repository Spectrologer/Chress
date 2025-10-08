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
        this.uiManager.setupAttackRangeToggle();

        // Make soundManager global for easy access from other classes
        window.soundManager = this.soundManager;

        // Start game loop
        this.gameLoop();

        // Expose game instance to console for debugging/cheating
        window.game = this;

        // Import and expose console commands
        import('./consoleCommands.js').then(module => {
            window.consoleCommands = module.default;
            // Expose individual commands for easier access
            window.tp = (x, y) => module.default.tp(this, x, y);
            window.spawnHorseIcon = () => module.default.spawnHorseIcon(this);
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

    toggleEnemyAttackRanges() {
        this.showEnemyAttackRanges = !this.showEnemyAttackRanges;
        console.log(`Enemy attack ranges visibility: ${this.showEnemyAttackRanges}`);
        
        // Update button state
        const button = document.getElementById('toggle-attack-range-button');
        if (button) button.classList.toggle('active', this.showEnemyAttackRanges);
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

    performBishopSpearCharge(item, targetX, targetY, enemy, dx, dy) {
        const playerPos = this.player.getPosition();
        const steps = Math.abs(dx);
        for (let i = 1; i < steps; i++) {
            const px = playerPos.x + (dx > 0 ? i : -i);
            const py = playerPos.y + (dy > 0 ? i : -i);
            if (!this.player.isWalkable(px, py, this.grid, px, py)) return;
        }
        item.uses--;
        if (item.uses <= 0) this.player.inventory = this.player.inventory.filter(invItem => invItem !== item);
        this.player.setPosition(targetX, targetY);
        if (enemy) {
            this.game.player.startBump(dx < 0 ? -1 : 1, dy < 0 ? -1 : 1);
            enemy.startBump(this.game.player.x - enemy.x, this.game.player.y - enemy.y);
            enemy.takeDamage(999);
            this.game.soundManager.playSound('attack');
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



        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize game when the page loads
window.addEventListener('load', () => {
    new Game();
});
