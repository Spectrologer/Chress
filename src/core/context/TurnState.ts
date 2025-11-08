/**
 * TurnState - Encapsulates turn-based game state
 *
 * Extracts turn queue, flags, and turn-related state from GameContext
 * into a focused, cohesive object.
 */

import type { Enemy } from '@entities/Enemy';

export class TurnState {
    // Turn control
    isPlayerTurn: boolean;
    justLeftExitTile: boolean;

    // Turn queue for enemy movements
    turnQueue: Enemy[];
    occupiedTilesThisTurn: Set<string>;
    initialEnemyTilesThisTurn: Set<string>;

    // Player death tracking
    playerDeathTimer: number | null;

    constructor() {
        this.isPlayerTurn = true;
        this.justLeftExitTile = false;
        this.turnQueue = [];
        this.occupiedTilesThisTurn = new Set();
        this.initialEnemyTilesThisTurn = new Set();
        this.playerDeathTimer = null;
    }

    /**
     * Start a new player turn
     */
    startPlayerTurn(): void {
        this.isPlayerTurn = true;
        this.turnQueue = [];
        this.occupiedTilesThisTurn.clear();
        this.initialEnemyTilesThisTurn.clear();
    }

    /**
     * Start enemy turns
     */
    startEnemyTurns(): void {
        this.isPlayerTurn = false;
    }

    /**
     * Add enemy to turn queue
     */
    addToTurnQueue(enemy: Enemy): void {
        this.turnQueue.push(enemy);
    }

    /**
     * Get next enemy from turn queue
     */
    getNextEnemy(): Enemy | undefined {
        return this.turnQueue.shift();
    }

    /**
     * Check if turn queue is empty
     */
    isTurnQueueEmpty(): boolean {
        return this.turnQueue.length === 0;
    }

    /**
     * Mark tile as occupied this turn
     */
    markTileOccupied(x: number, y: number): void {
        this.occupiedTilesThisTurn.add(`${x},${y}`);
    }

    /**
     * Check if tile is occupied this turn
     */
    isTileOccupied(x: number, y: number): boolean {
        return this.occupiedTilesThisTurn.has(`${x},${y}`);
    }

    /**
     * Mark initial enemy tile position
     */
    markInitialEnemyTile(x: number, y: number): void {
        this.initialEnemyTilesThisTurn.add(`${x},${y}`);
    }

    /**
     * Check if tile was an initial enemy position
     */
    wasInitialEnemyTile(x: number, y: number): boolean {
        return this.initialEnemyTilesThisTurn.has(`${x},${y}`);
    }

    /**
     * Reset turn state for new game
     */
    reset(): void {
        this.isPlayerTurn = true;
        this.justLeftExitTile = false;
        this.turnQueue = [];
        this.occupiedTilesThisTurn.clear();
        this.initialEnemyTilesThisTurn.clear();
        this.playerDeathTimer = null;
    }
}
