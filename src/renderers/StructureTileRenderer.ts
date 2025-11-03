import { TILE_COLORS, TILE_TYPES, TILE_SIZE } from '../core/constants/index';
import { RendererUtils } from './RendererUtils';
import { renderOverlay } from './BaseRendererHelpers';
import type { ImageCache, GridManager, BaseRenderer } from './types';

interface MultiTileHandler {
    findHousePosition(x: number, y: number, grid: GridManager | any[][]): { startX: number; startY: number } | null;
    findWellPosition(x: number, y: number, grid: GridManager | any[][]): { startX: number; startY: number } | null;
    findDeadTreePosition(x: number, y: number, grid: GridManager | any[][]): { startX: number; startY: number } | null;
    findShackPosition(x: number, y: number, grid: GridManager | any[][]): { startX: number; startY: number } | null;
    findCisternPosition(x: number, y: number, grid: GridManager | any[][]): { startX: number; startY: number } | null;
}

export class StructureTileRenderer {
    private images: ImageCache;
    private multiTileHandler: MultiTileHandler;
    private tileSize: number;

    constructor(images: ImageCache, multiTileHandler: MultiTileHandler, tileSize: number) {
        this.images = images;
        this.multiTileHandler = multiTileHandler;
        this.tileSize = tileSize;
    }

    renderStatueTile(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        pixelX: number,
        pixelY: number,
        grid: GridManager | any[][],
        zoneLevel: number,
        baseRenderer: BaseRenderer,
        tileType: string
    ): void {
        // First draw the base tile - statues need special handling for zones
        if (zoneLevel === 5 && RendererUtils.isImageLoaded(baseRenderer.images, 'housetile')) {
            ctx.drawImage(baseRenderer.images.housetile, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else if (zoneLevel >= 4 && zoneLevel !== 6 && RendererUtils.isImageLoaded(baseRenderer.images, 'desert')) {
            ctx.drawImage(baseRenderer.images.desert, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);
        }

        // Draw a pedestal
        ctx.fillStyle = '#a0a0a0'; // Light grey for pedestal
        ctx.fillRect(pixelX + 8, pixelY + TILE_SIZE - 16, TILE_SIZE - 16, 12);
        ctx.fillStyle = '#808080'; // Darker grey for shadow
        ctx.fillRect(pixelX + 8, pixelY + TILE_SIZE - 8, TILE_SIZE - 16, 4);

        const enemySpriteMap: Record<string, string> = {
            [TILE_TYPES.LIZARDY_STATUE]: 'lizardy',
            [TILE_TYPES.LIZARDO_STATUE]: 'lizardo',
            [TILE_TYPES.LIZARDEAUX_STATUE]: 'lizardeaux',
            [TILE_TYPES.LIZORD_STATUE]: 'lizord',
            [TILE_TYPES.ZARD_STATUE]: 'zard',
            [TILE_TYPES.LAZERD_STATUE]: 'lazerd',
        };

        const itemSpriteMap: Record<string, string> = {
            [TILE_TYPES.BOMB_STATUE]: 'bomb',
            [TILE_TYPES.SPEAR_STATUE]: 'spear',
            [TILE_TYPES.BOW_STATUE]: 'bow',
            [TILE_TYPES.HORSE_STATUE]: 'horse',
            [TILE_TYPES.BOOK_STATUE]: 'book',
            [TILE_TYPES.SHOVEL_STATUE]: 'shovel'
        };

        // Prefer enemy sprite mapping, otherwise check item statue mapping
        const spriteKey = enemySpriteMap[tileType] || itemSpriteMap[tileType];
        if (spriteKey) {
            const isItemStatue = itemSpriteMap[tileType] !== undefined;
            if (isItemStatue) {
                // Scale item-statues to fit the pedestal and apply grayscale+brightness filter
                // Special case: bow statue needs the bow portion rotated slightly counter-clockwise
                const statueOptions: any = { scaleToFit: true, scaleMaxSize: TILE_SIZE - 16, filter: 'grayscale(100%) brightness(0.8)' };
                if (tileType === TILE_TYPES.BOW_STATUE) {
                    // Rotate the bow statue 90 degrees counter-clockwise
                    statueOptions.rotate = -Math.PI / 2; // -90 degrees
                }
                renderOverlay(ctx, this.images, spriteKey, pixelX, pixelY, TILE_SIZE, TILE_COLORS[tileType] || '#888888', '?', { font: '20px Arial', fillStyle: '#FFFFFF' }, statueOptions);
            } else {
                // Enemy statues use full-tile draw with a vertical offset and should be rendered as stone (grayscale)
                renderOverlay(ctx, this.images, spriteKey, pixelX, pixelY - 10, TILE_SIZE, TILE_COLORS[tileType] || '#888888', '?', { font: '20px Arial', fillStyle: '#FFFFFF' }, { fullTile: true, filter: 'grayscale(100%) brightness(0.85)' });
            }
        } else {
            RendererUtils.drawFallbackTile(ctx, pixelX, pixelY, TILE_SIZE, TILE_COLORS[tileType] || '#888888', '?');
        }
    }

    renderHouseTile(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        pixelX: number,
        pixelY: number,
        grid: GridManager | any[][],
        zoneLevel: number,
        baseRenderer: BaseRenderer
    ): void {
        // First render dirt background
        baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Then render the club part
        if (RendererUtils.isImageLoaded(this.images, 'doodads/club')) {
            // For a 4x3 club, we need to determine which part of the club image to draw
            // Find the house area bounds to determine the position within the house
            const houseInfo = this.multiTileHandler.findHousePosition(x, y, grid);

            if (houseInfo) {
                // Calculate which part of the house image to use
                const partX = x - houseInfo.startX;
                const partY = y - houseInfo.startY;

                // Draw the corresponding part of the club image using utility
                const houseImage = this.images['doodads/club'];
                if (!RendererUtils.renderImageSlice(ctx, houseImage, partX, partY, 4, 3, pixelX, pixelY, TILE_SIZE)) {
                    // Fallback if slicing fails
                    RendererUtils.drawFallbackTile(ctx, pixelX, pixelY, TILE_SIZE, TILE_TYPES.HOUSE, 'H');
                }
            }
        } else {
            // Fallback color rendering
            RendererUtils.drawFallbackTile(ctx, pixelX, pixelY, TILE_SIZE, TILE_TYPES.HOUSE);
        }
    }

    renderWellTile(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        pixelX: number,
        pixelY: number,
        grid: GridManager | any[][],
        zoneLevel: number,
        baseRenderer: BaseRenderer
    ): void {
        // First render dirt background
        baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Then render the well part
        if (RendererUtils.isImageLoaded(this.images, 'doodads/well')) {
            // For a 2x2 well, we need to determine which part of the well image to draw
            // Find the well area bounds to determine the position within the well
            const wellInfo = this.multiTileHandler.findWellPosition(x, y, grid);

            if (wellInfo) {
                // Calculate which part of the well image to use
                const partX = x - wellInfo.startX;
                const partY = y - wellInfo.startY;

                // Draw the corresponding part of the well image
                // Divide the well image into 2x2 parts
                const wellImage = this.images['doodads/well'];
                const partWidth = wellImage.width / 2;
                const partHeight = wellImage.height / 2;

                ctx.drawImage(
                    wellImage,
                    partX * partWidth, partY * partHeight, // Source position
                    partWidth, partHeight, // Source size
                    pixelX, pixelY, // Destination position
                    TILE_SIZE, TILE_SIZE // Destination size
                );
            }
        } else {
            // Fallback color rendering
            RendererUtils.drawFallbackTile(ctx, pixelX, pixelY, TILE_SIZE, TILE_TYPES.WELL);
        }
    }

    renderDeadTreeTile(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        pixelX: number,
        pixelY: number,
        grid: GridManager | any[][],
        zoneLevel: number,
        baseRenderer: BaseRenderer
    ): void {
        // First render dirt background
        baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Then render the dead tree part
        if (RendererUtils.isImageLoaded(this.images, 'doodads/deadtree')) {
            // For a 2x2 dead tree, we need to determine which part of the dead tree image to draw
            // Find the dead tree area bounds to determine the position within the dead tree
            const deadtreeInfo = this.multiTileHandler.findDeadTreePosition(x, y, grid);

            if (deadtreeInfo) {
                // Calculate which part of the dead tree image to use
                const partX = x - deadtreeInfo.startX;
                const partY = y - deadtreeInfo.startY;

                // Draw the corresponding part of the dead tree image
                // Divide the dead tree image into 2x2 parts
                const deadtreeImage = this.images['doodads/deadtree'];
                const partWidth = deadtreeImage.width / 2;
                const partHeight = deadtreeImage.height / 2;

                ctx.drawImage(
                    deadtreeImage,
                    partX * partWidth, partY * partHeight, // Source position
                    partWidth, partHeight, // Source size
                    pixelX, pixelY, // Destination position
                    TILE_SIZE, TILE_SIZE // Destination size
                );
            }
        } else {
            // Fallback color rendering
            RendererUtils.drawFallbackTile(ctx, pixelX, pixelY, TILE_SIZE, TILE_TYPES.DEADTREE);
        }
    }

    renderEnemyTile(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        pixelX: number,
        pixelY: number,
        gridManager: GridManager | any[][],
        zoneLevel: number,
        baseRenderer: BaseRenderer
    ): void {
        // Use the stored enemyType from the grid tile
        const tile = (gridManager as any).getTile ? (gridManager as any).getTile(x, y) : (gridManager as any)[y]?.[x];
        let enemyKey = 'lizardy';

        // First draw the base tile
        if (zoneLevel >= 4 && zoneLevel !== 5 && zoneLevel !== 6 && RendererUtils.isImageLoaded(this.images, 'desert')) {
            ctx.drawImage(this.images.desert, pixelX, pixelY, TILE_SIZE, TILE_SIZE);
        } else {
            baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, gridManager, zoneLevel);
        }

        // Try to draw the enemy image if loaded, otherwise use fallback
        renderOverlay(ctx, this.images, enemyKey, pixelX, pixelY, TILE_SIZE, TILE_COLORS[TILE_TYPES.ENEMY], '🦎', { font: '32px Arial', fillStyle: '#FF1493' }, { fullTile: true });
    }

    renderPenneTile(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        pixelX: number,
        pixelY: number,
        grid: GridManager | any[][],
        zoneLevel: number,
        baseRenderer: BaseRenderer
    ): void {
        // First draw the base tile
        baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Try to draw the Penne image if loaded, otherwise use fallback
        renderOverlay(ctx, this.images, 'penne', pixelX, pixelY, TILE_SIZE, TILE_COLORS[TILE_TYPES.PENNE], '🍝', { font: '32px Arial', fillStyle: '#FFD700' }, { fullTile: true });
    }

    renderSquigTile(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        pixelX: number,
        pixelY: number,
        grid: GridManager | any[][],
        zoneLevel: number,
        baseRenderer: BaseRenderer
    ): void {
        // First draw the base tile
        baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        renderOverlay(ctx, this.images, 'squig', pixelX, pixelY, TILE_SIZE, TILE_COLORS[TILE_TYPES.SQUIG], '🐸', { font: '', fillStyle: '' }, { fullTile: true });
    }

    renderRuneTile(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        pixelX: number,
        pixelY: number,
        grid: GridManager | any[][],
        zoneLevel: number,
        baseRenderer: BaseRenderer
    ): void {
        // First draw the base tile
        baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        renderOverlay(ctx, this.images, 'rune', pixelX, pixelY, TILE_SIZE, TILE_COLORS[TILE_TYPES.RUNE], '🧙', { font: '', fillStyle: '' }, { fullTile: true });
    }

    renderNibTile(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        pixelX: number,
        pixelY: number,
        grid: GridManager | any[][],
        zoneLevel: number,
        baseRenderer: BaseRenderer
    ): void {
        // First draw the base tile
        baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        renderOverlay(ctx, this.images, 'nib', pixelX, pixelY, TILE_SIZE, TILE_COLORS[TILE_TYPES.NIB], '📖', { font: '', fillStyle: '' }, { fullTile: true });
    }

    renderMarkTile(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        pixelX: number,
        pixelY: number,
        grid: GridManager | any[][],
        zoneLevel: number,
        baseRenderer: BaseRenderer
    ): void {
        // First draw the base tile
        baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        renderOverlay(ctx, this.images, 'mark', pixelX, pixelY, TILE_SIZE, TILE_COLORS[TILE_TYPES.MARK], '🗺️', { font: '', fillStyle: '' }, { fullTile: true });
    }

    renderCraynTile(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        pixelX: number,
        pixelY: number,
        grid: GridManager | any[][],
        zoneLevel: number,
        baseRenderer: BaseRenderer
    ): void {
        // First draw the base tile
        baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        renderOverlay(ctx, this.images, 'crayn', pixelX, pixelY, TILE_SIZE, TILE_COLORS[TILE_TYPES.CRAYN], '🦎', { font: '', fillStyle: '' }, { fullTile: true });
    }

    renderFeltTile(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        pixelX: number,
        pixelY: number,
        grid: GridManager | any[][],
        zoneLevel: number,
        baseRenderer: BaseRenderer
    ): void {
        // First draw the base tile
        baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        renderOverlay(ctx, this.images, 'felt', pixelX, pixelY, TILE_SIZE, TILE_COLORS[TILE_TYPES.FELT], '🙋', { font: '', fillStyle: '' }, { fullTile: true });
    }

    renderForgeTile(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        pixelX: number,
        pixelY: number,
        grid: GridManager | any[][],
        zoneLevel: number,
        baseRenderer: BaseRenderer
    ): void {
        // First draw the base tile
        baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        renderOverlay(ctx, this.images, 'forge', pixelX, pixelY, TILE_SIZE, TILE_COLORS[TILE_TYPES.FORGE], '🛠️', { font: '', fillStyle: '' }, { fullTile: true });
    }

    renderShackTile(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        pixelX: number,
        pixelY: number,
        grid: GridManager | any[][],
        zoneLevel: number,
        baseRenderer: BaseRenderer
    ): void {
        // First render dirt background
        baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Check for shack image with proper key
        const imageKey = 'doodads/shack';
        const shackImage = this.images[imageKey];
        const imageLoaded = RendererUtils.isImageLoaded(this.images, imageKey) &&
                          shackImage &&
                          shackImage.width >= 48 && shackImage.height >= 48; // Minimum 3x3 expected

        // Then render the shack part
        if (imageLoaded) {
            // Find the shack position using the multi-tile handler
            const shackInfo = this.multiTileHandler.findShackPosition(x, y, grid);

            if (shackInfo) {
                // Calculate position within the 3x3 shack
                const partX = x - shackInfo.startX;
                const partY = y - shackInfo.startY;

                if (RendererUtils.renderImageSlice(ctx, shackImage, partX, partY, 3, 3, pixelX, pixelY, TILE_SIZE)) {
                    return; // Successfully rendered
                }
            }
        }

        // Fallback color rendering with distinctive marking
        RendererUtils.drawFallbackTile(ctx, pixelX, pixelY, TILE_SIZE, TILE_COLORS[TILE_TYPES.SHACK] || '#654321', 'S');
    }

    renderCisternTile(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        pixelX: number,
        pixelY: number,
        grid: GridManager | any[][],
        zoneLevel: number,
        baseRenderer: BaseRenderer
    ): void {
        // This renders a CISTERN tile.
        // Check if this is part of a double-bottom cistern (CISTERN + CISTERN)
        // or a traditional cistern (PORT + CISTERN)
        const cisternInfo = this.multiTileHandler.findCisternPosition(x, y, grid);

        // Determine if this is the top tile of the cistern structure
        const isTopTile = cisternInfo && cisternInfo.startY === y;

        // Check if both tiles are CISTERN (double-bottom mode)
        const getTile = (gx: number, gy: number) => (grid as any).getTile ? (grid as any).getTile(gx, gy) : (grid as any)[gy]?.[gx];
        const tileAbove = y > 0 ? getTile(x, y - 1) : null;
        const tileBelow = y < 9 ? getTile(x, y + 1) : null;
        const isDoubleBottom = (tileAbove === TILE_TYPES.CISTERN || tileBelow === TILE_TYPES.CISTERN);

        // First render dirt background
        baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        if (RendererUtils.isImageLoaded(this.images, 'doodads/cistern')) {
            const cisternImage = this.images['doodads/cistern'];
            const partWidth = cisternImage.width; // 16
            const partHeight = cisternImage.height / 2; // 9

            // Pixel perfect scaling: 16x9 -> 64x36
            const destW = partWidth * 4; // 64
            const destH = partHeight * 4; // 36
            const destX = pixelX; // Left justified
            const destY = pixelY; // Top of tile

            // Always use the bottom part of the sprite for CISTERN tiles
            ctx.drawImage(
                cisternImage,
                0, partHeight, // Source position (bottom part)
                partWidth, partHeight, // Source size
                destX, destY, // Destination position, aligned to top of tile
                destW, destH // Destination size
            );
        } else {
            // Fallback color rendering - semi-transparent slab to show dirt behind
            const partHeight = 9;
            const scaleFactor = 4;
            const destW = 16 * scaleFactor;
            const destH = partHeight * scaleFactor;
            const destX = pixelX;
            const destY = pixelY;
            ctx.fillStyle = `rgba${TILE_COLORS[TILE_TYPES.CISTERN].slice(4, -1)}, 0.7)`;
            ctx.fillRect(destX, destY, destW, destH);
            // Debug for gh-pages - show cistern location with 'C'
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('C', pixelX + TILE_SIZE / 2, pixelY + destH / 2);
        }
    }

    renderCisternTop(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        pixelX: number,
        pixelY: number,
        grid: GridManager | any[][],
        zoneLevel: number,
        baseRenderer: BaseRenderer
    ): void {
        // This is the TOP part of the cistern (the PORT/entrance).

        // First render dirt background so transparency works
        baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        if (RendererUtils.isImageLoaded(this.images, 'doodads/cistern')) {
            const cisternImage = this.images['doodads/cistern'];
            const partWidth = cisternImage.width; // 16
            const partHeight = cisternImage.height / 2; // 9

            // Pixel perfect scaling: 16x9 -> 64x36
            // Position at the bottom of the tile
            const destW = partWidth * 4; // 64
            const destH = partHeight * 4; // 36
            const destX = pixelX; // Left justified
            const destY = pixelY + TILE_SIZE - destH; // Bottom of tile

            ctx.drawImage(
                cisternImage,
                0, 0, // Source position (top part)
                partWidth, partHeight, // Source size
                destX, destY, // Destination position, aligned to top of tile
                destW, destH // Destination size
            );
        } else {
            // Fallback rendering - semi-transparent slab to show dirt behind
            const partHeight = 9;
            const scaleFactor = 4;
            const destW = 16 * scaleFactor;
            const destH = partHeight * scaleFactor;
            const destX = pixelX;
            const destY = pixelY + TILE_SIZE - destH;

            ctx.fillStyle = `rgba${TILE_COLORS[TILE_TYPES.CISTERN].slice(4, -1)}, 0.7)`;
            ctx.fillRect(destX, destY, destW, destH);
            // Debug for gh-pages - show cistern top with small 'C'
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('C', destX + destW / 2, destY + destH / 2 + 2);
        }
    }

    renderAxelotlTile(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        pixelX: number,
        pixelY: number,
        grid: GridManager | any[][],
        zoneLevel: number,
        baseRenderer: BaseRenderer
    ): void {
        // First draw the base tile
        baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        renderOverlay(ctx, this.images, 'axolotl', pixelX, pixelY, TILE_SIZE, TILE_COLORS[TILE_TYPES.AXELOTL] || '#FF69B4', 'AXL', { font: '20px Arial', fillStyle: '#000000' }, { fullTile: true });
    }

    renderGougeTile(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        pixelX: number,
        pixelY: number,
        grid: GridManager | any[][],
        zoneLevel: number,
        baseRenderer: BaseRenderer
    ): void {
        // First draw the base tile
        baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        renderOverlay(ctx, this.images, 'gouge', pixelX, pixelY, TILE_SIZE, TILE_COLORS[TILE_TYPES.GOUGE] || '#8A2BE2', 'GOU', { font: '20px Arial', fillStyle: '#FFFFFF' }, { fullTile: true });
    }

    renderPitfallTile(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        pixelX: number,
        pixelY: number,
        grid: GridManager | any[][],
        zoneLevel: number,
        baseRenderer: BaseRenderer
    ): void {
        // First draw the base tile
        baseRenderer.renderItemBaseTile(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Try to draw the pitfall image if loaded, otherwise it's invisible
        if (RendererUtils.isImageLoaded(this.images, 'pitfall')) {
            renderOverlay(ctx, this.images, 'pitfall', pixelX, pixelY, TILE_SIZE, '', '', { font: '', fillStyle: '' }, { fullTile: true });
            // Maintain previous transparency by overlaying with alpha when necessary — handled by CSS filter or image alpha
        }
    }

    renderTableTile(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        pixelX: number,
        pixelY: number,
        grid: GridManager | any[][],
        zoneLevel: number,
        baseRenderer: BaseRenderer
    ): void {
        // First render the base tile (interior floor)
        baseRenderer.renderFloorTileWithDirectionalTextures(ctx, x, y, pixelX, pixelY, grid, zoneLevel);

        // Then render the table image on top
        renderOverlay(ctx, this.images, 'doodads/table', pixelX, pixelY, TILE_SIZE, TILE_COLORS[TILE_TYPES.TABLE], '', { font: '', fillStyle: '' }, { fullTile: true });
    }
}
