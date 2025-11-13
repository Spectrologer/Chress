import { TILE_SIZE } from '@core/constants/index.js';
import { RendererUtils } from '@renderers/RendererUtils.js';
import { TileRenderStrategy } from './TileRenderStrategy.js';
import type { BaseRenderer } from '@renderers/types.js';
import type { MultiTileHandler } from '@renderers/MultiTileHandler.js';
import type { PortKind } from '@core/SharedTypes.js';

export class PortRenderStrategy extends TileRenderStrategy {
    private multiTileHandler: typeof MultiTileHandler;

    /** Port kinds that render as standalone features rather than structure doors */
    private static readonly STANDALONE_PORT_KINDS: ReadonlySet<PortKind> = new Set(['grate', 'stairdown', 'stairup']);

    constructor(images: Record<string, HTMLImageElement>, tileSize: number, multiTileHandler: typeof MultiTileHandler) {
        super(images, tileSize);
        this.multiTileHandler = multiTileHandler;
    }

    /**
     * Type guard to check if a tile has a valid portKind property
     */
    private hasPortKind(tile: any): tile is { type: number; portKind: PortKind } {
        return tile && typeof tile === 'object' && 'portKind' in tile && typeof tile.portKind === 'string';
    }

    /**
     * Check if this port should render as a standalone feature (not part of a structure)
     */
    private isStandalonePort(tileType: any): boolean {
        return this.hasPortKind(tileType) && PortRenderStrategy.STANDALONE_PORT_KINDS.has(tileType.portKind);
    }

    /**
     * Render the appropriate sprite for a given portKind
     * @returns true if a sprite was rendered, false otherwise
     */
    private renderPortKindSprite(ctx: CanvasRenderingContext2D, portKind: PortKind, pixelX: number, pixelY: number): boolean {
        switch (portKind) {
            case 'stairdown':
                if (RendererUtils.isImageLoaded(this.images, 'stairdown')) {
                    ctx.drawImage(this.images.stairdown, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
                    return true;
                }
                break;
            case 'stairup':
                if (RendererUtils.isImageLoaded(this.images, 'stairup')) {
                    ctx.drawImage(this.images.stairup, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
                    return true;
                }
                break;
            case 'grate':
                if (RendererUtils.isImageLoaded(this.images, 'doodads/grate')) {
                    ctx.drawImage(this.images['doodads/grate'], pixelX, pixelY, TILE_SIZE, TILE_SIZE);
                    return true;
                }
                break;
            case 'interior':
                // Draw a visual indicator for interior exit ports
                ctx.save();
                ctx.fillStyle = 'rgba(139, 69, 19, 0.4)'; // Semi-transparent brown
                ctx.fillRect(pixelX + 8, pixelY + 8, TILE_SIZE - 16, TILE_SIZE - 16);
                ctx.strokeStyle = 'rgba(205, 133, 63, 0.7)'; // Lighter brown border
                ctx.lineWidth = 2;
                ctx.strokeRect(pixelX + 8, pixelY + 8, TILE_SIZE - 16, TILE_SIZE - 16);
                ctx.restore();
                return true;
        }
        return false;
    }

    render(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        pixelX: number,
        pixelY: number,
        grid: any[][] | any,
        zoneLevel: number,
        baseRenderer: BaseRenderer,
        tileType?: any
    ): void {
        // Check if this PORT has a specific portKind (grate, stairdown, stairup) first
        // These should be rendered as their specific type, not as structure doors
        const hasSpecificPortKind = this.isStandalonePort(tileType);

        // PORT tiles are invisible overlays. Render the structure tile underneath them.
        // But skip structure detection if this is a grate/stairs that should render independently
        if (!hasSpecificPortKind) {
            const shackInfo = this.multiTileHandler.findShackPosition(x, y, grid);
            if (shackInfo) {
                this.renderShackTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer);
                return;
            }

            const houseInfo = this.multiTileHandler.findHousePosition(x, y, grid);
            if (houseInfo) {
                this.renderHouseTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer);
                return;
            }
        }

        // Interior zones use PORT as doors that transition back to surface; they are not holes.
        // Zone level 5 corresponds to interior zones in RenderManager. Don't render hole sprite there.
        if (zoneLevel === 5) {
            // Note: Floor tiles are now rendered in Pass 1 by RenderManager, so we don't re-render them here
            // This prevents covering up custom terrain textures (like museum floors)

            // If this PORT has a portKind (stairdown/stairup/interior), draw the corresponding doodad on top
            if (this.hasPortKind(tileType)) {
                this.renderPortKindSprite(ctx, tileType.portKind, pixelX, pixelY);
            }
            return;
        }

        // If it's not a door or grate and not interior, it's a simple hole from a shovel
        baseRenderer.renderItemBaseTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel);
        // If this PORT has a portKind (stairdown/stairup/grate), draw the corresponding doodad
        if (this.hasPortKind(tileType)) {
            if (this.renderPortKindSprite(ctx, tileType.portKind, pixelX, pixelY)) {
                return; // Early return if sprite was rendered
            }
        }
        if (RendererUtils.isImageLoaded(this.images, 'hole')) {
            ctx.drawImage(this.images.hole, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        }
    }

    // Helper methods - these should ideally delegate to the appropriate strategies
    // For now, keeping them here to avoid circular dependencies
    private renderShackTile(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        pixelX: number,
        pixelY: number,
        grid: any[][] | any,
        zoneLevel: number,
        baseRenderer: BaseRenderer
    ): void {
        // Delegate to helper - in a full implementation, this would use ShackRenderStrategy
        baseRenderer.structureRenderer.renderShackTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer);
    }

    private renderHouseTile(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        pixelX: number,
        pixelY: number,
        grid: any[][] | any,
        zoneLevel: number,
        baseRenderer: BaseRenderer
    ): void {
        // Delegate to helper - in a full implementation, this would use HouseRenderStrategy
        baseRenderer.structureRenderer.renderHouseTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel, baseRenderer);
    }
}
