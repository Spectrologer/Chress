import type { GameContext, Item } from '@core/context';
import type { InventoryItem } from '@managers/inventory/ItemMetadata';

interface HighlightedTile {
    x: number | null;
    y: number | null;
}

interface PendingCharge {
    itemId: string;
    // Add other charge properties as needed
}

/**
 * InputStateManager - Manages all input-related state
 *
 * Responsibilities:
 * - Track highlighted tiles for visual feedback
 * - Manage selection modes (shovel, charge, etc.)
 * - Track UI state (stats panel, radial menu,textbox messages)
 * - Provide state query methods for other components
 */
export class InputStateManager {
    private game: GameContext;

    // Visual feedback state
    public lastHighlightedTile: HighlightedTile;

    constructor(game: GameContext) {
        this.game = game;

        // Visual feedback state
        this.lastHighlightedTile = { x: null, y: null };

        // No other state needed - delegate to game object for actual state queries
    }

    // ========================================
    // STATE QUERIES
    // ========================================

    /**
     * Check if displaying a textbox message
     */
    isDisplayingSignMessage(): boolean {
        return !!this.game.displayingMessageForSign;
    }

    /**
     * Check if in shovel mode
     */
    isInShovelMode(): boolean {
        return !!this.game.shovelMode;
    }

    /**
     * Get active shovel item
     */
    getActiveShovel(): Item | null {
        return this.game.activeShovel;
    }

    /**
     * Check if stats panel is open
     */
    isStatsPanelOpen(): boolean {
        return this.game.uiManager?.isStatsPanelOpen() ?? false;
    }

    /**
     * Check if there's a pending charge selection
     */
    hasPendingCharge(): boolean {
        if (this.game.transientGameState) {
            return this.game.transientGameState.hasPendingCharge();
        }
        return false;
    }

    /**
     * Get pending charge details
     */
    getPendingCharge(): PendingCharge | null {
        if (this.game.transientGameState) {
            return this.game.transientGameState.getPendingCharge();
        }
        return null;
    }

    /**
     * Check if radial menu is open
     */
    isRadialMenuOpen(): boolean {
        return !!(this.game.radialInventoryUI?.open);
    }

    /**
     * Check if entrance animation is in progress
     */
    isEntranceAnimationActive(): boolean {
        return !!this.game._entranceAnimationInProgress;
    }

    // ========================================
    // VISUAL FEEDBACK
    // ========================================

    /**
     * Update highlighted tile for visual feedback
     */
    setHighlightedTile(x: number, y: number): void {
        this.lastHighlightedTile = { x, y };
    }

    /**
     * Get currently highlighted tile
     */
    getHighlightedTile(): HighlightedTile {
        return { ...this.lastHighlightedTile };
    }

    /**
     * Clear highlighted tile
     */
    clearHighlightedTile(): void {
        this.lastHighlightedTile = { x: null, y: null };
    }

    // ========================================
    // STATE CHECKS FOR PLAYER SETTINGS
    // ========================================

    /**
     * Check if verbose path animations are enabled
     */
    hasVerbosePathAnimations(): boolean {
        return !!(this.game.player.stats?.verbosePathAnimations);
    }

    /**
     * Check if there are any living enemies
     */
    hasLivingEnemies(): boolean {
        return this.game.enemies?.some((e) => e.health > 0) ?? false;
    }
}
