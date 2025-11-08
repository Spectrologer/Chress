import { TILE_TYPES } from '@core/constants/index';
import audioManager from '@utils/AudioManager';
import { eventBus } from '@core/EventBus';
import { EventTypes } from '@core/EventTypes';
import { Position } from '@core/Position';
import { CubeEffect } from '@managers/inventory/effects/SpecialEffects';
import type { IGame, ICoordinates } from '@core/context';
import type { TileObject } from '@core/SharedTypes';
import type { InputManager } from './InputManager';
import type { NPCManager } from './NPCManager';
import type { EnvironmentalInteractionManager } from './EnvironmentalInteractionManager';
import type { CombatActionManager } from './CombatActionManager';
import type { BombManager } from './BombManager';
import type { TerrainInteractionManager } from './TerrainInteractionManager';
import type { ZoneManager } from './ZoneManager';
import type { ItemPickupManager } from './inventory/ItemPickupManager';
import type { Player } from '@entities/Player';
import type { TransientGameState } from '@state/TransientGameState';
import type { EnemyCollection } from '@facades/EnemyCollection';
import type { PlayerFacade } from '@facades/PlayerFacade';
import type { InventoryUI } from '@ui/InventoryUI';
import type { CombatManager } from './CombatManager';

// Extended game interface for legacy properties
interface IGameWithLegacyProps extends IGame {
    justEnteredZone?: boolean;
    isInPitfallZone?: boolean;
    pitfallTurnsSurvived?: number;
}

interface InteractionFacade {
    inputManager: InputManager;
    npcManager: NPCManager;
    environmentManager: EnvironmentalInteractionManager;
}

interface CombatFacade {
    combatActionManager: CombatActionManager;
    bombManager: BombManager;
}

interface WorldFacade {
    terrainManager: TerrainInteractionManager;
    zoneManager: ZoneManager;
    itemPickupManager: ItemPickupManager;
}

type InteractionHandler = (gridCoords: ICoordinates, playerPos: { x: number; y: number }) => boolean;

export class InteractionManager {
    private game: IGame;
    private interactionFacade: InteractionFacade;
    private combatFacade: CombatFacade;
    private worldFacade: WorldFacade;
    private inputManager: InputManager;
    private npcManager: NPCManager;
    private environmentManager: EnvironmentalInteractionManager;
    public combatManager: CombatActionManager;
    private bombManager: BombManager;
    private terrainManager: TerrainInteractionManager;
    public zoneManager: ZoneManager; // Public for external access from PathfindingController and PlayerMovement
    private itemPickupManager: ItemPickupManager;
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
    constructor(game: IGame, interactionFacade: InteractionFacade, combatFacade: CombatFacade, worldFacade: WorldFacade) {
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
        // Handlers are checked in order - first match wins
        this.interactionHandlers = [
            (gridCoords, playerPos) => this.bombManager.handleBombPlacement(gridCoords),
            // Single generic NPC handler - handles both hardcoded NPCs and dynamic NPCs from ContentRegistry
            // This replaces 10+ individual NPC handler calls (interactWithPenne, interactWithSquig, etc.)
            (gridCoords, playerPos) => this.handleNPCInteraction(gridCoords),
            (gridCoords, playerPos) => this.environmentManager.handleSignTap(Position.from(gridCoords)),
            (gridCoords, playerPos) => this.environmentManager.handleStatueTap(Position.from(gridCoords)),
            (gridCoords, playerPos) => this.environmentManager.handleCubeTap(Position.from(gridCoords)),
            (gridCoords, playerPos) => this.bombManager.triggerBombExplosion(Position.from(gridCoords), Position.from(playerPos)),
            (gridCoords, playerPos) => {
                const bishopSpearCharge = this.combatManager.isValidBishopSpearCharge(Position.from(gridCoords), Position.from(playerPos));
                // Only auto-start a bishop charge if the item is present in the main inventory (via facade)
                if (bishopSpearCharge && this.game.playerFacade.findInInventory((item) => item === bishopSpearCharge.item)) {
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
                const horseIconCharge = this.combatManager.isValidHorseIconCharge(Position.from(gridCoords), Position.from(playerPos));
                // Only auto-start a knight charge if the item is present in the main inventory (via facade)
                if (horseIconCharge && this.game.playerFacade.findInInventory((item) => item === horseIconCharge.item)) {
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
                const bowShot = this.combatManager.isValidBowShot(Position.from(gridCoords), Position.from(playerPos));
                // Only auto-start a bow shot if the bow is in the main inventory (via facade)
                if (bowShot && this.game.playerFacade.findInInventory((item) => item === bowShot.item)) {
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
            (gridCoords, playerPos) => this.terrainManager.handleChoppableTile(Position.from(gridCoords), Position.from(playerPos)),
            (gridCoords, playerPos) => this.zoneManager.checkForZoneTransitionGesture(gridCoords, playerPos),
            (gridCoords, playerPos) => this.zoneManager.isTransitionEligible(gridCoords, playerPos),
        ];
    }

    /**
     * Generic NPC interaction handler that consolidates all NPC interactions
     * Tries all known NPC types in order until one handles the interaction
     * This eliminates the need for individual handler registrations
     */
    private handleNPCInteraction(gridCoords: ICoordinates): boolean {
        // List of all hardcoded NPCs that need to be checked
        // Order matters - check specific NPCs first, then dynamic registry
        const hardcodedNPCs = [
            'penne', 'squig', 'rune', 'nib', 'mark',
            'crayn', 'felt', 'axelotl', 'gouge', 'forge'
        ];

        // Try each hardcoded NPC interaction
        for (const npcName of hardcodedNPCs) {
            // Use the NPCManager's generic method to check this NPC type
            const method = `interactWith${npcName.charAt(0).toUpperCase() + npcName.slice(1)}` as keyof NPCManager;
            if (typeof this.npcManager[method] === 'function') {
                const npcMethod = this.npcManager[method] as unknown as (coords: ICoordinates) => boolean;
                if (npcMethod.call(this.npcManager, gridCoords)) {
                    return true;
                }
            }
        }

        // Finally try dynamic NPCs from ContentRegistry
        return this.npcManager.interactWithDynamicNPC(gridCoords);
    }

    // Consolidated interaction delegation methods
    checkPenneInteraction(): boolean {
        // Example: delegate to NPC manager or handle directly
        // (Penne is a type of NPC or tile)
        // You may want to refactor this to a more generic handler if needed
        return this.npcManager.interactWithPenne({ x: this.game.player.getPosition().x + 1, y: this.game.player.getPosition().y });
    }

    checkSquigInteraction(): boolean {
        return this.npcManager.interactWithSquig({ x: this.game.player.getPosition().x + 1, y: this.game.player.getPosition().y });
    }

    checkItemPickup(): boolean {
        return this.itemPickupManager.checkItemPickup();
    }

    useMapNote(): boolean {
        // Call useMapNote on the game context
        if (typeof this.game.useMapNote === 'function') {
            this.game.useMapNote();
            return true;
        }
        return false;
    }

    handleTap(gridCoords: ICoordinates): boolean {
        const clickedPos = Position.from(gridCoords);
        const transientState = this.game.transientGameState;

        // Handle pending cube activation confirmation or cancellation
        if ((transientState as any).hasPendingCubeActivation?.()) {
            const pending = (transientState as any).getPendingCubeActivation?.();
            if (pending && pending.gridCoords) {
                const cubePos = Position.from(pending.gridCoords);
                if (clickedPos.equals(cubePos)) {
                    // Confirmed - execute the cube effect
                    const effect = new CubeEffect();
                    effect.apply(this.game as any, pending.cubeItem, {});
                    (transientState as any).clearPendingCubeActivation?.();
                    eventBus.emit(EventTypes.UI_HIDE_MESSAGE, {});
                } else {
                    // Cancelled - tapped somewhere else
                    (transientState as any).clearPendingCubeActivation?.();
                    eventBus.emit(EventTypes.UI_HIDE_MESSAGE, {});
                }
            }
            return true;
        }

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
                if (pending.selectionType === 'bishop_spear') chargeDetails = this.combatManager.isValidBishopSpearCharge(Position.from(gridCoords), Position.from(playerPos), true);
                else if (pending.selectionType === 'horse_icon') chargeDetails = this.combatManager.isValidHorseIconCharge(Position.from(gridCoords), Position.from(playerPos), true);
                else if (pending.selectionType === 'bow') chargeDetails = this.combatManager.isValidBowShot(Position.from(gridCoords), Position.from(playerPos), true);
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
                const tileType = (typeof tileUnderPlayer === 'object' && (tileUnderPlayer as TileObject)?.type !== undefined) ? (tileUnderPlayer as TileObject).type : tileUnderPlayer;
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
                const gameWithLegacy = this.game as IGameWithLegacyProps;
                if (gameWithLegacy.justEnteredZone) {
                    gameWithLegacy.justEnteredZone = false;
                } else {
                    try { this.game.startEnemyTurns?.(); } catch (e) {}
                    if (gameWithLegacy.isInPitfallZone) {
                        gameWithLegacy.pitfallTurnsSurvived = (gameWithLegacy.pitfallTurnsSurvived ?? 0) + 1;
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

    triggerInteractAt(gridCoords: ICoordinates): void {
        // Check adjacency and delegate to appropriate managers
        this.npcManager.forceInteractAt(Position.from(gridCoords));
        this.environmentManager.forceInteractAt(Position.from(gridCoords));
        this.terrainManager.forceChoppableAction(Position.from(gridCoords), Position.from(this.game.player.getPosition()));

        // Handle bomb force trigger
        this.bombManager.forceBombTrigger(gridCoords);
    }
}
