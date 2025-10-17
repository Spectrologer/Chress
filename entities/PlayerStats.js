export class PlayerStats {
    constructor(player) {
        this.player = player;
        this.reset();
    }

    reset() {
        this.health = 3;
        this.thirst = 50;
        this.hunger = 50;
        this.points = 0;
        this.spentDiscoveries = 0;
        this.dead = false;
        this.verbosePathAnimations = true; // Toggle for step-by-step movement animations
    }

    getThirst() {
        return this.thirst;
    }

    getHunger() {
        return this.hunger;
    }

    setThirst(value) {
        this.thirst = Math.max(0, Math.min(50, value));
        if (this.thirst === 0) {
            this.setDead();
        }
    }

    setHunger(value) {
        this.hunger = Math.max(0, Math.min(50, value));
        if (this.hunger === 0) {
            this.setDead();
        }
    }

    getHealth() {
        return this.health;
    }

    setHealth(value) {
        this.health = Math.max(0, value);
        if (this.health <= 0) {
            this.setDead();
        }
    }

    takeDamage(amount = 1) {
        this.setHealth(this.health - amount);
    }

    decreaseThirst(amount = 1) {
        this.setThirst(this.thirst - amount);
    }

    decreaseHunger(amount = 1) {
        this.setHunger(this.hunger - amount);
    }

    restoreThirst(amount = 10) {
        this.setThirst(this.thirst + amount);
    }

    restoreHunger(amount = 10) {
        this.setHunger(this.hunger + amount);
    }

    setDead() {
        if (!this.dead) {
            this.dead = true;
            this.player.sprite = 'SeparateAnim/dead';
        }
    }

    isDead() {
        return this.dead;
    }

    getPoints() {
        return this.points;
    }

    setPoints(value) {
        this.points = value || 0;
    }

    addPoints(amount) {
        this.points += amount;
    }

    getSpentDiscoveries() {
        return this.spentDiscoveries;
    }

    setSpentDiscoveries(value) {
        this.spentDiscoveries = value || 0;
    }
}
