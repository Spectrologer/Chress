// @ts-check
import { TILE_TYPES, ANIMATION_CONSTANTS, PHYSICS_CONSTANTS } from '../core/constants/index.js';
import { Position } from '../core/Position.js';

/**
 * @typedef {Object} EnemyData
 * @property {number} x - X coordinate
 * @property {number} y - Y coordinate
 * @property {string} [enemyType] - Enemy type (lizard, lizardy, lizardo, lizord, zard, lizardeaux, lazerd)
 * @property {string} [id] - Unique identifier
 * @property {number} [health] - Health points
 */

/**
 * @typedef {Object} SmokeAnimation
 * @property {number} x - X coordinate
 * @property {number} y - Y coordinate
 * @property {number} frame - Remaining frames
 */

/**
 * Base enemy class with position tracking and animation support
 * Extended by Enemy class which adds movement and attack mixins
 */
export class BaseEnemy {
    /**
     * Creates a new BaseEnemy instance
     * @param {EnemyData} data - Enemy initialization data
     */
    constructor(data) {
        /** @type {Position} */
        this._position = new Position(data.x, data.y);

        /** @type {Position} */
        this._lastPosition = this._position.clone();

        // Maintain x, y properties for backward compatibility
        Object.defineProperty(this, 'x', {
            get() { return this._position.x; },
            set(value) { this._position.x = value; }
        });
        Object.defineProperty(this, 'y', {
            get() { return this._position.y; },
            set(value) { this._position.y = value; }
        });
        Object.defineProperty(this, 'lastX', {
            get() { return this._lastPosition.x; },
            set(value) { this._lastPosition.x = value; }
        });
        Object.defineProperty(this, 'lastY', {
            get() { return this._lastPosition.y; },
            set(value) { this._lastPosition.y = value; }
        });

        /** @type {string} */
        this.enemyType = data.enemyType || 'lizard';

        /** @type {string} */
        this.id = data.id;

        /** @type {number} */
        this.health = 1;

        /** @type {number} */
        this.attack = 1;

        /** @type {boolean} */
        this.justAttacked = false;

        /** @type {number} */
        this.attackAnimation = 0; // Frames remaining for attack animation

        /** @type {number} */
        this.deathAnimation = 0; // Frames remaining for death animation

        /** @type {number} */
        this.bumpOffsetX = 0;

        /** @type {number} */
        this.bumpOffsetY = 0;

        /** @type {number} */
        this.bumpFrames = 0;

        /** @type {number} */
        this.liftOffsetY = 0;

        /** @type {number} */
        this.liftFrames = 0;

        /** @type {Array<SmokeAnimation>} */
        this.smokeAnimations = [];

        /** @type {boolean} */
        this.isFrozen = false; // Frozen when player is on exit tile

        /** @type {boolean} */
        this.showFrozenVisual = false; // Visual grayscale effect (removed 1 turn earlier than isFrozen)

        // Add a small scaling factor for lizardy to prevent clipping
        if (this.enemyType === 'lizardy') {
            /** @type {number} */
            this.scale = PHYSICS_CONSTANTS.LIZARDY_SCALE;
        }
    }

    /**
     * Get point value for defeating this enemy
     * @returns {number} Point value
     */
    getPoints() {
        switch (this.enemyType) {
            case 'lizardy':
                return 1;
            case 'lizardo':
            case 'lizord':
            case 'zard':
                return 3;
            case 'lizardeaux':
                return 5;
            case 'lazerd':
                return 9;
            default:
                return 0;
        }
    }

    /**
     * Take damage and check if enemy is killed
     * @param {number} damage - Damage amount
     * @returns {boolean} True if enemy is dead
     */
    takeDamage(damage) {
        this.health -= damage;
        // Stop any ongoing movement animations if the enemy is killed
        if (this.health <= 0) {
            this.bumpFrames = 0;
            this.bumpOffsetX = 0;
            this.bumpOffsetY = 0;
            this.liftFrames = 0;
            this.liftOffsetY = 0;
        }
        return this.health <= 0;
    }

    /**
     * Set enemy position
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {void}
     */
    setPosition(x, y) {
        this._lastPosition = this._position.clone();
        this._position = new Position(x, y);
    }

    /**
     * Get enemy position as plain object
     * @returns {{x: number, y: number}} Position object
     */
    getPosition() {
        return this._position.toObject();
    }

    /**
     * Gets the internal Position object (useful for Position methods)
     * @returns {Position}
     */
    getPositionObject() {
        return this._position;
    }

    /**
     * Check if enemy is dead
     * @returns {boolean} True if dead
     */
    isDead() {
        return this.health <= 0;
    }

    /**
     * Start death animation
     * @returns {void}
     */
    startDeathAnimation() {
        this.deathAnimation = ANIMATION_CONSTANTS.DEATH_ANIMATION_FRAMES;
    }

    /**
     * Start bump animation
     * @param {number} deltaX - X direction (-1, 0, or 1)
     * @param {number} deltaY - Y direction (-1, 0, or 1)
     * @returns {void}
     */
    startBump(deltaX, deltaY) {
        // Set initial bump offset (towards the other entity)
        this.bumpOffsetX = deltaX * PHYSICS_CONSTANTS.BUMP_OFFSET_MAGNITUDE;
        this.bumpOffsetY = deltaY * PHYSICS_CONSTANTS.BUMP_OFFSET_MAGNITUDE;
        this.bumpFrames = ANIMATION_CONSTANTS.BUMP_ANIMATION_FRAMES;
    }

    /**
     * Update all animation frames
     * @returns {void}
     */
    updateAnimations() {
        if (this.deathAnimation > 0) {
            this.deathAnimation--;
        }
        if (this.bumpFrames > 0) {
            this.bumpFrames--;
            // Gradually reduce the offset
            this.bumpOffsetX *= PHYSICS_CONSTANTS.BUMP_DECAY_FACTOR;
            this.bumpOffsetY *= PHYSICS_CONSTANTS.BUMP_DECAY_FACTOR;
        }
        if (this.attackAnimation > 0) {
            this.attackAnimation--;
        }
        if (this.liftFrames > 0) {
            this.liftFrames--;
            // Use same timing constant as player and a smoother sine curve for hop
            const total = ANIMATION_CONSTANTS.LIFT_FRAMES;
            const elapsed = total - this.liftFrames; // 0..total
            const t = Math.max(0, Math.min(1, elapsed / total));
            const maxLift = -28; // match player's hop amplitude for visual parity
            this.liftOffsetY = maxLift * Math.sin(Math.PI * t);
        }
        this.smokeAnimations.forEach(anim => anim.frame--);
        this.smokeAnimations = this.smokeAnimations.filter(anim => anim.frame > 0);
    }

    /**
     * Check if a position is walkable for this enemy
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {Array<Array<any>>} grid - Game grid
     * @returns {boolean} True if walkable
     */
    isWalkable(x, y, grid) {
        const pos = new Position(x, y);

        // Enemies should respect the same general walkability rules as the player.
        // This check is modeled after the player's isWalkable method for consistency.
        if (!pos.isInBounds(grid.length)) {
            return false;
        }

        const tile = pos.getTile(grid);
        const tileType = tile && tile.type ? tile.type : tile;

        // List of generally walkable tile types for any character
        const walkableTypes = [
            TILE_TYPES.FLOOR,
            TILE_TYPES.WATER,
            TILE_TYPES.FOOD,
            TILE_TYPES.AXE,
            TILE_TYPES.HAMMER,
            TILE_TYPES.BISHOP_SPEAR,
            TILE_TYPES.HORSE_ICON,
            TILE_TYPES.BOMB,
            TILE_TYPES.NOTE,
            TILE_TYPES.HEART,
            TILE_TYPES.PORT,
            TILE_TYPES.PITFALL
        ];

        return walkableTypes.includes(tileType);
    }
}
