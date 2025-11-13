// Small runtime helper to animate overlay curling away like parchment.
// Exposes `animateOverlayCurl` on window for backward-compatible invocation.

(function () {
    // Create shimmer tile grid for start overlay
    let animationFrameId: number | null = null;
    let shouldStopAnimation = false;
    let timedOutCallbackIds: number[] = [];

    function createShimmerTileGrid() {
        const startOverlay = document.getElementById('startOverlay');
        if (!startOverlay) {
            // Retry after a short delay if overlay doesn't exist yet
            const timeoutId = window.setTimeout(createShimmerTileGrid, 100);
            timedOutCallbackIds.push(timeoutId);
            return;
        }

        // Check if tiles already exist
        let tilesContainer = startOverlay.querySelector('.shimmer-tiles-container') as HTMLElement;
        if (tilesContainer) return;

        // Get the overlay box to determine size
        const overlayBox = startOverlay.querySelector('.start-overlay-box') as HTMLElement;
        if (!overlayBox) {
            const timeoutId = window.setTimeout(createShimmerTileGrid, 100);
            timedOutCallbackIds.push(timeoutId);
            return;
        }

        // Create tiles container
        tilesContainer = document.createElement('div');
        tilesContainer.className = 'shimmer-tiles-container';

        const tileSize = 40; // 40px tiles
        // Use window size for reliable dimensions
        const cols = Math.ceil(window.innerWidth / tileSize) + 2;
        const rows = Math.ceil(window.innerHeight / tileSize) + 2;

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

        // Animate tiles - each tile lights up and fades as the wave passes over it
        let offset = 0;
        const waveSpeed = 0.15; // Speed of wave propagation
        const waveWidth = 8; // Width of the bright wave zone (increased for wider wave)

        // Extra vibrant pink and purple colors (brighter)
        const purpleR = 180, purpleG = 80, purpleB = 255;  // Brighter purple
        const pinkR = 255, pinkG = 80, pinkB = 180;        // Brighter pink

        // Base colors for tiles (very dim, almost invisible)
        const baseColor1 = `rgba(${purpleR}, ${purpleG}, ${purpleB}, 0.1)`;   // Purple (very dim)
        const baseColor2 = `rgba(${pinkR}, ${pinkG}, ${pinkB}, 0.1)`;         // Pink (very dim)

        function animateWave() {
            // Check if animation should stop
            if (shouldStopAnimation) {
                animationFrameId = null;
                return;
            }

            offset += waveSpeed;

            tiles.forEach((tile) => {
                const col = parseInt(tile.dataset.col || '0');
                const row = parseInt(tile.dataset.row || '0');

                // Calculate position in wave (diagonal wave pattern)
                const position = col + row * 0.5;

                // Determine base color based on checkerboard pattern
                const isPurple = (col + row) % 2 === 0;
                const baseColor = isPurple ? baseColor1 : baseColor2;

                // Calculate distance from wave center
                const distanceFromWave = Math.abs((position - offset) % 50);

                // Create a sharp brightness peak as wave passes
                // Using a narrow exponential decay for the shimmer effect
                const shimmerIntensity = Math.max(0, 1 - Math.pow(distanceFromWave / waveWidth, 2));

                // Interpolate between very dim and fully bright based on shimmer intensity
                if (shimmerIntensity > 0.01) {
                    const r = isPurple ? purpleR : pinkR;
                    const g = isPurple ? purpleG : pinkG;
                    const b = isPurple ? purpleB : pinkB;
                    const baseOpacity = 0.1;   // Very dim when not lit
                    const brightOpacity = 1.0; // Fully bright when lit

                    const opacity = baseOpacity + (brightOpacity - baseOpacity) * shimmerIntensity;
                    tile.style.backgroundColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;
                } else {
                    tile.style.backgroundColor = baseColor;
                }
            });

            animationFrameId = requestAnimationFrame(animateWave);
        }

        animateWave();
    }

    // Function to stop the shimmer animation and clean up resources
    function stopShimmerAnimation(): void {
        shouldStopAnimation = true;

        // Cancel any active animation frame
        if (animationFrameId !== null) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }

        // Clear all pending setTimeout callbacks
        for (const timeoutId of timedOutCallbackIds) {
            clearTimeout(timeoutId);
        }
        timedOutCallbackIds = [];

        // Remove the shimmer tiles container from DOM
        const startOverlay = document.getElementById('startOverlay');
        if (startOverlay) {
            const tilesContainer = startOverlay.querySelector('.shimmer-tiles-container');
            if (tilesContainer) {
                tilesContainer.remove();
            }
        }
    }

    // Expose cleanup function globally
    window.stopShimmerAnimation = stopShimmerAnimation;

    // Initialize shimmer tiles when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            const timeoutId = window.setTimeout(createShimmerTileGrid, 100);
            timedOutCallbackIds.push(timeoutId);
        });
    } else {
        const timeoutId = window.setTimeout(createShimmerTileGrid, 100);
        timedOutCallbackIds.push(timeoutId);
    }

    function animateOverlayCurl(overlayElement: HTMLElement | null): Promise<void> {
        return new Promise((resolve) => {
            if (!overlayElement) return resolve();

            try {
                // Stop the shimmer animation when overlay starts closing
                stopShimmerAnimation();

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
