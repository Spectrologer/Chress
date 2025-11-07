import { TILE_TYPES, GRID_SIZE, UI_CONSTANTS, ZONE_CONSTANTS, ANIMATION_CONSTANTS } from '@core/constants/index';
import { PlayerStats } from './PlayerStats';
import { PlayerAnimations } from './PlayerAnimations';
import { PlayerMovement } from './PlayerMovement';
import { PlayerAbilities } from './PlayerAbilities';
import { PlayerZoneTracking } from './PlayerZoneTracking';
import { createZoneKey } from '@utils/ZoneKeyUtils';
import audioManager from '@utils/AudioManager';
import { eventBus } from '@core/EventBus';
import { EventTypes } from '@core/EventTypes';
import { errorHandler, ErrorSeverity } from '@core/ErrorHandler';
import { TileRegistry } from '@core/TileRegistry';
import { isBomb, isTileType } from '@utils/TileUtils';
import GridIterator from '@utils/GridIterator';
import { Position } from '@core/Position';
import type { InventoryItem } from '@managers/inventory/ItemMetadata';

export interface ZoneCoords {
    x: number;
    y: number;
    dimension: number;
    depth?: number;
}

export type Grid = Array<Array<any>>;

export interface ItemManager {
    handleItemPickup?: (player: Player, x: number, y: number, grid: Grid) => void;
}

export class Player {
    private _position: Position;
    private _lastPosition: Position;

    public x: number;
    public y: number;
    public lastX: number;
    public lastY: number;

    public currentZone: ZoneCoords;
    public visitedZones: Set<string>;
    public inventory: InventoryItem[];
    public radialInventory: InventoryItem[];
    public abilities: Set<string>;
    public sprite: string;

    public stats: PlayerStats;
    public animations: PlayerAnimations;
    public movement: PlayerMovement;
    public abilityManager: PlayerAbilities;
    public zoneTracking: PlayerZoneTracking;

    public consecutiveKills: number;
    public lastActionType: string | null;
    public lastActionResult: string | null;
    public itemManager: ItemManager | null;
    public interactOnReach: Position | null;
    public undergroundDepth: number;

    constructor() {
        this._position = new Position(1, 1);
        this._lastPosition = this._position.clone();

        // Maintain x, y properties for backward compatibility
        Object.defineProperty(this, 'x', {
            get() { return this._position.x; },
            set(value: number) { this._position.x = value; }
        });
        Object.defineProperty(this, 'y', {
            get() { return this._position.y; },
            set(value: number) { this._position.y = value; }
        });
        Object.defineProperty(this, 'lastX', {
            get() { return this._lastPosition.x; },
            set(value: number) { this._lastPosition.x = value; }
        });
        Object.defineProperty(this, 'lastY', {
            get() { return this._lastPosition.y; },
            set(value: number) { this._lastPosition.y = value; }
        });

        this.currentZone = { x: 0, y: 0, dimension: 0, depth: 0 };
        this.visitedZones = new Set();
        this.inventory = [];
        this.radialInventory = [];
        this.abilities = new Set();
        this.sprite = 'SeparateAnim/Special2';

        this.stats = new PlayerStats(this);
        this.animations = new PlayerAnimations(this);
        this.movement = new PlayerMovement(this);
        this.abilityManager = new PlayerAbilities(this);
        this.zoneTracking = new PlayerZoneTracking(this);
        this.consecutiveKills = 0;
        this.lastActionType = null;
        this.lastActionResult = null;
        this.itemManager = null;

        this.interactOnReach = null;
        this.undergroundDepth = 0;
        this.zoneTracking.markZoneVisited(0, 0, 0);
    }

    move(newX: number, newY: number, grid: Grid, onZoneTransition?: (x: number, y: number, side: string) => void): boolean {
        const moved = this.movement.move(newX, newY, grid, onZoneTransition);

        if (!moved) {
            return this.abilityManager.tryUseAbility(newX, newY, grid);
        }

        return moved;
    }

    isWalkable(x: number, y: number, grid: Grid, fromX: number = this.x, fromY: number = this.y): boolean {
        return this.movement.isWalkable(x, y, grid, fromX, fromY);
    }

    setPosition(x: number, y: number): void {
        this.movement.setPosition(x, y);
    }

    getPosition(): { x: number; y: number } {
        return this._position.toObject();
    }

    getPositionObject(): Position {
        return this._position;
    }

    getCurrentZone(): ZoneCoords {
        return this.zoneTracking.getCurrentZone();
    }

    setCurrentZone(x: number, y: number, dimension: number = this.currentZone.dimension): void {
        this.zoneTracking.setCurrentZone(x, y, dimension);
    }

    markZoneVisited(x: number, y: number, dimension: number): void {
        this.zoneTracking.markZoneVisited(x, y, dimension);
    }

    hasVisitedZone(x: number, y: number, dimension: number): boolean {
        return this.zoneTracking.hasVisitedZone(x, y, dimension);
    }

    getVisitedZones(): Set<string> {
        return this.zoneTracking.getVisitedZones();
    }

    ensureValidPosition(grid: Grid): void {
        this.movement.ensureValidPosition(grid);
    }

    reset(): void {
        this.x = ZONE_CONSTANTS.PLAYER_SPAWN_POSITION.x;
        this.y = ZONE_CONSTANTS.PLAYER_SPAWN_POSITION.y;
        this.currentZone = { x: 0, y: 0, dimension: 0 };
        this.inventory = [];
        this.radialInventory = [];
        this.abilityManager.clearAbilities();
        this.sprite = 'SeparateAnim/Special2';
        this.zoneTracking.clearVisitedZones();
        this.stats.reset();
        this.animations.reset();
        this.interactOnReach = null;
        this.zoneTracking.markZoneVisited(0, 0, 0);
    }

    getThirst(): number {
        return this.stats.getThirst();
    }

    getHunger(): number {
        return this.stats.getHunger();
    }

    setThirst(value: number): void {
        this.stats.setThirst(value);
    }

    setHunger(value: number): void {
        this.stats.setHunger(value);
    }

    getHealth(): number {
        return this.stats.getHealth();
    }

    setHealth(value: number): void {
        this.stats.setHealth(value);
    }

    takeDamage(amount = 1): void {
        try {
            this.consecutiveKills = 0;
        } catch (e) {
            errorHandler.handle(e as Error, ErrorSeverity.WARNING, {
                component: 'Player',
                action: 'reset consecutive kills'
            });
        }
        this.stats.takeDamage(amount);
    }

    decreaseThirst(amount = 1): void {
        this.stats.decreaseThirst(amount);
    }

    decreaseHunger(amount = 1): void {
        this.stats.decreaseHunger(amount);
    }

    restoreThirst(amount = 10): void {
        this.stats.restoreThirst(amount);
    }

    restoreHunger(amount = 10): void {
        this.stats.restoreHunger(amount);
    }

    setDead(): void {
        this.stats.setDead();
    }

    isDead(): boolean {
        return this.stats.isDead();
    }

    onZoneTransition(): void {
        this.zoneTracking.onZoneTransition();
    }

    getPoints(): number {
        return this.stats.getPoints();
    }

    addPoints(points: number): void {
        this.stats.addPoints(points);
    }

    setPoints(points: number): void {
        this.stats.setPoints(points);
    }

    getSpentDiscoveries(): number {
        return this.stats.getSpentDiscoveries();
    }

    setSpentDiscoveries(value: number): void {
        this.stats.setSpentDiscoveries(value);
    }

    startBump(deltaX: number, deltaY: number): void {
        this.animations.startBump(deltaX, deltaY);
    }

    startBackflip(frames = 20): void {
        this.animations.startBackflip(frames);
    }

    startAttackAnimation(): void {
        this.animations.startAttackAnimation();
    }

    startActionAnimation(): void {
        this.animations.startActionAnimation();
    }

    startSmokeAnimation(): void {
        this.animations.startSmokeAnimation();
    }

    startSplodeAnimation(x: number, y: number): void {
        this.animations.startSplodeAnimation(x, y);
    }

    updateAnimations(): void {
        this.animations.update();
    }

    getValidSpawnPosition(game: { grid: Grid; enemies: Array<{ x: number; y: number }> }): { x: number; y: number } | null {
        const playerPos = this.getPosition();
        const availableTiles = GridIterator.findTiles(game.grid, (tile, x, y) => {
            const hasEnemy = game.enemies.some(e => e.x === x && e.y === y);
            return (isTileType(tile, TILE_TYPES.FLOOR) || isTileType(tile, TILE_TYPES.EXIT)) &&
                   !hasEnemy &&
                   !(x === playerPos.x && y === playerPos.y);
        });

        if (availableTiles.length > 0) {
            return availableTiles[Math.floor(Math.random() * availableTiles.length)];
        }
        return null;
    }

    setInteractOnReach(x: number, y: number): void {
        this.interactOnReach = new Position(x, y);
    }

    clearInteractOnReach(): void {
        this.interactOnReach = null;
    }

    setAction(type: string): void {
        this.lastActionType = type;
        if (type !== 'attack') this.lastActionResult = null;
    }
}
