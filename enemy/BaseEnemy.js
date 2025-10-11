import { TILE_TYPES } from '../core/constants.js';

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
    }

    getPoints() {
        switch (this.enemyType) {
            case 'lizardy':
            case 'lizardo':
                return 1;
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
        this.bumpFrames = 15; // Increased from 10 for longer animation
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
            // Lift animation: parabolic curve (lift up then land)
            const progress = this.liftFrames / 15;
            const maxLift = -12; // Lift 12 pixels up (half tile roughly)
            this.liftOffsetY = maxLift * 4 * progress * (1 - progress); // Parabolic lift
        }
        this.smokeAnimations.forEach(anim => anim.frame--);
        this.smokeAnimations = this.smokeAnimations.filter(anim => anim.frame > 0);

        if (this.game && this.game.pointAnimations) {
            this.game.pointAnimations.forEach(anim => anim.frame--);
            this.game.pointAnimations = this.game.pointAnimations.filter(anim => anim.frame > 0);
        }
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
            TILE_TYPES.EXIT,
            TILE_TYPES.WATER,
            TILE_TYPES.FOOD,
            TILE_TYPES.AXE,
            TILE_TYPES.HAMMER,
            TILE_TYPES.BISHOP_SPEAR,
            TILE_TYPES.HORSE_ICON,
            TILE_TYPES.BOMB,
            TILE_TYPES.NOTE,
            TILE_TYPES.HEART,
            TILE_TYPES.PORT
        ];

        return walkableTypes.includes(tileType);
    }
}
