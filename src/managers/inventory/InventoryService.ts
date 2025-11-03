import { ItemRepository } from './ItemRepository.js';
import { ItemEffectStrategy } from './ItemEffectStrategy.js';
import { ItemMetadata, type InventoryItem } from './ItemMetadata.js';
import { GRID_SIZE, TILE_TYPES } from '../../core/constants/index.js';
import audioManager from '../../utils/AudioManager.js';
import { eventBus } from '../../core/EventBus.js';
import { EventTypes } from '../../core/EventTypes.js';
import { isFloor } from '../../utils/TileUtils.js';

interface Game {
    player: any;
    grid: any[][];
    [key: string]: any;
}

interface UseItemContext {
    fromRadial?: boolean;
    targetX?: number;
    targetY?: number;
    [key: string]: any;
}

interface InventorySpace {
    main: number;
    radial: number;
}

/**
 * InventoryService - Business logic orchestration for inventory management
 *
 * This consolidated service replaces:
 * - Old InventoryService.js
 * - Most of ItemService.js
 * - ItemUsageManager.js
 *
 * Responsibilities:
 * - Orchestrate item pickup (repository + sound + animation)
 * - Orchestrate item usage (effect + repository cleanup)
 * - Orchestrate item drop (grid placement + repository removal)
 * - High-level inventory operations
 *
 * This class is THIN - it delegates to:
 * - ItemRepository (data access)
 * - ItemEffectStrategy (effect application)
 * - ItemMetadata (static data)
 */
export class InventoryService {
    private game: Game;
    public repository: ItemRepository;

    constructor(game: Game) {
        this.game = game;
        this.repository = new ItemRepository(game);
    }

    /**
     * Pickup an item from the grid and add to inventory
     * Orchestrates: sound + animation + repository
     */
    pickupItem(item: InventoryItem, sound: string = 'pickup'): boolean {
        if (!item || !this.game.player) return false;

        const success = this.repository.addToInventory(this.game.player, item, 'auto');

        if (success) {
            this._playPickupAnimation(item);
            this._playSound(sound);
            this._updateUI();
        }

        return success;
    }

    /**
     * Use an item from inventory
     * Orchestrates: effect application + repository cleanup + UI update
     *
     * @param item - Item being used
     * @param context - Context (fromRadial, targetX, targetY, etc.)
     */
    useItem(item: InventoryItem, context: UseItemContext = {}): boolean {
        if (!item || !this.game.player) return false;

        // Apply the item effect
        const result = ItemEffectStrategy.applyEffect(this.game, item, context);

        if (!result.success) {
            return false;
        }

        // If the item was consumed, decrement quantity/uses
        if (result.consumed) {
            if (typeof result.uses !== 'undefined') {
                this.repository.decrementAndCleanup(this.game.player, item, result.uses);
            } else if (typeof result.quantity !== 'undefined') {
                this.repository.decrementAndCleanup(this.game.player, item, result.quantity);
            }

            // Prune any zero-use items
            this.repository.pruneEmptyItems(this.game.player);
        }

        // Update UI
        this._updateUI();

        return true;
    }

    /**
     * Drop an item on the current tile
     */
    dropItem(itemType: string, tileType: number): boolean {
        const px = this.game.player.x;
        const py = this.game.player.y;

        // Check if player is within grid bounds
        if (py < 0 || py >= GRID_SIZE || px < 0 || px >= GRID_SIZE) {
            return false;
        }

        const currentTile = this.game.grid[py][px];

        if (!isFloor(currentTile)) {
            return false;
        }

        // Place tile
        this.game.grid[py][px] = tileType;

        // Remove from inventory
        const item = this.game.player.inventory.find((i: InventoryItem) => i.type === itemType);
        if (item) {
            this.repository.removeItem(this.game.player, item);
        }

        return true;
    }

    /**
     * Toggle item disabled state
     */
    toggleItemDisabled(item: InventoryItem): void {
        if (!item) return;

        if (typeof item.disabled === 'undefined') {
            item.disabled = false;
        }
        item.disabled = !item.disabled;

        this._updateUI();
    }

    /**
     * Get tooltip text for an item (delegates to metadata)
     */
    getTooltipText(item: InventoryItem): string {
        return ItemMetadata.getTooltipText(item);
    }

    /**
     * Check if player can pickup an item (has space or existing stack)
     */
    canPickupItem(item: InventoryItem): boolean {
        if (!item || !this.game.player) return false;

        const player = this.game.player;
        const isRadial = ItemMetadata.isRadialType(item.type);
        const inventoryType: 'main' | 'radial' = isRadial ? 'radial' : 'main';

        // Check for existing stack
        if (ItemMetadata.isStackable(item.type)) {
            if (this.repository.hasExistingStack(player, item, inventoryType)) {
                return true;
            }
        }

        // Check for available space
        return this.repository.hasSpace(player, inventoryType);
    }

    /**
     * Get inventory space info
     */
    getInventorySpace(): InventorySpace {
        return this.repository.getInventorySpace(this.game.player);
    }

    /**
     * Private: Play pickup animation
     * @private
     */
    private _playPickupAnimation(item: InventoryItem): void {
        try {
            const player = this.game.player;
            if (!player || !player.animations) return;

            const imageKey = ItemMetadata.getImageKey(item);
            player.animations.pickupHover = {
                imageKey: imageKey,
                frames: 60,
                totalFrames: 60,
                type: item.type,
                foodType: (item as any).foodType
            };
        } catch (e) {
            // Animation is optional, don't fail pickup
        }
    }

    /**
     * Private: Play sound effect
     * @private
     */
    private _playSound(soundName: string): void {
        audioManager.playSound(soundName, { game: this.game });
    }

    /**
     * Private: Update UI after inventory changes
     * @private
     */
    private _updateUI(): void {
        eventBus.emit(EventTypes.UI_UPDATE_STATS, {});
    }
}
