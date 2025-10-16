
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
        if (this.bombManager.handleBombPlacement(gridCoords)) return true;
        if (this.npcManager.interactWithPenne(gridCoords)) return true;
        if (this.npcManager.interactWithSquig(gridCoords)) return true;
        if (this.npcManager.interactWithRune(gridCoords)) return true;
        if (this.npcManager.interactWithNib(gridCoords)) return true;
        if (this.npcManager.interactWithMark(gridCoords)) return true;
        if (this.npcManager.interactWithCrayn(gridCoords)) return true;
        if (this.npcManager.interactWithFelt(gridCoords)) return true;
        if (this.npcManager.interactWithAxelotl(gridCoords)) return true;
        if (this.npcManager.interactWithForge(gridCoords)) return true;
        if (this.environmentManager.handleSignTap(gridCoords)) return true;
        if (this.environmentManager.handleStatueTap(gridCoords)) return true;

        // Bomb explosion handling
        if (this.bombManager.triggerBombExplosion(gridCoords, playerPos)) return true;

        // Combat action validation
        const bishopSpearCharge = this.combatManager.isValidBishopSpearCharge(gridCoords, playerPos);
        if (bishopSpearCharge) {
            this.game.pendingCharge = bishopSpearCharge;
            this.game.uiManager.showOverlayMessage('Tap again to confirm Bishop Charge', null, true, true);
            return true;
        }

        const horseIconCharge = this.combatManager.isValidHorseIconCharge(gridCoords, playerPos);
        if (horseIconCharge) {
            this.game.pendingCharge = horseIconCharge;
            this.game.uiManager.showOverlayMessage('Tap again to confirm Knight Charge', null, true, true);
            return true;
        }

        const bowShot = this.combatManager.isValidBowShot(gridCoords, playerPos);
        if (bowShot) {
            this.game.pendingCharge = bowShot;
            this.game.uiManager.showOverlayMessage('Tap again to confirm Bow Shot', null, true, true);
            return true;
        }

        // Terrain interactions
        if (this.terrainManager.handleChoppableTile(gridCoords, playerPos)) return true;

        // Zone transition gestures
        if (this.zoneManager.checkForZoneTransitionGesture(gridCoords, playerPos)) return true;

        // Zone transitions when standing on special tiles
        if (this.zoneManager.isTransitionEligible(gridCoords, playerPos)) return true;

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
