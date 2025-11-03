/**
 * CombatManager - Combat coordinator
 *
 * Refactored Architecture:
 * - EnemyMovementHandler: Enemy movement and pitfall logic
 * - PlayerCombatHandler: Player attack handling
 * - CollisionDetectionSystem: Collision detection and resolution
 */
import { errorHandler, ErrorSeverity } from '../core/ErrorHandler.js';
import { safeCall, safeGet } from '../utils/SafeServiceCall.js';
import { EnemyMovementHandler } from './combat/EnemyMovementHandler.js';
import { PlayerCombatHandler } from './combat/PlayerCombatHandler.js';
import { CollisionDetectionSystem } from './combat/CollisionDetectionSystem.js';

interface ZoneInfo {
    x: number;
    y: number;
    dimension: number;
    depth: number;
}

export interface DefeatResult {
    defeated: boolean;
    consecutiveKills: number;
}

interface Enemy {
    id: string;
    x: number;
    y: number;
    lastX?: number;
    lastY?: number;
    health: number;
    attack: number;
    enemyType: string;
    justAttacked?: boolean;
    attackAnimation?: number;
    liftFrames?: number;
    _suppressAttackSound?: boolean;
    startBump: (dx: number, dy: number) => void;
    takeDamage: (amount: number) => void;
    isDead?: () => boolean;
    planMoveTowards: (targetX: number, targetY: number, grid: any) => void;
    serialize: () => any;
}

interface PlayerPos {
    x: number;
    y: number;
}

interface Game {
    player: any;
    playerFacade: any;
    enemyCollection: any;
    gridManager: any;
    zoneRepository: any;
    grid: Array<Array<number | object>>;
    turnManager?: any;
    initialEnemyTilesThisTurn?: Set<string>;
}

export class CombatManager {
    private game: Game;
    private occupiedTiles: Set<string>;
    private bombManager: any;
    private defeatFlow: any;
    private movementHandler: EnemyMovementHandler;
    private playerCombatHandler: PlayerCombatHandler;
    private collisionSystem: CollisionDetectionSystem;

    /**
     * @param game - The main game instance
     * @param occupiedTiles - Set of tiles occupied during enemy turns
     * @param bombManager - Manages bomb timing and explosions
     * @param defeatFlow - Handles enemy defeat logic and rewards
     */
    constructor(game: Game, occupiedTiles: Set<string>, bombManager: any, defeatFlow: any) {
        this.game = game;
        this.occupiedTiles = occupiedTiles;
        this.bombManager = bombManager;
        this.defeatFlow = defeatFlow;

        // Initialize sub-handlers
        this.movementHandler = new EnemyMovementHandler(game, occupiedTiles);
        this.playerCombatHandler = new PlayerCombatHandler(game, (enemy, initiator) => this.defeatEnemy(enemy, initiator));
        this.collisionSystem = new CollisionDetectionSystem(game, bombManager, (enemy, initiator) => this.defeatEnemy(enemy, initiator));
    }

    /**
     * Safe accessor for player's current zone to support tests/mocks
     */
    getCurrentZone(): ZoneInfo {
        try {
            const zone = safeCall(this.game.player, 'getCurrentZone');
            if (zone) return zone;

            const currentZone = safeGet(this.game, 'player.currentZone');
            if (currentZone) return currentZone;
        } catch (e) {
            errorHandler.handle(e as Error, ErrorSeverity.WARNING, {
                component: 'CombatManager',
                action: 'get current zone'
            });
        }
        return { x: 0, y: 0, dimension: 0, depth: 0 };
    }

    /**
     * Add point animation at position
     */
    addPointAnimation(x: number, y: number, amount: number): void {
        // Delegate to defeatFlow
        this.defeatFlow.addPointAnimation(x, y, amount);
    }

    /**
     * Handle enemy defeated (without combo tracking)
     */
    handleEnemyDefeated(enemy: Enemy, currentZone: ZoneInfo): void {
        // Delegate to defeatFlow without combo tracking (initiator=null)
        this.defeatFlow.executeDefeat(enemy, currentZone, null);
    }

    /**
     * Defeat an enemy with optional combo tracking
     * @param enemy - The enemy to defeat
     * @param initiator - Optional initiator ('player', 'bomb', etc.)
     * @returns Result including defeated status and consecutive kills
     */
    defeatEnemy(enemy: Enemy, initiator: string | null = null): DefeatResult {
        const currentZone = this.getCurrentZone();
        // Delegate to defeatFlow for all defeat logic including combo tracking
        return this.defeatFlow.executeDefeat(enemy, currentZone, initiator);
    }

    handlePlayerAttack(enemy: Enemy, playerPos: PlayerPos): any {
        return this.playerCombatHandler.handlePlayerAttack(enemy, playerPos);
    }

    handleSingleEnemyMovement(enemy: Enemy): void {
        this.movementHandler.handleSingleEnemyMovement(enemy);
    }

    /**
     * Handle enemy movements after player actions
     */
    handleEnemyMovements(): void {
        // Handle enemy movements after player actions
         // This is a placeholder for now as the main enemy movement logic might be in game.js
    }

    checkCollisions(): any {
        return this.collisionSystem.checkCollisions();
    }
}
