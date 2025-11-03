import { TILE_TYPES } from '../core/constants/index.js';
import audioManager from '../utils/AudioManager.js';
import { eventBus } from '../core/EventBus.js';
import { EventTypes } from '../core/EventTypes.js';
import { Position } from '../core/Position.js';

interface GridCoords {
    x: number;
    y: number;
}

interface InteractionFacade {
    inputManager: any;
    npcManager: any;
    environmentManager: any;
}

interface CombatFacade {
    combatActionManager: any;
    bombManager: any;
}

interface WorldFacade {
    terrainManager: any;
    zoneManager: any;
    itemPickupManager: any;
}

interface Game {
    playerFacade: any;
    player: any;
    grid: Array<Array<number | object>>;
    transientGameState: any;
    enemyCollection: any;
    startEnemyTurns: () => void;
    justEnteredZone: boolean;
    isInPitfallZone: boolean;
    pitfallTurnsSurvived: number;
    updatePlayerPosition: () => void;
    inventoryManager: any;
    combatManager: any;
}

type InteractionHandler = (gridCoords: GridCoords, playerPos: { x: number; y: number }) => boolean;

export class InteractionManager {
    private game: Game;
    private interactionFacade: InteractionFacade;
    private combatFacade: CombatFacade;
    private worldFacade: WorldFacade;
    private inputManager: any;
    private npcManager: any;
    private environmentManager: any;
    private combatManager: any;
    private bombManager: any;
    private terrainManager: any;
    private zoneManager: any;
    private itemPickupManager: any;
    private interactionHandlers: InteractionHandler[];

    /**
     * InteractionManager coordinates all player interactions with the game world.
     *
     * Reduced from 9 constructor parameters to 4 by grouping related dependencies
     * into facades (InteractionFacade, CombatFacade, WorldFacade).
     *
     * @param game - The main game instance
     * @param interactionFacade - Groups NPC, environmental, and input managers
     * @param combatFacade - Groups combat action and bomb managers
     * @param worldFacade - Groups terrain, zone, and item pickup managers
     */
    constructor(game: Game, interactionFacade: InteractionFacade, combatFacade: CombatFacade, worldFacade: WorldFacade) {
        this.game = game;

        // Store facades for direct access to underlying managers when needed
        this.interactionFacade = interactionFacade;
        this.combatFacade = combatFacade;
        this.worldFacade = worldFacade;

        // Maintain backward compatibility with direct manager references
        this.inputManager = interactionFacade.inputManager;
        this.npcManager = interactionFacade.npcManager;
        this.environmentManager = interactionFacade.environmentManager;
        this.combatManager = combatFacade.combatActionManager;
        this.bombManager = combatFacade.bombManager;
        this.terrainManager = worldFacade.terrainManager;
        this.zoneManager = worldFacade.zoneManager;
        this.itemPickupManager = worldFacade.itemPickupManager;

        // Register interaction handlers for handleTap
        this.interactionHandlers = [
            (gridCoords, playerPos) => this.bombManager.handleBombPlacement(gridCoords),
            (gridCoords, playerPos) => this.npcManager.interactWithPenne(gridCoords),
            (gridCoords, playerPos) => this.npcManager.interactWithSquig(gridCoords),
            (gridCoords, playerPos) => this.npcManager.interactWithRune(gridCoords),
            (gridCoords, playerPos) => this.npcManager.interactWithNib(gridCoords),
            (gridCoords, playerPos) => this.npcManager.interactWithMark(gridCoords),
            (gridCoords, playerPos) => this.npcManager.interactWithCrayn(gridCoords),
            (gridCoords, playerPos) => this.npcManager.interactWithFelt(gridCoords),
            (gridCoords, playerPos) => this.npcManager.interactWithAxelotl(gridCoords),
            (gridCoords, playerPos) => this.npcManager.interactWithGouge(gridCoords),
            (gridCoords, playerPos) => this.npcManager.interactWithForge(gridCoords),
            // Dynamic NPC handler for all NPCs registered in ContentRegistry (e.g., gossip NPCs)
            (gridCoords, playerPos) => this.npcManager.interactWithDynamicNPC(gridCoords),
            (gridCoords, playerPos) => this.environmentManager.handleSignTap(gridCoords),
            (gridCoords, playerPos) => this.environmentManager.handleStatueTap(gridCoords),
            (gridCoords, playerPos) => this.bombManager.triggerBombExplosion(gridCoords, playerPos),
            (gridCoords, playerPos) => {
                const bishopSpearCharge = this.combatManager.isValidBishopSpearCharge(gridCoords, playerPos);
                // Only auto-start a bishop charge if the item is present in the main inventory (via facade)
                if (bishopSpearCharge && this.game.playerFacade.findInInventory((item: any) => item === bishopSpearCharge.item)) {
                    this.game.transientGameState.setPendingCharge(bishopSpearCharge);
                    // Emit event for confirmation prompt instead of direct UI call
                    eventBus.emit(EventTypes.UI_CONFIRMATION_SHOW, {
                        message: 'Tap again to confirm Bishop Charge',
                        action: 'bishop_charge',
                        data: bishopSpearCharge,
                        persistent: true,
                        largeText: true,
                        useTypewriter: false
                    });
                    return true;
                }
                return false;
            },
            (gridCoords, playerPos) => {
                const horseIconCharge = this.combatManager.isValidHorseIconCharge(gridCoords, playerPos);
                // Only auto-start a knight charge if the item is present in the main inventory (via facade)
                if (horseIconCharge && this.game.playerFacade.findInInventory((item: any) => item === horseIconCharge.item)) {
                    this.game.transientGameState.setPendingCharge(horseIconCharge);
                    // Emit event for confirmation prompt instead of direct UI call
                    eventBus.emit(EventTypes.UI_CONFIRMATION_SHOW, {
                        message: 'Tap again to confirm Knight Charge',
                        action: 'knight_charge',
                        data: horseIconCharge,
                        persistent: true,
                        largeText: true,
                        useTypewriter: false
                    });
                    return true;
                }
                return false;
            },
            (gridCoords, playerPos) => {
                const bowShot = this.combatManager.isValidBowShot(gridCoords, playerPos);
                // Only auto-start a bow shot if the bow is in the main inventory (via facade)
                if (bowShot && this.game.playerFacade.findInInventory((item: any) => item === bowShot.item)) {
                    this.game.transientGameState.setPendingCharge(bowShot);
                    // Emit event for confirmation prompt instead of direct UI call
                    eventBus.emit(EventTypes.UI_CONFIRMATION_SHOW, {
                        message: 'Tap again to confirm Bow Shot',
                        action: 'bow_shot',
                        data: bowShot,
                        persistent: true,
                        largeText: true,
                        useTypewriter: false
                    });
                    return true;
                }
                return false;
            },
            (gridCoords, playerPos) => this.terrainManager.handleChoppableTile(gridCoords, playerPos),
            (gridCoords, playerPos) => this.zoneManager.checkForZoneTransitionGesture(gridCoords, playerPos),
            (gridCoords, playerPos) => this.zoneManager.isTransitionEligible(gridCoords, playerPos),
        ];
    }

    // Consolidated interaction delegation methods
    checkPenneInteraction(): any {
        // Example: delegate to NPC manager or handle directly
        // (Penne is a type of NPC or tile)
        // You may want to refactor this to a more generic handler if needed
        return this.npcManager.interactWithPenne({ x: this.game.player.getPosition().x + 1, y: this.game.player.getPosition().y });
    }

    checkSquigInteraction(): any {
        return this.npcManager.interactWithSquig({ x: this.game.player.getPosition().x + 1, y: this.game.player.getPosition().y });
    }

    checkItemPickup(): any {
        return this.itemPickupManager.checkItemPickup();
    }

    useMapNote(): any {
        return this.game.inventoryManager.useMapNote();
    }

    handleTap(gridCoords: GridCoords): boolean {
        const clickedPos = Position.from(gridCoords);
        const transientState = this.game.transientGameState;

        // Handle pending charge confirmation or cancellation
        if (transientState.hasPendingCharge()) {
            const pending = transientState.getPendingCharge();
            let chargeDetails = null;

            // If pending was initiated from the radial UI it will contain a
            // selectionType and an item but not a concrete target. Re-run the
            // validator for the tapped gridCoords to obtain a proper
            // chargeDetails object to confirm.
            if (pending && pending.selectionType) {
                const playerPos = this.game.player.getPosition();
                // Re-run validators including radial inventory because selection
                // originated from the radial UI and the item may live there.
                if (pending.selectionType === 'bishop_spear') chargeDetails = this.combatManager.isValidBishopSpearCharge(gridCoords, playerPos, true);
                else if (pending.selectionType === 'horse_icon') chargeDetails = this.combatManager.isValidHorseIconCharge(gridCoords, playerPos, true);
                else if (pending.selectionType === 'bow') chargeDetails = this.combatManager.isValidBowShot(gridCoords, playerPos, true);
            } else {
                chargeDetails = pending;
            }

            // If we have valid chargeDetails with a target, confirm/cancel based on equality.
            if (chargeDetails && chargeDetails.target) {
                const targetPos = Position.from(chargeDetails.target);
                if (clickedPos.equals(targetPos)) {
                    this.combatManager.confirmPendingCharge(chargeDetails);
                } else {
                    this.combatManager.cancelPendingCharge();
                }
            } else {
                // No valid charge - cancel pending state
                this.combatManager.cancelPendingCharge();
            }
            return true;
        }

        const playerPos = this.game.player.getPositionObject();

        // Delegate to specialized managers based on tile type and context
        for (const handler of this.interactionHandlers) {
            if (handler(gridCoords, playerPos.toObject())) return true;
        }

        // Fallback: if the player tapped their own tile and it's an exit/port,
        // ensure we trigger the transition. This guards against cases where
        // upstream handlers or input rounding prevented the immediate handling
        // in the controller (touch/mouse edge-cases). Keep best-effort try/catch
        // to avoid throwing during interaction processing.
        try {
            if (playerPos.equals(clickedPos)) {
                const tileUnderPlayer = playerPos.getTile(this.game.grid);
                const tileType = (typeof tileUnderPlayer === 'object' && (tileUnderPlayer as any)?.type !== undefined) ? (tileUnderPlayer as any).type : tileUnderPlayer;
                if (tileType === TILE_TYPES.PORT) {
                    console.log('[InteractionManager] PORT tile detected, calling handlePortTransition');
                    try { this.zoneManager.handlePortTransition(); } catch (e) { console.error('[InteractionManager] PORT transition error:', e); }
                    return true;
                }
                if (tileType === TILE_TYPES.EXIT) {
                    console.log('[InteractionManager] EXIT tile detected, calling handleExitTap');
                    try { this.zoneManager.handleExitTap(playerPos.x, playerPos.y); } catch (e) { console.error('[InteractionManager] EXIT transition error:', e); }
                    return true;
                }
            }
        } catch (e) { console.error('[InteractionManager] Error checking port/exit:', e); }

    // If the tapped tile contains a live enemy, handle it here.
        // - If the player is adjacent, perform an immediate attack.
        // - Otherwise, mark the tap handled to prevent auto-pathing onto the enemy.
        const enemyCollection = this.game.enemyCollection;
        const enemyAtCoords = enemyCollection.findAt(gridCoords.x, gridCoords.y, true); // aliveOnly=true
        if (enemyAtCoords) {
            const dx = Math.abs(gridCoords.x - playerPos.x);
                const dy = Math.abs(gridCoords.y - playerPos.y);
                // Only allow cardinal (non-diagonal) immediate melee attacks when
                // no item/charge is involved. This enforces 4-way adjacency
                // (Manhattan distance == 1) instead of 8-way adjacency.
                const isAdjacent = (dx + dy === 1);

                if (isAdjacent) {
                // Perform immediate player attack on the adjacent enemy
                    try {
                        // Start attack animation
                        this.game.player.startAttackAnimation();

                        // Let enemy show its bump away from player
                        if (typeof enemyAtCoords.startBump === 'function') {
                            enemyAtCoords.startBump(playerPos.x - enemyAtCoords.x, playerPos.y - enemyAtCoords.y);
                        }

                        // If player has the axe, play the file-backed 'slash' SFX
                        // and mark the enemy to suppress the generic 'attack' sound
                        // in CombatManager (prevents double-playing). Use facade for ability check.
                        if (this.game.playerFacade.hasAbility('axe')) {
                            audioManager.playSound('slash', { game: this.game });
                            enemyAtCoords._suppressAttackSound = true;
                        }

                        // Mark that player performed an attack (may be the start of a combo)
                        try { this.game.player.setAction('attack'); } catch (e) {}

                        // Resolve defeat/points/removal via CombatManager. Pass initiator to
                        // allow consecutive-kill tracking. CombatManager returns info including
                        // consecutiveKills which we use to choose the animation.
                        const result = this.game.combatManager.defeatEnemy(enemyAtCoords, 'player');

                        // CombatManager will record the action result for combo logic

                        if (result && result.defeated) {
                            // If this was a consecutive kill (2 or more), perform a backflip
                            if (result.consecutiveKills >= 2) {
                                this.game.player.startBackflip();
                            } else {
                                // Otherwise perform the normal bump towards enemy
                                this.game.player.startBump(enemyAtCoords.x - playerPos.x, enemyAtCoords.y - playerPos.y);
                            }
                        }
                    } catch (e) {
                        // Best-effort: don't let an animation error block game flow
                    }

                // Trigger enemy turns (unless we just entered a zone)
                if (this.game.justEnteredZone) {
                    this.game.justEnteredZone = false;
                } else {
                    try { this.game.startEnemyTurns(); } catch (e) {}
                    if (this.game.isInPitfallZone) {
                        this.game.pitfallTurnsSurvived++;
                    }
                }

                // Update player visuals/stats after the attack
                try { this.game.updatePlayerPosition(); } catch (e) {}
                try { eventBus.emit(EventTypes.UI_UPDATE_STATS, {}); } catch (e) {}

                return true;
            }

            // Not adjacent: consume the tap to prevent auto-pathing onto an enemy tile.
            // Tapping on an enemy should never trigger auto-pathing, regardless of the
            // 'Auto Path With Enemies' setting. That setting only controls whether
            // auto-pathing is allowed when enemies exist on the map, not whether you
            // can path directly to enemy tiles.
            return true;
        }

        return false; // No interaction, allow pathfinding
    }

    triggerInteractAt(gridCoords: GridCoords): void {
        // Check adjacency and delegate to appropriate managers
        this.npcManager.forceInteractAt(gridCoords);
        this.environmentManager.forceInteractAt(gridCoords);
        this.terrainManager.forceChoppableAction(gridCoords, this.game.player.getPosition());

        // Handle bomb force trigger
        this.bombManager.forceBombTrigger(gridCoords);
    }
}
