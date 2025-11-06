import { ANIMATION_CONSTANTS, PHYSICS_CONSTANTS } from '@core/constants/index';
import { RENDERING_CONSTANTS } from '@core/constants/animation';
import type { Player } from './Player';

interface PickupHover {
    imageKey: string;
    frames: number;
    totalFrames: number;
    type: string;
    foodType?: string;
}

interface BowShot {
    frames: number;
    totalFrames: number;
    power: number;
}

interface SmokeAnimation {
    x: number;
    y: number;
    frame: number;
}

interface SplodeAnimation {
    x: number;
    y: number;
    frame: number;
    totalFrames: number;
}

export class PlayerAnimations {
    private player: Player;

    public attackAnimation: number;
    public actionAnimation: number;
    public damageAnimation: number;
    public smokeAnimations: SmokeAnimation[];
    public splodeAnimations: SplodeAnimation[];
    public bumpOffsetX: number;
    public bumpOffsetY: number;
    public bumpFrames: number;
    public backflipFrames: number;
    public backflipTotal: number;
    public backflipAngle: number;
    public backflipLiftOffsetY: number;
    public backflipLiftFrames: number;
    public backflipLiftTotal: number;
    public liftOffsetY: number;
    public liftFrames: number;
    public pickupHover: PickupHover | null;
    public bowShot: BowShot | null;
    public backflipInProgress?: boolean;
    public backflipDelayFrames?: number;
    public smokeX?: number;
    public smokeY?: number;
    public smokeAnimationFrame?: number;

    constructor(player: Player) {
        this.player = player;
        this.attackAnimation = 0;
        this.actionAnimation = 0;
        this.damageAnimation = 0;
        this.smokeAnimations = [];
        this.splodeAnimations = [];
        this.bumpOffsetX = 0;
        this.bumpOffsetY = 0;
        this.bumpFrames = 0;
        this.backflipFrames = 0;
        this.backflipTotal = 0;
        this.backflipAngle = 0;
        this.backflipLiftOffsetY = 0;
        this.backflipLiftFrames = 0;
        this.backflipLiftTotal = 0;
        this.liftOffsetY = 0;
        this.liftFrames = 0;
        this.pickupHover = null;
        this.bowShot = null;
        this.reset();
    }

    reset(): void {
        this.attackAnimation = 0;
        this.actionAnimation = 0;
        this.damageAnimation = 0;
        this.smokeAnimations = [];
        this.splodeAnimations = [];
        this.bumpOffsetX = 0;
        this.bumpOffsetY = 0;
        this.bumpFrames = 0;
        this.backflipFrames = 0;
        this.backflipTotal = 0;
        this.backflipAngle = 0;
        this.backflipLiftOffsetY = 0;
        this.backflipLiftFrames = 0;
        this.backflipLiftTotal = 0;
        this.liftOffsetY = 0;
        this.liftFrames = 0;
        this.pickupHover = null;
        this.bowShot = null;
    }

    startBump(deltaX: number, deltaY: number): void {
        this.bumpOffsetX = deltaX * PHYSICS_CONSTANTS.BUMP_OFFSET_MAGNITUDE;
        this.bumpOffsetY = deltaY * PHYSICS_CONSTANTS.BUMP_OFFSET_MAGNITUDE;
        this.bumpFrames = ANIMATION_CONSTANTS.BUMP_ANIMATION_FRAMES;
    }

    startBackflip(frames: number = ANIMATION_CONSTANTS.BACKFLIP_DEFAULT_FRAMES): void {
        this.backflipInProgress = true;
        this.backflipDelayFrames = ANIMATION_CONSTANTS.BACKFLIP_DELAY_FRAMES;
        this.backflipFrames = Math.max(1, Math.round(frames * PHYSICS_CONSTANTS.BACKFLIP_ROTATION_FACTOR));
        this.backflipTotal = this.backflipFrames;
        this.backflipAngle = 0;
        this.backflipLiftFrames = Math.max(ANIMATION_CONSTANTS.BACKFLIP_DELAY_FRAMES, Math.floor(frames * PHYSICS_CONSTANTS.BACKFLIP_LIFT_FRAME_RATIO));
        this.backflipLiftTotal = this.backflipLiftFrames;
        this.backflipLiftOffsetY = 0;
    }

    startAttackAnimation(): void {
        this.attackAnimation = ANIMATION_CONSTANTS.ATTACK_ANIMATION_FRAMES;
    }

    startActionAnimation(): void {
        this.actionAnimation = ANIMATION_CONSTANTS.ATTACK_ANIMATION_FRAMES;
    }

    startDamageAnimation(): void {
        this.damageAnimation = ANIMATION_CONSTANTS.DAMAGE_FLASH_FRAMES;
    }

    startSmokeAnimation(): void {
        this.smokeX = this.player.x;
        this.smokeY = this.player.y;
        this.smokeAnimationFrame = ANIMATION_CONSTANTS.SMOKE_FRAME_LIFETIME;
    }

    startSplodeAnimation(x: number, y: number): void {
        const total = ANIMATION_CONSTANTS.SPLODE_FRAMES;
        this.splodeAnimations.push({ x, y, frame: total, totalFrames: total });
    }

    update(): void {
        if (this.bumpFrames > 0) {
            this.bumpFrames--;
            this.bumpOffsetX *= PHYSICS_CONSTANTS.BUMP_DECAY_FACTOR;
            this.bumpOffsetY *= PHYSICS_CONSTANTS.BUMP_DECAY_FACTOR;
        }

        if (this.backflipInProgress) {
            if (this.backflipDelayFrames && this.backflipDelayFrames > 0) {
                this.backflipDelayFrames--;
            } else {
                if (this.backflipFrames > 0) {
                    const elapsed = this.backflipTotal - this.backflipFrames;
                    const t = Math.max(0, Math.min(1, elapsed / Math.max(1, this.backflipTotal)));
                    const ease = ANIMATION_CONSTANTS.EASE_BASE - ANIMATION_CONSTANTS.EASE_AMPLITUDE * Math.cos(Math.PI * t);
                    this.backflipAngle = -ease * Math.PI * 2;
                    this.backflipFrames--;
                    if (this.backflipFrames === 0) {
                        this.backflipAngle = 0;
                        this.backflipInProgress = false;
                    }
                }

                if (this.backflipLiftFrames > 0) {
                    this.backflipLiftFrames--;
                    const elapsedL = this.backflipLiftTotal - this.backflipLiftFrames;
                    const tL = Math.max(0, Math.min(1, elapsedL / Math.max(1, this.backflipLiftTotal)));
                    this.backflipLiftOffsetY = PHYSICS_CONSTANTS.BACKFLIP_LIFT_AMPLITUDE * Math.sin(Math.PI * tL);
                    if (this.backflipLiftFrames === 0) this.backflipLiftOffsetY = 0;
                }
            }
        }

        if (this.attackAnimation > 0) {
            this.attackAnimation--;
        }
        if (this.actionAnimation > 0) {
            this.actionAnimation--;
        }
        if (this.damageAnimation > 0) {
            this.damageAnimation--;
        }
        if (this.liftFrames > 0) {
            this.liftFrames--;
            const total = ANIMATION_CONSTANTS.LIFT_FRAMES;
            const elapsed = total - this.liftFrames;
            const t = Math.max(0, Math.min(1, elapsed / total));
            this.liftOffsetY = PHYSICS_CONSTANTS.STANDARD_LIFT_AMPLITUDE * Math.sin(Math.PI * t);
        } else {
            this.liftOffsetY = 0;
        }

        this.smokeAnimations.forEach(anim => anim.frame--);
        // Remove expired smoke animations in place to avoid GC pressure
        for (let i = this.smokeAnimations.length - 1; i >= 0; i--) {
            if (this.smokeAnimations[i].frame <= 0) {
                this.smokeAnimations.splice(i, 1);
            }
        }
        this.splodeAnimations.forEach(anim => anim.frame--);
        // Remove expired splode animations in place to avoid GC pressure
        for (let i = this.splodeAnimations.length - 1; i >= 0; i--) {
            if (this.splodeAnimations[i].frame <= 0) {
                this.splodeAnimations.splice(i, 1);
            }
        }

        if (this.pickupHover) {
            this.pickupHover.frames--;
            if (this.pickupHover.frames <= 0) {
                this.pickupHover = null;
            }
        }

        if (this.bowShot) {
            this.bowShot.frames--;
            if (this.bowShot.frames <= 0) this.bowShot = null;
        }
    }
}
