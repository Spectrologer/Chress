import { TILE_TYPES, ANIMATION_CONSTANTS } from '@core/constants/index';
import type { Enemy, Player, Position, Grid, Game } from './base';
import type { BaseMoveCalculator } from './base';

/**
 * Handles interaction between an enemy and the player, including adjacency checks
 * and special attack logic for different enemy types.
 */
export function handlePlayerInteraction(
    base: BaseMoveCalculator,
    enemy: Enemy,
    next: Position,
    player: Player,
    playerX: number,
    playerY: number,
    grid: Grid,
    enemies: Enemy[],
    isSimulation: boolean,
    game: Game | null
): Position | null {
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
            enemy.lastX = enemy.x; enemy.lastY = enemy.y; enemy.x = next.x; enemy.y = next.y; enemy.liftFrames = ANIMATION_CONSTANTS.LIFT_FRAMES;
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

/**
 * Handles an enemy falling into a pitfall, transitioning them to an underground zone.
 * Updates the game state, creates underground zones if needed, and transfers the enemy.
 */
export function handlePitfallTransition(
    base: BaseMoveCalculator,
    enemy: Enemy,
    x: number,
    y: number,
    game: any
): void {
    // Moved logic from original file; rely on game APIs and zoneGenerator
    game.grid[y][x] = TILE_TYPES.PORT;
    game.portTransitionData = { from: 'pitfall', x, y };
    const enemyIndex = game.enemies.indexOf(enemy);
    if (enemyIndex > -1) game.enemies.splice(enemyIndex, 1);
    const currentZone = game.player.currentZone;
    // Ensure the player's zone and depth reflect being in the first underground level
    const depth = Number.isInteger(game.player.undergroundDepth) && game.player.undergroundDepth > 0 ? game.player.undergroundDepth : 1;
    game.player.undergroundDepth = depth;
    game.player.currentZone.dimension = 2;
    game.player.currentZone.portType = 'underground';
    game.player.currentZone.depth = depth;
    const undergroundZoneKey = `${currentZone.x},${currentZone.y}:2:z-${depth}`;
    if (!game.zones.has(undergroundZoneKey)) {
        const undergroundZoneData = game.zoneGenerator.generateZone(
            currentZone.x, currentZone.y, 2, game.zones, game.connectionManager.zoneConnections, game.availableFoodAssets, 'port'
        );
        // annotate the generated zone with depth so player/zone logic can access it
        undergroundZoneData.depth = depth;
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
    if ((window as any).soundManager) (window as any).soundManager.playSound('pitfall');
}
