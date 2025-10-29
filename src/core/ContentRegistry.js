/**
 * ContentRegistry - Unified content registration system
 *
 * This provides a centralized way to register and manage all game content:
 * - Items (with effects, tooltips, spawning, rendering)
 * - NPCs (with placement, interactions, dialogue)
 * - Enemies (with spawn rules, weights, behaviors)
 * - Zone handlers (for different dimensions/biomes)
 *
 * Benefits:
 * - Add new content by registering in ONE place instead of 7-8 files
 * - Clear extension points for modding
 * - Automatic validation of content definitions
 * - Easy to iterate over all content for tooling/debug
 */

export class ContentRegistry {
    static #items = new Map();
    static #npcs = new Map();
    static #enemies = new Map();
    static #zoneHandlers = new Map();
    static #initialized = false;

    /**
     * Register a new item type
     * @param {string} id - Unique item identifier (e.g., 'magic_sword')
     * @param {Object} config - Item configuration
     * @param {number} config.tileType - TILE_TYPES constant
     * @param {boolean} [config.stackable=false] - Can stack in inventory
     * @param {boolean} [config.radial=false] - Goes in radial inventory
     * @param {BaseItemEffect} [config.effect] - Item effect handler
     * @param {number} [config.spawnWeight=0] - Base spawn probability
     * @param {Object} [config.spawnRules] - Advanced spawn rules
     * @param {number} [config.spawnRules.minLevel] - Minimum zone level
     * @param {number} [config.spawnRules.maxLevel] - Maximum zone level
     * @param {number|string} [config.spawnRules.dimension] - Required dimension (0=surface, 2=underground, 'any')
     * @param {boolean} [config.spawnRules.isActivated] - Activated item (special spawn rules)
     * @param {Function} config.getTooltip - Function(item) => string
     * @param {Function} config.getImageKey - Function(item) => string
     * @param {Object} [config.renderStrategy] - Rendering strategy instance
     * @param {Object} [config.metadata] - Additional custom metadata
     */
    static registerItem(id, config) {
        this.#validateItemConfig(id, config);
        this.#items.set(id, {
            id,
            tileType: config.tileType,
            stackable: config.stackable ?? false,
            radial: config.radial ?? false,
            effect: config.effect ?? null,
            spawnWeight: config.spawnWeight ?? 0,
            spawnRules: config.spawnRules ?? {},
            getTooltip: config.getTooltip,
            getImageKey: config.getImageKey,
            renderStrategy: config.renderStrategy ?? null,
            metadata: config.metadata ?? {}
        });
    }

    /**
     * Register a new NPC
     * @param {string} id - Unique NPC identifier (e.g., 'elder_merchant')
     * @param {Object} config - NPC configuration
     * @param {number} config.tileType - TILE_TYPES constant
     * @param {string} config.action - Interaction type ('barter', 'dialogue', 'quest')
     * @param {Object} [config.placement] - Spawn placement rules
     * @param {string} [config.placement.zone] - Zone identifier (e.g., 'home_interior')
     * @param {number} [config.placement.x] - Fixed X position
     * @param {number} [config.placement.y] - Fixed Y position
     * @param {number} [config.placement.spawnWeight] - Random spawn weight
     * @param {number|string} [config.placement.dimension] - Required dimension
     * @param {Object} [config.dialogue] - Dialogue tree/configuration
     * @param {Object} [config.barter] - Barter configuration
     * @param {Object} [config.renderStrategy] - Rendering strategy instance
     * @param {Object} [config.metadata] - Additional custom metadata
     */
    static registerNPC(id, config) {
        this.#validateNPCConfig(id, config);
        this.#npcs.set(id, {
            id,
            tileType: config.tileType,
            action: config.action,
            placement: config.placement ?? {},
            dialogue: config.dialogue ?? null,
            barter: config.barter ?? null,
            renderStrategy: config.renderStrategy ?? null,
            metadata: config.metadata ?? {}
        });
    }

    /**
     * Register a new enemy type
     * @param {string} id - Unique enemy identifier (e.g., 'fire_lizard')
     * @param {Object} config - Enemy configuration
     * @param {number} config.weight - Spawn weight/cost (1-5 scale)
     * @param {Object} config.spawnRules - Spawn distribution by level
     * @param {number} [config.spawnRules.level1] - Probability at level 1
     * @param {number} [config.spawnRules.level2] - Probability at level 2
     * @param {number} [config.spawnRules.level3] - Probability at level 3
     * @param {number} [config.spawnRules.level4] - Probability at level 4
     * @param {string} [config.behaviorType] - AI behavior type
     * @param {Object} [config.stats] - Base stats (health, damage, etc.)
     * @param {Object} [config.metadata] - Additional custom metadata
     */
    static registerEnemy(id, config) {
        this.#validateEnemyConfig(id, config);
        this.#enemies.set(id, {
            id,
            weight: config.weight,
            spawnRules: config.spawnRules ?? {},
            behaviorType: config.behaviorType ?? 'default',
            stats: config.stats ?? {},
            metadata: config.metadata ?? {}
        });
    }

    /**
     * Register a new zone handler for a dimension
     * @param {number} dimension - Dimension ID
     * @param {Function} handlerFactory - Factory function that creates handler instance
     * @param {Object} [config] - Zone configuration
     * @param {string} [config.name] - Display name for the zone type
     * @param {Object} [config.metadata] - Additional custom metadata
     */
    static registerZoneHandler(dimension, handlerFactory, config = {}) {
        if (typeof dimension !== 'number') {
            throw new Error(`Zone dimension must be a number, got: ${typeof dimension}`);
        }
        if (typeof handlerFactory !== 'function') {
            throw new Error('Zone handler must be a factory function');
        }
        this.#zoneHandlers.set(dimension, {
            dimension,
            factory: handlerFactory,
            name: config.name ?? `Dimension ${dimension}`,
            metadata: config.metadata ?? {}
        });
    }

    // ==================== GETTERS ====================

    /**
     * Get item configuration by ID
     */
    static getItem(id) {
        return this.#items.get(id);
    }

    /**
     * Get item by tile type
     */
    static getItemByTileType(tileType) {
        for (const item of this.#items.values()) {
            if (item.tileType === tileType) {
                return item;
            }
        }
        return null;
    }

    /**
     * Get all registered items
     */
    static getAllItems() {
        return Array.from(this.#items.values());
    }

    /**
     * Get all stackable items
     */
    static getStackableItems() {
        return Array.from(this.#items.values()).filter(item => item.stackable);
    }

    /**
     * Get all radial items
     */
    static getRadialItems() {
        return Array.from(this.#items.values()).filter(item => item.radial);
    }

    /**
     * Get items eligible for spawning in a zone
     * @param {number} zoneLevel - Zone level (1-4)
     * @param {number} dimension - Dimension (0=surface, 2=underground)
     * @param {number} [depth=1] - Underground depth
     */
    static getSpawnableItems(zoneLevel, dimension, depth = 1) {
        return Array.from(this.#items.values()).filter(item => {
            if (item.spawnWeight <= 0) return false;

            const rules = item.spawnRules;

            // Check dimension match
            if (rules.dimension !== undefined && rules.dimension !== 'any') {
                if (rules.dimension !== dimension) return false;
            }

            // Check level range
            if (rules.minLevel !== undefined && zoneLevel < rules.minLevel) return false;
            if (rules.maxLevel !== undefined && zoneLevel > rules.maxLevel) return false;

            // Check activated item restriction (no activated items in level 1 surface)
            if (rules.isActivated && zoneLevel === 1 && dimension === 0) return false;

            return true;
        });
    }

    /**
     * Get NPC configuration by ID
     */
    static getNPC(id) {
        return this.#npcs.get(id);
    }

    /**
     * Get NPC by tile type
     */
    static getNPCByTileType(tileType) {
        for (const npc of this.#npcs.values()) {
            if (npc.tileType === tileType) {
                return npc;
            }
        }
        return null;
    }

    /**
     * Get all registered NPCs
     */
    static getAllNPCs() {
        return Array.from(this.#npcs.values());
    }

    /**
     * Get NPCs for a specific placement zone
     * @param {string} zone - Zone identifier (e.g., 'home_interior')
     */
    static getNPCsForZone(zone) {
        return Array.from(this.#npcs.values()).filter(npc =>
            npc.placement && npc.placement.zone === zone
        );
    }

    /**
     * Get enemy configuration by ID
     */
    static getEnemy(id) {
        return this.#enemies.get(id);
    }

    /**
     * Get all registered enemies
     */
    static getAllEnemies() {
        return Array.from(this.#enemies.values());
    }

    /**
     * Get enemies eligible for spawning at a zone level
     * @param {number} zoneLevel - Zone level (1-4)
     */
    static getSpawnableEnemies(zoneLevel) {
        const enemies = [];
        for (const enemy of this.#enemies.values()) {
            const prob = enemy.spawnRules[`level${zoneLevel}`];
            if (prob !== undefined && prob > 0) {
                enemies.push({
                    type: enemy.id,
                    prob,
                    weight: enemy.weight
                });
            }
        }
        return enemies;
    }

    /**
     * Get zone handler factory for a dimension
     */
    static getZoneHandler(dimension) {
        return this.#zoneHandlers.get(dimension);
    }

    /**
     * Get all registered zone handlers
     */
    static getAllZoneHandlers() {
        return Array.from(this.#zoneHandlers.values());
    }

    // ==================== VALIDATION ====================

    static #validateItemConfig(id, config) {
        if (!id || typeof id !== 'string') {
            throw new Error('Item ID must be a non-empty string');
        }
        if (this.#items.has(id)) {
            throw new Error(`Item "${id}" is already registered`);
        }
        if (typeof config.tileType !== 'number') {
            throw new Error(`Item "${id}" must have a valid tileType number`);
        }
        if (typeof config.getTooltip !== 'function') {
            throw new Error(`Item "${id}" must have a getTooltip function`);
        }
        if (typeof config.getImageKey !== 'function') {
            throw new Error(`Item "${id}" must have a getImageKey function`);
        }
    }

    static #validateNPCConfig(id, config) {
        if (!id || typeof id !== 'string') {
            throw new Error('NPC ID must be a non-empty string');
        }
        if (this.#npcs.has(id)) {
            throw new Error(`NPC "${id}" is already registered`);
        }
        if (typeof config.tileType !== 'number') {
            throw new Error(`NPC "${id}" must have a valid tileType number`);
        }
        if (!config.action || typeof config.action !== 'string') {
            throw new Error(`NPC "${id}" must have an action type`);
        }
    }

    static #validateEnemyConfig(id, config) {
        if (!id || typeof id !== 'string') {
            throw new Error('Enemy ID must be a non-empty string');
        }
        if (this.#enemies.has(id)) {
            throw new Error(`Enemy "${id}" is already registered`);
        }
        if (typeof config.weight !== 'number' || config.weight <= 0) {
            throw new Error(`Enemy "${id}" must have a positive weight`);
        }
    }

    // ==================== UTILITY ====================

    /**
     * Check if registry has been initialized with content
     */
    static isInitialized() {
        return this.#initialized;
    }

    /**
     * Mark registry as initialized (called after all content is registered)
     */
    static markInitialized() {
        this.#initialized = true;
    }

    /**
     * Clear all registrations (useful for testing)
     */
    static clear() {
        this.#items.clear();
        this.#npcs.clear();
        this.#enemies.clear();
        this.#zoneHandlers.clear();
        this.#initialized = false;
    }

    /**
     * Get registry statistics
     */
    static getStats() {
        return {
            items: this.#items.size,
            npcs: this.#npcs.size,
            enemies: this.#enemies.size,
            zoneHandlers: this.#zoneHandlers.size,
            initialized: this.#initialized
        };
    }
}
