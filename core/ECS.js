import { ComponentFactory, DataContractValidator } from './DataContracts.js';
import logger from './logger.js';
import { COMPONENT_TYPES, ENTITY_SCHEMAS } from './constants.js';

/**
 * Entity Component System implementation
 * Manages entities, components, and their relationships
 */
export class ECS {
    constructor() {
        this.entities = new Map();
        this.components = new Map();
        this.nextEntityId = 1;

        // Initialize component maps for each component type
        Object.values(COMPONENT_TYPES).forEach(componentType => {
            this.components.set(componentType, new Map());
        });
    }

    /**
     * Creates a new entity and returns its ID
     * @param {string} entityType - Type of entity (ENEMY, TILE, ITEM, etc.)
     * @param {object} properties - Additional properties for the entity
     * @returns {number} - The new entity ID
     */
    createEntity(entityType = 'DEFAULT', properties = {}) {
        const entityId = this.nextEntityId++;
        const entity = {
            id: entityId,
            type: entityType,
            components: new Set(),
            ...properties
        };

        this.entities.set(entityId, entity);
        return entityId;
    }

    /**
     * Destroys an entity and all its components
     * @param {number} entityId - The entity ID to destroy
     */
    destroyEntity(entityId) {
        if (!this.entities.has(entityId)) {
            logger.warn(`Attempted to destroy non-existent entity: ${entityId}`);
            return;
        }

        const entity = this.entities.get(entityId);
        entity.components.forEach(componentType => {
            this.removeComponent(entityId, componentType);
        });

        this.entities.delete(entityId);
    }

    /**
     * Adds a component to an entity
     * @param {number} entityId - The entity ID
     * @param {object} component - The component to add
     */
    addComponent(entityId, component) {
        if (!this.entities.has(entityId)) {
            throw new Error(`Entity ${entityId} does not exist`);
        }

        const entity = this.entities.get(entityId);
        const componentType = component.type;

        // Remove existing component of this type if present
        if (entity.components.has(componentType)) {
            this.removeComponent(entityId, componentType);
        }

        // Add component to component map
        const componentMap = this.components.get(componentType);
        componentMap.set(entityId, component);

        // Mark entity as having this component
        entity.components.add(componentType);
    }

    /**
     * Removes a component from an entity
     * @param {number} entityId - The entity ID
     * @param {string} componentType - The component type to remove
     */
    removeComponent(entityId, componentType) {
        if (!this.entities.has(entityId)) {
            return; // Silently ignore for non-existent entities
        }

        const entity = this.entities.get(entityId);
        if (!entity.components.has(componentType)) {
            return; // Component not present
        }

        // Remove from component map
        const componentMap = this.components.get(componentType);
        componentMap.delete(entityId);

        // Remove from entity components set
        entity.components.delete(componentType);
    }

    /**
     * Gets a component from an entity
     * @param {number} entityId - The entity ID
     * @param {string} componentType - The component type
     * @returns {object|null} - The component or null if not found
     */
    getComponent(entityId, componentType) {
        const componentMap = this.components.get(componentType);
        return componentMap ? componentMap.get(entityId) || null : null;
    }

    /**
     * Checks if an entity has a specific component
     * @param {number} entityId - The entity ID
     * @param {string} componentType - The component type
     * @returns {boolean} - True if the entity has the component
     */
    hasComponent(entityId, componentType) {
        const entity = this.entities.get(entityId);
        return entity ? entity.components.has(componentType) : false;
    }

    /**
     * Gets all entities with specific components (intersection)
     * @param {string[]} componentTypes - Array of component types
     * @returns {number[]} - Array of entity IDs that have ALL specified components
     */
    getEntitiesWithComponents(componentTypes) {
        const result = new Set();

        // Start with all entities
        const firstComponentType = componentTypes[0];
        if (!firstComponentType) {
            return Array.from(this.entities.keys());
        }

        const firstComponentMap = this.components.get(firstComponentType);
        if (!firstComponentMap) {
            return [];
        }

        // Initialize with entities having the first component
        firstComponentMap.forEach((_, entityId) => {
            result.add(entityId);
        });

        // Filter by remaining components
        for (let i = 1; i < componentTypes.length; i++) {
            const componentType = componentTypes[i];
            const componentMap = this.components.get(componentType);
            if (!componentMap) {
                result.clear();
                break;
            }

            // Remove entities that don't have this component
            for (const entityId of result) {
                if (!componentMap.has(entityId)) {
                    result.delete(entityId);
                }
            }
        }

        return Array.from(result);
    }

    /**
     * Updates entity validation against its schema
     * @param {number} entityId - The entity ID
     * @returns {boolean} - True if valid
     */
    validateEntity(entityId) {
        const entity = this.entities.get(entityId);
        if (!entity) {
            throw new Error(`Entity ${entityId} does not exist`);
        }

        const schema = ENTITY_SCHEMAS[entity.type];
        if (!schema) {
            // No schema defined - assume valid
            return true;
        }

        // Check required components
        for (const requiredComponent of schema.required) {
            if (!this.hasComponent(entityId, requiredComponent)) {
                throw new Error(`Entity ${entityId} (${entity.type}) missing required component: ${requiredComponent}`);
            }
        }

        // Optional components don't need to be checked for presence
        return true;
    }

    /**
     * Gets component data for rendering
     * @param {number} entityId - The entity ID
     * @returns {object|null} - Render data object
     */
    getRenderData(entityId) {
        const position = this.getComponent(entityId, COMPONENT_TYPES.POSITION);
        const render = this.getComponent(entityId, COMPONENT_TYPES.RENDER);
        const animation = this.getComponent(entityId, COMPONENT_TYPES.ANIMATION);

        if (!position || !render) {
            return null;
        }

        return {
            entityId,
            position: { x: position.x, y: position.y },
            render: { ...render },
            animation: animation ? { ...animation } : null
        };
    }

    /**
     * Gets debug information about the ECS state
     * @returns {object} - Debug information
     */
    getDebugInfo() {
        const entitiesInfo = {};
        this.entities.forEach((entity, entityId) => {
            entitiesInfo[entityId] = {
                type: entity.type,
                components: Array.from(entity.components)
            };
        });

        const componentsInfo = {};
        this.components.forEach((componentMap, componentType) => {
            componentsInfo[componentType] = componentMap.size;
        });

        return {
            entityCount: this.entities.size,
            nextEntityId: this.nextEntityId,
            entities: entitiesInfo,
            components: componentsInfo
        };
    }

    /**
     * Clears all entities and components
     */
    clear() {
        this.entities.clear();
        this.components.forEach(componentMap => componentMap.clear());
        this.nextEntityId = 1;
    }
}

/**
 * System for managing tile entities specifically
 */
export class TileSystem {
    constructor(ecs, gridWidth = 9, gridHeight = 9) {
        this.ecs = ecs;
        this.grid = Array(gridHeight).fill().map(() => Array(gridWidth).fill(null));
        this.tilesToEntities = new Map(); // tile(x,y) -> entityId
        this.entitiesToTiles = new Map(); // entityId -> tile(x,y)
    }

    /**
     * Sets a tile at a specific position
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number|object} tileData - Tile data
     */
    setTile(x, y, tileData) {
        DataContractValidator.validateTile(tileData);

        // Remove existing tile entity if present
        if (this.grid[y][x] !== null) {
            const existingEntityId = this.tilesToEntities.get(`${x},${y}`);
            if (existingEntityId) {
                this.ecs.destroyEntity(existingEntityId);
                this.tilesToEntities.delete(`${x},${y}`);
                this.entitiesToTiles.delete(existingEntityId);
            }
        }

        // Create new tile entity
        this.grid[y][x] = tileData;
        const entityId = this.ecs.createEntity('TILE', { x, y });

        // Add components
        this.ecs.addComponent(entityId, ComponentFactory.createPosition(x, y));
        this.ecs.addComponent(entityId, ComponentFactory.createTileRender(tileData));
        this.ecs.addComponent(entityId, ComponentFactory.createCollision(true, 1, 1));

        // Track mapping
        this.tilesToEntities.set(`${x},${y}`, entityId);
        this.entitiesToTiles.set(entityId, { x, y });
    }

    /**
     * Gets the tile at a specific position
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {number|object|null} - The tile data or null
     */
    getTile(x, y) {
        if (x < 0 || x >= this.grid[0].length || y < 0 || y >= this.grid.length) {
            return null;
        }
        return this.grid[y][x];
    }

    /**
     * Gets the entity ID for a tile position
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {number|null} - The entity ID or null
     */
    getTileEntity(x, y) {
        return this.tilesToEntities.get(`${x},${y}`) || null;
    }

    /**
     * Gets the position for a tile entity
     * @param {number} entityId - The entity ID
     * @returns {object|null} - The position {x, y} or null
     */
    getEntityTile(entityId) {
        return this.entitiesToTiles.get(entityId) || null;
    }

    /**
     * Checks if a position is walkable
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {boolean} - True if walkable
     */
    isWalkable(x, y) {
        const tile = this.getTile(x, y);
        if (tile === null) return false;

        // Get entity ID and check collision component
        const entityId = this.getTileEntity(x, y);
        if (entityId) {
            const collision = this.ecs.getComponent(entityId, COMPONENT_TYPES.COLLISION);
            if (collision && collision.solid) {
                return false;
            }
        }

        // TODO: Add tile-specific walkability logic based on TILE_TYPES
        return true;
    }

    /**
     * Finds all tiles of a specific type
     * @param {number|object} tileType - Tile type to search for
     * @returns {Array} - Array of {x, y} positions
     */
    findTilesOfType(tileType) {
        const positions = [];
        for (let y = 0; y < this.grid.length; y++) {
            for (let x = 0; x < this.grid[y].length; x++) {
                const tile = this.grid[y][x];
                if (tile === tileType || (typeof tile === 'object' && tile.type === tileType)) {
                    positions.push({ x, y });
                }
            }
        }
        return positions;
    }
}

/**
 * System for managing enemy entities
 */
export class EnemySystem {
    constructor(ecs, tileSystem) {
        this.ecs = ecs;
        this.tileSystem = tileSystem;
        this.activeEnemies = new Set();
    }

    /**
     * Creates a new enemy entity
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} enemyType - Enemy type (lizardy, zard, etc.)
     * @param {object} stats - Enemy stats {health, attack, etc.}
     * @returns {number} - The new enemy entity ID
     */
    createEnemy(x, y, enemyType, stats = {}) {
        const entityId = this.ecs.createEntity('ENEMY', { enemyType, creationTime: Date.now() });

        // Create components
        this.ecs.addComponent(entityId, ComponentFactory.createPosition(x, y));
        this.ecs.addComponent(entityId, ComponentFactory.createRender(enemyType, 1));
        this.ecs.addComponent(entityId, ComponentFactory.createHealth(stats.health || 1, stats.health || 1));
        this.ecs.addComponent(entityId, ComponentFactory.createAttack(stats.attack || 1));
        this.ecs.addComponent(entityId, ComponentFactory.createMovement(1, false));
        this.ecs.addComponent(entityId, ComponentFactory.createCollision(true, 1, 1));
        this.ecs.addComponent(entityId, ComponentFactory.createLifecycle('active'));

        // Track enemy
        this.activeEnemies.add(entityId);

        return entityId;
    }

    /**
     * Moves an enemy to a new position
     * @param {number} entityId - Enemy entity ID
     * @param {number} newX - New X position
     * @param {number} newY - New Y position
     * @returns {boolean} - True if move was successful
     */
    moveEnemy(entityId, newX, newY) {
        if (!this.activeEnemies.has(entityId)) {
            return false;
        }

        // Check if position is occupied or blocked
        if (!this.tileSystem.isWalkable(newX, newY)) {
            return false;
        }

        // Check for other enemies at target position
        const enemiesAtTarget = this.getEnemiesAtPosition(newX, newY);
        if (enemiesAtTarget.length > 0) {
            return false;
        }

        // Update position component
        const position = this.ecs.getComponent(entityId, COMPONENT_TYPES.POSITION);
        if (position) {
            position.x = newX;
            position.y = newY;
        }

        return true;
    }

    /**
     * Gets all enemies at a specific position
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {number[]} - Array of enemy entity IDs
     */
    getEnemiesAtPosition(x, y) {
        return this.ecs.getEntitiesWithComponents([COMPONENT_TYPES.POSITION, COMPONENT_TYPES.HEALTH])
            .filter(entityId => {
                const position = this.ecs.getComponent(entityId, COMPONENT_TYPES.POSITION);
                return position.x === x && position.y === y;
            });
    }

    /**
     * Gets all active enemies
     * @returns {number[]} - Array of active enemy entity IDs
     */
    getActiveEnemies() {
        return Array.from(this.activeEnemies).filter(entityId => {
            const lifecycle = this.ecs.getComponent(entityId, COMPONENT_TYPES.LIFECYCLE);
            return lifecycle && lifecycle.state !== 'destroyed';
        });
    }

    /**
     * Destroys an enemy
     * @param {number} entityId - Enemy entity ID
     */
    destroyEnemy(entityId) {
        if (this.activeEnemies.has(entityId)) {
            // Set lifecycle to destroyed
            const lifecycle = this.ecs.getComponent(entityId, COMPONENT_TYPES.LIFECYCLE);
            if (lifecycle) {
                lifecycle.state = 'destroyed';
            }

            // Remove from active tracking
            this.activeEnemies.delete(entityId);
        }
    }

    /**
     * Updates enemy lifecycle states (handles death animation, cleanup)
     */
    updateEnemyLifecycles() {
        this.activeEnemies.forEach(entityId => {
            const lifecycle = this.ecs.getComponent(entityId, COMPONENT_TYPES.LIFECYCLE);
            const health = this.ecs.getComponent(entityId, COMPONENT_TYPES.HEALTH);

            if (health && health.current <= 0 && lifecycle.state === 'active') {
                lifecycle.state = 'dying';
                // TODO: Add death animation component
            }

            if (lifecycle.state === 'dying') {
                // TODO: Check if death animation finished, then destroy
            }
        });
    }
}
