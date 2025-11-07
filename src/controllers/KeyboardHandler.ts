import { Sign } from '@ui/Sign';
import audioManager from '@utils/AudioManager';
import { eventBus } from '@core/EventBus';
import { EventTypes } from '@core/EventTypes';
import { Enemy } from '@entities/Enemy';
import { findValidPlacement } from '@generators/GeneratorUtils';
import { TILE_TYPES } from '@core/constants/index';
import { ContentRegistry } from '@core/ContentRegistry';
import type { Position } from '@core/Position';
import type { GameContext } from '@core/context';

interface KeyPressResult {
    type: 'cancel_path' | 'movement';
    newX?: number;
    newY?: number;
    currentPos?: Position;
}

/**
 * KeyboardHandler - Handles keyboard input and key mapping
 *
 * Responsibilities:
 * - Listen to keyboard events
 * - Map keys to actions (movement, special abilities)
 * - Handle debug hotkeys
 * - Trigger appropriate game actions
 */
export class KeyboardHandler {
    private game: GameContext;

    // Audio state
    private _audioResumed: boolean;

    // Path execution state (tracked via events)
    private _pathExecuting: boolean;

    // Event unsubscribers
    private _unsubscribers: (() => void)[];

    // Bound methods
    private _onKeyDown: (event: KeyboardEvent) => void;

    // Path execution check callback (deprecated)
    private onPathExecutionCheck?: () => boolean;

    constructor(game: GameContext) {
        this.game = game;

        // Audio state
        this._audioResumed = false;

        // Path execution state (tracked via events)
        this._pathExecuting = false;

        // Subscribe to path execution events
        this._unsubscribers = [];
        this._setupEventListeners();

        // Bind methods
        this._onKeyDown = this._handleKeyDown.bind(this);
    }

    /**
     * Subscribe to path execution state events
     */
    private _setupEventListeners(): void {
        this._unsubscribers.push(
            eventBus.on(EventTypes.INPUT_PATH_STARTED, () => {
                this._pathExecuting = true;
            })
        );

        this._unsubscribers.push(
            eventBus.on(EventTypes.INPUT_PATH_CANCELLED, () => {
                this._pathExecuting = false;
            })
        );

        this._unsubscribers.push(
            eventBus.on(EventTypes.INPUT_PATH_COMPLETED, () => {
                this._pathExecuting = false;
            })
        );
    }

    /**
     * Set up keyboard event listeners
     */
    setupListeners(): void {
        window.addEventListener('keydown', this._onKeyDown);
    }

    /**
     * Remove keyboard event listeners and unsubscribe from events
     */
    destroy(): void {
        window.removeEventListener('keydown', this._onKeyDown);

        // Unsubscribe from event bus
        this._unsubscribers?.forEach(unsub => unsub());
        this._unsubscribers = [];
    }

    // ========================================
    // KEYBOARD EVENT HANDLER
    // ========================================

    private _handleKeyDown(event: KeyboardEvent): void {
        this._resumeAudioIfNeeded();
        try { this.handleKeyPress(event); } catch {}
    }

    /**
     * Handle a key press event
     * @param event - The keyboard event
     * @returns Movement info {newX, newY} or null if not a movement key
     */
    handleKeyPress(event: KeyboardEvent): KeyPressResult | null {
        if (this.game.isPlayerTurn === false) {
            return { type: 'cancel_path' };
        }
        if (this.game.player.isDead()) return null;

        // Clear pending charge using transientGameState
        if (this.game.transientGameState && this.game.transientGameState.hasPendingCharge()) {
            this.game.transientGameState.clearPendingCharge();
            this.game.hideOverlayMessage();
        }

        // Clear UI if not pathing (check event-based state)
        const isPathExecuting = this.onPathExecutionCheck ? this.onPathExecutionCheck() : this._pathExecuting;
        if (!isPathExecuting) {
            const transientState = this.game.transientGameState;
            if (this.game.displayingMessageForSign) {
                Sign.hideMessageForSign(this.game);
            } else if (transientState && transientState.isBombPlacementMode()) {
                transientState.exitBombPlacementMode();
                this.game.hideOverlayMessage();
            } else {
                this.game.hideOverlayMessage();
            }
        }

        const lowerKey = (event.key || '').toLowerCase();
        const movementKeys = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'];

        // Hotkeys - removed console commands, add specific hotkeys as needed

        // Debug
        if (event.key === '9') {
            this.game.playerFacade.addPoints(1);
            const pos = this.game.playerFacade.getPosition();
            this.game.combatManager.addPointAnimation(pos.x, pos.y, 1);
            return null;
        }
        if (event.key === '0') {
            this.game.consentManager.forceShowConsentBanner();
            return null;
        }
        if (event.key === '8') {
            // Teleport to level 3 (Wilds) - zone (9,0) which has Manhattan distance 9, placing it in wilds
            this.game.transitionToZone(9, 0, 'teleport', this.game.player.x, this.game.player.y);
            return null;
        }
        if (event.key === '7') {
            this.spawnRandomGossipNPC();
            return null;
        }

        // New position
        const currentPos = this.game.player.getPosition();
        let newX = currentPos.x, newY = currentPos.y;

        switch (event.key.toLowerCase()) {
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
            case 'k':
                try { this.game.player.startBackflip(); } catch {}
                return null;
            case '1':
                this.spawnEnemyAtPlayerPosition('lizardy');
                return null;
            case '2':
                this.spawnEnemyAtPlayerPosition('lizardo');
                return null;
            case '3':
                this.spawnEnemyAtPlayerPosition('lizardeaux');
                return null;
            case '4':
                this.spawnEnemyAtPlayerPosition('lizord');
                return null;
            case '5':
                this.spawnEnemyAtPlayerPosition('lazerd');
                return null;
            case '6':
                this.spawnEnemyAtPlayerPosition('zard');
                return null;
            case 'escape':
                this.game.resetGame();
                return null;
            default:
                return null;
        }

        event.preventDefault();

        // Manual press - show feedback
        try {
            if (!(event as any)._synthetic) {
                if (this.game?.renderManager?.showTapFeedback) {
                    this.game.renderManager.showTapFeedback(newX, newY);
                }
                audioManager.playSound('bloop', { game: this.game });
            }
        } catch {}

        // Return movement info
        return { type: 'movement', newX, newY, currentPos };
    }

    /**
     * Set callback to check if path is being executed
     * @deprecated Path execution state is now tracked via event bus
     */
    setPathExecutionCheckCallback(callback: () => boolean): void {
        this.onPathExecutionCheck = callback;
    }

    /**
     * Spawn an enemy at a random valid floor tile
     */
    private spawnEnemyAtPlayerPosition(enemyType: string): void {
        const pos = findValidPlacement({
            maxAttempts: 50,
            validate: (x: number, y: number): boolean => this.isFloorTileAvailable(x, y)
        });

        if (pos) {
            const enemy = new Enemy({
                x: pos.x,
                y: pos.y,
                enemyType: enemyType,
                id: `${enemyType}_${Date.now()}_${Math.random()}`
            });
            this.game.enemyCollection?.add(enemy);
            this.game.render?.();
        }
    }

    /**
    * Spawn a random gossip NPC at an available floor tile
    */
    private spawnRandomGossipNPC(): void {
        // Get all gossip NPCs from ContentRegistry
        const allNPCs = ContentRegistry.getAllNPCs();
        const gossipNPCs = allNPCs.filter(npc =>
            npc.metadata &&
            (npc.metadata as any).characterData &&
            (npc.metadata as any).characterData.metadata &&
            (npc.metadata as any).characterData.metadata.category === 'gossip'
        );

        if (gossipNPCs.length === 0) {
            console.warn('[KeyboardHandler] No gossip NPCs found');
            return;
        }

        // Select random gossip NPC
        const randomNPC = gossipNPCs[Math.floor(Math.random() * gossipNPCs.length)];

        // Find valid placement on floor tile
        let pos = this.findValidGossipNPCPlacement();

        // Fallback: if no valid placement found, try to find ANY floor tile
        if (!pos) {
            pos = this.findAnyFloorTilePlacement();
        }

        if (!pos) {
            console.warn('[KeyboardHandler] No floor tile placement found for gossip NPC');
            return;
        }

        // Get sprite key from metadata
        const spritePath = (randomNPC.metadata as any)?.sprite;
        let spriteKey = randomNPC.id; // fallback
        if (spritePath && typeof spritePath === 'string' && spritePath.startsWith('characters/npcs/')) {
            spriteKey = spritePath.replace('characters/npcs/', '').replace('.png', '');
        }

        // Create NPC entity
        const npc = this.game.npcManager?.createNPC(pos.x, pos.y, randomNPC.id, spriteKey);
        if (npc) {
            // Set tile on grid
            this.game.gridManager?.setTile(pos.x, pos.y, randomNPC.tileType);
            // Render update
            this.game.render?.();
        }
    }

    /**
     * Find a valid placement for gossip NPC on empty floor tile
     */
    private findValidGossipNPCPlacement(): Position | null {
        return findValidPlacement({
            maxAttempts: 50,
            validate: (x: number, y: number) => this.isFloorTileAvailableForNPC(x, y)
        });
    }

    /**
     * Find any floor tile for placement (fallback method)
     */
    private findAnyFloorTilePlacement(): Position | null {
        const { findValidPlacement } = require('@generators/GeneratorUtils');
        return findValidPlacement({
            maxAttempts: 100,
            validate: (x: number, y: number) => {
                const tile = this.game.gridManager.getTile(x, y);
                const tileValue = tile && tile.type ? tile.type : tile;
                return tileValue === TILE_TYPES.FLOOR;
            }
        });
    }

    /**
     * Check if a floor tile is available for NPC spawning
     */
    private isFloorTileAvailableForNPC(x: number, y: number): boolean {
        const tile = this.game.gridManager.getTile(x, y);
        const tileValue = tile && tile.type ? tile.type : tile;

        // Only place on normal floor tiles
        if (tileValue !== TILE_TYPES.FLOOR) {
            return false;
        }

        // Check for enemy
        if (this.game.enemyCollection?.hasEnemyAt(x, y, true)) {
            return false;
        }

        // Check for existing NPC
        if (this.game.npcManager?.getNPCAt(x, y)) {
            return false;
        }

        return true;
    }

    /**
     * Check if a floor tile is available for enemy spawning
     */
     private isFloorTileAvailable(x: number, y: number): boolean {
        const tile = this.game.gridManager.getTile(x, y);
        const tileValue = tile && tile.type ? tile.type : tile;
        // Only place on normal floor tiles
        if (tileValue !== TILE_TYPES.FLOOR) return false;
        // Check for enemy
        if (this.game.enemyCollection?.hasEnemyAt(x, y, true)) return false;
        // Note: Item checking is complex and omitted for simplicity in debug spawning
        return true;
    }

    // ========================================
    // HELPER METHODS
    // ========================================

    private _resumeAudioIfNeeded(): void {
        if (this._audioResumed) return;
        this._audioResumed = true;
        try {
            if (this.game?.soundManager?.resumeAudioContext) {
                this.game.soundManager.resumeAudioContext();
            }
        } catch {}
    }
}
