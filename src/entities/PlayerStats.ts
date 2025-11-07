import { PLAYER_STAT_CONSTANTS } from '@core/constants/ui';
import type { Player } from './Player';

export class PlayerStats {
    private player: Player;

    public health: number;
    public thirst: number;
    public hunger: number;
    public points: number;
    public spentDiscoveries: number;
    public dead: boolean;
    public verbosePathAnimations: boolean;
    public musicEnabled: boolean;
    public sfxEnabled: boolean;

    constructor(player: Player) {
        this.player = player;
        this.health = 3;
        this.thirst = PLAYER_STAT_CONSTANTS.INITIAL_THIRST;
        this.hunger = PLAYER_STAT_CONSTANTS.INITIAL_HUNGER;
        this.points = 0;
        this.spentDiscoveries = 0;
        this.dead = false;
        this.verbosePathAnimations = true;
        this.musicEnabled = true;
        this.sfxEnabled = true;
        this.reset();
    }

    reset(): void {
        this.health = 3;
        this.thirst = PLAYER_STAT_CONSTANTS.INITIAL_THIRST;
        this.hunger = PLAYER_STAT_CONSTANTS.INITIAL_HUNGER;
        this.points = 0;
        this.spentDiscoveries = 0;
        this.dead = false;
        this.verbosePathAnimations = true;
        this.musicEnabled = true;
        this.sfxEnabled = true;
    }

    getThirst(): number {
        return this.thirst;
    }

    getHunger(): number {
        return this.hunger;
    }

    setThirst(value: number): void {
        this.thirst = Math.max(0, Math.min(PLAYER_STAT_CONSTANTS.INITIAL_THIRST, value));
        if (this.thirst === 0) {
            this.setDead();
        }
    }

    setHunger(value: number): void {
        this.hunger = Math.max(0, Math.min(PLAYER_STAT_CONSTANTS.INITIAL_HUNGER, value));
        if (this.hunger === 0) {
            this.setDead();
        }
    }

    getHealth(): number {
        return this.health;
    }

    setHealth(value: number): void {
        this.health = Math.max(0, value);
        if (this.health <= 0) {
            this.setDead();
        }
    }

    takeDamage(amount = 1): void {
        this.setHealth(this.health - amount);
    }

    decreaseThirst(amount = 1): void {
        this.setThirst(this.thirst - amount);
    }

    decreaseHunger(amount = 1): void {
        this.setHunger(this.hunger - amount);
    }

    restoreThirst(amount = 10): void {
        this.setThirst(this.thirst + amount);
    }

    restoreHunger(amount = 10): void {
        this.setHunger(this.hunger + amount);
    }

    setDead(): void {
        if (!this.dead) {
            this.dead = true;
            this.player.sprite = 'SeparateAnim/dead';
        }
    }

    isDead(): boolean {
        return this.dead;
    }

    getPoints(): number {
        return this.points;
    }

    setPoints(value: number): void {
        this.points = value || 0;
    }

    addPoints(amount: number): void {
        this.points += amount;
    }

    getSpentDiscoveries(): number {
        return this.spentDiscoveries;
    }

    setSpentDiscoveries(value: number): void {
        this.spentDiscoveries = value || 0;
    }
}
