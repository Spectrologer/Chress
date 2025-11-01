// RegionNotification.ts
// Handles region notification UI logic

interface GameInstance {
    animationScheduler: any;
}

export class RegionNotification {
    private game: GameInstance;

    constructor(game: GameInstance) {
        this.game = game;
    }

    showRegionNotification(zoneX: number, zoneY: number): void {
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

    generateRegionName(zoneX: number, zoneY: number): string {
        const distance = Math.max(Math.abs(zoneX), Math.abs(zoneY));
        if (distance <= 2) return 'Home';
        else if (distance <= 8) return 'Woods';
        else if (distance <= 16) return 'Wilds';
        else return 'Frontier';
    }
}
