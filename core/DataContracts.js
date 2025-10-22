import { TILE_SCHEMAS, ANIMATION_SCHEMAS, ENTITY_SCHEMAS, COMPONENT_TYPES } from './constants.js';

/**
 * Data Contract Validation System
 * Ensures all data structures conform to defined schemas
 */
export class DataContractValidator {

    /**
     * Validates a tile object against the appropriate schema
     * @param {any} tile - The tile object to validate
     * @returns {boolean} - True if valid
     * @throws {Error} - If validation fails
     */
    static validateTile(tile) {
        if (typeof tile === 'number') {
            // Primitive tile - should be a valid TILE_TYPES enum value
            return this.validatePrimitiveTile(tile);
        } else if (typeof tile === 'object' && tile !== null) {
            // Object tile - should have required properties
            return this.validateObjectTile(tile);
        }
        throw new Error(`Invalid tile format: expected number or object, got ${typeof tile}`);
    }

    /**
     * Validates a primitive tile (number representing TILE_TYPES)
     * @param {number} tileType - The tile type number
     * @returns {boolean} - True if valid
     */
    static validatePrimitiveTile(tileType) {
        if (typeof tileType !== 'number') {
            throw new Error(`Primitive tile must be a number, got ${typeof tileType}`);
        }
        // Basic validation - tile type should be a valid integer
        if (!Number.isInteger(tileType) || tileType < 0) {
            throw new Error(`Invalid tile type: ${tileType}. Must be a non-negative integer.`);
        }
        return true;
    }

    /**
     * Validates an object tile with properties
     * @param {object} tile - The tile object to validate
     * @returns {boolean} - True if valid
     */
    static validateObjectTile(tile) {
        if (!tile.type) {
            throw new Error('Object tile must have a "type" property');
        }
        this.validatePrimitiveTile(tile.type);

        // Additional property validation can be added per tile type
        switch (tile.type) {
            case 'BOMB':
                return this.validateBombTile(tile);
            case 'BISHOP_SPEAR':
            case 'HORSE_ICON':
                return this.validateChargedItemTile(tile);
            case 'BOW':
                return this.validateBowTile(tile);
            case 'SIGN':
                return this.validateSignTile(tile);
            case 'FOOD':
                return this.validateFoodTile(tile);
            default:
                // Default validation for unknown object tiles
                return true;
        }
    }

    /**
     * Validates bomb tile properties
     */
    static validateBombTile(tile) {
        if (typeof tile.actionsSincePlaced !== 'number') {
            throw new Error('Bomb tile must have numeric "actionsSincePlaced" property');
        }
        if (tile.actionsSincePlaced < 0) {
            throw new Error('Bomb "actionsSincePlaced" must be non-negative');
        }
        if (typeof tile.justPlaced !== 'boolean') {
            throw new Error('Bomb tile must have boolean "justPlaced" property (if present)');
        }
        return true;
    }

    /**
     * Validates charged item tile properties
     */
    static validateChargedItemTile(tile) {
        if (typeof tile.uses !== 'number' || !Number.isInteger(tile.uses)) {
            throw new Error('Charged item tile must have integer "uses" property');
        }
        if (tile.uses < 0 || tile.uses > 3) {
            throw new Error('Charged item "uses" must be between 0 and 3');
        }
        return true;
    }

    /**
     * Validates bow tile properties
     */
    static validateBowTile(tile) {
        if (typeof tile.uses !== 'number' || !Number.isInteger(tile.uses)) {
            throw new Error('Bow tile must have integer "uses" property');
        }
        if (tile.uses < 0 || tile.uses > 3) {
            throw new Error('Bow "uses" must be between 0 and 3');
        }
        return true;
    }

    /**
     * Validates sign tile properties
     */
    static validateSignTile(tile) {
        if (typeof tile.message !== 'string') {
            throw new Error('Sign tile must have string "message" property');
        }
        return true;
    }

    /**
     * Validates food tile properties
     */
    static validateFoodTile(tile) {
        if (typeof tile.foodType !== 'string') {
            throw new Error('Food tile must have string "foodType" property');
        }
        return true;
    }

    /**
     * Validates animation data against schemas
     * @param {string} animationType - Type of animation (POINT, ARROW, etc.)
     * @param {object} animationData - The animation data object
     * @returns {boolean} - True if valid
     */
    static validateAnimation(animationType, animationData) {
        const schema = ANIMATION_SCHEMAS[animationType];
        if (!schema) {
            throw new Error(`Unknown animation type: ${animationType}`);
        }

        for (const [property, expectedType] of Object.entries(schema)) {
            const value = animationData[property];
            if (value === undefined) {
                throw new Error(`Animation ${animationType} missing required property: ${property}`);
            }
            this.validatePropertyType(value, expectedType, `${animationType}.${property}`);
        }
        return true;
    }

    /**
     * Validates a property's type
     * @param {*} value - The value to check
     * @param {string} expectedType - The expected type
     * @param {string} propertyPath - Path for error reporting
     */
    static validatePropertyType(value, expectedType, propertyPath) {
        switch (expectedType) {
            case 'number':
                if (typeof value !== 'number' || isNaN(value)) {
                    throw new Error(`${propertyPath} must be a valid number, got ${typeof value}`);
                }
                break;
            case 'string':
                if (typeof value !== 'string') {
                    throw new Error(`${propertyPath} must be a string, got ${typeof value}`);
                }
                break;
            case 'boolean':
                if (typeof value !== 'boolean') {
                    throw new Error(`${propertyPath} must be a boolean, got ${typeof value}`);
                }
                break;
            case 'object':
                if (typeof value !== 'object' || value === null) {
                    throw new Error(`${propertyPath} must be an object, got ${typeof value}`);
                }
                break;
            default:
                throw new Error(`Unknown type validation: ${expectedType}`);
        }
    }
}

/**
 * ECS Component Factory
 * Creates properly structured components
 */
export class ComponentFactory {

    /**
     * Creates a position component
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {object} - Position component
     */
    static createPosition(x, y) {
        return { x, y, type: COMPONENT_TYPES.POSITION };
    }

    /**
     * Creates a render component for tiles
     * @param {number|object} tileData - Tile data
     * @returns {object} - Render component
     */
    static createTileRender(tileData) {
        DataContractValidator.validateTile(tileData);
        return {
            type: COMPONENT_TYPES.RENDER,
            tileData,
            renderType: 'tile'
        };
    }

    /**
     * Creates a render component for entities
     * @param {string} textureKey - Texture key
     * @param {number} zIndex - Render z-index
     * @returns {object} - Render component
     */
    static createEntityRender(textureKey, zIndex = 0) {
        return {
            type: COMPONENT_TYPES.RENDER,
            textureKey,
            zIndex,
            renderType: 'entity'
        };
    }

    /**
     * Creates a health component
     * @param {number} maxHealth - Maximum health value
     * @param {number} currentHealth - Current health value
     * @returns {object} - Health component
     */
    static createHealth(maxHealth, currentHealth = maxHealth) {
        if (currentHealth > maxHealth || currentHealth < 0) {
            throw new Error(`Invalid health values: current=${currentHealth}, max=${maxHealth}`);
        }
        return {
            type: COMPONENT_TYPES.HEALTH,
            max: maxHealth,
            current: currentHealth
        };
    }

    /**
     * Creates an attack component
     * @param {number} damage - Base damage
     * @param {number} range - Attack range
     * @returns {object} - Attack component
     */
    static createAttack(damage, range = 1) {
        return {
            type: COMPONENT_TYPES.ATTACK,
            damage,
            range,
            lastAttacked: 0
        };
    }

    /**
     * Creates a movement component
     * @param {number} speed - Movement speed
     * @param {boolean} justAttackedFlag - Whether entity just attacked
     * @returns {object} - Movement component
     */
    static createMovement(speed = 1, justAttackedFlag = false) {
        return {
            type: COMPONENT_TYPES.MOVEMENT,
            speed,
            lastX: 0,
            lastY: 0,
            justAttacked: justAttackedFlag
        };
    }

    /**
     * Creates an animation component
     * @param {object} animationData - Animation data
     * @returns {object} - Animation component
     */
    static createAnimation(animationData) {
        return {
            type: COMPONENT_TYPES.ANIMATION,
            ...animationData
        };
    }

    /**
     * Creates a collision component
     * @param {boolean} solid - Whether collision is solid/blocking
     * @param {number} width - Collision width
     * @param {number} height - Collision height
     * @returns {object} - Collision component
     */
    static createCollision(solid = true, width = 1, height = 1) {
        return {
            type: COMPONENT_TYPES.COLLISION,
            solid,
            width,
            height
        };
    }

    /**
     * Creates a lifecycle component
     * @param {string} state - Current lifecycle state
     * @param {object} metadata - Additional lifecycle metadata
     * @returns {object} - Lifecycle component
     */
    static createLifecycle(state = 'active', metadata = {}) {
        return {
            type: COMPONENT_TYPES.LIFECYCLE,
            state,
            metadata
        };
    }
}

/**
 * Animation Manager for managing different animation collections
 */
export class AnimationManager {

    constructor() {
        this.pointAnimations = [];
        this.arrowAnimations = [];
        this.horseChargeAnimations = [];
        this.bumpAnimations = [];
        this.liftAnimations = [];
        this.smokeAnimations = [];
        this.multiplierAnimations = [];
    }

    /**
     * Adds a point animation
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} amount - Point amount to display
     */
    addPointAnimation(x, y, amount) {
        const animation = { x, y, amount, frame: 30 };
        DataContractValidator.validateAnimation('POINT', animation);
        this.pointAnimations.push(animation);
    }

    /**
     * Adds a multiplier animation (e.g. x2, x3) shown near an enemy when combos occur
     * @param {number} x - X tile coordinate
     * @param {number} y - Y tile coordinate
     * @param {number} multiplier - Multiplier value (2,3,...)
     */
    addMultiplierAnimation(x, y, multiplier) {
        const animation = { x, y, multiplier, frame: 40 };
        DataContractValidator.validateAnimation('MULTIPLIER', animation);
        this.multiplierAnimations.push(animation);
    }

    /**
     * Adds an arrow animation
     * @param {number} startX - Start X position
     * @param {number} startY - Start Y position
     * @param {number} endX - End X position
     * @param {number} endY - End Y position
     */
    addArrowAnimation(startX, startY, endX, endY) {
        const animation = { startX, startY, endX, endY, frame: 20 };
        DataContractValidator.validateAnimation('ARROW', animation);
        this.arrowAnimations.push(animation);
    }

    /**
     * Adds a horse charge animation
     * @param {object} startPos - Start position {x, y}
     * @param {object} midPos - Midpoint position for L-shaped moves {x, y}
     * @param {object} endPos - End position {x, y}
     */
    addHorseChargeAnimation({ startPos, midPos, endPos }) {
        const animation = { startPos: { ...startPos }, midPos: { ...midPos }, endPos: { ...endPos }, frame: 20 };
        DataContractValidator.validateAnimation('HORSE_CHARGE', animation);
        this.horseChargeAnimations.push(animation);
    }

    /**
     * Adds a bump animation
     * @param {number} offsetX - X offset
     * @param {number} offsetY - Y offset
     * @param {number} frames - Number of frames
     */
    addBumpAnimation(offsetX, offsetY, frames = 15) {
        const animation = { offsetX, offsetY, frames };
        DataContractValidator.validateAnimation('BUMP', animation);
        this.bumpAnimations.push(animation);
    }

    /**
     * Adds a lift animation
     * @param {number} offsetY - Y offset
     * @param {number} frames - Number of frames
     */
    addLiftAnimation(offsetY, frames = 15) {
        const animation = { offsetY, frames };
        DataContractValidator.validateAnimation('LIFT', animation);
        this.liftAnimations.push(animation);
    }

    /**
     * Adds a smoke animation
     * @param {number} duration - Duration in frames
     */
    addSmokeAnimation(duration = 6) {
        const animation = { frame: duration };
        DataContractValidator.validateAnimation('SMOKE', animation);
        this.smokeAnimations.push(animation);
    }

    /**
     * Updates all animations (decrements frames, removes expired)
     */
    updateAnimations() {
        // Update point animations
        this.pointAnimations.forEach(anim => anim.frame--);
        this.pointAnimations = this.pointAnimations.filter(anim => anim.frame > 0);

        // Update arrow animations
        this.arrowAnimations.forEach(anim => anim.frame--);
        this.arrowAnimations = this.arrowAnimations.filter(anim => anim.frame > 0);

        // Update horse charge animations
        this.horseChargeAnimations.forEach(anim => anim.frame--);
        this.horseChargeAnimations = this.horseChargeAnimations.filter(anim => anim.frame > 0);

        // Update bump animations
        this.bumpAnimations.forEach(anim => {
            anim.frames--;
            // Gradually reduce offsets for smooth return
            anim.offsetX *= 0.85;
            anim.offsetY *= 0.85;
        });
        this.bumpAnimations = this.bumpAnimations.filter(anim => anim.frames > 0);

        // Update lift animations
        this.liftAnimations.forEach(anim => {
            anim.frames--;
            // Parabolic lift curve
            const progress = anim.frames / 15;
            const maxLift = -12;
            anim.offsetY = maxLift * 4 * progress * (1 - progress);
        });
        this.liftAnimations = this.liftAnimations.filter(anim => anim.frames > 0);

        // Update smoke animations
        this.smokeAnimations.forEach(anim => anim.frame--);
        this.smokeAnimations = this.smokeAnimations.filter(anim => anim.frame > 0);

        // Update multiplier animations
        this.multiplierAnimations.forEach(anim => anim.frame--);
        this.multiplierAnimations = this.multiplierAnimations.filter(anim => anim.frame > 0);
    }

    /**
     * Gets all active animations
     * @returns {object} - Object containing all animation arrays
     */
    getActiveAnimations() {
        return {
            pointAnimations: [...this.pointAnimations],
            arrowAnimations: [...this.arrowAnimations],
            horseChargeAnimations: [...this.horseChargeAnimations],
            bumpAnimations: [...this.bumpAnimations],
            liftAnimations: [...this.liftAnimations],
            smokeAnimations: [...this.smokeAnimations],
            multiplierAnimations: [...this.multiplierAnimations]
        };
    }

    /**
     * Clears all animations
     */
    clearAll() {
        this.pointAnimations = [];
        this.arrowAnimations = [];
        this.horseChargeAnimations = [];
        this.bumpAnimations = [];
        this.liftAnimations = [];
        this.smokeAnimations = [];
        this.multiplierAnimations = [];
    }
}
