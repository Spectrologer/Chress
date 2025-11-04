/**
 * InteractionFacade - Groups interaction-related dependencies
 *
 * Consolidates managers responsible for NPC interactions, environmental
 * interactions, and input handling into a single cohesive interface.
 *
 * This facade reduces constructor parameter count in InteractionManager
 * from 9 to 4 parameters.
 */
export class InteractionFacade {
    public npcManager: any;
    public environmentManager: any;
    public inputManager: any;

    /**
     * @param {Object} npcManager - Handles NPC interactions
     * @param {Object} environmentManager - Manages environmental interactions (signs, statues)
     * @param {Object} inputManager - Handles user input
     */
    constructor(npcManager, environmentManager, inputManager) {
        this.npcManager = npcManager;
        this.environmentManager = environmentManager;
        this.inputManager = inputManager;
    }

    // NPC interaction methods
    interactWithPenne(coords) {
        return this.npcManager.interactWithPenne(coords);
    }

    interactWithSquig(coords) {
        return this.npcManager.interactWithSquig(coords);
    }

    interactWithRune(coords) {
        return this.npcManager.interactWithRune(coords);
    }

    interactWithNib(coords) {
        return this.npcManager.interactWithNib(coords);
    }

    interactWithMark(coords) {
        return this.npcManager.interactWithMark(coords);
    }

    interactWithCrayn(coords) {
        return this.npcManager.interactWithCrayn(coords);
    }

    interactWithFelt(coords) {
        return this.npcManager.interactWithFelt(coords);
    }

    interactWithAxelotl(coords) {
        return this.npcManager.interactWithAxelotl(coords);
    }

    interactWithGouge(coords) {
        return this.npcManager.interactWithGouge(coords);
    }

    interactWithForge(coords) {
        return this.npcManager.interactWithForge(coords);
    }

    // Environmental interaction methods
    handleSignTap(coords) {
        return this.environmentManager.handleSignTap(coords);
    }

    handleStatueTap(coords) {
        return this.environmentManager.handleStatueTap(coords);
    }

    // Input handling methods
    handleKeyPress(event) {
        return this.inputManager.handleKeyPress(event);
    }
}
