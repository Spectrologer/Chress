/**
 * Game Context - Barrel file for all context exports
 */

export * from './GameContextInterfaces';
export * from './GameContextGetters';
export * from './GameContextCommands';
export { GameContext } from './GameContextCore';
export { ManagerRegistry } from './ManagerRegistry';
export type { ManagerTypes } from './ManagerRegistry';
export { TurnState } from './TurnState';
export {
    CombatFacade,
    InventoryFacade,
    InteractionFacade,
    TurnsFacade,
    RenderFacade,
    ZoneFacade,
    ActionsFacade
} from './GameFacades';
