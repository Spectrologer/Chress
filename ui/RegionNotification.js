// RegionNotification.js
// Handles region notification UI logic

export class RegionNotification {
    constructor(game) {
        this.game = game;
    }

    showRegionNotification(zoneX, zoneY) {
        const regionNotification = document.getElementById('regionNotification');
        if (!regionNotification) return;
        const regionName = this.generateRegionName(zoneX, zoneY);
        regionNotification.textContent = regionName;
        regionNotification.classList.add('show');
        // Prevent regionNotification from blocking pointer events
        regionNotification.style.pointerEvents = 'none';
        this.game.animationScheduler.createSequence()
            .wait(2000)
            .then(() => {
                regionNotification.classList.remove('show');
                regionNotification.style.pointerEvents = '';
            })
            .start();
    }

    generateRegionName(zoneX, zoneY) {
        const distance = Math.max(Math.abs(zoneX), Math.abs(zoneY));
        if (distance <= 2) return 'Home';
        else if (distance <= 8) return 'Woods';
        else if (distance <= 16) return 'Wilds';
        else return 'Frontier';
    }
}