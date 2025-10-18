
import { NPCInteractionManager } from './NPCInteractionManager.js';
import { ItemPickupManager } from './ItemPickupManager.js';
import { CombatActionManager } from './CombatActionManager.js';
import { BombInteractionManager } from './BombInteractionManager.js';
import { TerrainInteractionManager } from './TerrainInteractionManager.js';
import { ZoneTransitionManager } from './ZoneTransitionManager.js';
import { EnvironmentalInteractionManager } from './EnvironmentalInteractionManager.js';

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
                if (bishopSpearCharge) {
                    this.game.pendingCharge = bishopSpearCharge;
                    this.game.uiManager.showOverlayMessage('Tap again to confirm Bishop Charge', null, true, true);
                    return true;
                }
                return false;
            },
            (gridCoords, playerPos) => {
                const horseIconCharge = this.combatManager.isValidHorseIconCharge(gridCoords, playerPos);
                if (horseIconCharge) {
                    this.game.pendingCharge = horseIconCharge;
                    this.game.uiManager.showOverlayMessage('Tap again to confirm Knight Charge', null, true, true);
                    return true;
                }
                return false;
            },
            (gridCoords, playerPos) => {
                const bowShot = this.combatManager.isValidBowShot(gridCoords, playerPos);
                if (bowShot) {
                    this.game.pendingCharge = bowShot;
                    this.game.uiManager.showOverlayMessage('Tap again to confirm Bow Shot', null, true, true);
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
            const chargeDetails = this.game.pendingCharge;

            if (gridCoords.x === chargeDetails.target.x && gridCoords.y === chargeDetails.target.y) {
                this.combatManager.confirmPendingCharge(chargeDetails);
            } else {
                this.combatManager.cancelPendingCharge();
            }
            return true;
        }

        const playerPos = this.game.player.getPosition();

        // Delegate to specialized managers based on tile type and context
        for (const handler of this.interactionHandlers) {
            if (handler(gridCoords, playerPos)) return true;
        }

        // If the tapped tile contains a live enemy, handle it here.
        // - If the player is adjacent, perform an immediate attack.
        // - Otherwise, mark the tap handled to prevent auto-pathing onto the enemy.
        const enemyAtCoords = this.game.enemies.find(e => e.x === gridCoords.x && e.y === gridCoords.y && e.health > 0);
        if (enemyAtCoords) {
            const dx = Math.abs(gridCoords.x - playerPos.x);
            const dy = Math.abs(gridCoords.y - playerPos.y);
            const isAdjacent = (dx <= 1 && dy <= 1) && !(dx === 0 && dy === 0);

            if (isAdjacent) {
                // Perform immediate player attack on the adjacent enemy
                try {
                    this.game.player.startAttackAnimation();
                    this.game.player.startBump(enemyAtCoords.x - playerPos.x, enemyAtCoords.y - playerPos.y);
                    if (typeof enemyAtCoords.startBump === 'function') {
                        enemyAtCoords.startBump(playerPos.x - enemyAtCoords.x, playerPos.y - enemyAtCoords.y);
                    }
                    // Resolve defeat/points/removal via CombatManager
                    this.game.combatManager.defeatEnemy(enemyAtCoords);
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
            return true;
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
