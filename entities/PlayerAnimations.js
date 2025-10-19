import { ANIMATION_CONSTANTS } from '../core/constants.js';

export class PlayerAnimations {
    constructor(player) {
        this.player = player;
        this.reset();
    }

    reset() {
        this.attackAnimation = 0;
        this.actionAnimation = 0;
        this.smokeAnimations = [];
        this.splodeAnimations = [];
        this.bumpOffsetX = 0;
        this.bumpOffsetY = 0;
        this.bumpFrames = 0;
        this.liftOffsetY = 0;
        this.liftFrames = 0;
        this.pickupHover = null; // { imageKey, frames, totalFrames, type, foodType }
    this.bowShot = null; // { frames, totalFrames, power }
    }

    startBump(deltaX, deltaY) {
        // Keep consistency with enemies (stronger visual bump)
        this.bumpOffsetX = deltaX * 24;
        this.bumpOffsetY = deltaY * 24;
        this.bumpFrames = ANIMATION_CONSTANTS.BUMP_ANIMATION_FRAMES;
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

    startSmokeAnimation() {
        this.smokeX = this.player.x;
        this.smokeY = this.player.y;
        this.smokeAnimationFrame = 18;
    }

    startSplodeAnimation(x, y) {
        const total = 36; // keep previous chosen value
        this.splodeAnimations.push({ x, y, frame: total, totalFrames: total });
    }

    update() {
        if (this.bumpFrames > 0) {
            this.bumpFrames--;
            this.bumpOffsetX *= 0.85;
            this.bumpOffsetY *= 0.85;
        }
        if (this.attackAnimation > 0) {
            this.attackAnimation--;
        }
        if (this.actionAnimation > 0) {
            this.actionAnimation--;
        }
        if (this.liftFrames > 0) {
            // Use animation constant for consistent timing
            this.liftFrames--;
            const total = ANIMATION_CONSTANTS.LIFT_FRAMES;
            const elapsed = total - this.liftFrames; // 0..total
            const t = Math.max(0, Math.min(1, elapsed / total)); // normalized 0..1
            // Make hop more pronounced: larger negative maxLift (upwards)
            const maxLift = -28; // pixels up at peak (more pronounced)
            // Use a sine ease (smooth up and down) for natural hop
            // sin(pi * t) goes 0 -> 1 -> 0 over t in [0,1]
            this.liftOffsetY = maxLift * Math.sin(Math.PI * t);
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