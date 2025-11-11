// Small runtime helper to animate overlay curling away like parchment.
// Exposes `animateOverlayCurl` on window for backward-compatible invocation.

(function () {
    // Create shimmer tile grid for start overlay
    let animationFrameId: number | null = null;

    function createShimmerTileGrid() {
        const startOverlay = document.getElementById('startOverlay');
        if (!startOverlay) {
            // Retry after a short delay if overlay doesn't exist yet
            setTimeout(createShimmerTileGrid, 100);
            return;
        }

        // Check if tiles already exist
        let tilesContainer = startOverlay.querySelector('.shimmer-tiles-container') as HTMLElement;
        if (tilesContainer) return;

        // Get the overlay box to determine size
        const overlayBox = startOverlay.querySelector('.start-overlay-box') as HTMLElement;
        if (!overlayBox) {
            setTimeout(createShimmerTileGrid, 100);
            return;
        }

        // Create tiles container
        tilesContainer = document.createElement('div');
        tilesContainer.className = 'shimmer-tiles-container';

        const tileSize = 40; // 40px tiles
        // Use window size for reliable dimensions
        const cols = Math.ceil(window.innerWidth / tileSize) + 2;
        const rows = Math.ceil(window.innerHeight / tileSize) + 2;

        console.log('Creating shimmer grid:', cols, 'x', rows, 'tiles');

        // Create tiles
        const tiles: HTMLElement[] = [];
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const tile = document.createElement('div');
                tile.className = 'shimmer-tile';
                tile.style.left = `${col * tileSize}px`;
                tile.style.top = `${row * tileSize}px`;
                tile.dataset.col = col.toString();
                tile.dataset.row = row.toString();
                tilesContainer.appendChild(tile);
                tiles.push(tile);
            }
        }

        // Insert tiles container before the overlay box
        startOverlay.insertBefore(tilesContainer, overlayBox);
        console.log('Shimmer tiles created:', tiles.length);

        // Animate tiles - each tile switches between two colors in a wave
        let offset = 0;
        const waveSpeed = 0.08; // Speed of wave propagation

        // Define two alternating colors
        const color1 = 'rgba(142, 63, 93, 0.5)';   // Purple
        const color2 = 'rgba(186, 97, 86, 0.5)';   // Pink

        function animateWave() {
            offset += waveSpeed;

            tiles.forEach((tile) => {
                const col = parseInt(tile.dataset.col || '0');
                const row = parseInt(tile.dataset.row || '0');

                // Calculate position in wave (diagonal wave pattern)
                const position = col + row * 0.5;

                // Determine which color this tile should be based on wave position
                // Use sine wave to create smooth alternating pattern
                const waveValue = Math.sin((position - offset) * 0.5);

                // Switch between color1 and color2 based on wave value
                tile.style.backgroundColor = waveValue > 0 ? color1 : color2;
            });

            requestAnimationFrame(animateWave);
        }

        animateWave();
    }

    // Initialize shimmer tiles when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(createShimmerTileGrid, 100);
        });
    } else {
        setTimeout(createShimmerTileGrid, 100);
    }

    function animateOverlayCurl(overlayElement: HTMLElement | null): Promise<void> {
        return new Promise((resolve) => {
            if (!overlayElement) return resolve();

            try {
                // Ensure overlay is visible so animation can run
                overlayElement.style.display = overlayElement.style.display || 'flex';

                // Force reflow and use requestAnimationFrame to avoid class-add-induced jumps
                // (ensures the browser has applied any inline display changes before animating)

                overlayElement.getBoundingClientRect();
                requestAnimationFrame(() => requestAnimationFrame(() => {
                    // Add the furling class (slower, softer curl)
                    overlayElement.classList.add('start-overlay-furling');
                }));

                // Listen for animation end
                const onEnd = (ev?: Event): void => {
                    if (ev && ev.target !== overlayElement) return; // ignore bubbled events
                    overlayElement.removeEventListener('animationend', onEnd);
                    // Clean up class and hide overlay
                    try { overlayElement.classList.remove('start-overlay-furling'); } catch (e) { logger.warn('[OverlayAnimations] Failed to remove furling class (animationend):', e); }
                    try { overlayElement.style.display = 'none'; } catch (e) { logger.warn('[OverlayAnimations] Failed to hide overlay (animationend):', e); }
                    resolve();
                };

                overlayElement.addEventListener('animationend', onEnd);

                // Fallback timeout in case animationend doesn't fire — slightly longer
                // than the CSS animation (1200ms) to be safe.
                setTimeout(() => {
                    try { overlayElement.classList.remove('start-overlay-furling'); } catch (e) { logger.warn('[OverlayAnimations] Failed to remove furling class (timeout):', e); }
                    try { overlayElement.style.display = 'none'; } catch (e) { logger.warn('[OverlayAnimations] Failed to hide overlay (timeout):', e); }
                    resolve();
                }, 2000);
            } catch (e) {
                logger.warn('[OverlayAnimations] Animation error:', e);
                try { overlayElement.style.display = 'none'; } catch (err) { logger.warn('[OverlayAnimations] Failed to hide overlay after error:', err); }
                resolve();
            }
        });
    }

    // Expose globally for simple call from GameInitializer without module import
    try { window.animateOverlayCurl = animateOverlayCurl; } catch (e) { logger.warn('[OverlayAnimations] Failed to expose global function:', e); }
})();
