/**
 * Game Context Commands - Command methods for state changes
 * Extracted from GameContext to reduce file size and improve organization
 */

import type { Enemy } from '@entities/Enemy';
import type { InventoryItem } from '@managers/inventory/ItemMetadata';
import type { Treasure } from '@managers/ZoneManager';
import type { Item } from './GameContextInterfaces';

/**
 * Command methods mixin for GameContext
 * These methods delegate to the appropriate managers
 */
export class GameContextCommands {
    // Manager properties (must be set by GameContext)
    turnManager: any;
    renderManager: any;
    combatManager: any;
    interactionManager: any;
    gameStateManager: any;
    actionManager: any;
    uiManager: any;
    gameInitializer: any;
    zoneManager: any;
    shovelMode!: boolean;
    activeShovel!: Item | null;
    player: any;
    grid: any;
    ui: any;
    radialInventoryUI: any;

    handleTurnCompletion(): void {
        this.turnManager!.handleTurnCompletion();
    }

    startEnemyTurns(): void {
        this.turnManager!.startEnemyTurns();
    }

    processTurnQueue(): void {
        this.turnManager!.processTurnQueue();
    }

    render(): void {
        this.renderManager!.render();
    }

    handleEnemyMovements(): void {
        this.combatManager!.handleEnemyMovements();
    }

    checkCollisions(): boolean {
        return this.combatManager!.checkCollisions();
    }

    checkPenneInteraction(): void {
        this.interactionManager!.checkPenneInteraction();
    }

    checkSquigInteraction(): void {
        this.interactionManager!.checkSquigInteraction();
    }

    checkItemPickup(): void {
        this.interactionManager!.checkItemPickup();
    }

    useMapNote(): void {
        this.interactionManager!.useMapNote();
    }

    interactWithNPC(foodType: string): void {
        (this.interactionManager as any).interactWithNPC(foodType);
    }

    addTreasureToInventory(): void {
        this.gameStateManager!.addTreasureToInventory();
    }

    addBomb(): void {
        this.actionManager!.addBomb();
    }

    hideOverlayMessage(): void {
        this.uiManager!.hideOverlayMessage();
    }

    showSignMessage(text: string, imageSrc: string | null = null, name: string | null = null, buttonText: string | null = null, category = 'unknown', portraitBackground?: string): void {
        this.uiManager!.showSignMessage(text, imageSrc, name, buttonText, category, portraitBackground);
    }

    updatePlayerPosition(): void {
        this.uiManager!.updatePlayerPosition();
        try {
            const moved = this.ui.hasPlayerMoved(this.player);
            if (moved) {
                if (this.radialInventoryUI && this.radialInventoryUI.open) {
                    this.radialInventoryUI.close();
                }
            }
            this.ui.updateLastPlayerPosition(this.player);
        } catch (e) {}
    }

    updatePlayerStats(): void {
        (window as any).eventBus.emit((window as any).EventTypes.UI_UPDATE_STATS, {});
    }

    incrementBombActions(): void {
        this.actionManager!.incrementBombActions();
    }

    performBishopSpearCharge(item: InventoryItem, targetX: number, targetY: number, enemy: Enemy, dx: number, dy: number): void {
        this.actionManager!.performBishopSpearCharge(item, targetX, targetY, enemy, dx, dy);
    }

    performHorseIconCharge(item: InventoryItem, targetX: number, targetY: number, enemy: Enemy, dx: number, dy: number): void {
        this.actionManager!.performHorseIconCharge(item, targetX, targetY, enemy, dx, dy);
    }

    performBowShot(item: InventoryItem, targetX: number, targetY: number): void {
        this.actionManager!.performBowShot(item, targetX, targetY);
    }

    explodeBomb(bx: number, by: number): void {
        this.actionManager!.explodeBomb(bx, by);
    }

    transitionToZone(newZoneX: number, newZoneY: number, exitSide: string, exitX: number, exitY: number): void {
        this.gameInitializer!.transitionToZone(newZoneX, newZoneY, exitSide, exitX, exitY);
    }

    generateZone(): void {
        this.zoneManager!.generateZone();
    }

    spawnTreasuresOnGrid(treasures: Treasure[]): void {
        this.zoneManager!.spawnTreasuresOnGrid(treasures);
    }

    resetGame(): void {
        this.gameInitializer!.resetGame();
    }

    /**
     * Exit shovel mode - command pattern for state mutation
     */
    exitShovelMode(): void {
        this.shovelMode = false;
        this.activeShovel = null;
        this.hideOverlayMessage();
    }

    /**
     * Check if player is on an exit tile
     */
    isPlayerOnExitTile(): boolean {
        if (!this.player || !this.grid) return false;
        const pos = this.player.getPosition();
        const tile = this.grid[pos.y] && this.grid[pos.y][pos.x];
        const tileType = (tile && typeof tile === 'object' && 'type' in tile) ? tile.type : tile;
        return tileType === 3; // TILE_TYPES.EXIT = 3
    }
}
