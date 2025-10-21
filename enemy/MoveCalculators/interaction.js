import { TILE_TYPES } from '../../core/constants.js';

export function handlePlayerInteraction(base, enemy, next, player, playerX, playerY, grid, enemies, isSimulation, game) {
    // Check adjacency
    const dx = Math.abs(next.x - playerX);
    const dy = Math.abs(next.y - playerY);

    // Lizord special bump handled in base.performLizordBumpAttack when required
    if (enemy.enemyType === 'lizord' && !isSimulation) {
        const startDx = Math.abs(next.x - enemy.x);
        const startDy = Math.abs(next.y - enemy.y);
        const isKnightMove = (startDx === 2 && startDy === 1) || (startDx === 1 && startDy === 2);
        if (isKnightMove && next.x === playerX && next.y === playerY) {
            const key = `${next.x},${next.y}`;
            const initialSet = (game && game.initialEnemyTilesThisTurn) || new Set();
            const ownStart = `${enemy.x},${enemy.y}`;
            if (initialSet.has(key) && key !== ownStart) return null;
            if (game && game.occupiedTilesThisTurn) game.occupiedTilesThisTurn.add(key);
            enemy.lastX = enemy.x; enemy.lastY = enemy.y; enemy.x = next.x; enemy.y = next.y; enemy.liftFrames = 15;
            base.performLizordBumpAttack(enemy, player, playerX, playerY, grid, enemies, game);
            return null;
        }
    }

    if (dx === 1 && dy === 1) {
        if (enemy.enemyType !== 'lizardeaux') {
            if (next.x === enemy.x && next.y === enemy.y) {
                base.performAttack(enemy, player, playerX, playerY, grid, enemies, game);
                return null;
            }
            return next;
        } else {
            return next;
        }
    } else if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
        if (next.x === enemy.x && next.y === enemy.y) {
            base.performAttack(enemy, player, playerX, playerY, grid, enemies, game);
            return null;
        }
        return next;
    } else {
        return next;
    }
}

export function handlePitfallTransition(base, enemy, x, y, game) {
    // Moved logic from original file; rely on game APIs and zoneGenerator
    game.grid[y][x] = TILE_TYPES.PORT;
    game.portTransitionData = { from: 'pitfall', x, y };
    const enemyIndex = game.enemies.indexOf(enemy);
    if (enemyIndex > -1) game.enemies.splice(enemyIndex, 1);
    const currentZone = game.player.currentZone;
    const undergroundZoneKey = `${currentZone.x},${currentZone.y}:2`;
    if (!game.zones.has(undergroundZoneKey)) {
        const undergroundZoneData = game.zoneGenerator.generateZone(
            currentZone.x, currentZone.y, 2, game.zones, game.connectionManager.zoneConnections, game.availableFoodAssets, 'port'
        );
        game.zones.set(undergroundZoneKey, undergroundZoneData);
    }
    const undergroundZoneData = game.zones.get(undergroundZoneKey);
    const updatedZoneData = { ...undergroundZoneData, enemies: [...(undergroundZoneData.enemies || []), { ...enemy, x: enemy.x, y: enemy.y, enemyType: enemy.enemyType, health: enemy.health, id: enemy.id }] };
    try {
        const startKey = `${enemy.x},${enemy.y}`;
        if (game && game.turnManager && game.turnManager.initialEnemyTilesThisTurn) game.turnManager.initialEnemyTilesThisTurn.delete(startKey);
        if (game && game.turnManager && game.turnManager.occupiedTilesThisTurn) game.turnManager.occupiedTilesThisTurn.delete(startKey);
        if (game && game.occupiedTilesThisTurn) game.occupiedTilesThisTurn.delete(startKey);
    } catch (e) { /* ignore */ }
    game.zones.set(undergroundZoneKey, updatedZoneData);
    if (window.soundManager) window.soundManager.playSound('pitfall');
}
