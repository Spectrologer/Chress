import type { GameContext } from '../core/context/GameContextCore';
import type { Enemy } from '@entities/Enemy';
import type { EnemyCollection } from '@facades/EnemyCollection';
import { TILE_TYPES } from '../core/constants/index';

/**
 * Virtual board piece for simulation
 */
interface VirtualPiece {
    type: string;
    team: 'player' | 'enemy';
    x: number;
    y: number;
    hasMovedEver?: boolean;
}

/**
 * Virtual board state for minimax simulation
 */
interface BoardState {
    pieces: VirtualPiece[];
}

/**
 * ChessAI
 *
 * Implements a minimax algorithm with alpha-beta pruning for chess mode AI.
 * Makes the AI think 2-3 moves ahead and evaluate positions strategically.
 */
export class ChessAI {
    private game: GameContext;

    // Piece values for evaluation (standard chess values)
    private readonly PIECE_VALUES: Record<string, number> = {
        'lizardy': 100,      // Pawn
        'lizord': 320,       // Knight
        'zard': 330,         // Bishop
        'lizardeaux': 500,   // Rook
        'lazerd': 900,       // Queen
        'lizardo': 20000     // King
    };

    // Position evaluation tables (piece-square tables)
    // Bonus points for pieces on certain squares
    private readonly PAWN_TABLE = [
        [0,  0,  0,  0,  0,  0,  0,  0],
        [50, 50, 50, 50, 50, 50, 50, 50],
        [10, 10, 20, 30, 30, 20, 10, 10],
        [5,  5, 10, 25, 25, 10,  5,  5],
        [0,  0,  0, 20, 20,  0,  0,  0],
        [5, -5,-10,  0,  0,-10, -5,  5],
        [5, 10, 10,-20,-20, 10, 10,  5],
        [0,  0,  0,  0,  0,  0,  0,  0]
    ];

    private readonly KNIGHT_TABLE = [
        [-50,-40,-30,-30,-30,-30,-40,-50],
        [-40,-20,  0,  0,  0,  0,-20,-40],
        [-30,  0, 10, 15, 15, 10,  0,-30],
        [-30,  5, 15, 20, 20, 15,  5,-30],
        [-30,  0, 15, 20, 20, 15,  0,-30],
        [-30,  5, 10, 15, 15, 10,  5,-30],
        [-40,-20,  0,  5,  5,  0,-20,-40],
        [-50,-40,-30,-30,-30,-30,-40,-50]
    ];

    private readonly KING_TABLE = [
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-20,-30,-30,-40,-40,-30,-30,-20],
        [-10,-20,-20,-20,-20,-20,-20,-10],
        [ 20, 20,  0,  0,  0,  0, 20, 20],
        [ 20, 30, 10,  0,  0, 10, 30, 20]
    ];

    constructor(game: GameContext) {
        this.game = game;
    }

    /**
     * Select the best move for an enemy unit using minimax with alpha-beta pruning
     * @param depth Search depth (2-3 recommended, 3 is stronger but slower)
     */
    async selectBestMove(depth: number = 2): Promise<{ enemy: Enemy; move: { x: number; y: number } } | null> {
        const enemyCollection = this.game.enemyCollection as EnemyCollection;
        const allEnemies = enemyCollection.getAll();
        const enemyTeamUnits = allEnemies.filter(e => e.team === 'enemy');

        if (enemyTeamUnits.length === 0) {
            return null;
        }

        let bestScore = -Infinity;
        let bestMove: { enemy: Enemy; move: { x: number; y: number } } | null = null;

        // Generate all possible moves for all enemy units
        const allPossibleMoves: Array<{ enemy: Enemy; move: { x: number; y: number } }> = [];

        for (const enemy of enemyTeamUnits) {
            const validMoves = this.getValidMovesForUnit(enemy);
            for (const move of validMoves) {
                allPossibleMoves.push({ enemy, move });
            }
        }

        console.log('[ChessAI] Evaluating', allPossibleMoves.length, 'possible moves at depth', depth);

        // If no moves available, return null (true stalemate)
        if (allPossibleMoves.length === 0) {
            console.log('[ChessAI] No legal moves available - true stalemate');
            return null;
        }

        // Order moves to improve alpha-beta pruning efficiency
        const orderedMoves = this.orderMoves(allPossibleMoves);

        // Yield to browser BEFORE starting calculation
        await new Promise(resolve => setTimeout(resolve, 0));

        // Evaluate each possible move using minimax (with async breaks)
        for (let i = 0; i < orderedMoves.length; i++) {
            const { enemy, move } = orderedMoves[i];

            // Yield to browser after EVERY move evaluation to prevent blocking
            if (i > 0) {
                await new Promise(resolve => setTimeout(resolve, 0));
            }

            const score = this.evaluateMove(enemy, move, depth);

            console.log('[ChessAI]  ', enemy.enemyType, 'from', enemy.x, enemy.y, 'to', move.x, move.y, '= score', score);

            if (score > bestScore) {
                bestScore = score;
                bestMove = { enemy, move };
            }
        }

        // If somehow no move was selected (all scores were -Infinity), pick the first move
        // This ensures the AI always makes a legal move when one exists
        if (!bestMove && orderedMoves.length > 0) {
            console.log('[ChessAI] All moves had very poor scores, selecting first available move');
            bestMove = orderedMoves[0];
        }

        console.log('[ChessAI] Best move score:', bestScore, 'for', bestMove?.enemy.enemyType, 'from', bestMove?.enemy.x, bestMove?.enemy.y, 'to', bestMove?.move);

        return bestMove;
    }

    /**
     * Evaluate a move using minimax with alpha-beta pruning
     */
    private evaluateMove(enemy: Enemy, move: { x: number; y: number }, depth: number): number {
        // Create virtual board state
        const boardState = this.createBoardState();

        // Apply move to virtual board
        const capturedPiece = this.applyMoveToBoard(boardState, enemy.x, enemy.y, move.x, move.y);

        // Check if this move wins the game (captures player king)
        if (capturedPiece && this.getBaseType(capturedPiece.type) === 'lizardo' && capturedPiece.team === 'player') {
            return 999999; // Win immediately
        }

        // Run minimax from opponent's perspective
        const score = -this.minimaxWithBoard(boardState, depth - 1, -Infinity, Infinity, false);

        return score;
    }

    /**
     * Minimax algorithm with alpha-beta pruning (using virtual board)
     * @param board Virtual board state
     * @param depth Remaining search depth
     * @param alpha Best score for maximizing player
     * @param beta Best score for minimizing player
     * @param isMaximizing True if current player is maximizing (enemy AI), false if minimizing (human player)
     */
    private minimaxWithBoard(board: BoardState, depth: number, alpha: number, beta: number, isMaximizing: boolean): number {
        // Base case: reached max depth or game over
        if (depth === 0) {
            return this.evaluateBoardState(board);
        }

        const currentTeam = isMaximizing ? 'enemy' : 'player';
        const currentTeamUnits = board.pieces.filter(p => p.team === currentTeam);

        // Check for game over (king captured)
        const enemyKing = board.pieces.find(p => p.team === 'enemy' && this.getBaseType(p.type) === 'lizardo');
        const playerKing = board.pieces.find(p => p.team === 'player' && this.getBaseType(p.type) === 'lizardo');

        if (!enemyKing) return -999999; // Enemy lost
        if (!playerKing) return 999999;  // Enemy won

        // Generate all possible moves for current team
        const allPossibleMoves: Array<{ piece: VirtualPiece; move: { x: number; y: number } }> = [];
        for (const piece of currentTeamUnits) {
            const validMoves = this.getValidMovesForVirtualPiece(board, piece);
            for (const move of validMoves) {
                allPossibleMoves.push({ piece, move });
            }
        }

        // Check for stalemate
        if (allPossibleMoves.length === 0) {
            return 0; // Draw
        }

        if (isMaximizing) {
            let maxScore = -Infinity;

            for (const { piece, move } of allPossibleMoves) {
                // Clone board and apply move
                const newBoard = this.cloneBoardState(board);
                this.applyMoveToBoard(newBoard, piece.x, piece.y, move.x, move.y);

                const score = this.minimaxWithBoard(newBoard, depth - 1, alpha, beta, false);

                maxScore = Math.max(maxScore, score);
                alpha = Math.max(alpha, score);

                // Beta cutoff
                if (beta <= alpha) {
                    break;
                }
            }

            return maxScore;
        } else {
            let minScore = Infinity;

            for (const { piece, move } of allPossibleMoves) {
                // Clone board and apply move
                const newBoard = this.cloneBoardState(board);
                this.applyMoveToBoard(newBoard, piece.x, piece.y, move.x, move.y);

                const score = this.minimaxWithBoard(newBoard, depth - 1, alpha, beta, true);

                minScore = Math.min(minScore, score);
                beta = Math.min(beta, score);

                // Alpha cutoff
                if (beta <= alpha) {
                    break;
                }
            }

            return minScore;
        }
    }

    /**
     * Evaluate a virtual board position
     * Positive score favors enemy AI, negative favors player
     */
    private evaluateBoardState(board: BoardState): number {
        let score = 0;

        // Material and position evaluation
        for (const piece of board.pieces) {
            const baseType = this.getBaseType(piece.type);
            const pieceValue = this.PIECE_VALUES[baseType] || 0;
            const positionBonus = this.getPositionBonusForVirtual(piece);

            let totalValue = pieceValue + positionBonus;

            // Check if piece is under attack (hanging)
            if (this.isPieceUnderAttack(board, piece)) {
                // Penalize hanging pieces heavily
                totalValue -= pieceValue * 0.5;
            }

            // Add to score if enemy piece, subtract if player piece
            if (piece.team === 'enemy') {
                score += totalValue;
            } else {
                score -= totalValue;
            }
        }

        // Add center control bonus
        score += this.evaluateBoardCenterControl(board);

        return score;
    }

    /**
     * Get position bonus from piece-square tables for virtual piece
     */
    private getPositionBonusForVirtual(piece: VirtualPiece): number {
        const baseType = this.getBaseType(piece.type);
        const x = piece.x;
        const y = piece.y;

        // Ensure coordinates are in bounds for 8x8 tables
        if (x < 0 || x > 7 || y < 0 || y > 7) {
            return 0;
        }

        // Flip y-coordinate for enemy pieces (they view board from opposite side)
        const tableY = piece.team === 'enemy' ? y : (7 - y);

        switch (baseType) {
            case 'lizardy':
                return this.PAWN_TABLE[tableY][x];
            case 'lizord':
                return this.KNIGHT_TABLE[tableY][x];
            case 'lizardo':
                return this.KING_TABLE[tableY][x];
            default:
                return 0;
        }
    }

    /**
     * Check if a piece is under attack by enemy pieces
     */
    private isPieceUnderAttack(board: BoardState, targetPiece: VirtualPiece): boolean {
        const enemyPieces = board.pieces.filter(p => p.team !== targetPiece.team);

        for (const enemyPiece of enemyPieces) {
            const moves = this.getValidMovesForVirtualPiece(board, enemyPiece);
            if (moves.some(move => move.x === targetPiece.x && move.y === targetPiece.y)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Evaluate control of center squares (d4, d5, e4, e5) on virtual board
     */
    private evaluateBoardCenterControl(board: BoardState): number {
        const centerSquares = [
            { x: 3, y: 3 }, { x: 3, y: 4 },
            { x: 4, y: 3 }, { x: 4, y: 4 }
        ];

        let score = 0;

        for (const square of centerSquares) {
            const piece = board.pieces.find(p => p.x === square.x && p.y === square.y);
            if (piece) {
                score += piece.team === 'enemy' ? 30 : -30;
            }
        }

        return score;
    }

    /**
     * Order moves to improve alpha-beta pruning efficiency
     * Prioritize: high-value captures > low-value captures > center moves > other moves
     */
    private orderMoves(moves: Array<{ enemy: Enemy; move: { x: number; y: number } }>): Array<{ enemy: Enemy; move: { x: number; y: number } }> {
        const enemyCollection = this.game.enemyCollection as EnemyCollection;

        return moves.sort((a, b) => {
            // Check if moves are captures and get victim value
            const aVictim = enemyCollection.findAt(a.move.x, a.move.y, true);
            const bVictim = enemyCollection.findAt(b.move.x, b.move.y, true);

            const aVictimValue = aVictim ? (this.PIECE_VALUES[this.getBaseType(aVictim.enemyType)] || 0) : 0;
            const bVictimValue = bVictim ? (this.PIECE_VALUES[this.getBaseType(bVictim.enemyType)] || 0) : 0;

            // Prioritize higher value captures (MVV-LVA: Most Valuable Victim - Least Valuable Attacker)
            if (aVictimValue !== bVictimValue) {
                return bVictimValue - aVictimValue;
            }

            // If both are captures or both are non-captures, prioritize center moves
            const centerSquares = [3, 4];
            const aIsCenter = centerSquares.includes(a.move.x) && centerSquares.includes(a.move.y);
            const bIsCenter = centerSquares.includes(b.move.x) && centerSquares.includes(b.move.y);

            if (aIsCenter && !bIsCenter) return -1;
            if (!aIsCenter && bIsCenter) return 1;

            return 0;
        });
    }

    /**
     * Create a virtual board state from current game state
     */
    private createBoardState(): BoardState {
        const enemyCollection = this.game.enemyCollection as EnemyCollection;
        const pieces: VirtualPiece[] = [];

        for (const unit of enemyCollection.getAll()) {
            pieces.push({
                type: unit.enemyType,
                team: unit.team,
                x: unit.x,
                y: unit.y,
                hasMovedEver: unit.hasMovedEver
            });
        }

        return { pieces };
    }

    /**
     * Clone a virtual board state
     */
    private cloneBoardState(board: BoardState): BoardState {
        return {
            pieces: board.pieces.map(p => ({ ...p }))
        };
    }

    /**
     * Apply a move to a virtual board
     * @returns The captured piece if any
     */
    private applyMoveToBoard(board: BoardState, fromX: number, fromY: number, toX: number, toY: number): VirtualPiece | null {
        // Find the piece to move
        const pieceIndex = board.pieces.findIndex(p => p.x === fromX && p.y === fromY);
        if (pieceIndex === -1) return null;

        const movingPiece = board.pieces[pieceIndex];
        const baseType = this.getBaseType(movingPiece.type);

        // Check if there's a piece to capture at destination
        const capturedIndex = board.pieces.findIndex(p => p.x === toX && p.y === toY);
        let capturedPiece: VirtualPiece | null = null;

        // Check for castling: King moving to a rook's position
        if (baseType === 'lizardo' && capturedIndex !== -1) {
            const targetPiece = board.pieces[capturedIndex];
            const targetBaseType = this.getBaseType(targetPiece.type);

            if (targetBaseType === 'lizardeaux' && targetPiece.team === movingPiece.team) {
                // This is castling!
                const kingX = fromX;
                const rookX = toX;

                // Move king 2 squares toward rook
                if (rookX > kingX) {
                    // Kingside castling
                    board.pieces[pieceIndex].x = kingX + 2;
                    board.pieces[capturedIndex].x = kingX + 1;
                } else {
                    // Queenside castling
                    board.pieces[pieceIndex].x = kingX - 2;
                    board.pieces[capturedIndex].x = kingX - 1;
                }

                // Mark both as moved
                board.pieces[pieceIndex].hasMovedEver = true;
                board.pieces[capturedIndex].hasMovedEver = true;

                return null; // No capture in castling
            }
        }

        if (capturedIndex !== -1) {
            capturedPiece = board.pieces[capturedIndex];
            // Remove captured piece
            board.pieces.splice(capturedIndex, 1);
            // Adjust piece index if needed
            if (capturedIndex < pieceIndex) {
                board.pieces[pieceIndex - 1].x = toX;
                board.pieces[pieceIndex - 1].y = toY;
                board.pieces[pieceIndex - 1].hasMovedEver = true;
            } else {
                board.pieces[pieceIndex].x = toX;
                board.pieces[pieceIndex].y = toY;
                board.pieces[pieceIndex].hasMovedEver = true;
            }
        } else {
            // Just move the piece
            board.pieces[pieceIndex].x = toX;
            board.pieces[pieceIndex].y = toY;
            board.pieces[pieceIndex].hasMovedEver = true;
        }

        return capturedPiece;
    }

    /**
     * Get valid moves for a unit (same logic as TurnManager)
     */
    getValidMovesForUnit(unit: Enemy): Array<{ x: number; y: number }> {
        const validMoves: Array<{ x: number; y: number }> = [];
        const { x, y } = unit;
        const grid = this.game.grid;
        const enemyCollection = this.game.enemyCollection as EnemyCollection;

        const baseType = this.getBaseType(unit.enemyType);
        const forwardDir = unit.team === 'enemy' ? 1 : -1;

        const isValidSquare = (px: number, py: number): boolean => {
            if (px < 0 || px >= grid[0].length || py < 0 || py >= grid.length) {
                return false;
            }
            const tileValue = grid[py][px];
            const isWall = tileValue === TILE_TYPES.WALL ||
                          (typeof tileValue === 'object' && tileValue !== null && tileValue.type === TILE_TYPES.WALL);
            return !isWall;
        };

        const addMoveIfValid = (px: number, py: number, canCapture: boolean = true, mustCapture: boolean = false): boolean => {
            if (!isValidSquare(px, py)) {
                return false;
            }

            const unitAtPos = enemyCollection.findAt(px, py, true) as Enemy | null;

            if (mustCapture) {
                if (unitAtPos && unitAtPos.team !== unit.team) {
                    validMoves.push({ x: px, y: py });
                    return true;
                }
                return false;
            }

            if (!unitAtPos) {
                if (!mustCapture) {
                    validMoves.push({ x: px, y: py });
                }
                return true;
            } else if (unitAtPos.team !== unit.team && canCapture) {
                validMoves.push({ x: px, y: py });
                return true;
            }

            return false;
        };

        switch (baseType) {
            case 'lizardy': // Pawn
                addMoveIfValid(x, y + forwardDir, false, false);
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
                for (const [dx, dy] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
                    for (let i = 1; i < 8; i++) {
                        if (!addMoveIfValid(x + dx * i, y + dy * i)) {
                            break;
                        }
                        const unitAtPos = enemyCollection.findAt(x + dx * i, y + dy * i, true);
                        if (unitAtPos) break;
                    }
                }
                break;

            case 'lizardeaux': // Rook
                for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
                    for (let i = 1; i < 8; i++) {
                        if (!addMoveIfValid(x + dx * i, y + dy * i)) {
                            break;
                        }
                        const unitAtPos = enemyCollection.findAt(x + dx * i, y + dy * i, true);
                        if (unitAtPos) break;
                    }
                }
                break;

            case 'lazerd': // Queen
                for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0], [-1, -1], [-1, 1], [1, -1], [1, 1]]) {
                    for (let i = 1; i < 8; i++) {
                        if (!addMoveIfValid(x + dx * i, y + dy * i)) {
                            break;
                        }
                        const unitAtPos = enemyCollection.findAt(x + dx * i, y + dy * i, true);
                        if (unitAtPos) break;
                    }
                }
                break;

            case 'lizardo': // King
                for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0], [-1, -1], [-1, 1], [1, -1], [1, 1]]) {
                    addMoveIfValid(x + dx, y + dy);
                }
                // Add castling moves
                this.addCastlingMovesForAI(unit, validMoves, enemyCollection, grid);
                break;

            default:
                for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0], [-1, -1], [-1, 1], [1, -1], [1, 1]]) {
                    addMoveIfValid(x + dx, y + dy);
                }
                break;
        }

        return validMoves;
    }

    /**
     * Get valid moves for a virtual piece on virtual board
     */
    private getValidMovesForVirtualPiece(board: BoardState, piece: VirtualPiece): Array<{ x: number; y: number }> {
        const validMoves: Array<{ x: number; y: number }> = [];
        const { x, y } = piece;
        const grid = this.game.grid;

        const baseType = this.getBaseType(piece.type);
        const forwardDir = piece.team === 'enemy' ? 1 : -1;

        const isValidSquare = (px: number, py: number): boolean => {
            if (px < 0 || px >= grid[0].length || py < 0 || py >= grid.length) {
                return false;
            }
            const tileValue = grid[py][px];
            const isWall = tileValue === TILE_TYPES.WALL ||
                          (typeof tileValue === 'object' && tileValue !== null && tileValue.type === TILE_TYPES.WALL);
            return !isWall;
        };

        const addMoveIfValid = (px: number, py: number, canCapture: boolean = true, mustCapture: boolean = false): boolean => {
            if (!isValidSquare(px, py)) {
                return false;
            }

            const pieceAtPos = board.pieces.find(p => p.x === px && p.y === py);

            if (mustCapture) {
                if (pieceAtPos && pieceAtPos.team !== piece.team) {
                    validMoves.push({ x: px, y: py });
                    return true;
                }
                return false;
            }

            if (!pieceAtPos) {
                if (!mustCapture) {
                    validMoves.push({ x: px, y: py });
                }
                return true;
            } else if (pieceAtPos.team !== piece.team && canCapture) {
                validMoves.push({ x: px, y: py });
                return true;
            }

            return false;
        };

        switch (baseType) {
            case 'lizardy': // Pawn
                addMoveIfValid(x, y + forwardDir, false, false);
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
                for (const [dx, dy] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
                    for (let i = 1; i < 8; i++) {
                        if (!addMoveIfValid(x + dx * i, y + dy * i)) {
                            break;
                        }
                        const pieceAtPos = board.pieces.find(p => p.x === x + dx * i && p.y === y + dy * i);
                        if (pieceAtPos) break;
                    }
                }
                break;

            case 'lizardeaux': // Rook
                for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
                    for (let i = 1; i < 8; i++) {
                        if (!addMoveIfValid(x + dx * i, y + dy * i)) {
                            break;
                        }
                        const pieceAtPos = board.pieces.find(p => p.x === x + dx * i && p.y === y + dy * i);
                        if (pieceAtPos) break;
                    }
                }
                break;

            case 'lazerd': // Queen
                for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0], [-1, -1], [-1, 1], [1, -1], [1, 1]]) {
                    for (let i = 1; i < 8; i++) {
                        if (!addMoveIfValid(x + dx * i, y + dy * i)) {
                            break;
                        }
                        const pieceAtPos = board.pieces.find(p => p.x === x + dx * i && p.y === y + dy * i);
                        if (pieceAtPos) break;
                    }
                }
                break;

            case 'lizardo': // King
                for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0], [-1, -1], [-1, 1], [1, -1], [1, 1]]) {
                    addMoveIfValid(x + dx, y + dy);
                }
                break;

            default:
                for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0], [-1, -1], [-1, 1], [1, -1], [1, 1]]) {
                    addMoveIfValid(x + dx, y + dy);
                }
                break;
        }

        return validMoves;
    }

    /**
     * Get base type without 'black_' prefix
     */
    private getBaseType(enemyType: string): string {
        return enemyType.replace('black_', '');
    }

    /**
     * Add castling moves for the king (AI version)
     */
    private addCastlingMovesForAI(
        king: Enemy,
        validMoves: Array<{ x: number; y: number }>,
        enemyCollection: EnemyCollection,
        grid: number[][]
    ): void {
        // Can't castle if king has moved
        if (king.hasMovedEver) {
            return;
        }

        const { x: kingX, y: kingY } = king;

        // Find all rooks on the same team that haven't moved
        const allUnits = enemyCollection.getAll() as Enemy[];
        const rooks = allUnits.filter((unit: Enemy) => {
            const baseType = this.getBaseType(unit.enemyType);
            return baseType === 'lizardeaux' &&
                   unit.team === king.team &&
                   !unit.hasMovedEver &&
                   unit.y === kingY; // Same row
        });

        for (const rook of rooks) {
            const rookX = rook.x;

            // Check if path between king and rook is clear
            const minX = Math.min(kingX, rookX);
            const maxX = Math.max(kingX, rookX);
            let pathClear = true;

            // Check all squares between king and rook (exclusive)
            for (let x = minX + 1; x < maxX; x++) {
                // Check for walls
                const tileValue = grid[kingY][x];
                const isWall = tileValue === TILE_TYPES.WALL ||
                              (typeof tileValue === 'object' && tileValue !== null && (tileValue as any).type === TILE_TYPES.WALL);
                if (isWall) {
                    pathClear = false;
                    break;
                }

                // Check for units
                const unitAtPos = enemyCollection.findAt(x, kingY, true);
                if (unitAtPos) {
                    pathClear = false;
                    break;
                }
            }

            if (!pathClear) {
                continue;
            }

            // Add the rook's position as a valid "move" for castling
            validMoves.push({ x: rookX, y: kingY });
        }
    }
}
