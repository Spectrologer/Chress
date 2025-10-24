import { TILE_TYPES } from '../core/constants.js';
import { Sign } from '../ui/Sign.js';

export function dropItem(game, itemType, tileType) {
    const px = game.player.x, py = game.player.y;
    const currentTile = game.grid[py][px];
    if (currentTile === TILE_TYPES.FLOOR || (typeof currentTile === 'object' && currentTile.type === TILE_TYPES.FLOOR)) {
        game.grid[py][px] = tileType;
        const idx = game.player.inventory.findIndex(item => item.type === itemType);
        if (idx >= 0) game.player.inventory.splice(idx, 1);
        return true;
    }
    return false;
}

export function useInventoryItem(game, item, idx) {
    switch (item.type) {
        case 'food':
            item.quantity = (item.quantity || 1) - 1;
            game.player.restoreHunger(10);
            if (item.quantity <= 0) game.player.inventory.splice(idx, 1);
            break;
        case 'water':
            item.quantity = (item.quantity || 1) - 1;
            game.player.restoreThirst(10);
            if (item.quantity <= 0) game.player.inventory.splice(idx, 1);
            break;
        case 'bomb':
            item.quantity = (item.quantity || 1) - 1;
            if (item.quantity <= 0) game.player.inventory.splice(idx, 1);
            break;
        case 'axe':
            dropItem(game, 'axe', TILE_TYPES.AXE);
            break;
        case 'hammer':
            dropItem(game, 'hammer', TILE_TYPES.HAMMER);
            break;
        case 'bishop_spear':
            dropItem(game, 'bishop_spear', { type: TILE_TYPES.BISHOP_SPEAR, uses: item.uses });
            break;
        case 'horse_icon':
            dropItem(game, 'horse_icon', { type: TILE_TYPES.HORSE_ICON, uses: item.uses });
            break;
        case 'bow':
            dropItem(game, 'bow', { type: TILE_TYPES.BOW, uses: item.uses });
            break;
        case 'shovel':
            game.shovelMode = true;
            game.activeShovel = item;
            // Instructional overlay - don't use typewriter
            game.uiManager.showOverlayMessage('Click an adjacent tile to dig a hole.', null, true, false, false);
            break;
        case 'heart':
            game.player.setHealth(game.player.getHealth() + 1);
            game.player.inventory.splice(idx, 1);
            break;
        case 'note':
            item.quantity = (item.quantity || 1) - 1;
            useMapNote(game);
            game.hideOverlayMessage();

            const noteMessageText = 'Coordinates revealed! Added to message log.';
            if (game.uiManager && game.uiManager.messageManager && typeof game.uiManager.messageManager.addNoteToStack === 'function') {
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

            if (item.quantity <= 0) game.player.inventory.splice(idx, 1);
            break;
        case 'book_of_time_travel':
            item.uses--;
            if (item.uses <= 0) game.player.inventory.splice(idx, 1);
            game.startEnemyTurns();
            game.updatePlayerStats();
            return; // avoid double update
    }

    game.updatePlayerStats();
}

export function useMapNote(game) {
    const currentZone = game.player.getCurrentZone();
    const visited = game.player.getVisitedZones();

    const candidates = [];
    for (let zoneX = currentZone.x - 50; zoneX <= currentZone.x + 50; zoneX++) {
        for (let zoneY = currentZone.y - 50; zoneY <= currentZone.y + 50; zoneY++) {
            const zoneKey = `${zoneX},${zoneY}`;
            if (!visited.has(zoneKey) && !game.specialZones.has(zoneKey)) {
                const distance = Math.max(Math.abs(zoneX - currentZone.x), Math.abs(zoneY - currentZone.y));
                if (distance >= 5 && distance <= 15) candidates.push({ x: zoneX, y: zoneY, distance });
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
    game.uiManager.addMessageToLog(`A distant location has been revealed on your map: (${selected.x}, ${selected.y})`);
    game.updatePlayerStats();
    game.uiManager.renderZoneMap();
}
