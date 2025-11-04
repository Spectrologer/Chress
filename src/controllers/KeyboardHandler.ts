import { Sign } from '../ui/Sign';
import audioManager from '../utils/AudioManager';
import { eventBus } from '../core/EventBus';
import { EventTypes } from '../core/EventTypes';

interface KeyPressResult {
    type: 'cancel_path' | 'movement';
    newX?: number;
    newY?: number;
    currentPos?: any;
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
    private game: any;

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

    constructor(game: any) {
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
        try { this.handleKeyPress(event); } catch (e) {}
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
            this.game.player.setSpentDiscoveries(this.game.player.getVisitedZones().size - 999);
            this.game.uiManager.updateZoneDisplay();
            return null;
        }
        if (event.key === '7') {
            const pos = this.game.playerFacade.getPosition();
            this.game.transitionToZone(9, 0, 'teleport', pos.x, pos.y);
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
                try { this.game.player.startBackflip(); } catch (e) {}
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
        } catch (e) {}

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
        } catch (e) {}
    }
}
