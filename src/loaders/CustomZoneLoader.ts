import { logger } from '@core/logger';

/**
 * CustomZoneLoader - Loads custom zones from JSON files
 *
 * Handles importing and parsing custom zone definitions created
 * with the zone editor tool.
 */
export class CustomZoneLoader {
    private loadedZones: Map<string, unknown>;
    private zonePath: string;

    constructor() {
        this.loadedZones = new Map();
        this.zonePath = './zones/custom/';
    }

    /**
     * Load a custom zone by name
     * @param {string} zoneName - The name of the zone file (without .json extension)
     * @returns {Promise<Object|null>} The parsed zone data or null if loading fails
     */
    async loadZone(zoneName: string): Promise<unknown> {
        // Check cache first
        if (this.loadedZones.has(zoneName)) {
            logger.debug(`[CustomZoneLoader] Loading ${zoneName} from cache`);
            return this.loadedZones.get(zoneName);
        }

        try {
            const filePath = `${this.zonePath}${zoneName}.json`;
            logger.info(`[CustomZoneLoader] Loading custom zone: ${filePath}`);

            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const zoneData = await response.json();

            // Validate zone data
            if (!this.validateZoneData(zoneData)) {
                throw new Error('Invalid zone data format');
            }

            // Cache the zone
            this.loadedZones.set(zoneName, zoneData);

            logger.info(`[CustomZoneLoader] Successfully loaded zone: ${zoneName}`);
            return zoneData;

        } catch (error) {
            logger.error(`[CustomZoneLoader] Failed to load zone ${zoneName}:`, error);
            return null;
        }
    }

    /**
     * Validate zone data structure
     * @param {Object} zoneData - The zone data to validate
     * @returns {boolean} True if valid
     */
    validateZoneData(zoneData: unknown): boolean {
        if (!zoneData || typeof zoneData !== 'object') {
            logger.error('[CustomZoneLoader] Zone data is not an object');
            return false;
        }

        if (!(zoneData as any).name || typeof (zoneData as any).name !== 'string') {
            logger.error('[CustomZoneLoader] Zone missing valid name');
            return false;
        }

        if (!Array.isArray((zoneData as any).size) || (zoneData as any).size.length !== 2) {
            logger.error('[CustomZoneLoader] Zone missing valid size array');
            return false;
        }

        if (!Array.isArray((zoneData as any).terrain)) {
            logger.error('[CustomZoneLoader] Zone missing terrain array');
            return false;
        }

        const expectedCells = (zoneData as any).size[0] * (zoneData as any).size[1];
        if ((zoneData as any).terrain.length !== expectedCells) {
            logger.error(`[CustomZoneLoader] Terrain array length mismatch. Expected ${expectedCells}, got ${(zoneData as any).terrain.length}`);
            return false;
        }

        if (!(zoneData as any).features || typeof (zoneData as any).features !== 'object') {
            logger.error('[CustomZoneLoader] Zone missing features object');
            return false;
        }

        return true;
    }

    /**
     * Convert custom zone data to game grid format
     * @param {Object} zoneData - The custom zone data
     * @returns {Object} Formatted zone data for game use
     */
    convertToGameFormat(zoneData: any): unknown {
        const [width, height] = zoneData.size;
        const grid = [];

        // Create grid structure
        for (let row = 0; row < height; row++) {
            const rowData = [];
            for (let col = 0; col < width; col++) {
                const index = row * width + col;
                const terrain = zoneData.terrain[index];
                const featureKey = `${col},${row}`;
                const feature = zoneData.features[featureKey] || null;

                rowData.push({
                    terrain: terrain,
                    feature: feature,
                    x: col,
                    y: row
                });
            }
            grid.push(rowData);
        }

        return {
            name: zoneData.name,
            width: width,
            height: height,
            grid: grid,
            metadata: zoneData.metadata || {}
        };
    }

    /**
     * Load and convert a zone in one step
     * @param {string} zoneName - The name of the zone to load
     * @returns {Promise<Object|null>} Converted zone data or null
     */
    async loadAndConvert(zoneName: string): Promise<unknown> {
        const zoneData = await this.loadZone(zoneName);
        if (!zoneData) return null;

        return this.convertToGameFormat(zoneData);
    }

    /**
     * List all available custom zones
     * @returns {Array<string>} List of cached zone names
     */
    getLoadedZones() {
        return Array.from(this.loadedZones.keys());
    }

    /**
     * Clear the zone cache
     */
    clearCache() {
        this.loadedZones.clear();
        logger.info('[CustomZoneLoader] Cache cleared');
    }

    /**
     * Reload a specific zone (bypass cache)
     * @param {string} zoneName - The name of the zone to reload
     * @returns {Promise<Object|null>} The reloaded zone data
     */
    async reloadZone(zoneName: string): Promise<unknown> {
        this.loadedZones.delete(zoneName);
        return await this.loadZone(zoneName);
    }
}

// Singleton instance
export const customZoneLoader = new CustomZoneLoader();
