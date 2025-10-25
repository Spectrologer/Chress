
import { NPCInteractionManager } from './NPCInteractionManager.js';
import { ItemPickupManager } from './ItemPickupManager.js';
import { CombatActionManager } from './CombatActionManager.js';
import { BombInteractionManager } from './BombInteractionManager.js';
import { TerrainInteractionManager } from './TerrainInteractionManager.js';
import { ZoneTransitionManager } from './ZoneTransitionManager.js';
import { EnvironmentalInteractionManager } from './EnvironmentalInteractionManager.js';
import { TILE_TYPES } from '../core/constants.js';
import audioService from '../utils/AudioService.js';

export class InteractionManager {
    constructor(game, inputManager) {
        this.game = game;
        this.inputManager = inputManager;

        // Initialize specialized managers
        this.npcManager = new NPCInteractionManager(game);
        this.itemPickupManager = new ItemPickupManager(game);
        this.combatManager = new CombatActionManager(game);
        this.bombManager = new BombInteractionManager(game);
        this.terrainManager = new TerrainInteractionManager(game);
        this.zoneManager = new ZoneTransitionManager(game, inputManager);
        this.environmentManager = new EnvironmentalInteractionManager(game);

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
            (gridCoords, playerPos) => this.environmentManager.handleSignTap(gridCoords),
            (gridCoords, playerPos) => this.environmentManager.handleStatueTap(gridCoords),
            (gridCoords, playerPos) => this.bombManager.triggerBombExplosion(gridCoords, playerPos),
            (gridCoords, playerPos) => {
                const bishopSpearCharge = this.combatManager.isValidBishopSpearCharge(gridCoords, playerPos);
                // Only auto-start a bishop charge if the item is present in the main inventory
                if (bishopSpearCharge && this.game.player.inventory.indexOf(bishopSpearCharge.item) >= 0) {
                    this.game.pendingCharge = bishopSpearCharge;
                    // Confirmation prompt - no typewriter
                    this.game.uiManager.showOverlayMessage('Tap again to confirm Bishop Charge', null, true, true, false);
                    return true;
                }
                return false;
            },
            (gridCoords, playerPos) => {
                const horseIconCharge = this.combatManager.isValidHorseIconCharge(gridCoords, playerPos);
                // Only auto-start a knight charge if the item is present in the main inventory
                if (horseIconCharge && this.game.player.inventory.indexOf(horseIconCharge.item) >= 0) {
                    this.game.pendingCharge = horseIconCharge;
                    // Confirmation prompt - no typewriter
                    this.game.uiManager.showOverlayMessage('Tap again to confirm Knight Charge', null, true, true, false);
                    return true;
                }
                return false;
            },
            (gridCoords, playerPos) => {
                const bowShot = this.combatManager.isValidBowShot(gridCoords, playerPos);
                // Only auto-start a bow shot if the bow is in the main inventory
                if (bowShot && this.game.player.inventory.indexOf(bowShot.item) >= 0) {
                    this.game.pendingCharge = bowShot;
                    // Confirmation prompt - no typewriter
                    this.game.uiManager.showOverlayMessage('Tap again to confirm Bow Shot', null, true, true, false);
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
    checkLionInteraction() {
        // Example: delegate to NPC manager or handle directly
        // (Assuming lion is a type of NPC or tile)
        // You may want to refactor this to a more generic handler if needed
        return this.npcManager.interactWithPenne({ x: this.game.player.getPosition().x + 1, y: this.game.player.getPosition().y });
    }

    checkSquigInteraction() {
        return this.npcManager.interactWithSquig({ x: this.game.player.getPosition().x + 1, y: this.game.player.getPosition().y });
    }



    checkItemPickup() {
        return this.itemPickupManager.checkItemPickup();
    }

    useMapNote() {
        return this.game.inventoryManager.useMapNote();
    }

    handleTap(gridCoords) {
        // Handle pending charge confirmation or cancellation
        if (this.game.pendingCharge) {
            const pending = this.game.pendingCharge;
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
                if (gridCoords.x === chargeDetails.target.x && gridCoords.y === chargeDetails.target.y) {
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

        const playerPos = this.game.player.getPosition();

        // Delegate to specialized managers based on tile type and context
        for (const handler of this.interactionHandlers) {
            if (handler(gridCoords, playerPos)) return true;
        }

        // Fallback: if the player tapped their own tile and it's an exit/port,
        // ensure we trigger the transition. This guards against cases where
        // upstream handlers or input rounding prevented the immediate handling
        // in the controller (touch/mouse edge-cases). Keep best-effort try/catch
        // to avoid throwing during interaction processing.
        try {
            if (gridCoords.x === playerPos.x && gridCoords.y === playerPos.y) {
                const tileUnderPlayer = this.game.grid[playerPos.y]?.[playerPos.x];
                const tileType = (typeof tileUnderPlayer === 'object' && tileUnderPlayer?.type !== undefined) ? tileUnderPlayer.type : tileUnderPlayer;
                if (tileType === TILE_TYPES.PORT) {
                    try { this.zoneManager.handlePortTransition(); } catch (e) {}
                    return true;
                }
                if (tileType === TILE_TYPES.EXIT) {
                    try { this.zoneManager.handleExitTap(playerPos.x, playerPos.y); } catch (e) {}
                    return true;
                }
            }
        } catch (e) {}

    // If the tapped tile contains a live enemy, handle it here.
        // - If the player is adjacent, perform an immediate attack.
        // - Otherwise, mark the tap handled to prevent auto-pathing onto the enemy.
        const enemyAtCoords = this.game.enemies.find(e => e.x === gridCoords.x && e.y === gridCoords.y && e.health > 0);
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
                        // in CombatManager (prevents double-playing).
                        if (this.game.player.abilities && this.game.player.abilities.has && this.game.player.abilities.has('axe')) {
                            audioService.playSound('slash', { game: this.game });
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
                try { this.game.updatePlayerStats(); } catch (e) {}

                return true;
            }

            // Not adjacent: consume the tap to prevent auto-pathing onto an enemy tile
            // unless the player has enabled the 'Auto Path With Enemies' setting.
            const allowAutoPath = !!(this.game.player.stats && this.game.player.stats.autoPathWithEnemies);
            if (!isAdjacent && !allowAutoPath) return true;
            if (!isAdjacent && allowAutoPath) {
                // Let the input/controller logic proceed so it can attempt pathfinding
                // (which will only succeed if a path exists and the controller allows
                // targeting enemy tiles when the setting is enabled).
                // Fall through to return false (meaning: not handled here).
            } else {
                return true; // adjacent handled above
            }
        }

        return false; // No interaction, allow pathfinding
    }

    triggerInteractAt(gridCoords) {
        // Check adjacency and delegate to appropriate managers
        this.npcManager.forceInteractAt(gridCoords);
        this.environmentManager.forceInteractAt(gridCoords);
        this.terrainManager.forceChoppableAction(gridCoords, this.game.player.getPosition());

        // Handle bomb force trigger
        this.bombManager.forceBombTrigger(gridCoords);
    }


}
