import { logger } from '../core/logger.js';
import { TILE_TYPES, GRID_SIZE, getZoneLevelFromDistance } from '../core/constants/index.js';

export class ZoneStateManager {
    static zoneCounter = 0;
    static enemyCounter = 0;
    static axeSpawned = false;
    static hammerSpawned = false;
    static spearSpawned = false;
    static horseIconSpawned = false;
    static noteSpawned = false;
    static penneSpawned = false;
    static squigSpawned = false;
// Flag to ensure at least one shack spawns in level 1 per session
static shackSpawned = false;
// Flag for the special shack in the Wilds
static wildsShackSpawned = false;
// Flag to ensure the first wilds zone is clear except for shack
static firstWildsZonePlaced = false;
// Flag to ensure at least one cistern spawns in level 1 per session
static cisternSpawnedForLevel1 = false;
static wellSpawned = false;
static deadTreeSpawned = false;
static axeWarningSignPlaced = false;
static hammerWarningSignPlaced = false;
    static firstFrontierSignPlaced = false;

    // Pre-determined spawn locations for special items
    static axeSpawnZone = null;
    static hammerSpawnZone = null;
    static noteSpawnZone = null;
    static spearSpawnZone = null;
    static horseIconSpawnZone = null;
    static wildsShackSpawnZone = null;

    static initializeItemLocations() {
        if (this.axeSpawnZone && this.hammerSpawnZone && this.spearSpawnZone && this.horseIconSpawnZone) {
            return; // Already initialized
        }

        // Level 1 (Home): dist 1-2
        this.axeSpawnZone = this.getRandomZoneForLevel(1, 2);

        // Level 2 (Woods): dist 3-8
        this.hammerSpawnZone = this.getRandomZoneForLevel(3, 8);

        // Level 3 (Wilds): dist 9-16
        this.spearSpawnZone = this.getRandomZoneForLevel(9, 16);

        // Level 4 (Frontier): dist 17-24
        this.horseIconSpawnZone = this.getRandomZoneForLevel(17, 24);
    }

    static getRandomZoneForLevel(minDist, maxDist) {
        let x, y;
        do {
            const range = maxDist * 2 + 1;
            x = Math.floor(Math.random() * range) - maxDist;
            y = Math.floor(Math.random() * range) - maxDist;
        } while (Math.max(Math.abs(x), Math.abs(y)) < minDist || Math.max(Math.abs(x), Math.abs(y)) > maxDist);
        return { x, y };
    }

    static getZoneLevel(zoneX, zoneY) {
        const dist = Math.max(Math.abs(zoneX), Math.abs(zoneY));
        return getZoneLevelFromDistance(dist);
    }

    static hashCode(str) {
        let hash = 0;
        if (str.length === 0) return hash;
        for (const char of str) {
            const charCode = char.charCodeAt(0);
            hash = ((hash << 5) - hash) + charCode;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }

    static resetSessionData() {
        this.zoneCounter = 0;
        this.enemyCounter = 0;
        this.axeSpawned = false;
        this.hammerSpawned = false;
        this.spearSpawned = false;
        this.noteSpawned = false;
        this.penneSpawned = false;
        this.shackSpawned = false;
        this.wildsShackSpawned = false;
        this.firstWildsZonePlaced = false;
        this.cisternSpawnedForLevel1 = false;
        this.squigSpawned = false;
        this.wellSpawned = false;
        this.deadTreeSpawned = false;
        this.axeWarningSignPlaced = false;
        this.hammerWarningSignPlaced = false;
        this.firstFrontierSignPlaced = false;
        this.axeSpawnZone = null;
        this.hammerSpawnZone = null;
        this.noteSpawnZone = null;
        this.spearSpawnZone = null;
        this.horseIconSpawnZone = null;
        this.wildsShackSpawnZone = null;
    }
}
