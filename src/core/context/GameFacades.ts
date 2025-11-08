/**
 * GameFacades - Domain-specific facades for common operations
 *
 * Provides clean, focused APIs for different game domains instead of
 * accessing managers directly. Reduces coupling and improves readability.
 */

import type { ManagerRegistry } from './ManagerRegistry';
import type { Enemy } from '@entities/Enemy';
import type { Item } from './GameContextInterfaces';

/**
 * Combat operations facade
 */
export class CombatFacade {
    constructor(private managers: ManagerRegistry) {}

    handleEnemyMovements(): void {
        this.managers.get('combatManager')?.handleEnemyMovements();
    }

    checkCollisions(): boolean {
        return this.managers.get('combatManager')?.checkCollisions() ?? false;
    }

    performBishopSpearCharge(item: Item, targetX: number, targetY: number, enemy: Enemy, dx: number, dy: number): void {
        this.managers.get('actionManager')?.performBishopSpearCharge(item, targetX, targetY, enemy, dx, dy);
    }

    performHorseIconCharge(item: Item, targetX: number, targetY: number, enemy: Enemy, dx: number, dy: number): void {
        this.managers.get('actionManager')?.performHorseIconCharge(item, targetX, targetY, enemy, dx, dy);
    }

    performBowShot(item: Item, targetX: number, targetY: number): void {
        this.managers.get('actionManager')?.performBowShot(item, targetX, targetY);
    }
}

/**
 * Inventory operations facade
 */
export class InventoryFacade {
    constructor(private managers: ManagerRegistry) {}

    addTreasure(): void {
        this.managers.get('gameStateManager')?.addTreasureToInventory();
    }

    addBomb(): void {
        this.managers.get('actionManager')?.addBomb();
    }

    getService() {
        return this.managers.get('inventoryService');
    }
}

/**
 * Interaction operations facade
 */
export class InteractionFacade {
    constructor(private managers: ManagerRegistry) {}

    checkPenneInteraction(): void {
        this.managers.get('interactionManager')?.checkPenneInteraction();
    }

    checkSquigInteraction(): void {
        this.managers.get('interactionManager')?.checkSquigInteraction();
    }

    checkItemPickup(): void {
        this.managers.get('interactionManager')?.checkItemPickup();
    }

    useMapNote(): void {
        this.managers.get('interactionManager')?.useMapNote();
    }

    interactWithNPC(foodType: string): void {
        (this.managers.get('interactionManager') as any)?.interactWithNPC(foodType);
    }
}

/**
 * Turn management facade
 */
export class TurnsFacade {
    constructor(private managers: ManagerRegistry) {}

    handleTurnCompletion(): void {
        this.managers.get('turnManager')?.handleTurnCompletion();
    }

    startEnemyTurns(): void {
        this.managers.get('turnManager')?.startEnemyTurns();
    }

    processTurnQueue(): void {
        this.managers.get('turnManager')?.processTurnQueue();
    }
}

/**
 * Rendering facade
 */
export class RenderFacade {
    constructor(private managers: ManagerRegistry) {}

    render(): void {
        this.managers.get('renderManager')?.render();
    }
}

/**
 * Zone operations facade
 */
export class ZoneFacade {
    constructor(private managers: ManagerRegistry) {}

    transitionToZone(newZoneX: number, newZoneY: number, exitSide: string, exitX: number, exitY: number): void {
        this.managers.get('gameInitializer')?.transitionToZone(newZoneX, newZoneY, exitSide, exitX, exitY);
    }

    generateZone(): void {
        this.managers.get('zoneManager')?.generateZone();
    }

    spawnTreasuresOnGrid(treasures: any[]): void {
        this.managers.get('zoneManager')?.spawnTreasuresOnGrid(treasures);
    }
}

/**
 * Actions facade (bombs, special items)
 */
export class ActionsFacade {
    constructor(private managers: ManagerRegistry) {}

    incrementBombActions(): void {
        this.managers.get('actionManager')?.incrementBombActions();
    }

    explodeBomb(bx: number, by: number): void {
        this.managers.get('actionManager')?.explodeBomb(bx, by);
    }
}
