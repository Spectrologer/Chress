/**
 * GameContext - Backward compatibility layer
 *
 * This file has been split into smaller, more focused modules in ./context/
 * All exports are re-exported here for backward compatibility.
 *
 * New code should import from '@core/context' or specific domain files:
 * - '@core/context/GameContextInterfaces'
 * - '@core/context/GameContextGetters'
 * - '@core/context/GameContextCommands'
 * - '@core/context/GameContextCore'
 */

export * from './context/index';
