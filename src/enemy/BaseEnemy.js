import { TILE_TYPES, ANIMATION_CONSTANTS, PHYSICS_CONSTANTS } from '../core/constants/index.js';
import { Position } from '../core/Position.js';

export class BaseEnemy {
    constructor(data) {
        // Internal position tracking using Position class
        this._position = new Position(data.x, data.y);
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

        this.enemyType = data.enemyType || 'lizard';
        this.id = data.id;
        this.health = 1;
        this.attack = 1;
        this.justAttacked = false;
        this.attackAnimation = 0; // Frames remaining for attack animation
        this.deathAnimation = 0; // Frames remaining for death animation
        this.bumpOffsetX = 0;
        this.bumpOffsetY = 0;
        this.bumpFrames = 0;
        this.liftOffsetY = 0;
        this.liftFrames = 0;
        this.smokeAnimations = [];
        this.isFrozen = false; // Frozen when player is on exit tile
        this.showFrozenVisual = false; // Visual grayscale effect (removed 1 turn earlier than isFrozen)

        // Add a small scaling factor for lizardy to prevent clipping
        if (this.enemyType === 'lizardy') {
            this.scale = PHYSICS_CONSTANTS.LIZARDY_SCALE;
        }
    }

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

    setPosition(x, y) {
        this._lastPosition = this._position.clone();
        this._position = new Position(x, y);
    }

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

    isDead() {
        return this.health <= 0;
    }

    startDeathAnimation() {
        this.deathAnimation = ANIMATION_CONSTANTS.DEATH_ANIMATION_FRAMES;
    }

    startBump(deltaX, deltaY) {
        // Set initial bump offset (towards the other entity)
        this.bumpOffsetX = deltaX * PHYSICS_CONSTANTS.BUMP_OFFSET_MAGNITUDE;
        this.bumpOffsetY = deltaY * PHYSICS_CONSTANTS.BUMP_OFFSET_MAGNITUDE;
        this.bumpFrames = ANIMATION_CONSTANTS.BUMP_ANIMATION_FRAMES;
    }

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
