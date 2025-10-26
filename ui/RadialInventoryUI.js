import { TILE_SIZE, TILE_TYPES } from '../core/constants.js';
import { saveRadialInventory } from './RadialPersistence.js';
import { ItemMetadata } from './inventory/ItemMetadata.js';

export class RadialInventoryUI {
    constructor(game, inventoryService) {
        this.game = game;
        this.inventoryService = inventoryService;
        this.open = false;
        this.container = null; // DOM element
        // Map of slot elements to item indexes
        this._slotMap = new Map();
    }

    createContainer() {
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
    div.style.zIndex = 9999;
        // Inject minimal CSS for pulsating background (once per page)
        if (!document.getElementById('radial-inventory-ui-styles')) {
            const style = document.createElement('style');
            style.id = 'radial-inventory-ui-styles';
            style.textContent = `
            @keyframes radial-pulse {
                0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0,0,0,0.12); }
                50% { transform: scale(1.03); box-shadow: 0 0 10px 4px rgba(0,0,0,0.08); }
                100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0,0,0,0.12); }
            }
            .radial-slot-bg { animation: radial-pulse 1.6s ease-in-out infinite; }
            `;
            document.head.appendChild(style);
        }
        document.body.appendChild(div);
        this.container = div;
        return div;
    }

    openAtPlayer() {
        this.createContainer();
        this.close(); // clear
    const canvasRect = this.game.canvas.getBoundingClientRect();
    const player = this.game.player;
        // If player is standing on a stairdown, block opening radial so player must click to descend
        try {
            const tileUnder = this.game.grid[player.y] && this.game.grid[player.y][player.x];
            // tileUnder can be a primitive TILE_TYPES.PORT number or an object { type: TILE_TYPES.PORT, portKind: 'stairdown' }
            const tileType = (typeof tileUnder === 'object' && tileUnder?.type !== undefined) ? tileUnder.type : tileUnder;
            const portKind = (tileUnder && typeof tileUnder === 'object') ? tileUnder.portKind : null;
            // Don't open radial while standing on ANY port (stairdown/stairup/pitfall/cistern),
            // because these should be actionable by tapping the player's tile.
            if (tileType === TILE_TYPES.PORT || portKind === 'stairdown' || portKind === 'stairup') {
                return; // Do not open radial
            }
        } catch (e) {}
        // If radial inventory is empty, try to migrate eligible items from main inventory
        try {
            if ((!player.radialInventory || player.radialInventory.length === 0) && player.inventory && player.inventory.length > 0) {
                for (let i = player.inventory.length - 1; i >= 0 && (player.radialInventory.length || 0) < 8; i--) {
                    const it = player.inventory[i];
                    if (it && ItemMetadata.RADIAL_TYPES.includes(it.type)) {
                        // Normalize book representation: prefer 'uses' for books
                        if (it.type === 'book_of_time_travel') {
                            if (typeof it.uses === 'undefined') it.uses = (typeof it.quantity !== 'undefined') ? it.quantity : 1;
                            try { delete it.quantity; } catch (e) {}
                        }
                        player.inventory.splice(i, 1);
                        player.radialInventory = player.radialInventory || [];
                        player.radialInventory.push(it);
                    }
                }
                try { saveRadialInventory(this.game); } catch (e) {}
            }
        } catch (e) { try { console.warn('[RadialUI] migrate error', e); } catch (er) {} }

    // Compute screen scaling from canvas pixels -> CSS pixels
    const scaleX = canvasRect.width / (this.game.canvas.width || canvasRect.width);
    const scaleY = canvasRect.height / (this.game.canvas.height || canvasRect.height);
    // Screen-space tile size (may differ on non-square scaling)
    const tileScreenW = TILE_SIZE * scaleX;
    const tileScreenH = TILE_SIZE * scaleY;
    const centerX = canvasRect.left + (player.x + 0.5) * tileScreenW;
    const centerY = canvasRect.top + (player.y + 0.5) * tileScreenH;

        // Positions for 8 surrounding tiles (clockwise starting north)
        const dirs = [ {dx:0,dy:-1},{dx:1,dy:-1},{dx:1,dy:0},{dx:1,dy:1},{dx:0,dy:1},{dx:-1,dy:1},{dx:-1,dy:0},{dx:-1,dy:-1} ];

        this.game.radialInventorySnapshot = Array.from(this.game.player.radialInventory || []);

    // Make icons occupy an entire tile visually (in screen pixels)
    const iconSizeW = tileScreenW;
    const iconSizeH = tileScreenH;
    // Use a square size for placement (use smaller of the two to avoid overflow)
    const iconSize = Math.min(iconSizeW, iconSizeH);

        const radial = this.game.player.radialInventory || [];
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
            this.container.appendChild(note);
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
            el.style.cursor = this.game.player.isDead() ? 'not-allowed' : 'pointer';

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

            el.addEventListener('click', (ev) => {
                ev.stopPropagation();
                if (this.game.player.isDead()) return;
                // If this is a bomb in the radial, explicitly enter bomb placement mode here
                if (item.type === 'bomb' && this.game.player.radialInventory && this.game.player.radialInventory.indexOf(item) >= 0) {
                    const px = this.game.player.x, py = this.game.player.y;
                    this.game.bombPlacementPositions = [];
                    const directions = [{dx:1,dy:0},{dx:-1,dy:0},{dx:0,dy:1},{dx:0,dy:-1}];
                    for (const dir of directions) {
                        const nx = px + dir.dx, ny = py + dir.dy;
                        if (nx >= 0 && nx < 9 && ny >= 0 && ny < 9) {
                            const tile = this.game.grid[ny][nx];
                            if (tile === TILE_TYPES.FLOOR || tile === TILE_TYPES.EXIT) {
                                this.game.bombPlacementPositions.push({x: nx, y: ny});
                            }
                        }
                    }
                    this.game.bombPlacementMode = true;
                    try { if (this.game.uiManager) this.game.uiManager.showOverlayMessage('Tap a tile to place a bomb', null, true, true); } catch(e) {}
                    this.close();
                    return;
                }

                this.inventoryService.useItem(item, { fromRadial: true });
                this.close();
                if (this.game.updatePlayerStats) this.game.updatePlayerStats();
            });

            this.container.appendChild(el);
            this._slotMap.set(el, idx);
        });

        // Record when radial was opened so we can ignore the originating tap
        // that opened it (mobile browsers may fire a click after touchend).
        this._openedAt = Date.now();

        // Add a document-level click handler so clicks on the player's own
        // tile (which hit the canvas) will close the radial menu. We add
        // the listener in capture phase so it runs even if other handlers
        // stop propagation. Ignore clicks that occur very shortly after
        // opening to avoid immediately closing from the same touch.
        this._bodyClickHandler = (ev) => {
            try {
                const now = Date.now();
                // Ignore clicks that happen within 300ms of opening
                if (this._openedAt && (now - this._openedAt) < 300) return;
                // Convert screen coords to grid using the game's input manager
                const conv = this.game.inputManager && this.game.inputManager.convertScreenToGrid ? this.game.inputManager.convertScreenToGrid(ev.clientX, ev.clientY) : null;
                if (!conv) return;
                const playerPos = (this.game.player && typeof this.game.player.getPosition === 'function') ? this.game.player.getPosition() : { x: this.game.player.x, y: this.game.player.y };
                if (conv.x === playerPos.x && conv.y === playerPos.y) {
                    // Close radial when clicking own tile
                    this.close();
                }
            } catch (e) {}
        };
        try { document.addEventListener('click', this._bodyClickHandler, true); } catch (e) {}

        // Also listen for pointerdown on the game canvas directly. Pointer
        // events are more reliable on some platforms (they fire before click),
        // so this helps ensure a tap on the player's tile will close the radial.
        this._canvasPointerHandler = (ev) => {
            try {
                const now = Date.now();
                if (this._openedAt && (now - this._openedAt) < 300) return;
                if (!this.game || !this.game.inputManager) return;
                const conv = this.game.inputManager.convertScreenToGrid(ev.clientX, ev.clientY);
                if (!conv) return;
                const playerPos = (this.game.player && typeof this.game.player.getPosition === 'function') ? this.game.player.getPosition() : { x: this.game.player.x, y: this.game.player.y };
                if (conv.x === playerPos.x && conv.y === playerPos.y) {
                    try { this.close(); } catch (e) {}
                }
            } catch (e) {}
        };
        try { if (this.game && this.game.canvas) this.game.canvas.addEventListener('pointerdown', this._canvasPointerHandler, true); } catch (e) {}

        // Some environments may swallow 'click' events or other handlers may
        // stop propagation. Also listen for document-level pointerdown in the
        // capture phase so a single click/tap reliably closes the radial UI
        // (this fires earlier than 'click'). Keep the small ignore window to
        // avoid immediately closing from the same interaction that opened it.
        this._bodyPointerDownHandler = (ev) => {
            try {
                const now = Date.now();
                if (this._openedAt && (now - this._openedAt) < 300) return;
                const conv = this.game.inputManager && this.game.inputManager.convertScreenToGrid ? this.game.inputManager.convertScreenToGrid(ev.clientX, ev.clientY) : null;
                if (!conv) return;
                const playerPos = (this.game.player && typeof this.game.player.getPosition === 'function') ? this.game.player.getPosition() : { x: this.game.player.x, y: this.game.player.y };
                if (conv.x === playerPos.x && conv.y === playerPos.y) {
                    this.close();
                }
            } catch (e) {}
        };
        try { document.addEventListener('pointerdown', this._bodyPointerDownHandler, true); } catch (e) {}

        this.open = true;
    }

    _getImageForItem(item) {
        // Best-effort mapping to existing assets
        switch (item.type) {
            case 'bomb': return 'assets/items/bomb.png';
            case 'horse_icon': return 'assets/items/horse.png';
            case 'bow': return 'assets/items/bow.png';
            case 'bishop_spear': return 'assets/items/spear.png';
            case 'book_of_time_travel': return 'assets/items/book.png';
            default: return item.image || 'assets/items/unknown.png';
        }
    }

    close() {
        if (!this.container) return;
    // Remove the global click handler if present
    try { if (this._bodyClickHandler) document.removeEventListener('click', this._bodyClickHandler, true); } catch (e) {}
    this._bodyClickHandler = null;
    // Remove canvas pointer handler if present
    try { if (this._canvasPointerHandler && this.game && this.game.canvas) this.game.canvas.removeEventListener('pointerdown', this._canvasPointerHandler, true); } catch (e) {}
    this._canvasPointerHandler = null;
    this._openedAt = null;
        // Clear the container fully (remove any notes/slots)
        try { this.container.innerHTML = ''; } catch (e) {}
        this._slotMap.clear();
        this.open = false;
    }
}
