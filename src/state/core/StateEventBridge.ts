// @ts-check
/**
 * StateEventBridge - Bridges state changes to EventBus
 *
 * Maintains backward compatibility by emitting EventBus events
 * when specific state paths change.
 */

import { eventBus } from '@core/EventBus';
import { EventTypes } from '@core/EventTypes';

export class StateEventBridge {
  /**
   * Emit EventBus events for backward compatibility
   * @param {string} path - The changed path
   * @param {any} value - The new value
   * @returns {void}
   */
  emitStateChangeEvent(path: string, value: unknown): void {
    // Map state paths to existing EventTypes
    if (path.startsWith('persistent.player.stats')) {
      eventBus.emit(EventTypes.PLAYER_STATS_CHANGED);
    } else if (path === 'transient.itemAbilities.pendingCharge') {
      eventBus.emit(EventTypes.CHARGE_STATE_CHANGED, value);
    } else if (path === 'transient.itemAbilities.bombPlacementMode') {
      eventBus.emit(EventTypes.BOMB_PLACEMENT_MODE_CHANGED, value);
    } else if (path === 'transient.interactions.signMessage') {
      if (value) {
        eventBus.emit(EventTypes.SIGN_MESSAGE_DISPLAYED, value);
      } else {
        eventBus.emit(EventTypes.SIGN_MESSAGE_CLEARED);
      }
    } else if (path === 'transient.combat.playerJustAttacked') {
      if (value) {
        eventBus.emit(EventTypes.PLAYER_ATTACKED);
      }
    }
  }

  /**
   * Emit events for multiple path changes
   * @param {Object} updates - Object with path -> value mappings
   * @returns {void}
   */
  emitBatchEvents(updates: Record<string, unknown>): void {
    for (const [path, value] of Object.entries(updates)) {
      this.emitStateChangeEvent(path, value);
    }
  }

  /**
   * Emit reset events
   * @param {string} sliceType - Type of reset ('transient', 'session', 'all')
   * @returns {void}
   */
  emitResetEvent(sliceType: string): void {
    if (sliceType === 'transient') {
      eventBus.emit(EventTypes.TRANSIENT_STATE_RESET);
    } else if (sliceType === 'session' || sliceType === 'all') {
      eventBus.emit(EventTypes.GAME_RESET);
    }
  }
}
