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
        const unitsWithAttacks = unitsWithMoves.map(({ enemy, moves }) => {
            const attackMoves = moves.filter(move => {
                const unitAtTarget = enemyCollection.findAt(move.x, move.y, true);
                return unitAtTarget && unitAtTarget.team === 'player';
            });
            if (attackMoves.length > 0) {
                console.log('[Chess]', enemy.enemyType, 'can attack at:', attackMoves);
            }
            return { enemy, moves, attackMoves };
        }).filter(({ attackMoves }) => attackMoves.length > 0);

        console.log('[Chess]', unitsWithAttacks.length, 'units can attack player units');

        let selected: { enemy: Enemy; moves: Array<{ x: number; y: number }> };
        let selectedMove: { x: number; y: number };

        if (unitsWithAttacks.length > 0) {
            // If we have units that can attack, select one and choose an attack move
            const attackUnit = unitsWithAttacks[Math.floor(Math.random() * unitsWithAttacks.length)];
            selected = { enemy: attackUnit.enemy, moves: attackUnit.moves };
            // IMPORTANT: Select from attack moves only, not all moves
            selectedMove = attackUnit.attackMoves[Math.floor(Math.random() * attackUnit.attackMoves.length)];
        } else {
            // Otherwise, select a unit that can move and choose any valid move
            const movingUnit = unitsWithMoves[Math.floor(Math.random() * unitsWithMoves.length)];
            selected = movingUnit;
            selectedMove = selected.moves[Math.floor(Math.random() * selected.moves.length)];
        }

        // Store the target move for the combat manager to use
        selected.enemy._chessTargetMove = selectedMove;

        return [selected.enemy];
    }

    /**
     * Get valid moves for a chess unit (simplified version of InputCoordinator logic)
     */
    private _getValidMovesForChessUnit(unit: Enemy): Array<{ x: number; y: number }> {
        const validMoves: Array<{ x: number; y: number }> = [];
        const { x, y } = unit;
        const grid = this.game.grid;
        const enemyCollection = this.game.enemyCollection as EnemyCollection;

        // Get the base enemy type (remove 'black_' prefix if present)
        const baseType = unit.enemyType.replace('black_', '');

        // Determine movement direction based on team
        // Black pieces (enemy) move down (increasing y), white pieces (player) move up (decreasing y)
        const forwardDir = unit.team === 'enemy' ? 1 : -1;

        // Helper function to check if a position is valid and not a wall
        const isValidSquare = (px: number, py: number): boolean => {
            if (px < 0 || px >= grid[0].length || py < 0 || py >= grid.length) {
                return false;
            }
            const tileValue = grid[py][px];
            const isWall = tileValue === TILE_TYPES.WALL ||
                          (typeof tileValue === 'object' && tileValue !== null && tileValue.type === TILE_TYPES.WALL);
            return !isWall;
        };

        // Helper function to add move if valid
        const addMoveIfValid = (px: number, py: number, canCapture: boolean = true, mustCapture: boolean = false): boolean => {
            if (!isValidSquare(px, py)) {
                return false;
            }

            const unitAtPos = enemyCollection.findAt(px, py, true) as Enemy | null;

            if (mustCapture) {
                // Must have an enemy unit to capture
                if (unitAtPos && unitAtPos.team !== unit.team) {
                    validMoves.push({ x: px, y: py });
                    return true;
                }
                return false;
            }

            if (!unitAtPos) {
                // Empty square
                if (!mustCapture) {
                    validMoves.push({ x: px, y: py });
                }
                return true;
            } else if (unitAtPos.team !== unit.team && canCapture) {
                // Can capture enemy unit
                validMoves.push({ x: px, y: py });
                return true;
            }

            return false;
        };

        switch (baseType) {
            case 'lizardy': // Pawn
                // Move forward one square (no capture)
                addMoveIfValid(x, y + forwardDir, false, false);

                // Capture diagonally
                addMoveIfValid(x - 1, y + forwardDir, true, true);
                addMoveIfValid(x + 1, y + forwardDir, true, true);
                break;

            case 'lizord': // Knight
                const knightMoves = [
                    [2, 1], [2, -1], [-2, 1], [-2, -1],
                    [1, 2], [1, -2], [-1, 2], [-1, -2]
                ];
                for (const [dx, dy] of knightMoves) {
                    addMoveIfValid(x + dx, y + dy);
                }
                break;

            case 'zard': // Bishop
                // Diagonal movement
                for (const [dx, dy] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
                    for (let i = 1; i < 8; i++) {
                        if (!addMoveIfValid(x + dx * i, y + dy * i)) {
                            break;
                        }
                        // Stop if we captured a piece
                        const unitAtPos = enemyCollection.findAt(x + dx * i, y + dy * i, true);
                        if (unitAtPos) break;
                    }
                }
                break;

            case 'lizardeaux': // Rook
                // Horizontal and vertical movement
                for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
                    for (let i = 1; i < 8; i++) {
                        if (!addMoveIfValid(x + dx * i, y + dy * i)) {
                            break;
                        }
                        // Stop if we captured a piece
                        const unitAtPos = enemyCollection.findAt(x + dx * i, y + dy * i, true);
                        if (unitAtPos) break;
                    }
                }
                break;

            case 'lazerd': // Queen
                // All directions
                for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0], [-1, -1], [-1, 1], [1, -1], [1, 1]]) {
                    for (let i = 1; i < 8; i++) {
                        if (!addMoveIfValid(x + dx * i, y + dy * i)) {
                            break;
                        }
                        // Stop if we captured a piece
                        const unitAtPos = enemyCollection.findAt(x + dx * i, y + dy * i, true);
                        if (unitAtPos) break;
                    }
                }
                break;

            case 'lizardo': // King
                // One square in any direction
                for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0], [-1, -1], [-1, 1], [1, -1], [1, 1]]) {
                    addMoveIfValid(x + dx, y + dy);
                }
                break;

            default:
                // Unknown piece type - use generic adjacent movement
                for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0], [-1, -1], [-1, 1], [1, -1], [1, 1]]) {
                    addMoveIfValid(x + dx, y + dy);
                }
                break;
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
