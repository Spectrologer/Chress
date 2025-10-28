import { ANIMATION_CONSTANTS, PHYSICS_CONSTANTS } from '../core/constants/index.js';
import { RENDERING_CONSTANTS } from '../core/constants/animation.js';

export class PlayerAnimations {
    constructor(player) {
        this.player = player;
        this.reset();
    }

    reset() {
        this.attackAnimation = 0;
        this.actionAnimation = 0;
        this.damageAnimation = 0; // frames remaining for damage flash
        this.smokeAnimations = [];
        this.splodeAnimations = [];
        this.bumpOffsetX = 0;
        this.bumpOffsetY = 0;
        this.bumpFrames = 0;
        this.backflipFrames = 0; // frames remaining for backflip rotation
        this.backflipTotal = 0; // total frames for backflip
        this.backflipAngle = 0; // current rotation angle in radians
    this.backflipLiftOffsetY = 0; // vertical offset for backflip jump
    this.backflipLiftFrames = 0;
    this.backflipLiftTotal = 0;
        this.liftOffsetY = 0;
        this.liftFrames = 0;
        this.pickupHover = null; // { imageKey, frames, totalFrames, type, foodType }
    this.bowShot = null; // { frames, totalFrames, power }
    }

    startBump(deltaX, deltaY) {
        // Strong visual bump for damage feedback
        this.bumpOffsetX = deltaX * PHYSICS_CONSTANTS.BUMP_OFFSET_MAGNITUDE;
        this.bumpOffsetY = deltaY * PHYSICS_CONSTANTS.BUMP_OFFSET_MAGNITUDE;
        this.bumpFrames = ANIMATION_CONSTANTS.BUMP_ANIMATION_FRAMES;
    }

    startBackflip(frames = ANIMATION_CONSTANTS.BACKFLIP_DEFAULT_FRAMES) {
        // Sequence: bump -> small delay -> jump+rotate -> land
        // Optional: keep the bump visual for a short moment before the flip
        // We'll use a small delay to separate the bump from the rotation.
        this.backflipInProgress = true;
        this.backflipDelayFrames = ANIMATION_CONSTANTS.BACKFLIP_DELAY_FRAMES;
        // rotation is slightly slower than lift
        this.backflipFrames = Math.max(1, Math.round(frames * PHYSICS_CONSTANTS.BACKFLIP_ROTATION_FACTOR));
        this.backflipTotal = this.backflipFrames;
        this.backflipAngle = 0;
        // Jump slightly higher than normal lift for backflip
        this.backflipLiftFrames = Math.max(ANIMATION_CONSTANTS.BACKFLIP_DELAY_FRAMES, Math.floor(frames * PHYSICS_CONSTANTS.BACKFLIP_LIFT_FRAME_RATIO));
        this.backflipLiftTotal = this.backflipLiftFrames;
        this.backflipLiftOffsetY = 0;
    }

    startAttackAnimation() {
        this.attackAnimation = ANIMATION_CONSTANTS.ATTACK_ANIMATION_FRAMES;
        // Sound is played by the initiating controller (InteractionController/
        // InteractionManager) so the played SFX can be context-sensitive
        // (e.g., play 'slash' when the player has an axe). Avoid playing a
        // generic attack/procedural sound here to prevent double sounds.
    }

    startActionAnimation() {
        this.actionAnimation = ANIMATION_CONSTANTS.ATTACK_ANIMATION_FRAMES;
    }

    startDamageAnimation() {
        this.damageAnimation = ANIMATION_CONSTANTS.DAMAGE_FLASH_FRAMES;
    }

    startSmokeAnimation() {
        this.smokeX = this.player.x;
        this.smokeY = this.player.y;
        this.smokeAnimationFrame = ANIMATION_CONSTANTS.SMOKE_FRAME_LIFETIME;
    }

    startSplodeAnimation(x, y) {
        const total = ANIMATION_CONSTANTS.SPLODE_FRAMES;
        this.splodeAnimations.push({ x, y, frame: total, totalFrames: total });
    }

    update() {
        if (this.bumpFrames > 0) {
            this.bumpFrames--;
            this.bumpOffsetX *= PHYSICS_CONSTANTS.BUMP_DECAY_FACTOR;
            this.bumpOffsetY *= PHYSICS_CONSTANTS.BUMP_DECAY_FACTOR;
        }
        // Backflip handling: if a backflip was initiated, wait the delay then perform jump+rotation
        if (this.backflipInProgress) {
            if (this.backflipDelayFrames > 0) {
                this.backflipDelayFrames--;
                // keep bump offset visual until delay completes
            } else {
                // Perform rotation if frames remain
                if (this.backflipFrames > 0) {
                    const elapsed = this.backflipTotal - this.backflipFrames; // 0..total-1
                    const t = Math.max(0, Math.min(1, elapsed / Math.max(1, this.backflipTotal)));
                    // Ease-in-out for nicer motion
                    const ease = ANIMATION_CONSTANTS.EASE_BASE - ANIMATION_CONSTANTS.EASE_AMPLITUDE * Math.cos(Math.PI * t);
                    // Single full rotation, counterclockwise (-2PI)
                    this.backflipAngle = -ease * Math.PI * 2; // 0..-2PI
                    this.backflipFrames--;
                    if (this.backflipFrames === 0) {
                        this.backflipAngle = 0;
                        this.backflipInProgress = false; // finished
                    }
                }

                // Backflip vertical jump: quick up-and-down movement
                if (this.backflipLiftFrames > 0) {
                    this.backflipLiftFrames--;
                    const elapsedL = this.backflipLiftTotal - this.backflipLiftFrames; // 0..total
                    const tL = Math.max(0, Math.min(1, elapsedL / Math.max(1, this.backflipLiftTotal)));
                    // Use sine to do 0 -> 1 -> 0 over tL
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
            // Use animation constant for consistent timing
            this.liftFrames--;
            const total = ANIMATION_CONSTANTS.LIFT_FRAMES;
            const elapsed = total - this.liftFrames; // 0..total
            const t = Math.max(0, Math.min(1, elapsed / total)); // normalized 0..1
            // Use a sine ease (smooth up and down) for natural hop
            // sin(pi * t) goes 0 -> 1 -> 0 over t in [0,1]
            this.liftOffsetY = PHYSICS_CONSTANTS.STANDARD_LIFT_AMPLITUDE * Math.sin(Math.PI * t);
        } else {
            this.liftOffsetY = 0;
        }
        this.smokeAnimations.forEach(anim => anim.frame--);
        this.smokeAnimations = this.smokeAnimations.filter(anim => anim.frame > 0);
        this.splodeAnimations.forEach(anim => anim.frame--);
        this.splodeAnimations = this.splodeAnimations.filter(anim => anim.frame > 0);

        // Update pickup hover animation (brief float above player's head)
        if (this.pickupHover) {
            this.pickupHover.frames--;
            if (this.pickupHover.frames <= 0) {
                this.pickupHover = null;
            }
        }
        // Update bowShot animation
        if (this.bowShot) {
            this.bowShot.frames--;
            if (this.bowShot.frames <= 0) this.bowShot = null;
        }
    }
}