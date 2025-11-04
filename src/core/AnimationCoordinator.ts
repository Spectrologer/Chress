import { eventBus } from './EventBus';
import { EventTypes } from './EventTypes';

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
  private player: any;
  private listeners: Map<string, Function>;

  constructor(player: any) {
    this.player = player;
    this.listeners = new Map();
    this.setupListeners();
  }

  setupListeners() {
    // Bump animation - Used for knockback effects and collisions
    const bumpListener = (data: any) => {
      if (this.player.startBump) {
        this.player.startBump(data.dx, data.dy);
      }
    };
    this.listeners.set(EventTypes.ANIMATION_BUMP, bumpListener);
    eventBus.on(EventTypes.ANIMATION_BUMP, bumpListener);

    // Backflip animation - Used for successful enemy defeats
    const backflipListener = () => {
      if (this.player.startBackflip) {
        this.player.startBackflip();
      }
    };
    this.listeners.set(EventTypes.ANIMATION_BACKFLIP, backflipListener);
    eventBus.on(EventTypes.ANIMATION_BACKFLIP, backflipListener);

    // Smoke animation - Used for special abilities or teleportation
    const smokeListener = (data: any) => {
      if (this.player.startSmokeAnimation) {
        this.player.startSmokeAnimation(data.x, data.y);
      }
    };
    this.listeners.set(EventTypes.ANIMATION_SMOKE, smokeListener);
    eventBus.on(EventTypes.ANIMATION_SMOKE, smokeListener);

    // Attack animation - Used for player attacks
    const attackListener = () => {
      if (this.player.startAttackAnimation) {
        this.player.startAttackAnimation();
      }
    };
    this.listeners.set(EventTypes.ANIMATION_ATTACK, attackListener);
    eventBus.on(EventTypes.ANIMATION_ATTACK, attackListener);

    // Knockback - Updates player position (used with bump animation)
    const knockbackListener = (data: any) => {
      if (this.player.setPosition) {
        // Use emitEvent=false because we're responding to an event already
        this.player.setPosition(data.x, data.y, false);
      }
    };
    this.listeners.set(EventTypes.PLAYER_KNOCKBACK, knockbackListener);
    eventBus.on(EventTypes.PLAYER_KNOCKBACK, knockbackListener);
  }

  /**
   * Cleanup event listeners when coordinator is destroyed
   */
  destroy() {
    for (const [eventType, listener] of this.listeners.entries()) {
      eventBus.off(eventType, listener as any);
    }
    this.listeners.clear();
  }
}
