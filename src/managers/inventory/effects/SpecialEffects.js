import { BaseItemEffect } from './BaseItemEffect.js';
import { TILE_TYPES } from '../../../core/constants/index.js';
import { Sign } from '../../../ui/Sign.js';
import { logger } from '../../../core/logger.js';
import { eventBus } from '../../../core/EventBus.js';
import { EventTypes } from '../../../core/EventTypes.js';
import { isAdjacent } from '../../../core/utils/DirectionUtils.js';

/**
 * Special effects - Shovel, Note, Book of Time Travel
 */

export class ShovelEffect extends BaseItemEffect {
    apply(game, item, context = {}) {
        const { targetX, targetY } = context;

        // If no target specified, enter shovel mode for selection
        if (targetX === undefined || targetY === undefined) {
            game.shovelMode = true;
            game.activeShovel = item;
            this._showMessage(game, 'Click an adjacent tile to dig a hole.', null, true, false);
            return { consumed: false, success: true };
        }

        // Validate target position
        const playerPos = game.player.getPosition();
        const dx = Math.abs(targetX - playerPos.x);
        const dy = Math.abs(targetY - playerPos.y);

        if (!isAdjacent(dx, dy)) {
            this._showMessage(game, "You must dig in an adjacent tile!", null, false, false);
            return { consumed: false, success: false };
        }

        if (game.grid[targetY][targetX] !== TILE_TYPES.FLOOR) {
            this._showMessage(game, "You can only dig on an empty floor tile.", null, false, false);
            return { consumed: false, success: false };
        }

        const enemiesAtPos = game.enemies ? game.enemies.filter(e => e.x === targetX && e.y === targetY) : [];
        if (enemiesAtPos.length > 0) {
            this._showMessage(game, "Cannot dig under an enemy!", null, false, false);
            return { consumed: false, success: false };
        }

        // Dig the hole
        game.grid[targetY][targetX] = TILE_TYPES.PORT;

        // Start enemy turns
        if (typeof game.startEnemyTurns === 'function') {
            game.startEnemyTurns();
        }

        return { consumed: true, uses: 1, success: true };
    }
}

export class NoteEffect extends BaseItemEffect {
    apply(game, item, context = {}) {
        // Use map note to reveal distant location
        this._useMapNote(game);

        // Hide overlay and show note message
        if (typeof game.hideOverlayMessage === 'function') {
            game.hideOverlayMessage();
        }

        const noteMessageText = 'Coordinates revealed! Added to message log.';

        if (game.uiManager && game.uiManager.messageManager &&
            typeof game.uiManager.messageManager.addNoteToStack === 'function') {
            game.uiManager.messageManager.addNoteToStack(noteMessageText, 'assets/items/note.png', 2000);
        } else {
            game.displayingMessageForSign = { message: noteMessageText };
            game.showSignMessage(noteMessageText, 'assets/items/note.png');
            game.animationScheduler.createSequence()
                .wait(2000)
                .then(() => {
                    if (game.displayingMessageForSign && game.displayingMessageForSign.message === noteMessageText) {
                        Sign.hideMessageForSign(game);
                    }
                })
                .start();
        }

        return { consumed: true, quantity: 1, success: true };
    }

    _useMapNote(game) {
        const currentZone = game.player.getCurrentZone();
        const visited = game.player.getVisitedZones();

        const candidates = [];
        for (let zoneX = currentZone.x - 50; zoneX <= currentZone.x + 50; zoneX++) {
            for (let zoneY = currentZone.y - 50; zoneY <= currentZone.y + 50; zoneY++) {
                const zoneKey = `${zoneX},${zoneY}`;
                if (!visited.has(zoneKey) && !game.specialZones.has(zoneKey)) {
                    const distance = Math.max(Math.abs(zoneX - currentZone.x), Math.abs(zoneY - currentZone.y));
                    if (distance >= 5 && distance <= 15) {
                        candidates.push({ x: zoneX, y: zoneY, distance });
                    }
                }
            }
        }

        if (candidates.length === 0) return;

        const selected = candidates[Math.floor(Math.random() * candidates.length)];
        const zoneKey = `${selected.x},${selected.y}`;

        const treasurePool = [
            () => ({ type: TILE_TYPES.FOOD, foodType: game.availableFoodAssets[Math.floor(Math.random() * game.availableFoodAssets.length)] }),
            () => TILE_TYPES.WATER,
            () => TILE_TYPES.BOMB,
            () => ({ type: TILE_TYPES.BOW, uses: 3 }),
            () => ({ type: TILE_TYPES.HORSE_ICON, uses: 3 }),
            () => ({ type: TILE_TYPES.BOOK_OF_TIME_TRAVEL, uses: 3 }),
            () => ({ type: TILE_TYPES.BISHOP_SPEAR, uses: 3 })
        ];

        const treasures = [];
        for (let i = 0; i < 4; i++) {
            const getRandomTreasure = treasurePool[Math.floor(Math.random() * treasurePool.length)];
            treasures.push(getRandomTreasure());
        }

        game.specialZones.set(zoneKey, treasures);
        game.player.markZoneVisited(selected.x, selected.y);

        if (game.uiManager && typeof game.uiManager.addMessageToLog === 'function') {
            game.uiManager.addMessageToLog(`A distant location has been revealed on your map: (${selected.x}, ${selected.y})`);
        }

        eventBus.emit(EventTypes.UI_UPDATE_STATS, {});

        if (game.uiManager && typeof game.uiManager.renderZoneMap === 'function') {
            game.uiManager.renderZoneMap();
        }
    }
}

export class BookOfTimeTravelEffect extends BaseItemEffect {
    apply(game, item, context = {}) {
        // Debug logging (keep for compatibility)
        if (window.inventoryDebugMode) {
            logger.debug('[ITEM.EFFECT] book use - BEFORE decrement', { uses: item.uses });
            try {
                throw new Error('ITEM.EFFECT book decrement stack');
            } catch (e) {
                logger.debug(e.stack);
            }
        }

        // Show visual feedback
        eventBus.emit(EventTypes.UI_SHOW_MESSAGE, {
            text: 'Reading from the Book of Time Travel...<br>Time passes.',
            imageSrc: 'assets/items/book.png',
            isPersistent: true,
            isLargeText: false,
            useTypewriter: false
        });

        // Pass one turn (allow enemies to move)
        if (typeof game.startEnemyTurns === 'function') {
            game.startEnemyTurns();
        }

        if (window.inventoryDebugMode) {
            logger.debug('[ITEM.EFFECT] book use - AFTER effect', { uses: item.uses });
        }

        return { consumed: true, uses: 1, success: true };
    }
}
