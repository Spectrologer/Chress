import { INPUT_CONSTANTS, TILE_TYPES } from './constants.js';

// Lightweight pointer normalization for the game canvas. Keeps behavior similar
// to existing mouse/touch handlers: tap detection, hold-feedback updates, and
// swipe -> directional key events. Designed to be non-invasive so existing
// mouse/touch listeners can remain while pointer support is added.
export class PointerInput {
    constructor(game, handlers, convertScreenToGrid) {
        this.game = game;
        this.handlers = handlers; // { handleTap, handleKeyPress }
        this.convertScreenToGrid = convertScreenToGrid;
        this.activePointers = new Map(); // pointerId -> {startX, startY, startTime, lastTile}

        if (!this.game || !this.game.canvas) return;

        this._onPointerDown = this._onPointerDown.bind(this);
        this._onPointerMove = this._onPointerMove.bind(this);
        this._onPointerUp = this._onPointerUp.bind(this);
        this._onPointerCancel = this._onPointerCancel.bind(this);

        this.game.canvas.addEventListener('pointerdown', this._onPointerDown, { passive: true });
        this.game.canvas.addEventListener('pointermove', this._onPointerMove, { passive: true });
        this.game.canvas.addEventListener('pointerup', this._onPointerUp, { passive: true });
        this.game.canvas.addEventListener('pointercancel', this._onPointerCancel);
    }

    _onPointerDown(e) {
        // Only primary button for mouse
        if (e.pointerType === 'mouse' && e.button !== 0) return;

        try { e.target.setPointerCapture?.(e.pointerId); } catch (err) {}

        const now = Date.now();
        this.activePointers.set(e.pointerId, {
            startX: e.clientX,
            startY: e.clientY,
            startTime: now,
            lastTile: this._safeConvert(e.clientX, e.clientY)
        });

        // If this is a touch and the pointer started on the player's tile, open radial UI immediately
        try {
            const info = this.activePointers.get(e.pointerId);
            const t = info && info.lastTile;
            if (e.pointerType !== 'mouse' && t && this.game && this.game.player) {
                const playerPos = this.game.player.getPosition();
                if (t.x === playerPos.x && t.y === playerPos.y && this.game.radialInventoryUI) {
                    // Don't open radial when standing on an exit or port tile
                    const currentTile = this.game.grid[playerPos.y]?.[playerPos.x];
                    if (currentTile === TILE_TYPES.EXIT || currentTile === TILE_TYPES.PORT) {
                        // If radial is already open, close it; otherwise do not open or suppress the tap
                        if (this.game.radialInventoryUI.open) try { this.game.radialInventoryUI.close(); } catch (err) {}
                        // NOTE: do NOT set info._radialOpened here — we want the tap to reach the
                        // normal handlers so exit/port logic can run.
                    } else {
                        try {
                            if (this.game.radialInventoryUI.open) {
                                this.game.radialInventoryUI.close();
                                info._radialOpened = true; // Suppress tap on pointerup
                            } else {
                                this.game.radialInventoryUI.openAtPlayer();
                                info._radialOpened = true;
                            }
                        } catch (err) {}
                    }
                }
            }
        } catch (err) {}

        if (this.game && this.game.renderManager && typeof this.game.renderManager.startHoldFeedback === 'function') {
            const t = this.activePointers.get(e.pointerId).lastTile;
            if (t) this.game.renderManager.startHoldFeedback(t.x, t.y);
        }
        if (this.game && this.game.soundManager && typeof this.game.soundManager.playSound === 'function') {
            const t = this.activePointers.get(e.pointerId).lastTile;
            const enemyAtInitial = t ? this.game.enemies.find(en => en.x === t.x && en.y === t.y && en.health > 0) : null;
            if (!enemyAtInitial) this.game.soundManager.playSound('bloop');
        }
    }

    _onPointerMove(e) {
        const info = this.activePointers.get(e.pointerId);
        if (!info) return;
        const gc = this._safeConvert(e.clientX, e.clientY);
        if (!gc) return;
        // If pointer moved onto the player's tile and radial isn't open yet for this pointer, open it
        try {
            if (e.pointerType !== 'mouse' && this.game && this.game.player && this.game.radialInventoryUI) {
                const playerPos = this.game.player.getPosition();
                if (gc.x === playerPos.x && gc.y === playerPos.y && !info._radialHoverOpened) {
                    // Don't open radial on hover when standing on exits or ports
                    const currentTile = this.game.grid[playerPos.y]?.[playerPos.x];
                    if (currentTile === TILE_TYPES.EXIT || currentTile === TILE_TYPES.PORT) {
                        info._radialHoverOpened = true; // mark to avoid re-opening
                    } else {
                        try { this.game.radialInventoryUI.openAtPlayer(); } catch (err) {}
                        info._radialHoverOpened = true;
                    }
                }
            }
        } catch (err) {}
        if (this.game && this.game.renderManager && typeof this.game.renderManager.startHoldFeedback === 'function') {
            this.game.renderManager.startHoldFeedback(gc.x, gc.y);
        }
        if (info.lastTile.x !== gc.x || info.lastTile.y !== gc.y) {
            if (this.game && this.game.soundManager && typeof this.game.soundManager.playSound === 'function') {
                const enemyOnGc = this.game.enemies.find(en => en.x === gc.x && en.y === gc.y && en.health > 0);
                if (!enemyOnGc) this.game.soundManager.playSound('bloop');
            }
            info.lastTile = gc;
        }
    }

    _onPointerUp(e) {
        const info = this.activePointers.get(e.pointerId);
        if (!info) return;
        try { e.target.releasePointerCapture?.(e.pointerId); } catch (err) {}

        if (this.game && this.game.renderManager && typeof this.game.renderManager.clearFeedback === 'function') {
            this.game.renderManager.clearFeedback();
        }

        // If radial UI was opened on pointerdown for this pointer, suppress the normal tap handling
        if (info._radialOpened) {
            this.activePointers.delete(e.pointerId);
            return;
        }

        // For mouse input, preserve legacy behavior: mouse drag + release should
        // trigger a tap at release coordinates (matching prior mousedown/mouseup logic).
        if (e.pointerType === 'mouse') {
            try { this.handlers.handleTap(e.clientX, e.clientY); } catch (err) {}
            this.activePointers.delete(e.pointerId);
            return;
        }

        const deltaX = e.clientX - info.startX;
        const deltaY = e.clientY - info.startY;
        const touchDuration = Date.now() - info.startTime;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // Tap conditions follow the existing touch logic in InputBindings
        if (touchDuration < INPUT_CONSTANTS.MAX_TAP_TIME && distance < INPUT_CONSTANTS.MIN_SWIPE_DISTANCE) {
            try { this.handlers.handleTap(e.clientX, e.clientY); } catch (err) {}
        } else if (touchDuration >= INPUT_CONSTANTS.MAX_TAP_TIME) {
            try { this.handlers.handleTap(e.clientX, e.clientY); } catch (err) {}
        } else if (distance > INPUT_CONSTANTS.MIN_SWIPE_DISTANCE) {
            // Interpret as swipe -> directional key
            let direction = '';
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                direction = deltaX > 0 ? 'arrowright' : 'arrowleft';
            } else {
                direction = deltaY > 0 ? 'arrowdown' : 'arrowup';
            }
            try { this.handlers.handleKeyPress({ key: direction, preventDefault: () => {} }); } catch (err) {}
        }

        this.activePointers.delete(e.pointerId);
    }

    _onPointerCancel(e) {
        if (this.game && this.game.renderManager && typeof this.game.renderManager.clearFeedback === 'function') {
            this.game.renderManager.clearFeedback();
        }
        this.activePointers.delete(e.pointerId);
    }

    _safeConvert(x, y) {
        try { return this.convertScreenToGrid(x, y); } catch (err) { return null; }
    }

    destroy() {
        if (!this.game || !this.game.canvas) return;
        this.game.canvas.removeEventListener('pointerdown', this._onPointerDown);
        this.game.canvas.removeEventListener('pointermove', this._onPointerMove);
        this.game.canvas.removeEventListener('pointerup', this._onPointerUp);
        this.game.canvas.removeEventListener('pointercancel', this._onPointerCancel);
    }
}
