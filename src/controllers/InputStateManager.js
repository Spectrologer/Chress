/**
 * InputStateManager - Manages all input-related state
 *
 * Responsibilities:
 * - Track highlighted tiles for visual feedback
 * - Manage selection modes (shovel, charge, etc.)
 * - Track UI state (stats panel, radial menu, sign messages)
 * - Provide state query methods for other components
 */
export class InputStateManager {
    constructor(game) {
        this.game = game;

        // Visual feedback state
        this.lastHighlightedTile = { x: null, y: null };

        // No other state needed - delegate to game object for actual state queries
    }

    // ========================================
    // STATE QUERIES
    // ========================================

    /**
     * Check if displaying a sign message
     */
    isDisplayingSignMessage() {
        return !!this.game.displayingMessageForSign;
    }

    /**
     * Check if in shovel mode
     */
    isInShovelMode() {
        return !!this.game.shovelMode;
    }

    /**
     * Get active shovel item
     */
    getActiveShovel() {
        return this.game.activeShovel;
    }

    /**
     * Check if stats panel is open
     */
    isStatsPanelOpen() {
        return this.game.uiManager?.isStatsPanelOpen() ?? false;
    }

    /**
     * Check if there's a pending charge selection
     */
    hasPendingCharge() {
        if (this.game.transientGameState) {
            return this.game.transientGameState.hasPendingCharge();
        }
        return false;
    }

    /**
     * Get pending charge details
     */
    getPendingCharge() {
        if (this.game.transientGameState) {
            return this.game.transientGameState.getPendingCharge();
        }
        return null;
    }

    /**
     * Check if radial menu is open
     */
    isRadialMenuOpen() {
        return !!(this.game.radialInventoryUI?.open);
    }

    /**
     * Check if entrance animation is in progress
     */
    isEntranceAnimationActive() {
        return !!this.game._entranceAnimationInProgress;
    }

    // ========================================
    // VISUAL FEEDBACK
    // ========================================

    /**
     * Update highlighted tile for visual feedback
     */
    setHighlightedTile(x, y) {
        this.lastHighlightedTile = { x, y };
    }

    /**
     * Get currently highlighted tile
     */
    getHighlightedTile() {
        return { ...this.lastHighlightedTile };
    }

    /**
     * Clear highlighted tile
     */
    clearHighlightedTile() {
        this.lastHighlightedTile = { x: null, y: null };
    }

    // ========================================
    // STATE CHECKS FOR PLAYER SETTINGS
    // ========================================

    /**
     * Check if verbose path animations are enabled
     */
    hasVerbosePathAnimations() {
        return !!(this.game.player.stats?.verbosePathAnimations);
    }

    /**
     * Check if there are any living enemies
     */
    hasLivingEnemies() {
        return this.game.enemies?.some(e => e.health > 0) ?? false;
    }
}
