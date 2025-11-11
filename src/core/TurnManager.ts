import type { GameContext } from './context/GameContextCore';
import type { Enemy } from '@entities/Enemy';
import type { EnemyCollection } from '@facades/EnemyCollection';
import { isInChessMode } from './GameModeManager';
import { TILE_TYPES } from './constants/index';

/**
 * TurnManager
 *
 * Manages the turn-based game loop including:
 * - Turn queue processing for enemy movements
 * - Exit tile freeze mechanics
 * - Occupied tile tracking
 * - Pitfall turn counting
 */
export class TurnManager {
    private game: GameContext;

    turnQueue: Enemy[];
    occupiedTilesThisTurn: Set<string>;
    initialEnemyTilesThisTurn: Set<string>;
    wasPlayerOnExitLastTurn: boolean;

    constructor(game: GameContext) {
        this.game = game;

        this.turnQueue = [];
        this.occupiedTilesThisTurn = new Set();
        this.initialEnemyTilesThisTurn = new Set();
        this.wasPlayerOnExitLastTurn = false;
    }

    /**
     * Handle turn completion after player action
     * Manages pitfall tracking
     */
    handleTurnCompletion(): boolean {
        // CRITICAL: Prevent multiple calls to startEnemyTurns
        // If it's already the enemy's turn, don't start enemy turns again
        if (!this.game.isPlayerTurn) {
            return false;
        }

        // Skip enemy turns during entrance animation
        const isEntranceActive = (this.game as any)._entranceAnimationInProgress;
        if (!isEntranceActive) {
            this.startEnemyTurns();
        }

        const transientState = (this.game as any).transientGameState;
        if (transientState.isInPitfallZone()) {
            transientState.incrementPitfallTurnsSurvived();
        }
        return true;
    }

    /**
     * Start enemy turns and set up turn queue
     */
    startEnemyTurns(): void {
        const transientState = (this.game as any).transientGameState;
        // If the player just attacked and an attack has delay, enemy turns will
        // be started by the attack resolution elsewhere.
        if (transientState.didPlayerJustAttack()) return;

        // Check if player is on exit tile - if so, freeze all enemies
        const playerOnExit = this.game.isPlayerOnExitTile();

        const enemyCollection = this.game.enemyCollection as EnemyCollection;

        // CRITICAL: Set isPlayerTurn to false FIRST before any other operations
        // This prevents race conditions where input could be processed during the transition
        this.game.isPlayerTurn = false;

        // Immediately cancel any pending tap timeouts to prevent delayed input from executing
        // This must happen immediately after setting isPlayerTurn to false
        if (this.game.inputManager?.gestureDetector) {
            this.game.inputManager.gestureDetector.clearTapTimeout();
        }

        this.occupiedTilesThisTurn.clear();
        this.initialEnemyTilesThisTurn = enemyCollection.getPositionsSet();

        const playerPos = this.game.player!.getPosition();
        this.occupiedTilesThisTurn.add(`${playerPos.x},${playerPos.y}`);

        // Detect if player just stepped off exit tile
        if (this.wasPlayerOnExitLastTurn && !playerOnExit) {
            // Player just left the exit tile - set flag for 1-turn grace period
            this.game.justLeftExitTile = true;
        }

        // Set freeze state on all enemies based on player position
        // Enemies stay frozen for 1 turn after leaving exit tile
        const shouldFreeze = playerOnExit || this.game.justLeftExitTile;
        enemyCollection.forEach(enemy => {
            enemy.isFrozen = shouldFreeze;
            // Visual freeze effect is removed 1 turn earlier (only when on exit tile, not during grace period)
            enemy.showFrozenVisual = playerOnExit;
        });

        // Clear the grace period flag after it's been used for one turn
        if (this.game.justLeftExitTile && !playerOnExit) {
            this.game.justLeftExitTile = false;
        }

        // Update the tracking variable for next turn
        this.wasPlayerOnExitLastTurn = playerOnExit;

        // Chess mode: Only one enemy moves per turn
        if (isInChessMode(this.game)) {
            this.turnQueue = this._selectChessEnemyToMove(enemyCollection);
            console.log('[Chess] Selected enemy to move:', this.turnQueue[0]?.enemyType);
        } else {
            // Normal mode: All enemies move
            this.turnQueue = enemyCollection.getAll();
        }

        this.processTurnQueue();
    }

    /**
     * Select one enemy unit to move in chess mode
     * Prioritizes units that can attack, then randomly selects from units that can move
     */
    private _selectChessEnemyToMove(enemyCollection: EnemyCollection): Enemy[] {
        const allEnemies = enemyCollection.getAll();
        const enemyTeamUnits = allEnemies.filter(e => e.team === 'enemy');

        console.log('[Chess] Enemy team has', enemyTeamUnits.length, 'units');

        if (enemyTeamUnits.length === 0) {
            return [];
        }

        // Get valid moves for each enemy unit using the same logic as InputCoordinator
        const unitsWithMoves: Array<{ enemy: Enemy; moves: Array<{ x: number; y: number }> }> = [];

        for (const enemy of enemyTeamUnits) {
            const validMoves = this._getValidMovesForChessUnit(enemy);
            console.log('[Chess]', enemy.enemyType, 'at', enemy.x, enemy.y, 'has', validMoves.length, 'valid moves');
            if (validMoves.length > 0) {
                unitsWithMoves.push({ enemy, moves: validMoves });
            }
        }

        if (unitsWithMoves.length === 0) {
            console.log('[Chess] No enemy units can move - stalemate!');
            return [];
        }

        console.log('[Chess]', unitsWithMoves.length, 'units have valid moves');

        // Prioritize units that can attack player units
        const unitsWithAttacks = unitsWithMoves.filter(({ enemy, moves }) => {
            const attackMoves = moves.filter(move => {
                const unitAtTarget = enemyCollection.findAt(move.x, move.y, true);
                return unitAtTarget && unitAtTarget.team === 'player';
            });
            if (attackMoves.length > 0) {
                console.log('[Chess]', enemy.enemyType, 'can attack at:', attackMoves);
            }
            return attackMoves.length > 0;
        });

        console.log('[Chess]', unitsWithAttacks.length, 'units can attack player units');

        const candidateUnits = unitsWithAttacks.length > 0 ? unitsWithAttacks : unitsWithMoves;

        // Randomly select one unit
        const selected = candidateUnits[Math.floor(Math.random() * candidateUnits.length)];

        // Randomly select one of its valid moves
        const selectedMove = selected.moves[Math.floor(Math.random() * selected.moves.length)];

        // Store the target move for the combat manager to use
        (selected.enemy as any)._chessTargetMove = selectedMove;

        return [selected.enemy];
    }

    /**
     * Get valid moves for a chess unit (simplified version of InputCoordinator logic)
     */
    private _getValidMovesForChessUnit(unit: Enemy): Array<{ x: number; y: number }> {
        const validMoves: Array<{ x: number; y: number }> = [];
        const { x, y } = unit;
        const grid = this.game.grid;

        // Get the base enemy type (remove 'black_' prefix if present)
        const baseType = unit.enemyType.replace('black_', '');

        // Simplified movement - just return adjacent squares for now
        // The full logic can be imported from InputCoordinator if needed
        const directions = [
            [0, -1], [0, 1], [-1, 0], [1, 0],  // Cardinal
            [-1, -1], [-1, 1], [1, -1], [1, 1]  // Diagonal
        ];

        for (const [dx, dy] of directions) {
            const newX = x + dx;
            const newY = y + dy;

            // Check bounds
            if (newX < 0 || newX >= grid[0].length || newY < 0 || newY >= grid.length) {
                continue;
            }

            // Check for walls - WALL is tile type 1
            const tileValue = grid[newY][newX];
            const isWall = tileValue === TILE_TYPES.WALL ||
                          (typeof tileValue === 'object' && tileValue !== null && tileValue.type === TILE_TYPES.WALL);
            if (isWall) {
                console.log('[Chess] Wall at', newX, newY, '- skipping');
                continue;
            }

            const enemyCollection = this.game.enemyCollection as EnemyCollection;
            const unitAtPos = enemyCollection.findAt(newX, newY, true) as Enemy | null;

            // Can move to empty squares or capture enemy units
            if (!unitAtPos || unitAtPos.team !== unit.team) {
                validMoves.push({ x: newX, y: newY });
            }
        }

        return validMoves;
    }

    /**
     * Process the turn queue recursively
     * Handles enemy movement and collision detection
     */
    processTurnQueue(): void {
        if (this.turnQueue.length === 0) {
            // IMPORTANT: Do NOT set isPlayerTurn here - it must be set AFTER animations complete
            // to prevent input spam from skipping enemy turns
            (this.game as any).playerJustAttacked = false;

            // After all enemy moves, run collision and pickup checks
            let playerWasAttacked = false;
            if (this.game.combatManager && typeof this.game.combatManager.checkCollisions === 'function') {
                const collisionResult = this.game.combatManager.checkCollisions();
                // checkCollisions may return boolean or void depending on implementation
                playerWasAttacked = collisionResult === true;
            }
            if (this.game.interactionManager && typeof this.game.interactionManager.checkItemPickup === 'function') {
                this.game.interactionManager.checkItemPickup();
            }

            // Schedule the player turn to be re-enabled AFTER all animations complete
            // CRITICAL: Don't re-enable immediately - wait for collision animations
            const pauseTime = playerWasAttacked ? 500 : 100; // Minimum 100ms buffer

            this.game.animationScheduler!.createSequence()
                .wait(pauseTime)
                .then(() => {
                    // Only NOW is it safe to re-enable player input
                    this.game.isPlayerTurn = true;
                })
                .start();

            return;
        }

        const enemy = this.turnQueue.shift()!;
        const enemyCollection = this.game.enemyCollection as EnemyCollection;
        const isStillValid = enemy && !enemy.isDead() && enemyCollection.includes(enemy);

        // Frozen enemies process faster since they don't actually move
        // Increased wait time to make enemy movements more visible and prevent input spam
        const waitTime = (isStillValid && enemy.isFrozen) ? 100 : 600;

        this.game.animationScheduler!.createSequence()
            .then(() => {
                if (isStillValid && !enemy.isFrozen) {
                    (this.game.combatManager as any).handleSingleEnemyMovement(enemy);
                }
            })
            .wait(waitTime)
            .then(() => this.processTurnQueue())
            .start();
    }
}
