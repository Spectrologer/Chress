import { eventBus } from './EventBus.js';
import { EventTypes } from './EventTypes.js';

/**
 * AnimationCoordinator - Centralizes player animation management
 *
 * This class listens to animation events and delegates to the player's animation methods.
 * This provides a clean separation between game logic (which emits events) and the
 * player object (which handles the actual animation implementation).
 *
 * Benefits:
 * - Decouples animation requests from player implementation
 * - Makes animation triggering consistent across the codebase
 * - Provides a single point for animation debugging and logging
 * - Allows for future animation queuing/prioritization if needed
 */
export class AnimationCoordinator {
  constructor(player) {
    this.player = player;
    this.setupListeners();
  }

  setupListeners() {
    // Bump animation - Used for knockback effects and collisions
    eventBus.on(EventTypes.ANIMATION_BUMP, (data) => {
      if (this.player.startBump) {
        this.player.startBump(data.dx, data.dy);
      }
    });

    // Backflip animation - Used for successful enemy defeats
    eventBus.on(EventTypes.ANIMATION_BACKFLIP, () => {
      if (this.player.startBackflip) {
        this.player.startBackflip();
      }
    });

    // Smoke animation - Used for special abilities or teleportation
    eventBus.on(EventTypes.ANIMATION_SMOKE, (data) => {
      if (this.player.startSmokeAnimation) {
        this.player.startSmokeAnimation(data.x, data.y);
      }
    });

    // Attack animation - Used for player attacks
    eventBus.on(EventTypes.ANIMATION_ATTACK, () => {
      if (this.player.startAttackAnimation) {
        this.player.startAttackAnimation();
      }
    });

    // Knockback - Updates player position (used with bump animation)
    eventBus.on(EventTypes.PLAYER_KNOCKBACK, (data) => {
      if (this.player.setPosition) {
        // Use emitEvent=false because we're responding to an event already
        this.player.setPosition(data.x, data.y, false);
      }
    });
  }

  /**
   * Cleanup event listeners when coordinator is destroyed
   */
  destroy() {
    eventBus.off(EventTypes.ANIMATION_BUMP);
    eventBus.off(EventTypes.ANIMATION_BACKFLIP);
    eventBus.off(EventTypes.ANIMATION_SMOKE);
    eventBus.off(EventTypes.ANIMATION_ATTACK);
    eventBus.off(EventTypes.PLAYER_KNOCKBACK);
  }
}
