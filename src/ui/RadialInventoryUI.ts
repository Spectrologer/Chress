import type { IGame } from '@core/context';
import type { Coordinates } from '@core/PositionTypes';
import { TILE_SIZE, TILE_TYPES, UI_CONSTANTS, TIMING_CONSTANTS, INVENTORY_CONSTANTS } from '@core/constants/index';
import { saveRadialInventory } from '@managers/RadialPersistence';
import { ItemMetadata } from '@managers/inventory/ItemMetadata';
import { eventBus } from '@core/EventBus';
import { EventTypes } from '@core/EventTypes';
import { EventListenerManager } from '@utils/EventListenerManager';
import type { InventoryService } from '@managers/inventory/InventoryService';

interface UseItemOptions {
    fromRadial?: boolean;
    isDoubleClick?: boolean;
}

interface InventoryItem {
    type: string;
    uses?: number;
    quantity?: number;
    disabled?: boolean;
    image?: string;
}

interface Player {
    x: number;
    y: number;
    radialInventory: InventoryItem[];
    inventory: InventoryItem[];
    isDead(): boolean;
    getPosition?(): Coordinates;
}

interface InputManager {
    convertScreenToGrid?(clientX: number, clientY: number): Coordinates | null;
}

interface InventoryInteractionHandler {
    handleItemUse(item: InventoryItem, options: UseItemOptions): void;
}

export class RadialInventoryUI {
    private game: IGame;
    private inventoryService: InventoryService;
    public open: boolean;
    private container: HTMLDivElement | null;
    // Map of slot elements to item indexes
    private _slotMap: Map<HTMLElement, number | string>;
    private _openedAt: number | null;
    private eventManager: EventListenerManager;

    constructor(game: IGame, inventoryService: InventoryService) {
        this.game = game;
        this.inventoryService = inventoryService;
        this.open = false;
        this.container = null;
        this._slotMap = new Map();
        this._openedAt = null;
        this.eventManager = new EventListenerManager();
    }

    private createContainer(): HTMLDivElement {
        if (this.container) return this.container;
        const div = document.createElement('div');
        div.className = 'radial-inventory-overlay';
        div.style.position = 'absolute';
        div.style.pointerEvents = 'none';
        div.style.left = '0';
        div.style.top = '0';
        div.style.width = '100%';
    div.style.height = '100%';
    // Ensure radial overlay is above most UI
    div.style.zIndex = String(UI_CONSTANTS.Z_INDEX_RADIAL_OVERLAY);
        // Inject minimal CSS for pulsating background (once per page)
        if (!document.getElementById('radial-inventory-ui-styles')) {
            const style = document.createElement('style');
            style.id = 'radial-inventory-ui-styles';
            style.textContent = `
            @keyframes radial-pulse {
                0% {
                    transform: scale(1);
                    box-shadow: 0 0 0 0 rgba(0,0,0,0.12);
                }
                50% {
                    transform: scale(1.08);
                    box-shadow: 0 0 10px 4px rgba(0,0,0,0.15);
                }
                100% {
                    transform: scale(1);
                    box-shadow: 0 0 0 0 rgba(0,0,0,0.12);
                }
            }
            .radial-slot-bg {
                animation: radial-pulse ${TIMING_CONSTANTS.RADIAL_PULSE_ANIMATION_DURATION} ease-in-out infinite;
                will-change: transform;
            }
            `;
            document.head.appendChild(style);
        }
        document.body.appendChild(div);
        this.container = div;
        return div;
    }

    openAtPlayer(): void {
        this.createContainer();
        this.close(); // clear
    if (!this.game.canvas) return;
    const canvasRect = this.game.canvas.getBoundingClientRect();
    const player = this.game.player;
        // Note: Radial menu can now open even when standing on EXIT/PORT tiles.
        // Transitions are triggered via double-tap on the player tile.
        // If radial inventory is empty, try to migrate eligible items from main inventory
        const radialInv = this.game.playerFacade?.getRadialInventory();
        const mainInv = this.game.playerFacade?.getInventory();
        if ((!radialInv || radialInv.length === 0) && mainInv && mainInv.length > 0) {
            for (let i = mainInv.length - 1; i >= 0 && (radialInv?.length || 0) < UI_CONSTANTS.RADIAL_INVENTORY_MAX_SIZE; i--) {
                const it = mainInv[i];
                if (it && ItemMetadata.RADIAL_TYPES.includes(it.type)) {
                    // Normalize book representation: prefer 'uses' for books
                    if (it.type === 'book_of_time_travel') {
                        if (typeof it.uses === 'undefined') {
                            const qty = typeof it.quantity === 'number' ? it.quantity : 1;
                            it.uses = qty;
                        }
                        delete it.quantity;
                    }
                    mainInv.splice(i, 1);
                    const radial = radialInv || [];
                    radial.push(it);
                }
            }
            saveRadialInventory(this.game);
        }

    // Compute screen scaling from canvas pixels -> CSS pixels
    const scaleX = canvasRect.width / (this.game.canvas.width || canvasRect.width);
    const scaleY = canvasRect.height / (this.game.canvas.height || canvasRect.height);
    // Screen-space tile size (may differ on non-square scaling)
    const tileScreenW = TILE_SIZE * scaleX;
    const tileScreenH = TILE_SIZE * scaleY;
    const playerX = this.game.playerFacade?.getX() ?? 0;
    const playerY = this.game.playerFacade?.getY() ?? 0;
    const centerX = canvasRect.left + (playerX + 0.5) * tileScreenW;
    const centerY = canvasRect.top + (playerY + 0.5) * tileScreenH;

        // Positions for 8 surrounding tiles (clockwise starting north)
        const dirs = [ {dx:0,dy:-1},{dx:1,dy:-1},{dx:1,dy:0},{dx:1,dy:1},{dx:0,dy:1},{dx:-1,dy:1},{dx:-1,dy:0},{dx:-1,dy:-1} ];

        this.game.radialInventorySnapshot = Array.from(this.game.playerFacade?.getRadialInventory() || []);

    // Make icons occupy an entire tile visually (in screen pixels)
    const iconSizeW = tileScreenW;
    const iconSizeH = tileScreenH;
    // Use a square size for placement (use smaller of the two to avoid overflow)
    const iconSize = Math.min(iconSizeW, iconSizeH);

        const radial = this.game.playerFacade?.getRadialInventory() || [];
        if (radial.length === 0) {
            // Show an empty indicator so it's clear the radial opened
            const note = document.createElement('div');
            note.className = 'radial-empty-note';
            note.style.position = 'absolute';
            note.style.left = `${centerX - 60}px`;
            note.style.top = `${centerY - 90}px`;
            note.style.padding = '6px 10px';
            note.style.background = 'rgba(0,0,0,0.7)';
            note.style.color = '#fff';
            note.style.borderRadius = '6px';
            note.style.pointerEvents = 'none';
            note.textContent = 'No radial items';
            this.container!.appendChild(note);
            this._slotMap.set(note, 'note');
        }

        radial.forEach((item, idx) => {
            const dir = dirs[idx % dirs.length];
            const slotX = centerX + dir.dx * tileScreenW;
            const slotY = centerY + dir.dy * tileScreenH;

            // Render image sized to tile and centered on the tile's screen position
            const el = document.createElement('div');
            el.className = 'radial-slot';
            el.style.position = 'absolute';
            el.style.left = `${slotX - iconSize/2}px`;
            el.style.top = `${slotY - iconSize/2}px`;
            el.style.width = `${iconSize}px`;
            el.style.height = `${iconSize}px`;
            el.style.pointerEvents = 'auto';
            el.style.cursor = this.game.playerFacade?.isDead() ? 'not-allowed' : 'pointer';

            // Semi-transparent, subtly pulsating black background
            el.style.background = 'rgba(0,0,0,0.28)';
            el.style.borderRadius = '10px';
            el.style.display = 'flex';
            el.style.alignItems = 'center';
            el.style.justifyContent = 'center';
            el.style.boxSizing = 'border-box';
            el.classList.add('radial-slot-bg');

            const img = document.createElement('img');
            img.src = this._getImageForItem(item);
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'contain';
            img.style.imageRendering = 'pixelated';
            if (item.disabled) img.style.opacity = '0.5';
            // Rotate bow icon 90deg counter-clockwise for radial menu
            if (item.type === 'bow') {
                img.style.transform = 'rotate(-90deg)';
                img.style.transformOrigin = '50% 50%';
            }
            // Scale down Fischer's Cube in radial menu (75% for pixel-perfect scaling)
            if (item.type === 'fischers_wand') {
                img.style.width = '75%';
                img.style.height = '75%';
            }
            el.appendChild(img);

            // Uses indicator (subtle)
            const uses = document.createElement('div');
            uses.textContent = `${item.uses || item.quantity || ''}`;
            uses.style.position = 'absolute';
            // Nudge slightly outside the tile so it doesn't obscure the icon
            uses.style.right = '-6px';
            uses.style.bottom = '-6px';
            uses.style.fontSize = '12px';
            uses.style.color = '#000';
            uses.style.background = 'rgba(255,255,255,0.88)';
            uses.style.padding = '0px 4px';
            uses.style.borderRadius = '4px';
            uses.style.boxShadow = '0 1px 0 rgba(0,0,0,0.08)';
            uses.style.textShadow = 'none';
            uses.style.fontWeight = '600';
            el.appendChild(uses);

            this.eventManager.add(el, 'click', (ev: Event) => {
                ev.stopPropagation();
                if (this.game.playerFacade?.isDead()) return;

                // Delegate to unified interaction handler
                this.game.inventoryInteractionHandler?.handleItemUse(item, {
                    fromRadial: true,
                    isDoubleClick: false
                });

                this.close();
                eventBus.emit(EventTypes.UI_UPDATE_STATS, {});
            });

            this.container!.appendChild(el);
            this._slotMap.set(el, idx);
        });

        // Record when radial was opened so we can ignore the originating tap
        // that opened it (mobile browsers may fire a click after touchend).
        this._openedAt = Date.now();

        // Add a document-level click handler so clicks on the player's own
        // tile (which hit the canvas) will close the radial menu.
        const bodyClickHandler = (ev: Event): void => {
            const now = Date.now();
            // Ignore clicks that happen within 300ms of opening
            if (this._openedAt && (now - this._openedAt) < TIMING_CONSTANTS.RADIAL_MENU_OPEN_IGNORE_WINDOW) return;
            // Convert screen coords to grid using the game's input manager
            const conv = this.game.inputManager?.convertScreenToGrid?.((ev as MouseEvent).clientX, (ev as MouseEvent).clientY);
            if (!conv) return;
            const playerPos = this.game.playerFacade?.getPosition?.() ?? { x: this.game.playerFacade?.getX() ?? 0, y: this.game.playerFacade?.getY() ?? 0 };
            if (conv.x === playerPos.x && conv.y === playerPos.y) {
                // Close radial when clicking own tile
                this.close();
            }
        };
        this.eventManager.add(document, 'click', bodyClickHandler as EventListener, { capture: true });

        // Also listen for pointerdown on the game canvas directly.
        const canvasPointerHandler = (ev: PointerEvent): void => {
            const now = Date.now();
            if (this._openedAt && (now - this._openedAt) < TIMING_CONSTANTS.RADIAL_MENU_OPEN_IGNORE_WINDOW) return;
            if (!this.game?.inputManager) return;
            const conv = this.game.inputManager.convertScreenToGrid?.(ev.clientX, ev.clientY);
            if (!conv) return;
            const playerPos = this.game.playerFacade?.getPosition?.() ?? { x: this.game.playerFacade.getX(), y: this.game.playerFacade.getY() };
            if (conv.x === playerPos.x && conv.y === playerPos.y) {
                this.close();
            }
        };
        this.eventManager.add(this.game.canvas, 'pointerdown', canvasPointerHandler as EventListener, { capture: true });

        // Also listen for document-level pointerdown.
        const bodyPointerDownHandler = (ev: PointerEvent): void => {
            const now = Date.now();
            if (this._openedAt && (now - this._openedAt) < TIMING_CONSTANTS.RADIAL_MENU_OPEN_IGNORE_WINDOW) return;
            const conv = this.game.inputManager?.convertScreenToGrid?.(ev.clientX, ev.clientY);
            if (!conv) return;
            const playerPos = this.game.playerFacade?.getPosition?.() ?? { x: this.game.playerFacade.getX(), y: this.game.playerFacade.getY() };
            if (conv.x === playerPos.x && conv.y === playerPos.y) {
                this.close();
            }
        };
        this.eventManager.add(document, 'pointerdown', bodyPointerDownHandler as EventListener, { capture: true });

        this.open = true;
    }

    private _getImageForItem(item: InventoryItem): string {
        // Best-effort mapping to existing assets
        switch (item.type) {
            case 'bomb': return 'assets/items/misc/bomb.png';
            case 'horse_icon': return 'assets/items/misc/horse.png';
            case 'bow': return 'assets/items/equipment/bow.png';
            case 'bishop_spear': return 'assets/items/equipment/spear.png';
            case 'book_of_time_travel': return 'assets/items/misc/book.png';
            case 'shovel': return 'assets/items/equipment/shovel.png';
            case 'fischers_cube': return 'assets/environment/doodads/cube.png';
            case 'teleport_branch': return 'assets/items/misc/branch.png';
            default: return item.image || 'assets/items/unknown.png';
        }
    }

    close(): void {
        if (!this.container) return;
        // Cleanup all event listeners
        this.eventManager.cleanup();
        this._openedAt = null;
        // Clear the container fully (remove any notes/slots)
        this.container.innerHTML = '';
        this._slotMap.clear();
        this.open = false;
    }

    /**
     * Cleanup all event listeners and resources
     * Call this when destroying the RadialInventoryUI instance
     */
    cleanup(): void {
        this.close();
    }
}
