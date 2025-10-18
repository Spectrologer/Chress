import { ZoneStateManager } from '../generators/ZoneStateManager.js';

export class MiniMap {
    constructor(game) {
        this.game = game;
        this.isExpanded = false;
        this.expandedCanvas = null;
        this.expandedCtx = null;
        this.panX = 0;
        this.panY = 0;
        this.lastX = 0;
        this.lastY = 0;
        this.isDragging = false;
    }

    setupEvents() {
        const smallCanvas = document.getElementById('zoneMap');
        const overlay = document.getElementById('expandedMapOverlay');
        this.expandedCanvas = document.getElementById('expandedMapCanvas');
        this.expandedCtx = this.expandedCanvas.getContext('2d');

        // Expand on click/tap inside minimap
    // smallCanvas expand is handled via pointer events only
    smallCanvas.addEventListener('pointerup', (e) => { try { e.preventDefault(); } catch (err) {} ; this.expand(); });

        // Retract on click/tap outside expanded minimap
    overlay.addEventListener('pointerup', (e) => { try { e.preventDefault(); } catch (err) {} ; this.retract(); });

        // Prevent retraction when clicking/tapping on the expanded minimap itself
    this.expandedCanvas.addEventListener('pointerdown', (e) => e.stopPropagation());

        // Panning for expanded map
        // Pointer-based panning for expanded map canvas
        this.expandedCanvas.addEventListener('pointerdown', (e) => {
            this.isDragging = true;
            this.lastX = e.clientX;
            this.lastY = e.clientY;
            try { e.target.setPointerCapture?.(e.pointerId); } catch (err) {}
        });

        this.expandedCanvas.addEventListener('pointermove', (e) => {
            if (this.isDragging && e.pointerType) {
                // Invert pan direction for intuitive map movement
                this.panX -= (this.lastX - e.clientX) / 90;
                this.panY -= (this.lastY - e.clientY) / 90;
                this.lastX = e.clientX;
                this.lastY = e.clientY;
                this.renderExpanded();
            }
        });

        this.expandedCanvas.addEventListener('pointerup', (e) => {
            this.isDragging = false;
            try { e.target.releasePointerCapture?.(e.pointerId); } catch (err) {}
        });
        this.expandedCanvas.addEventListener('pointerleave', () => {
            this.isDragging = false;
        });
    }

    expand() {
        if (this.isExpanded) return; // Already expanded
        this.isExpanded = true;
        this.panX = 0;
        this.panY = 0;
        const overlay = document.getElementById('expandedMapOverlay');
        overlay.classList.add('show');
        this.renderExpanded();
    }

    renderExpanded() {
        // Ensure the canvas is a square and matches CSS size
        const rect = this.expandedCanvas.getBoundingClientRect();
        const size = Math.floor(Math.min(rect.width, rect.height));
        this.expandedCanvas.width = size;
        this.expandedCanvas.height = size;
        this.renderZoneMap({ctx: this.expandedCtx, offsetX: this.panX, offsetY: this.panY, isExpanded: true, canvasSize: size});
    }

    retract() {
        if (!this.isExpanded) return; // Not expanded
        this.isExpanded = false;
        const overlay = document.getElementById('expandedMapOverlay');
        overlay.classList.remove('show');
    }

    renderZoneMap(params = {}) {
        const { ctx = this.game.mapCtx, offsetX = 0, offsetY = 0, isExpanded = false, canvasSize = null } = params;

        // Responsive square size
        const mapSize = canvasSize || Math.min(ctx.canvas.width, ctx.canvas.height);
        // More tiles visible in expanded mode
        const visibleZoneCount = isExpanded ? 15 : 5.5;
        const zoneSize = Math.max(isExpanded ? 30 : 20, Math.min(isExpanded ? 64 : 36, Math.floor(mapSize / visibleZoneCount)));
        const centerX = mapSize / 2;
        const centerY = mapSize / 2;

        // Clear the map with a parchment-like background
        ctx.fillStyle = '#E6D3A3';  // Warm parchment tone
        ctx.fillRect(0, 0, mapSize, mapSize);

        // Calculate visible range around current zone
        const range = Math.floor(mapSize / zoneSize / 2) + 1; // Dynamically calculate range
        const currentZone = this.game.player.getCurrentZone();

        // Special case for Woodcutter's Club interior: show an axe icon instead of the map
        if (currentZone.x === 0 && currentZone.y === 0 && currentZone.dimension === 1) {
            const axeImage = this.game.textureManager.getImage('axe');
            if (axeImage && axeImage.complete) {
                // Draw the axe icon in the center of the map canvas
                const iconSize = mapSize * 0.7; // Make it large
                const iconX = (mapSize - iconSize) / 2;
                const iconY = (mapSize - iconSize) / 2;
                ctx.drawImage(axeImage, iconX, iconY, iconSize, iconSize);
            } else {
                // Fallback text if image isn't loaded
                ctx.fillStyle = '#2F1B14';
                ctx.font = 'bold 14px serif';
                ctx.fillText("Woodcutter's Club", mapSize / 2, mapSize / 2);
            }
            return; // Skip drawing the regular zone grid
        }



        for (let dy = -range; dy <= range; dy++) {
            for (let dx = -range; dx <= range; dx++) {
                // Panning: offsetX/offsetY are in tile units
                const zoneX = currentZone.x + dx - Math.round(offsetX);
                const zoneY = currentZone.y + dy - Math.round(offsetY);

                const mapX = centerX + dx * zoneSize - zoneSize / 2;
                const mapY = centerY + dy * zoneSize - zoneSize / 2;

                // Determine zone color with parchment-friendly palette
                let color = '#C8B99C'; // Unexplored - darker parchment tone
                if (this.game.player.hasVisitedZone(zoneX, zoneY, currentZone.dimension)) {
                    if (currentZone.dimension === 2) {
                        color = '#4B0082'; // Indigo for visited underground
                    } else {
                        // Color code by zone level for the overworld
                        const zoneLevel = ZoneStateManager.getZoneLevel(zoneX, zoneY);
                        switch (zoneLevel) {
                            case 1: // Home
                                color = '#B8860B'; // Darker gold
                                break;
                            case 2: // Woods
                                color = '#556B2F'; // Dark Olive Green
                                break;
                            case 3: // Wilds
                                color = '#8B4513'; // Saddle Brown
                                break;
                            case 4: // Frontier
                                color = '#D2691E'; // Chocolate/Orange-Brown
                                break;
                        }
                    }
                }
                if (zoneX === currentZone.x && zoneY === currentZone.y) {
                    color = '#CD853F'; // Current - warm brown/gold
                }

                // Draw zone square
                ctx.fillStyle = color;
                ctx.fillRect(mapX, mapY, zoneSize - 2, zoneSize - 2);

                // Draw border with aged ink color
                ctx.strokeStyle = '#8B4513';  // Saddle brown for ink effect
                ctx.lineWidth = 1;
                ctx.strokeRect(mapX, mapY, zoneSize - 2, zoneSize - 2);

                // Draw marked tile indicator (X)
                if (this.game.player.isTileMarked && this.game.player.isTileMarked(zoneX, zoneY)) {
                    ctx.fillStyle = '#8B0000'; // Dark red for the mark
                    ctx.font = `bold ${zoneSize * 0.9}px serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('X', mapX + (zoneSize / 2), mapY + (zoneSize / 2) + 1);
                }

                // Draw star icon for special zones (from map notes)
                const zoneKey = `${zoneX},${zoneY}`;
                if (this.game.specialZones.has(zoneKey)) {
                    ctx.fillStyle = '#000000'; // Black color for the star
                    ctx.font = `bold ${zoneSize * 0.9}px serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('★', mapX + (zoneSize / 2), mapY + (zoneSize / 2) + 1);
                }

                // Draw club icon for the home zone (0,0) in the overworld
                if (zoneX === 0 && zoneY === 0 && currentZone.dimension === 0) {
                    ctx.fillStyle = '#2F1B14'; // Dark brown for the symbol
                    ctx.font = `bold ${zoneSize * 0.8}px serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    // Draw the club symbol in the center of the tile
                    ctx.fillText('♣', mapX + (zoneSize / 2), mapY + (zoneSize / 2) + 1);
                }

                // Draw player icon (king symbol) for the current zone
                if (zoneX === currentZone.x && zoneY === currentZone.y) {
                    ctx.fillStyle = '#2F1B14'; // Dark brown for the symbol
                    // Make the font size relative to the zone tile size for good scaling
                    ctx.font = `bold ${zoneSize * 0.8}px serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    // Draw the king symbol in the center of the tile
                    ctx.fillText('♔', mapX + (zoneSize / 2), mapY + (zoneSize / 2) + 1);
                }


            }
        }
    }
}
