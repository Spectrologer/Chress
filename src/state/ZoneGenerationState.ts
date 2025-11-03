/**
 * Centralized state for zone generation session data.
 *
 * Replaces the static properties in ZoneStateManager with instance-based state
 * that can be properly saved, loaded, and tested.
 *
 * @module ZoneGenerationState
 */

interface Position {
    x: number;
    y: number;
}

interface SpawnFlags {
    axe: boolean;
    hammer: boolean;
    spear: boolean;
    horseIcon: boolean;
    note: boolean;
    penne: boolean;
    squig: boolean;
    shack: boolean;
    wildsShack: boolean;
    cisternLevel1: boolean;
    well: boolean;
    deadTree: boolean;
    axeWarningSign: boolean;
    hammerWarningSign: boolean;
    firstFrontierSign: boolean;
}

interface SpawnLocations {
    axe: Position | null;
    hammer: Position | null;
    spear: Position | null;
    horseIcon: Position | null;
    note: Position | null;
    wildsShack: Position | null;
}

interface SerializedState {
    zoneCounter: number;
    enemyCounter: number;
    spawnFlags: SpawnFlags;
    firstWildsZonePlaced: boolean;
    spawnLocations: SpawnLocations;
}

export class ZoneGenerationState {
    zoneCounter: number = 0;
    enemyCounter: number = 0;
    spawnFlags: SpawnFlags;
    firstWildsZonePlaced: boolean = false;
    spawnLocations: SpawnLocations;

    constructor() {
        this.spawnFlags = {
            axe: false,
            hammer: false,
            spear: false,
            horseIcon: false,
            note: false,
            penne: false,
            squig: false,
            shack: false,
            wildsShack: false,
            cisternLevel1: false,
            well: false,
            deadTree: false,
            axeWarningSign: false,
            hammerWarningSign: false,
            firstFrontierSign: false
        };

        this.spawnLocations = {
            axe: null,
            hammer: null,
            spear: null,
            horseIcon: null,
            note: null,
            wildsShack: null
        };
    }

    /**
     * Reset all session data to initial state
     */
    reset(): void {
        this.zoneCounter = 0;
        this.enemyCounter = 0;
        this.spawnFlags = {
            axe: false,
            hammer: false,
            spear: false,
            horseIcon: false,
            note: false,
            penne: false,
            squig: false,
            shack: false,
            wildsShack: false,
            cisternLevel1: false,
            well: false,
            deadTree: false,
            axeWarningSign: false,
            hammerWarningSign: false,
            firstFrontierSign: false
        };
        this.firstWildsZonePlaced = false;
        this.spawnLocations = {
            axe: null,
            hammer: null,
            spear: null,
            horseIcon: null,
            note: null,
            wildsShack: null
        };
    }

    /**
     * Initialize spawn locations for special items if not already set
     */
    initializeItemLocations(): void {
        if (this.spawnLocations.axe &&
            this.spawnLocations.hammer &&
            this.spawnLocations.spear &&
            this.spawnLocations.horseIcon) {
            return; // Already initialized
        }

        // Level 1 (Home): dist 1-2
        this.spawnLocations.axe = this._getRandomZoneForLevel(1, 2);

        // Level 2 (Woods): dist 3-8
        this.spawnLocations.hammer = this._getRandomZoneForLevel(3, 8);

        // Level 3 (Wilds): dist 9-16
        this.spawnLocations.spear = this._getRandomZoneForLevel(9, 16);

        // Level 4 (Frontier): dist 17-24
        this.spawnLocations.horseIcon = this._getRandomZoneForLevel(17, 24);
    }

    /**
     * Generate a random zone coordinate within a distance range
     */
    private _getRandomZoneForLevel(minDist: number, maxDist: number): Position {
        let x: number;
        let y: number;

        do {
            const range = maxDist * 2 + 1;
            x = Math.floor(Math.random() * range) - maxDist;
            y = Math.floor(Math.random() * range) - maxDist;
        } while (Math.max(Math.abs(x), Math.abs(y)) < minDist ||
                 Math.max(Math.abs(x), Math.abs(y)) > maxDist);

        return { x, y };
    }

    /**
     * Check if a specific item/feature has been spawned
     */
    hasSpawned(flag: keyof SpawnFlags): boolean {
        return this.spawnFlags[flag] === true;
    }

    /**
     * Mark an item/feature as spawned
     */
    setSpawnFlag(flag: keyof SpawnFlags, value: boolean = true): void {
        this.spawnFlags[flag] = value;
    }

    /**
     * Get the spawn location for a special item
     */
    getSpawnLocation(item: keyof SpawnLocations): Position | null {
        return this.spawnLocations[item] || null;
    }

    /**
     * Set the spawn location for a special item
     */
    setSpawnLocation(item: keyof SpawnLocations, location: Position): void {
        this.spawnLocations[item] = location;
    }

    /**
     * Increment and return the zone counter
     */
    incrementZoneCounter(): number {
        return ++this.zoneCounter;
    }

    /**
     * Increment and return the enemy counter
     */
    incrementEnemyCounter(): number {
        return ++this.enemyCounter;
    }

    /**
     * Get current zone counter value
     */
    getZoneCounter(): number {
        return this.zoneCounter;
    }

    /**
     * Get current enemy counter value
     */
    getEnemyCounter(): number {
        return this.enemyCounter;
    }

    /**
     * Serialize state for saving
     */
    serialize(): SerializedState {
        return {
            zoneCounter: this.zoneCounter,
            enemyCounter: this.enemyCounter,
            spawnFlags: { ...this.spawnFlags },
            firstWildsZonePlaced: this.firstWildsZonePlaced,
            spawnLocations: { ...this.spawnLocations }
        };
    }

    /**
     * Deserialize state from saved data
     */
    deserialize(data: Partial<SerializedState>): void {
        if (!data) return;

        this.zoneCounter = data.zoneCounter || 0;
        this.enemyCounter = data.enemyCounter || 0;
        this.spawnFlags = { ...this.spawnFlags, ...data.spawnFlags };
        this.firstWildsZonePlaced = data.firstWildsZonePlaced || false;
        this.spawnLocations = { ...this.spawnLocations, ...data.spawnLocations };
    }
}
