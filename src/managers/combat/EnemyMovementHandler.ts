/**
 * EnemyMovementHandler - Handles enemy movement and pitfall logic
 *
 * Manages single enemy movements including pitfall trap detection.
 * Extracted from CombatManager to reduce file size.
 */

import { TILE_TYPES } from '@core/constants/index';
import { createZoneKey } from '@utils/ZoneKeyUtils';
import { eventBus } from '@core/EventBus';
import { EventTypes } from '@core/EventTypes';
import { isInChessMode, exitChessModeAndReturn, resetToNormalMode } from '@core/GameModeManager';
import { logger } from '@core/logger';
import { Position } from '@core/Position';
import type { Game } from '@core/game';
import type { Enemy } from '@entities/Enemy';

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
        if (!enemyCollection) return;

        // Ensure we are not trying to move a dead or non-existent enemy
        if (!enemy || enemy.health <= 0 || !enemyCollection.includes(enemy)) {
            return;
        }

        const gridManager = this.game.gridManager;
        const playerPos = (this.game.player as any).getPosition() as Position;
        const allEnemies = enemyCollection.getAll() as Enemy[];

        let move: Position | null;

        // Chess mode: Use pre-selected move from TurnManager
        if (isInChessMode(this.game) && enemy._chessTargetMove) {
            const targetMove = enemy._chessTargetMove;
            move = Position.from(targetMove);
            console.log('[Chess] Enemy moving from', enemy.x, enemy.y, 'to', move.x, move.y);

            // Check if there's a unit at the target
            const targetUnit = enemyCollection.findAt(move.x, move.y, true) as Enemy | null;

            // Check for castling: King moving to a rook's position
            const baseType = enemy.enemyType.replace('black_', '');
            if (baseType === 'lizardo' && targetUnit && targetUnit.team === enemy.team) {
                const rookBaseType = targetUnit.enemyType.replace('black_', '');
                if (rookBaseType === 'lizardeaux') {
                    // This is castling!
                    const kingX = enemy.x;
                    const rookX = targetUnit.x;

                    // Move king 2 squares toward rook
                    if (rookX > kingX) {
                        // Kingside castling
                        enemy.x = kingX + 2;
                        targetUnit.x = kingX + 1;
                    } else {
                        // Queenside castling
                        enemy.x = kingX - 2;
                        targetUnit.x = kingX - 1;
                    }

                    // Mark both pieces as having moved
                    enemy.hasMovedEver = true;
                    targetUnit.hasMovedEver = true;

                    // Clean up the chess move marker
                    delete enemy._chessTargetMove;
                    return; // Skip normal movement
                }
            }

            // Check if there's a player unit to capture
            if (targetUnit && targetUnit.team === 'player') {
                console.log('[Chess] Enemy capturing player unit:', targetUnit.enemyType);
                enemyCollection.remove(targetUnit);

                // Check for checkmate (player king captured)
                if (targetUnit.enemyType === 'lizardo') {
                    console.log('[Chess] Enemy wins! Player king captured.');

                    // Show defeat dialogue
                    this.game.uiManager?.messageManager?.dialogueManager?.showDialogue(
                        'Defeat! The enemy has captured your king.',
                        null,
                        null,
                        'Return to Museum',
                        'unknown',
                        undefined,
                        () => {
                            // Use the custom board return zone system
                            const returnZone = (this.game as any).customBoardReturnZone;
                            if (returnZone && this.game.transitionToZone && this.game.playerFacade) {
                                logger.info(`[Chess] Returning to zone (${returnZone.x}, ${returnZone.y}) dimension ${returnZone.dimension}`);

                                // Exit chess mode
                                resetToNormalMode(this.game);

                                // Set dimension BEFORE calling transitionToZone
                                this.game.playerFacade.setZoneDimension(returnZone.dimension);

                                // Clear the return zone and custom board name
                                delete (this.game as any).customBoardReturnZone;
                                delete (this.game as any).customBoardName;

                                // Transition to the stored zone (handles player spawning)
                                this.game.transitionToZone(returnZone.x, returnZone.y, 'teleport', 5, 5);
                            }
                        }
                    );
                }
            }

            // Clean up the chess move marker
            delete enemy._chessTargetMove;
        } else {
            // Normal mode: Use standard pathfinding
            move = enemy.planMoveTowards(this.game.player, this.game.grid, allEnemies, playerPos, false, this.game);
        }

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
        this.game.enemyCollection?.removeById(enemy.id, false);

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
        if (!enemyCollection) return false;

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

        // Mark piece as having moved (for castling)
        if (isInChessMode(this.game)) {
            enemy.hasMovedEver = true;
        }
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
