import { INPUT_CONSTANTS } from '../core/constants.js';

export class InputBindings {
    constructor(game, handlers, convertScreenToGrid) {
        this.game = game;
        this.handlers = handlers; // { handleTap, handleKeyPress }
        this.convertScreenToGrid = convertScreenToGrid;
        this.lastHighlightedTile = { x: null, y: null };
        this._audioResumed = false;
    }

    _resumeAudioIfNeeded() {
        if (this._audioResumed) return;
        this._audioResumed = true;
        try {
            if (this.game && this.game.soundManager && typeof this.game.soundManager.resumeAudioContext === 'function') {
                this.game.soundManager.resumeAudioContext();
            }
        } catch (e) {}
    }

    setupControls() {
        // Keyboard controls
        window.addEventListener('keydown', (event) => {
            this._resumeAudioIfNeeded();
            try { this.handlers.handleKeyPress(event); } catch (e) {}
        });

        // Mouse press/hold -> click behavior
        this.game.canvas.addEventListener('mousedown', (event) => {
            this._resumeAudioIfNeeded();
            const gridCoords = this.convertScreenToGrid(event.clientX, event.clientY);
            try {
                if (this.game && this.game.renderManager && typeof this.game.renderManager.startHoldFeedback === 'function') {
                    this.game.renderManager.startHoldFeedback(gridCoords.x, gridCoords.y);
                }
                if (this.game && this.game.soundManager && typeof this.game.soundManager.playSound === 'function') {
                    const enemyAtInitial = this.game.enemies.find(e => e.x === gridCoords.x && e.y === gridCoords.y && e.health > 0);
                    if (!enemyAtInitial) {
                        this.game.soundManager.playSound('bloop');
                    }
                    this.lastHighlightedTile.x = gridCoords.x;
                    this.lastHighlightedTile.y = gridCoords.y;
                }
            } catch (e) {}

            const onMouseMove = (ev) => {
                try {
                    const gc = this.convertScreenToGrid(ev.clientX, ev.clientY);
                    if (this.game && this.game.renderManager && typeof this.game.renderManager.startHoldFeedback === 'function') {
                        this.game.renderManager.startHoldFeedback(gc.x, gc.y);
                    }
                    if (this.lastHighlightedTile.x !== gc.x || this.lastHighlightedTile.y !== gc.y) {
                        if (this.game && this.game.soundManager && typeof this.game.soundManager.playSound === 'function') {
                            const enemyOnGc = this.game.enemies.find(e => e.x === gc.x && e.y === gc.y && e.health > 0);
                            if (!enemyOnGc) this.game.soundManager.playSound('bloop');
                        }
                        this.lastHighlightedTile.x = gc.x;
                        this.lastHighlightedTile.y = gc.y;
                    }
                } catch (e) {}
            };

            const onMouseUp = (ev) => {
                try {
                    if (this.game && this.game.renderManager && typeof this.game.renderManager.clearFeedback === 'function') {
                        this.game.renderManager.clearFeedback();
                    }
                } catch (e) {}
                this.lastHighlightedTile.x = null;
                this.lastHighlightedTile.y = null;
                try { this.handlers.handleTap(ev.clientX, ev.clientY); } catch (e) {}
                window.removeEventListener('mouseup', onMouseUp);
                window.removeEventListener('mousemove', onMouseMove);
            };

            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        });

        // Click fallback
        this.game.canvas.addEventListener('click', (event) => {
            try { this.handlers.handleTap(event.clientX, event.clientY); } catch (e) {}
        });

        // Touch controls
        this.setupTouchControls();
    }

    setupTouchControls() {
        let touchStartX = 0;
        let touchStartY = 0;
        let touchStartTime = 0;

        this.game.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this._resumeAudioIfNeeded();
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            touchStartTime = Date.now();

            try {
                const gridCoords = this.convertScreenToGrid(touch.clientX, touch.clientY);
                if (this.game && this.game.renderManager && typeof this.game.renderManager.startHoldFeedback === 'function') {
                    this.game.renderManager.startHoldFeedback(gridCoords.x, gridCoords.y);
                }
                if (this.game && this.game.soundManager && typeof this.game.soundManager.playSound === 'function') {
                    const enemyAtInitial = this.game.enemies.find(e => e.x === gridCoords.x && e.y === gridCoords.y && e.health > 0);
                    if (!enemyAtInitial) {
                        this.game.soundManager.playSound('bloop');
                    }
                    this.lastHighlightedTile.x = gridCoords.x;
                    this.lastHighlightedTile.y = gridCoords.y;
                }
            } catch (e) {}
        }, { passive: false });

        this.game.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const touch = e.changedTouches[0];
            const deltaX = touch.clientX - touchStartX;
            const deltaY = touch.clientY - touchStartY;
            const touchDuration = Date.now() - touchStartTime;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

            if (touchDuration < INPUT_CONSTANTS.MAX_TAP_TIME && distance < INPUT_CONSTANTS.MIN_SWIPE_DISTANCE) {
                try { if (this.game && this.game.renderManager && typeof this.game.renderManager.clearFeedback === 'function') this.game.renderManager.clearFeedback(); } catch (e) {}
                try { this.handlers.handleTap(touch.clientX, touch.clientY); } catch (e) {}
            } else if (touchDuration >= INPUT_CONSTANTS.MAX_TAP_TIME) {
                try { if (this.game && this.game.renderManager && typeof this.game.renderManager.clearFeedback === 'function') this.game.renderManager.clearFeedback(); } catch (e) {}
                try { this.handlers.handleTap(touch.clientX, touch.clientY); } catch (e) {}
            } else if (distance > INPUT_CONSTANTS.MIN_SWIPE_DISTANCE) {
                let direction = '';
                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    direction = deltaX > 0 ? 'arrowright' : 'arrowleft';
                } else {
                    direction = deltaY > 0 ? 'arrowdown' : 'arrowup';
                }
                try { this.handlers.handleKeyPress({ key: direction, preventDefault: () => {} }); } catch (e) {}
            }
        }, { passive: false });

        this.game.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            if (!touch) return;
            try {
                const gc = this.convertScreenToGrid(touch.clientX, touch.clientY);
                if (this.game && this.game.renderManager && typeof this.game.renderManager.startHoldFeedback === 'function') {
                    this.game.renderManager.startHoldFeedback(gc.x, gc.y);
                }
                if (this.lastHighlightedTile.x !== gc.x || this.lastHighlightedTile.y !== gc.y) {
                    if (this.game && this.game.soundManager && typeof this.game.soundManager.playSound === 'function') {
                        const enemyOnGc = this.game.enemies.find(e => e.x === gc.x && e.y === gc.y && e.health > 0);
                        if (!enemyOnGc) this.game.soundManager.playSound('bloop');
                    }
                    this.lastHighlightedTile.x = gc.x;
                    this.lastHighlightedTile.y = gc.y;
                }
            } catch (err) {}
        }, { passive: false });

        this.game.canvas.addEventListener('touchcancel', (e) => {
            try {
                if (this.game && this.game.renderManager && typeof this.game.renderManager.clearFeedback === 'function') {
                    this.game.renderManager.clearFeedback();
                }
                this.lastHighlightedTile.x = null;
                this.lastHighlightedTile.y = null;
            } catch (err) {}
        });
    }
}
