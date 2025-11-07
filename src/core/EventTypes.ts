/**
 * EventTypes - Backward compatibility layer
 *
 * This file has been split into domain-specific modules in ./events/
 * All exports are re-exported here for backward compatibility.
 *
 * New code should import from '@core/events' or specific domain files:
 * - '@core/events/CombatEvents'
 * - '@core/events/GameStateEvents'
 * - '@core/events/ZoneEvents'
 * - '@core/events/PlayerEvents'
 * - '@core/events/UIEvents'
 * - '@core/events/InventoryEvents'
 * - '@core/events/InputEvents'
 * - '@core/events/AnimationEvents'
 * - '@core/events/AudioEvents'
 */

export * from './events/index';
