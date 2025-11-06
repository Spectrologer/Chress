import type { IGame } from '@core/GameContext';
import { ZoneStateManager } from '@generators/ZoneStateManager';
import { UI_RENDERING_CONSTANTS } from '@core/constants/rendering';
import { EventListenerManager } from '@utils/EventListenerManager';

interface Zone {
    x: number;
    y: number;
    dimension: number;
}

interface Player {
    getCurrentZone(): Zone;
    hasVisitedZone(x: number, y: number, dimension: number): boolean;
    undergroundDepth?: number;
    getVisitedZones(): Set<string>;
    getSpentDiscoveries(): number;
}

interface TextureManager {
    getImage(name: string): HTMLImageElement | null;
}

interface RenderParams {
    ctx?: CanvasRenderingContext2D;
    offsetX?: number;
    offsetY?: number;
    isExpanded?: boolean;
    canvasSize?: number | null;
}

export class MiniMap {
    private game: IGame;
    private isExpanded: boolean;
    private expandedCanvas: HTMLCanvasElement | null;
    private expandedCtx: CanvasRenderingContext2D | null;
    private panX: number;
    private panY: number;
    private lastX: number;
    private lastY: number;
    private isDragging: boolean;
    private dragMoved: boolean;
    // highlights keyed by "x,y,dimension" -> shape string ("circle","triangle","star","diamond")
    private highlights: Record<string, string>;
    private eventManager: EventListenerManager;

    constructor(game: IGame) {
        this.game = game;
        this.isExpanded = false;
        this.expandedCanvas = null;
        this.expandedCtx = null;
        this.panX = 0;
        this.panY = 0;
        this.lastX = 0;
        this.lastY = 0;
        this.isDragging = false;
        this.dragMoved = false;
        this.highlights = {};
        this.eventManager = new EventListenerManager();
    }

    setupEvents(): void {
        const smallCanvas = document.getElementById('zoneMap') as HTMLCanvasElement | null;
        const overlay = document.getElementById('expandedMapOverlay');
        this.expandedCanvas = document.getElementById('expandedMapCanvas') as HTMLCanvasElement | null;
        if (this.expandedCanvas) {
            this.expandedCtx = this.expandedCanvas.getContext('2d');
        }

        if (!smallCanvas || !overlay || !this.expandedCanvas) {
            return;
        }

        // Expand on click/tap inside minimap
        // smallCanvas expand is handled via pointer events only
        this.eventManager.add(smallCanvas, 'pointerup', (e: PointerEvent) => {
            e?.preventDefault?.();
            this.expand();
        });

        // Retract on click/tap outside expanded minimap
        this.eventManager.add(overlay, 'pointerup', (e: PointerEvent) => {
            e?.preventDefault?.();
            this.retract();
        });

        // Prevent retraction when clicking/tapping on the expanded minimap itself
        this.eventManager.add(this.expandedCanvas, 'pointerdown', (e: PointerEvent) => e.stopPropagation());

        // Panning for expanded map
        // Pointer-based panning for expanded map canvas
        this.eventManager.addPointerSequence(this.expandedCanvas, {
            onDown: (e: PointerEvent) => {
                this.isDragging = true;
                this.dragMoved = false;
                this.lastX = e.clientX;
                this.lastY = e.clientY;
                (e.target as any)?.setPointerCapture?.(e.pointerId);
            },
            onMove: (e: PointerEvent) => {
                if (this.isDragging && e.pointerType) {
                    // If the pointer moved enough, mark as a drag so we don't interpret it as a click
                    const dx = Math.abs(this.lastX - e.clientX);
                    const dy = Math.abs(this.lastY - e.clientY);
                    if (dx > 2 || dy > 2) this.dragMoved = true;

                    // Invert pan direction for intuitive map movement
                    this.panX -= (this.lastX - e.clientX) / 90;
                    this.panY -= (this.lastY - e.clientY) / 90;
                    this.lastX = e.clientX;
                    this.lastY = e.clientY;
                    this.renderExpanded();
                }
            },
            onUp: (e: PointerEvent) => {
                // Stop propagation so overlay doesn't immediately retract
                e.stopPropagation();

                // If this interaction was a drag, don't treat it as a click highlight
                if (!this.dragMoved) {
                    this.handleExpandedClick(e);
                }

                this.isDragging = false;
                (e.target as any)?.releasePointerCapture?.(e.pointerId);
            }
        });

        this.eventManager.add(this.expandedCanvas, 'pointerleave', () => {
            this.isDragging = false;
        });
    }

    expand(): void {
        if (this.isExpanded) return; // Already expanded
        this.isExpanded = true;
        this.panX = 0;
        this.panY = 0;
        const overlay = document.getElementById('expandedMapOverlay');
        if (overlay) {
            overlay.classList.add('show');
        }
        this.renderExpanded();
    }

    private renderExpanded(): void {
        if (!this.expandedCanvas || !this.expandedCtx) return;

        // Ensure the canvas is a square and matches CSS size
        const rect = this.expandedCanvas.getBoundingClientRect();
        const size = Math.floor(Math.min(rect.width, rect.height));
        this.expandedCanvas.width = size;
        this.expandedCanvas.height = size;
        this.renderZoneMap({ctx: this.expandedCtx, offsetX: this.panX, offsetY: this.panY, isExpanded: true, canvasSize: size});
    }

    // Handle clicks on the expanded minimap to cycle highlight shapes
    private handleExpandedClick(e: MouseEvent): void {
        if (!this.expandedCanvas) return;
        const rect = this.expandedCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const mapSize = this.expandedCanvas.width; // renderExpanded keeps canvas square
        const visibleZoneCount = UI_RENDERING_CONSTANTS.MINIMAP_VISIBLE_ZONE_COUNT;
        const zoneSize = Math.max(30, Math.min(64, Math.floor(mapSize / visibleZoneCount)));
        const centerX = mapSize / 2;
        const centerY = mapSize / 2;

        const relX = x - centerX;
        const relY = y - centerY;
        const dx = Math.round(relX / zoneSize);
        const dy = Math.round(relY / zoneSize);

        const currentZone = this.game.player.getCurrentZone();
        const zoneX = currentZone.x + dx - Math.round(this.panX);
        const zoneY = currentZone.y + dy - Math.round(this.panY);
        const hk = `${zoneX},${zoneY},${currentZone.dimension}`;

        const shapes = ['circle', 'triangle', 'star', 'diamond', 'heart', 'club', null];
        const current = this.highlights?.[hk] ?? null;
        let idx = shapes.indexOf(current);
        if (idx === -1) idx = shapes.length - 1; // treat unknown as blank
        const next = shapes[(idx + 1) % shapes.length];
        if (next === null) {
            // remove highlight
            delete this.highlights[hk];
        } else {
            this.highlights[hk] = next;
        }

        // Re-render both expanded and small minimap so highlights appear immediately
        this.renderExpanded();
        this.renderZoneMap();
    }

    retract(): void {
        if (!this.isExpanded) return; // Not expanded
        this.isExpanded = false;
        const overlay = document.getElementById('expandedMapOverlay');
        if (overlay) {
            overlay.classList.remove('show');
        }
    }

    renderZoneMap(params: RenderParams = {}): void {
        const { ctx = this.game.mapCtx, offsetX = 0, offsetY = 0, isExpanded = false, canvasSize = null } = params;

        // Responsive square size
        const mapSize = canvasSize || Math.min(ctx.canvas.width, ctx.canvas.height);
        // More tiles visible in expanded mode
        const visibleZoneCount = isExpanded ? UI_RENDERING_CONSTANTS.MINIMAP_VISIBLE_ZONE_COUNT : 5.5;
        const zoneSize = Math.max(isExpanded ? 30 : 20, Math.min(isExpanded ? 64 : 36, Math.floor(mapSize / visibleZoneCount)));
        const centerX = mapSize / 2;
        const centerY = mapSize / 2;

        // Clear the map with a parchment-like background
        ctx.fillStyle = '#E6D3A3';  // Warm parchment tone
        ctx.fillRect(0, 0, mapSize, mapSize);

        // Calculate visible range around current zone
        const range = Math.floor(mapSize / zoneSize / 2) + 1; // Dynamically calculate range
        const currentZone = this.game.player.getCurrentZone();

        // Special case for Museum interior: show a pawn icon instead of the map
        if (currentZone.x === 0 && currentZone.y === 0 && currentZone.dimension === 1) {
            const pawnImage = this.game.textureManager.getImage('ui/pawn_white');
                if (pawnImage && pawnImage.complete) {
                    // Draw the pawn icon in the center of the map canvas
                    // Turn off image smoothing so the scaled-up icon remains crisp
                    // Preserve previous smoothing settings and restore after draw
                    const prevSmoothing = ctx.imageSmoothingEnabled;
                    const prevQuality = (ctx as any).imageSmoothingQuality;
                    ctx.imageSmoothingEnabled = false;
                    // Some browsers support imageSmoothingQuality; set to 'low' when disabling smoothing
                    if (typeof (ctx as any).imageSmoothingQuality !== 'undefined') (ctx as any).imageSmoothingQuality = 'low';

                    const iconSize = mapSize * 0.7; // Make it large
                    const iconX = (mapSize - iconSize) / 2;
                    const iconY = (mapSize - iconSize) / 2;
                    ctx.drawImage(pawnImage, iconX, iconY, iconSize, iconSize);

                    // Restore previous smoothing settings
                    ctx.imageSmoothingEnabled = prevSmoothing;
                    if (typeof prevQuality !== 'undefined' && typeof (ctx as any).imageSmoothingQuality !== 'undefined') (ctx as any).imageSmoothingQuality = prevQuality;
            } else {
                // Fallback text if image isn't loaded
                ctx.fillStyle = '#2F1B14';
                ctx.font = 'bold 14px serif';
                ctx.fillText("Museum", mapSize / 2, mapSize / 2);
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

                // Draw marked tile indicator (X) - feature disabled until implemented
                // if (this.game.player.isTileMarked && this.game.player.isTileMarked(zoneX, zoneY)) {
                //     ctx.fillStyle = '#8B0000'; // Dark red for the mark
                //     ctx.font = `bold ${zoneSize * 0.9}px serif`;
                //     ctx.textAlign = 'center';
                //     ctx.textBaseline = 'middle';
                //     ctx.fillText('X', mapX + (zoneSize / 2), mapY + (zoneSize / 2) + 1);
                // }

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

                // Draw highlight marker if present (only meaningful for expanded map but harmless otherwise)
                const hk = `${zoneX},${zoneY},${currentZone.dimension}`;
                const shape = this.highlights?.[hk];
                if (shape) {
                    // Map shape names to text glyphs and colors for crisp scaling
                    const glyphs: Record<string, string> = { circle: '●', triangle: '▲', star: '★', diamond: '◆', heart: '♥', club: '♣' };
                    const colorMap: Record<string, string> = {
                        // darker/muted, higher contrast against light gray/parchment
                        circle: '#8B0000',   // deep red
                        triangle: '#B45309', // dark orange/brown
                        star: '#B87333',     // bronze/gold-brown
                        diamond: '#5B21B6',  // deep purple
                        heart: '#9D174D',    // deep magenta
                        club: '#0F766E'      // dark teal
                    };
                    const glyph = glyphs[shape] || null;
                    if (glyph) {
                        // Draw a subtle dark outline then fill so glyphs remain legible on light backgrounds
                        ctx.save();
                        ctx.font = `bold ${zoneSize * 0.9}px serif`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        // Stroke for contrast
                        ctx.lineWidth = Math.max(1, Math.floor(zoneSize * 0.06));
                        ctx.strokeStyle = 'rgba(0,0,0,0.65)';
                        ctx.strokeText(glyph, mapX + (zoneSize / 2), mapY + (zoneSize / 2) + 1);
                        // Fill with the shape color
                        ctx.fillStyle = colorMap[shape] || '#111111';
                        ctx.fillText(glyph, mapX + (zoneSize / 2), mapY + (zoneSize / 2) + 1);
                        ctx.restore();
                    }
                }


            }
        }
    }

    /**
     * Cleanup all event listeners
     * Call this when destroying the MiniMap instance
     */
    cleanup(): void {
        this.eventManager.cleanup();
    }
}
