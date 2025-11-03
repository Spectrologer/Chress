import { TILE_TYPES } from '../core/constants/index';
import { safeCall } from '../utils/SafeServiceCall';
import { checkOrthogonalLineOfSight } from '../utils/LineOfSightUtils';
import type { Game } from '../core/Game';
import type { Position } from '../core/Position';
import type { InventoryItem } from '../managers/inventory/ItemMetadata';
import type { Enemy } from '../entities/Enemy';

interface ChargeDetails {
    type: string;
    item: InventoryItem;
    target: Position;
    enemy: Enemy | null;
    dx?: number;
    dy?: number;
}

export class CombatActionManager {
    private game: Game;

    constructor(game: Game) {
        this.game = game;
    }

    /**
     * Finds a usable item of the specified type in player's inventory
     */
    public findUsableItem(itemType: string, includeRadial: boolean = false): InventoryItem | null {
        // Use facade for inventory access
        const inventoryItems = this.game.playerFacade.getInventory() as InventoryItem[];
        const radialItems = includeRadial ? (this.game.playerFacade.getRadialInventory() as InventoryItem[]) : [];
        const allItems = inventoryItems.concat(radialItems);
        return allItems.find(item => item.type === itemType && item.uses > 0 && !item.disabled) || null;
    }

    public isValidBishopSpearCharge(gridCoords: Position, playerPos: Position, includeRadial: boolean = false): ChargeDetails | null {
        const bishopSpearItem = this.findUsableItem('bishop_spear', includeRadial);
        if (!bishopSpearItem) return null;

        const enemyCollection = this.game.enemyCollection;
        const enemyAtCoords = enemyCollection.findAt(gridCoords.x, gridCoords.y, true) as Enemy | undefined;
        // Use gridManager for grid access
        const targetTile = this.game.gridManager.getTile(gridCoords.x, gridCoords.y);
        // Use playerFacade for walkability check
        const isEmptyTile = !enemyAtCoords && this.game.playerFacade.isWalkable(gridCoords.x, gridCoords.y, this.game.grid, playerPos.x, playerPos.y);

        if (!(enemyAtCoords || isEmptyTile)) return null;

        const dx = gridCoords.x - playerPos.x;
        const dy = gridCoords.y - playerPos.y;

        if (Math.abs(dx) === Math.abs(dy) && Math.abs(dx) > 0 && Math.abs(dx) <= 5) {
            return { type: 'bishop_spear', item: bishopSpearItem, target: gridCoords, enemy: enemyAtCoords || null, dx, dy };
        }
        return null;
    }

    public isValidHorseIconCharge(gridCoords: Position, playerPos: Position, includeRadial: boolean = false): ChargeDetails | null {
        const horseIconItem = this.findUsableItem('horse_icon', includeRadial);
        if (!horseIconItem) return null;

        const enemyCollection = this.game.enemyCollection;
        const enemyAtCoords = enemyCollection.findAt(gridCoords.x, gridCoords.y, true) as Enemy | undefined;
        // Use gridManager for grid access
        const targetTile = this.game.gridManager.getTile(gridCoords.x, gridCoords.y);
        // Use playerFacade for walkability check
        const isEmptyTile = !enemyAtCoords && this.game.playerFacade.isWalkable(gridCoords.x, gridCoords.y, this.game.grid, playerPos.x, playerPos.y);

        if (!(enemyAtCoords || isEmptyTile)) return null;

        const dx = gridCoords.x - playerPos.x;
        const dy = gridCoords.y - playerPos.y;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        if (absDx + absDy === 3 && absDx >= 1 && absDy >= 1 && absDx !== absDy && Math.max(absDx, absDy) <= 5) {
            return { type: 'horse_icon', item: horseIconItem, target: gridCoords, enemy: enemyAtCoords || null, dx, dy };
        }
        return null;
    }

    public isValidBowShot(gridCoords: Position, playerPos: Position, includeRadial: boolean = false): ChargeDetails | null {
        const bowItem = this.findUsableItem('bow', includeRadial);
        if (!bowItem) return null;

        const enemyCollection = this.game.enemyCollection;
        const enemyAtCoords = enemyCollection.findAt(gridCoords.x, gridCoords.y, true) as Enemy | undefined;
        if (!enemyAtCoords) return null;

        const dx = gridCoords.x - playerPos.x;
        const dy = gridCoords.y - playerPos.y;

        const isOrthogonal = (dx === 0 && Math.abs(dy) > 1) || (dy === 0 && Math.abs(dx) > 1);
        if (!isOrthogonal) return null;

        // Check line of sight (use playerFacade for walkability)
        const isPathClear = checkOrthogonalLineOfSight(
            playerPos.x, playerPos.y,
            gridCoords.x, gridCoords.y,
            this.game.grid,
            {
                isWalkable: (x: number, y: number, grid: any) => this.game.playerFacade.isWalkable(x, y, grid),
                checkEnemies: false,
                includeEndpoint: false
            }
        );

        if (isPathClear) {
            return { type: 'bow', item: bowItem, target: gridCoords, enemy: enemyAtCoords };
        }
        return null;
    }

    public confirmPendingCharge(chargeDetails: ChargeDetails): void {
        // Capture any transient data needed (e.g. enemy reference for bow) before clearing pending state
        const enemyRef = chargeDetails.enemy;

        // Clear pending state and hide overlay immediately so UI doesn't persist after confirmation
        this.game.transientGameState.clearPendingCharge();
        safeCall(this.game, 'hideOverlayMessage');

        if (chargeDetails.type === 'bishop_spear') {
            (this.game as any).performBishopSpearCharge(chargeDetails.item, chargeDetails.target.x, chargeDetails.target.y, chargeDetails.enemy, chargeDetails.dx, chargeDetails.dy);
        } else if (chargeDetails.type === 'horse_icon') {
            (this.game as any).performHorseIconCharge(chargeDetails.item, chargeDetails.target.x, chargeDetails.target.y, chargeDetails.enemy, chargeDetails.dx, chargeDetails.dy);
        } else if (chargeDetails.type === 'bow') {
            // Pass the captured enemy reference so performBowShot can operate after pendingCharge is cleared
            (this.game as any).actionManager.performBowShot(chargeDetails.item, chargeDetails.target.x, chargeDetails.target.y, enemyRef);
        }
    }

    public cancelPendingCharge(): void {
        this.game.transientGameState.clearPendingCharge();
        (this.game as any).hideOverlayMessage();
    }
}
