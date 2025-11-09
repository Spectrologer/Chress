import type { NPCManager } from '@managers/NPCManager';
import type { EnvironmentalInteractionManager } from '@managers/EnvironmentalInteractionManager';
import type { InputUIHandler } from '@ui/InputUIHandler';
import type { Coordinates } from '@core/PositionTypes';

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
    public npcManager: NPCManager;
    public environmentManager: EnvironmentalInteractionManager;
    public inputManager: InputUIHandler;

    /**
     * @param npcManager - Handles NPC interactions
     * @param environmentManager - Manages environmental interactions (signs, statues)
     * @param inputManager - Handles user input
     */
    constructor(
        npcManager: NPCManager,
        environmentManager: EnvironmentalInteractionManager,
        inputManager: InputUIHandler
    ) {
        this.npcManager = npcManager;
        this.environmentManager = environmentManager;
        this.inputManager = inputManager;
    }

    // NPC interaction methods
    interactWithPenne(coords: Coordinates): boolean {
        return this.npcManager.interactWithPenne(coords);
    }

    interactWithSquig(coords: Coordinates): boolean {
        return this.npcManager.interactWithSquig(coords);
    }

    interactWithRune(coords: Coordinates): boolean {
        return this.npcManager.interactWithRune(coords);
    }

    interactWithNib(coords: Coordinates): boolean {
        return this.npcManager.interactWithNib(coords);
    }

    interactWithMark(coords: Coordinates): boolean {
        return this.npcManager.interactWithMark(coords);
    }

    interactWithCrayn(coords: Coordinates): boolean {
        return this.npcManager.interactWithCrayn(coords);
    }

    interactWithFelt(coords: Coordinates): boolean {
        return this.npcManager.interactWithFelt(coords);
    }

    interactWithAxelotl(coords: Coordinates): boolean {
        return this.npcManager.interactWithAxelotl(coords);
    }

    interactWithGouge(coords: Coordinates): boolean {
        return this.npcManager.interactWithGouge(coords);
    }

    interactWithForge(coords: Coordinates): boolean {
        return this.npcManager.interactWithForge(coords);
    }

    // Environmental interaction methods
    handleSignTap(coords: Coordinates): boolean {
        return this.environmentManager.handleSignTap(coords);
    }

    handleStatueTap(coords: Coordinates): boolean {
        return this.environmentManager.handleStatueTap(coords);
    }

    // Input handling methods
    handleKeyPress(event: KeyboardEvent): boolean {
        return this.inputManager.handleKeyPress(event);
    }
}
