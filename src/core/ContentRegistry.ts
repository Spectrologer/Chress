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
import type { BaseItemEffect } from '../managers/inventory/effects/BaseItemEffect';

export interface ItemSpawnRules {
    minLevel?: number;
    maxLevel?: number;
    dimension?: number | 'any';
    isActivated?: boolean;
}

export interface ItemConfig {
    tileType: number;
    stackable?: boolean;
    radial?: boolean;
    effect?: BaseItemEffect;
    spawnWeight?: number;
    spawnRules?: ItemSpawnRules;
    getTooltip: (item: object) => string;
    getImageKey: (item: object) => string;
    renderStrategy?: object;
    metadata?: Record<string, unknown>;
}

export interface ItemDefinition extends ItemConfig {
    id: string;
}

export interface NPCPlacement {
    zone?: string;
    x?: number;
    y?: number;
    spawnWeight?: number;
    dimension?: number | string;
}

export interface NPCConfig {
    tileType: number;
    action: string;
    placement?: NPCPlacement;
    dialogue?: object;
    barter?: object;
    renderStrategy?: object;
    metadata?: Record<string, unknown>;
}

export interface NPCDefinition extends NPCConfig {
    id: string;
}

export interface EnemySpawnRules {
    level1?: number;
    level2?: number;
    level3?: number;
    level4?: number;
}

export interface EnemyConfig {
    weight: number;
    spawnRules?: EnemySpawnRules;
    behaviorType?: string;
    stats?: Record<string, number>;
    metadata?: Record<string, unknown>;
}

export interface EnemyDefinition extends EnemyConfig {
    id: string;
}

export interface ZoneHandlerConfig {
    name?: string;
    metadata?: Record<string, unknown>;
}

export interface ZoneHandlerDefinition {
    dimension: number;
    factory: (...args: unknown[]) => unknown;
    name: string;
    metadata: Record<string, unknown>;
}

export interface SpawnableEnemy {
    type: string;
    prob: number;
    weight: number;
}

export class ContentRegistry {
    private static items = new Map<string, ItemDefinition>();
    private static npcs = new Map<string, NPCDefinition>();
    private static enemies = new Map<string, EnemyDefinition>();
    private static zoneHandlers = new Map<number, ZoneHandlerDefinition>();
    private static initialized = false;

    /**
     * Register a new item type
     */
    static registerItem(id: string, config: ItemConfig): void {
        this.validateItemConfig(id, config);
        this.items.set(id, {
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
     */
    static registerNPC(id: string, config: NPCConfig): void {
        this.validateNPCConfig(id, config);
        this.npcs.set(id, {
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
     */
    static registerEnemy(id: string, config: EnemyConfig): void {
        this.validateEnemyConfig(id, config);
        this.enemies.set(id, {
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
     */
    static registerZoneHandler(dimension: number, handlerFactory: (...args: unknown[]) => unknown, config: ZoneHandlerConfig = {}): void {
        if (typeof dimension !== 'number') {
            throw new Error(`Zone dimension must be a number, got: ${typeof dimension}`);
        }
        if (typeof handlerFactory !== 'function') {
            throw new Error('Zone handler must be a factory function');
        }
        this.zoneHandlers.set(dimension, {
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
    static getItem(id: string): ItemDefinition | undefined {
        return this.items.get(id);
    }

    /**
     * Get item by tile type
     */
    static getItemByTileType(tileType: number): ItemDefinition | null {
        for (const item of this.items.values()) {
            if (item.tileType === tileType) {
                return item;
            }
        }
        return null;
    }

    /**
     * Get all registered items
     */
    static getAllItems(): ItemDefinition[] {
        return Array.from(this.items.values());
    }

    /**
     * Get all stackable items
     */
    static getStackableItems(): ItemDefinition[] {
        return Array.from(this.items.values()).filter(item => item.stackable);
    }

    /**
     * Get all radial items
     */
    static getRadialItems(): ItemDefinition[] {
        return Array.from(this.items.values()).filter(item => item.radial);
    }

    /**
     * Get items eligible for spawning in a zone
     */
    static getSpawnableItems(zoneLevel: number, dimension: number, depth: number = 1): ItemDefinition[] {
        return Array.from(this.items.values()).filter(item => {
            if (item.spawnWeight! <= 0) return false;

            const rules = item.spawnRules!;

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
    static getNPC(id: string): NPCDefinition | undefined {
        return this.npcs.get(id);
    }

    /**
     * Get NPC by tile type
     */
    static getNPCByTileType(tileType: number): NPCDefinition | null {
        for (const npc of this.npcs.values()) {
            if (npc.tileType === tileType) {
                return npc;
            }
        }
        return null;
    }

    /**
     * Get all registered NPCs
     */
    static getAllNPCs(): NPCDefinition[] {
        return Array.from(this.npcs.values());
    }

    /**
     * Get NPCs for a specific placement zone
     */
    static getNPCsForZone(zone: string): NPCDefinition[] {
        return Array.from(this.npcs.values()).filter(npc =>
            npc.placement && npc.placement.zone === zone
        );
    }

    /**
     * Get enemy configuration by ID
     */
    static getEnemy(id: string): EnemyDefinition | undefined {
        return this.enemies.get(id);
    }

    /**
     * Get all registered enemies
     */
    static getAllEnemies(): EnemyDefinition[] {
        return Array.from(this.enemies.values());
    }

    /**
     * Get enemies eligible for spawning at a zone level
     */
    static getSpawnableEnemies(zoneLevel: number): SpawnableEnemy[] {
        const enemies: SpawnableEnemy[] = [];
        for (const enemy of this.enemies.values()) {
            const prob = (enemy.spawnRules as any)[`level${zoneLevel}`];
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
    static getZoneHandler(dimension: number): ZoneHandlerDefinition | undefined {
        return this.zoneHandlers.get(dimension);
    }

    /**
     * Get all registered zone handlers
     */
    static getAllZoneHandlers(): ZoneHandlerDefinition[] {
        return Array.from(this.zoneHandlers.values());
    }

    // ==================== VALIDATION ====================

    private static validateItemConfig(id: string, config: ItemConfig): void {
        if (!id || typeof id !== 'string') {
            throw new Error('Item ID must be a non-empty string');
        }
        if (this.items.has(id)) {
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

    private static validateNPCConfig(id: string, config: NPCConfig): void {
        if (!id || typeof id !== 'string') {
            throw new Error('NPC ID must be a non-empty string');
        }
        if (this.npcs.has(id)) {
            throw new Error(`NPC "${id}" is already registered`);
        }
        if (typeof config.tileType !== 'number') {
            throw new Error(`NPC "${id}" must have a valid tileType number`);
        }
        if (!config.action || typeof config.action !== 'string') {
            throw new Error(`NPC "${id}" must have an action type`);
        }
    }

    private static validateEnemyConfig(id: string, config: EnemyConfig): void {
        if (!id || typeof id !== 'string') {
            throw new Error('Enemy ID must be a non-empty string');
        }
        if (this.enemies.has(id)) {
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
    static isInitialized(): boolean {
        return this.initialized;
    }

    /**
     * Mark registry as initialized (called after all content is registered)
     */
    static markInitialized(): void {
        this.initialized = true;
    }

    /**
     * Clear all registrations (useful for testing)
     */
    static clear(): void {
        this.items.clear();
        this.npcs.clear();
        this.enemies.clear();
        this.zoneHandlers.clear();
        this.initialized = false;
    }

    /**
     * Get registry statistics
     */
    static getStats(): { items: number; npcs: number; enemies: number; zoneHandlers: number; initialized: boolean } {
        return {
            items: this.items.size,
            npcs: this.npcs.size,
            enemies: this.enemies.size,
            zoneHandlers: this.zoneHandlers.size,
            initialized: this.initialized
        };
    }
}
