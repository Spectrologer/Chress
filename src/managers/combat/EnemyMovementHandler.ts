/**
 * EnemyMovementHandler - Handles enemy movement and pitfall logic
 *
 * Manages single enemy movements including pitfall trap detection.
 * Extracted from CombatManager to reduce file size.
 */

import { TILE_TYPES } from '../../core/constants/index';
import { createZoneKey } from '../../utils/ZoneKeyUtils';
import { eventBus } from '../../core/EventBus';
import { EventTypes } from '../../core/EventTypes';
import type { Game } from '../../core/Game';
import type { Position } from '../../core/Position';

interface Enemy {
    x: number;
    y: number;
    lastX?: number;
    lastY?: number;
    health: number;
    id: string;
    enemyType: string;
    liftFrames?: number;
    planMoveTowards: (player: any, grid: any, allEnemies: any[], playerPos: Position, param5: boolean, game: Game) => Position | null;
    serialize: () => any;
    [key: string]: any;
}

export class EnemyMovementHandler {
    private game: Game;
    private occupiedTiles: Set<string>;

    constructor(game: Game, occupiedTiles: Set<string>) {
        this.game = game;
        this.occupiedTiles = occupiedTiles;
    }

    /**
     * Handle movement for a single enemy
     */
    public handleSingleEnemyMovement(enemy: Enemy): void {
        const enemyCollection = this.game.enemyCollection;

        // Ensure we are not trying to move a dead or non-existent enemy
        if (!enemy || enemy.health <= 0 || !enemyCollection.includes(enemy)) {
            return;
        }

        const gridManager = this.game.gridManager;
        const playerPos = (this.game.player as any).getPosition() as Position;
        const allEnemies = enemyCollection.getAll() as Enemy[];

        const move = enemy.planMoveTowards(this.game.player, this.game.grid, allEnemies, playerPos, false, this.game);
        if (!move) return;

        // Check if enemy is moving onto a pitfall trap
        const targetTile = gridManager.getTile(move.x, move.y);
        if (targetTile === TILE_TYPES.PITFALL) {
            this._handlePitfallFall(enemy, move);
            return;
        }

        // Validate movement is valid
        if (!this._isMovementValid(enemy, move)) {
            return;
        }

        // Execute movement
        this._executeMovement(enemy, move);

        // Handle special animations (lizord charge)
        if (enemy.enemyType === 'lizord' && (enemy.lastX !== enemy.x || enemy.lastY !== enemy.y)) {
            this._emitLizordChargeAnimation(enemy);
        }
    }

    /**
     * Handle enemy falling into pitfall
     */
    private _handlePitfallFall(enemy: Enemy, move: Position): void {
        const gridManager = this.game.gridManager;

        // Leave the surface tile as pitfall
        gridManager.setTile(move.x, move.y, TILE_TYPES.PITFALL);

        // Clear turn-manager bookkeeping
        try {
            const startKey = `${enemy.x},${enemy.y}`;
            const turnManager = (this.game as any).turnManager;
            if (turnManager && turnManager.initialEnemyTilesThisTurn) {
                turnManager.initialEnemyTilesThisTurn.delete(startKey);
            }
            if (this.occupiedTiles) {
                this.occupiedTiles.delete(startKey);
            }
        } catch (e) {
            // Defensive
        }

        // Remove from current zone
        this.game.enemyCollection.removeById(enemy.id, false);

        // Add to underground zone
        const currentZone = (this.game.player as any).getCurrentZone();
        const depth = this.game.playerFacade.getUndergroundDepth() || 1;
        const undergroundZoneKey = createZoneKey(currentZone.x, currentZone.y, 2, depth);

        if (this.game.zoneRepository.hasByKey(undergroundZoneKey)) {
            const undergroundZoneData: any = this.game.zoneRepository.getByKey(undergroundZoneKey);
            const spawnPos = (this.game.player as any).getValidSpawnPosition(this.game) as Position;
            enemy.x = spawnPos.x;
            enemy.y = spawnPos.y;
            undergroundZoneData.enemies.push(enemy.serialize());
        }
    }

    /**
     * Check if movement is valid
     */
    private _isMovementValid(enemy: Enemy, move: Position): boolean {
        const enemyCollection = this.game.enemyCollection;
        const key = `${move.x},${move.y}`;

        // Check if tile is currently occupied by another enemy
        const occupiedNow = enemyCollection.some((e: Enemy) => e.id !== enemy.id && e.x === move.x && e.y === move.y);
        if (occupiedNow) return false;

        // Check if tile was occupied at turn start
        const initialSet = (this.game as any).initialEnemyTilesThisTurn || new Set<string>();
        const ownStartKey = `${enemy.lastX || enemy.x},${enemy.lastY || enemy.y}`;
        if (initialSet.has(key) && key !== ownStartKey) return false;

        // Check if tile is claimed this turn
        if (this.occupiedTiles.has(key)) return false;

        return true;
    }

    /**
     * Execute enemy movement
     */
    private _executeMovement(enemy: Enemy, move: Position): void {
        const key = `${move.x},${move.y}`;
        this.occupiedTiles.add(key);

        enemy.lastX = enemy.x;
        enemy.lastY = enemy.y;
        enemy.x = move.x;
        enemy.y = move.y;
        enemy.liftFrames = 15; // Start lift animation
    }

    /**
     * Emit lizord (knight) charge animation
     */
    private _emitLizordChargeAnimation(enemy: Enemy): void {
        const dx = enemy.x - (enemy.lastX || enemy.x);
        const dy = enemy.y - (enemy.lastY || enemy.y);
        let midX: number, midY: number;

        // Determine the corner of the L-shaped move
        if (Math.abs(dx) > Math.abs(dy)) {
            midX = enemy.x;
            midY = enemy.lastY || enemy.y;
        } else {
            midX = enemy.lastX || enemy.x;
            midY = enemy.y;
        }

        eventBus.emit(EventTypes.ANIMATION_REQUESTED, {
            type: 'horseCharge',
            x: enemy.x,
            y: enemy.y,
            data: {
                startPos: { x: enemy.lastX || enemy.x, y: enemy.lastY || enemy.y },
                midPos: { x: midX, y: midY },
                endPos: { x: enemy.x, y: enemy.y }
            }
        });
    }
}
