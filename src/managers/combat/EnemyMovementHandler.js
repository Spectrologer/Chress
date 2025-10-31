// @ts-check
/**
 * EnemyMovementHandler - Handles enemy movement and pitfall logic
 *
 * Manages single enemy movements including pitfall trap detection.
 * Extracted from CombatManager to reduce file size.
 */

import { TILE_TYPES } from '../../core/constants/index.js';
import { createZoneKey } from '../../utils/ZoneKeyUtils.js';
import { eventBus } from '../../core/EventBus.js';
import { EventTypes } from '../../core/EventTypes.js';

export class EnemyMovementHandler {
    /**
     * @param {any} game - The main game instance
     * @param {Set<string>} occupiedTiles - Set of tiles occupied during enemy turns
     */
    constructor(game, occupiedTiles) {
        this.game = game;
        this.occupiedTiles = occupiedTiles;
    }

    /**
     * Handle movement for a single enemy
     * @param {any} enemy - The enemy to move
     * @returns {void}
     */
    handleSingleEnemyMovement(enemy) {
        const enemyCollection = this.game.enemyCollection;

        // Ensure we are not trying to move a dead or non-existent enemy
        if (!enemy || enemy.health <= 0 || !enemyCollection.includes(enemy)) {
            return;
        }

        const gridManager = this.game.gridManager;
        const playerPos = this.game.player.getPosition();
        const allEnemies = enemyCollection.getAll();

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
     * @param {any} enemy - The enemy
     * @param {any} move - The move coordinates
     * @private
     */
    _handlePitfallFall(enemy, move) {
        const gridManager = this.game.gridManager;

        // Leave the surface tile as pitfall
        gridManager.setTile(move.x, move.y, TILE_TYPES.PITFALL);

        // Clear turn-manager bookkeeping
        try {
            const startKey = `${enemy.x},${enemy.y}`;
            if (this.game.turnManager && this.game.turnManager.initialEnemyTilesThisTurn) {
                this.game.turnManager.initialEnemyTilesThisTurn.delete(startKey);
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
        const currentZone = this.game.player.getCurrentZone();
        const depth = this.game.playerFacade.getUndergroundDepth() || 1;
        const undergroundZoneKey = createZoneKey(currentZone.x, currentZone.y, 2, depth);

        if (this.game.zoneRepository.hasByKey(undergroundZoneKey)) {
            const undergroundZoneData = this.game.zoneRepository.getByKey(undergroundZoneKey);
            const spawnPos = this.game.player.getValidSpawnPosition(this.game);
            enemy.x = spawnPos.x;
            enemy.y = spawnPos.y;
            undergroundZoneData.enemies.push(enemy.serialize());
        }
    }

    /**
     * Check if movement is valid
     * @param {any} enemy - The enemy
     * @param {any} move - The move coordinates
     * @returns {boolean}
     * @private
     */
    _isMovementValid(enemy, move) {
        const enemyCollection = this.game.enemyCollection;
        const key = `${move.x},${move.y}`;

        // Check if tile is currently occupied by another enemy
        const occupiedNow = enemyCollection.some(e => e.id !== enemy.id && e.x === move.x && e.y === move.y);
        if (occupiedNow) return false;

        // Check if tile was occupied at turn start
        const initialSet = this.game.initialEnemyTilesThisTurn || new Set();
        const ownStartKey = `${enemy.lastX || enemy.x},${enemy.lastY || enemy.y}`;
        if (initialSet.has(key) && key !== ownStartKey) return false;

        // Check if tile is claimed this turn
        if (this.occupiedTiles.has(key)) return false;

        return true;
    }

    /**
     * Execute enemy movement
     * @param {any} enemy - The enemy
     * @param {any} move - The move coordinates
     * @private
     */
    _executeMovement(enemy, move) {
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
     * @param {any} enemy - The lizord enemy
     * @private
     */
    _emitLizordChargeAnimation(enemy) {
        const dx = enemy.x - enemy.lastX;
        const dy = enemy.y - enemy.lastY;
        let midX, midY;

        // Determine the corner of the L-shaped move
        if (Math.abs(dx) > Math.abs(dy)) {
            midX = enemy.x;
            midY = enemy.lastY;
        } else {
            midX = enemy.lastX;
            midY = enemy.y;
        }

        eventBus.emit(EventTypes.ANIMATION_REQUESTED, {
            type: 'horseCharge',
            x: enemy.x,
            y: enemy.y,
            data: {
                startPos: { x: enemy.lastX, y: enemy.lastY },
                midPos: { x: midX, y: midY },
                endPos: { x: enemy.x, y: enemy.y }
            }
        });
    }
}
