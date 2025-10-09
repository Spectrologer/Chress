export class MiniMap {
    constructor(game) {
        this.game = game;
    }

    renderZoneMap() {
        // Get actual canvas size from CSS (responsive)
        const mapSize = Math.min(this.game.mapCanvas.width, this.game.mapCanvas.height);
        // Calculate zone size for better visibility: aim for 8-9 zones visible with larger tiles
        const zoneSize = Math.max(18, Math.min(28, Math.floor(mapSize / 8.5)));
        const centerX = mapSize / 2;
        const centerY = mapSize / 2;

        // Clear the map with a parchment-like background
        this.game.mapCtx.fillStyle = '#E6D3A3';  // Warm parchment tone
        this.game.mapCtx.fillRect(0, 0, mapSize, mapSize);

        // Calculate visible range around current zone
        const range = 5; // Show 5 zones in each direction
        const currentZone = this.game.player.getCurrentZone();

        // Special case for Woodcutter's Club interior: show an axe icon instead of the map
        if (currentZone.x === 0 && currentZone.y === 0 && currentZone.dimension === 1) {
            const axeImage = this.game.textureManager.getImage('axe');
            if (axeImage && axeImage.complete) {
                // Draw the axe icon in the center of the map canvas
                const iconSize = mapSize * 0.7; // Make it large
                const iconX = (mapSize - iconSize) / 2;
                const iconY = (mapSize - iconSize) / 2;
                this.game.mapCtx.drawImage(axeImage, iconX, iconY, iconSize, iconSize);
            } else {
                // Fallback text if image isn't loaded
                this.game.mapCtx.fillStyle = '#2F1B14';
                this.game.mapCtx.font = 'bold 14px serif';
                this.game.mapCtx.fillText("Woodcutter's Club", mapSize / 2, mapSize / 2);
            }
            return; // Skip drawing the regular zone grid
        }

        for (let dy = -range; dy <= range; dy++) {
            for (let dx = -range; dx <= range; dx++) {
                const zoneX = currentZone.x + dx;
                const zoneY = currentZone.y + dy;

                const mapX = centerX + dx * zoneSize - zoneSize / 2;
                const mapY = centerY + dy * zoneSize - zoneSize / 2;

                // Determine zone color with parchment-friendly palette
                let color = '#C8B99C'; // Unexplored - darker parchment tone
                if (this.game.player.hasVisitedZone(zoneX, zoneY)) {
                    color = '#B8860B'; // Visited - darker gold
                }
                if (zoneX === currentZone.x && zoneY === currentZone.y) {
                    color = '#CD853F'; // Current - warm brown/gold
                }

                // Draw zone square
                this.game.mapCtx.fillStyle = color;
                this.game.mapCtx.fillRect(mapX, mapY, zoneSize - 2, zoneSize - 2);

                // Draw border with aged ink color
                this.game.mapCtx.strokeStyle = '#8B4513';  // Saddle brown for ink effect
                this.game.mapCtx.lineWidth = 1;
                this.game.mapCtx.strokeRect(mapX, mapY, zoneSize - 2, zoneSize - 2);

                // Draw coordinates for current zone
                if (zoneX === currentZone.x && zoneY === currentZone.y) {
                    this.game.mapCtx.fillStyle = '#2F1B14';  // Dark brown for text
                    this.game.mapCtx.font = 'bold 9px serif';  // Slightly larger and serif font
                    this.game.mapCtx.textAlign = 'center';
                    this.game.mapCtx.fillText(`${zoneX},${zoneY}`, mapX + zoneSize / 2, mapY + zoneSize / 2 + 3);
                }
            }
        }

        // Draw center crosshairs with aged ink color
        this.game.mapCtx.strokeStyle = '#8B4513';  // Matching the border color
        this.game.mapCtx.lineWidth = 2;  // Slightly thicker for visibility
        this.game.mapCtx.beginPath();
        this.game.mapCtx.moveTo(centerX - 6, centerY);
        this.game.mapCtx.lineTo(centerX + 6, centerY);
        this.game.mapCtx.moveTo(centerX, centerY - 6);
        this.game.mapCtx.lineTo(centerX, centerY + 6);
        this.game.mapCtx.stroke();
    }
}
