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
    }

    startBump(deltaX, deltaY) {
        this.bumpOffsetX = deltaX * 24;
        this.bumpOffsetY = deltaY * 24;
        this.bumpFrames = 15;
    }

    startAttackAnimation() {
        this.attackAnimation = 20;
        window.soundManager?.playSound('attack');
    }

    startActionAnimation() {
        this.actionAnimation = 15;
    }

    startSmokeAnimation() {
        this.smokeX = this.player.x;
        this.smokeY = this.player.y;
        this.smokeAnimationFrame = 18;
    }

    startSplodeAnimation(x, y) {
        // Make the splode animation slightly faster than the previous 48 frames but slower than original 16.
        // frame represents remaining frames; totalFrames is used by renderer to map to sprite frames
        const total = 36; // slightly faster visual than 48
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
            this.liftFrames--;
            const progress = this.liftFrames / 15;
            const maxLift = -12;
            this.liftOffsetY = maxLift * 4 * progress * (1 - progress);
        }
        this.smokeAnimations.forEach(anim => anim.frame--);
        this.smokeAnimations = this.smokeAnimations.filter(anim => anim.frame > 0);
        this.splodeAnimations.forEach(anim => anim.frame--);
        this.splodeAnimations = this.splodeAnimations.filter(anim => anim.frame > 0);
    }
}