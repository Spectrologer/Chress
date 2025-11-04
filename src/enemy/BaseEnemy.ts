import { TILE_TYPES, ANIMATION_CONSTANTS, PHYSICS_CONSTANTS } from '@core/constants/index';
import { Position } from '@core/Position';

export interface EnemyData {
    x: number;
    y: number;
    enemyType?: string;
    id?: string;
    health?: number;
}

export interface SmokeAnimation {
    x: number;
    y: number;
    frame: number;
}

export class BaseEnemy {
    [key: string]: any;

    private _position: Position;
    private _lastPosition: Position;

    public x: number;
    public y: number;
    public lastX: number;
    public lastY: number;

    public enemyType: string;
    public id: string;
    public health: number;
    public attack: number;
    public justAttacked: boolean;
    public attackAnimation: number;
    public deathAnimation: number;
    public bumpOffsetX: number;
    public bumpOffsetY: number;
    public bumpFrames: number;
    public liftOffsetY: number;
    public liftFrames: number;
    public smokeAnimations: SmokeAnimation[];
    public isFrozen: boolean;
    public showFrozenVisual: boolean;
    public scale?: number;

    constructor(data: EnemyData) {
        this._position = new Position(data.x, data.y);
        this._lastPosition = this._position.clone();

        Object.defineProperty(this, 'x', {
            get() { return this._position.x; },
            set(value: number) { this._position.x = value; }
        });
        Object.defineProperty(this, 'y', {
            get() { return this._position.y; },
            set(value: number) { this._position.y = value; }
        });
        Object.defineProperty(this, 'lastX', {
            get() { return this._lastPosition.x; },
            set(value: number) { this._lastPosition.x = value; }
        });
        Object.defineProperty(this, 'lastY', {
            get() { return this._lastPosition.y; },
            set(value: number) { this._lastPosition.y = value; }
        });

        this.enemyType = data.enemyType || 'lizard';
        this.id = data.id || '';
        this.health = 1;
        this.attack = 1;
        this.justAttacked = false;
        this.attackAnimation = 0;
        this.deathAnimation = 0;
        this.bumpOffsetX = 0;
        this.bumpOffsetY = 0;
        this.bumpFrames = 0;
        this.liftOffsetY = 0;
        this.liftFrames = 0;
        this.smokeAnimations = [];
        this.isFrozen = false;
        this.showFrozenVisual = false;

        if (this.enemyType === 'lizardy') {
            this.scale = PHYSICS_CONSTANTS.LIZARDY_SCALE;
        }
    }

    getPoints(): number {
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

    takeDamage(damage: number): boolean {
        this.health -= damage;
        if (this.health <= 0) {
            this.bumpFrames = 0;
            this.bumpOffsetX = 0;
            this.bumpOffsetY = 0;
            this.liftFrames = 0;
            this.liftOffsetY = 0;
        }
        return this.health <= 0;
    }

    setPosition(x: number, y: number): void {
        this._lastPosition = this._position.clone();
        this._position = new Position(x, y);
    }

    getPosition(): { x: number; y: number } {
        return this._position.toObject();
    }

    getPositionObject(): Position {
        return this._position;
    }

    isDead(): boolean {
        return this.health <= 0;
    }

    startDeathAnimation(): void {
        this.deathAnimation = ANIMATION_CONSTANTS.DEATH_ANIMATION_FRAMES;
    }

    startBump(deltaX: number, deltaY: number): void {
        this.bumpOffsetX = deltaX * PHYSICS_CONSTANTS.BUMP_OFFSET_MAGNITUDE;
        this.bumpOffsetY = deltaY * PHYSICS_CONSTANTS.BUMP_OFFSET_MAGNITUDE;
        this.bumpFrames = ANIMATION_CONSTANTS.BUMP_ANIMATION_FRAMES;
    }

    updateAnimations(): void {
        if (this.deathAnimation > 0) {
            this.deathAnimation--;
        }
        if (this.bumpFrames > 0) {
            this.bumpFrames--;
            this.bumpOffsetX *= PHYSICS_CONSTANTS.BUMP_DECAY_FACTOR;
            this.bumpOffsetY *= PHYSICS_CONSTANTS.BUMP_DECAY_FACTOR;
        }
        if (this.attackAnimation > 0) {
            this.attackAnimation--;
        }
        if (this.liftFrames > 0) {
            this.liftFrames--;
            const total = ANIMATION_CONSTANTS.LIFT_FRAMES;
            const elapsed = total - this.liftFrames;
            const t = Math.max(0, Math.min(1, elapsed / total));
            const maxLift = -28;
            this.liftOffsetY = maxLift * Math.sin(Math.PI * t);
        }
        this.smokeAnimations.forEach(anim => anim.frame--);
        this.smokeAnimations = this.smokeAnimations.filter(anim => anim.frame > 0);
    }

    isWalkable(x: number, y: number, grid: any[][]): boolean {
        const pos = new Position(x, y);

        if (!pos.isInBounds(grid.length)) {
            return false;
        }

        const tile = pos.getTile(grid);
        const tileType = tile && tile.type ? tile.type : tile;

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

    serialize(): any {
        return {
            x: this.x,
            y: this.y,
            lastX: this.lastX,
            lastY: this.lastY,
            enemyType: this.enemyType,
            id: this.id,
            health: this.health,
            attack: this.attack,
            justAttacked: this.justAttacked,
            attackAnimation: this.attackAnimation,
            deathAnimation: this.deathAnimation,
            bumpOffsetX: this.bumpOffsetX,
            bumpOffsetY: this.bumpOffsetY,
            bumpFrames: this.bumpFrames,
            liftOffsetY: this.liftOffsetY,
            liftFrames: this.liftFrames,
            smokeAnimations: this.smokeAnimations,
            isFrozen: this.isFrozen,
            showFrozenVisual: this.showFrozenVisual,
            scale: this.scale
        };
    }
}
