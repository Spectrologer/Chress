import { TILE_TYPES, ANIMATION_CONSTANTS } from '../core/constants.js';

export class BaseEnemy {
    constructor(data) {
        this.x = data.x;
        this.y = data.y;
        this.lastX = this.x;
        this.lastY = this.y;
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

        // Add a small scaling factor for lizardy to prevent clipping
        if (this.enemyType === 'lizardy') {
            this.scale = 0.9; // Render at 90% of original size
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
        this.x = x;
        this.y = y;
    }

    getPosition() {
        return { x: this.x, y: this.y };
    }

    isDead() {
        return this.health <= 0;
    }

    startDeathAnimation() {
        this.deathAnimation = 15; // 15 frames of death animation
    }

    startBump(deltaX, deltaY) {
        // Set initial bump offset (towards the other entity)
        this.bumpOffsetX = deltaX * 24; // Increased from 16 for more impact
        this.bumpOffsetY = deltaY * 24;
        this.bumpFrames = ANIMATION_CONSTANTS.BUMP_ANIMATION_FRAMES;
    }

    updateAnimations() {
        if (this.deathAnimation > 0) {
            this.deathAnimation--;
        }
        if (this.bumpFrames > 0) {
            this.bumpFrames--;
            // Gradually reduce the offset
            this.bumpOffsetX *= 0.85; // Adjusted decay for smoother return
            this.bumpOffsetY *= 0.85;
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
        // Enemies should respect the same general walkability rules as the player.
        // This check is modeled after the player's isWalkable method for consistency.
        if (x < 0 || x >= grid.length || y < 0 || y >= grid.length) {
            return false;
        }

        const tile = grid[y][x];
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
