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

        // Animate tiles - each tile lights up and fades as the wave passes over it
        let offset = 0;
        const waveSpeed = 0.15; // Speed of wave propagation
        const waveWidth = 3; // Width of the bright wave zone

        // Base colors for tiles (checkerboard pattern)
        const baseColor1 = 'rgba(142, 63, 93, 0.3)';   // Purple (dim)
        const baseColor2 = 'rgba(186, 97, 86, 0.3)';   // Pink (dim)

        // Bright colors when lit up
        const brightColor1 = 'rgba(142, 63, 93, 0.95)';  // Purple (bright)
        const brightColor2 = 'rgba(186, 97, 86, 0.95)';  // Pink (bright)

        function animateWave() {
            offset += waveSpeed;

            tiles.forEach((tile) => {
                const col = parseInt(tile.dataset.col || '0');
                const row = parseInt(tile.dataset.row || '0');

                // Calculate position in wave (diagonal wave pattern)
                const position = col + row * 0.5;

                // Determine base color based on checkerboard pattern
                const isColor1 = (col + row) % 2 === 0;
                const baseColor = isColor1 ? baseColor1 : baseColor2;
                const brightColor = isColor1 ? brightColor1 : brightColor2;

                // Calculate distance from wave center
                const distanceFromWave = Math.abs((position - offset) % 50);

                // Create a sharp brightness peak as wave passes
                // Using a narrow exponential decay for the shimmer effect
                const shimmerIntensity = Math.max(0, 1 - Math.pow(distanceFromWave / waveWidth, 2));

                // Interpolate between base and bright color based on shimmer intensity
                if (shimmerIntensity > 0.01) {
                    const r1 = isColor1 ? 142 : 186;
                    const g1 = isColor1 ? 63 : 97;
                    const b1 = isColor1 ? 93 : 86;
                    const baseOpacity = 0.3;
                    const brightOpacity = 0.95;

                    const opacity = baseOpacity + (brightOpacity - baseOpacity) * shimmerIntensity;
                    tile.style.backgroundColor = `rgba(${r1}, ${g1}, ${b1}, ${opacity})`;
                } else {
                    tile.style.backgroundColor = baseColor;
                }
            });

            animationFrameId = requestAnimationFrame(animateWave);
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
