import { TILE_TYPES, GRID_SIZE } from '../core/constants/index.js';
import { Position } from '../core/Position.js';
import { isTileType } from '../utils/TileUtils.js';
import audioManager from '../utils/AudioManager.js';
import type { Player } from './Player.js';
import type { Grid } from './Player.js';

export class PlayerAbilities {
    private player: Player;

    constructor(player: Player) {
        this.player = player;
    }

    tryUseAbility(targetX: number, targetY: number, grid: Grid): boolean {
        const targetPos = new Position(targetX, targetY);
        const playerPos = this.player['_position'];
        const tile = targetPos.getTile(grid);

        const isAdjacentOrthogonal = playerPos.isAdjacentTo(targetPos, false);
        if (!isAdjacentOrthogonal) {
            return false;
        }

        this.tryChop(targetX, targetY, grid, tile);
        this.trySmash(targetX, targetY, grid, tile);

        return false;
    }

    private tryChop(targetX: number, targetY: number, grid: Grid, tile: any): boolean {
        const hasAxe = this.player.abilities.has('axe');
        if (!hasAxe) {
            return false;
        }

        if (isTileType(tile, TILE_TYPES.GRASS) || isTileType(tile, TILE_TYPES.SHRUBBERY)) {
            const isBorder = targetX === 0 || targetX === GRID_SIZE - 1 || targetY === 0 || targetY === GRID_SIZE - 1;
            const targetPos = new Position(targetX, targetY);
            targetPos.setTile(grid, isBorder ? TILE_TYPES.EXIT : TILE_TYPES.FLOOR);

            this.player.stats.decreaseHunger();
            this.player.animations.startActionAnimation();
            this.player.animations.startBump(targetX - this.player.x, targetY - this.player.y);

            audioManager.playSound('slash');

            (window as any).gameInstance.startEnemyTurns();
            return true;
        }

        return false;
    }

    private trySmash(targetX: number, targetY: number, grid: Grid, tile: any): boolean {
        const hasHammer = this.player.abilities.has('hammer');
        if (!hasHammer) {
            return false;
        }

        if (isTileType(tile, TILE_TYPES.ROCK)) {
            const isBorder = targetY === 0 || targetY === GRID_SIZE - 1 || targetX === 0 || targetX === GRID_SIZE - 1;
            const targetPos = new Position(targetX, targetY);
            targetPos.setTile(grid, isBorder ? TILE_TYPES.EXIT : TILE_TYPES.FLOOR);

            this.player.stats.decreaseHunger(2);
            this.player.animations.startActionAnimation();
            this.player.animations.startBump(targetX - this.player.x, targetY - this.player.y);

            audioManager.playSound('smash');

            (window as any).gameInstance.startEnemyTurns();
            return true;
        }

        return false;
    }

    hasAbility(abilityName: string): boolean {
        return this.player.abilities.has(abilityName);
    }

    addAbility(abilityName: string): void {
        this.player.abilities.add(abilityName);
    }

    removeAbility(abilityName: string): void {
        this.player.abilities.delete(abilityName);
    }

    clearAbilities(): void {
        this.player.abilities.clear();
    }
}
