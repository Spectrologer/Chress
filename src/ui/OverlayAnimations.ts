// Small runtime helper to animate overlay curling away like parchment.
// Exposes `animateOverlayCurl` on window for backward-compatible invocation.

declare global {
    interface Window {
        animateOverlayCurl: (overlayElement: HTMLElement | null) => Promise<void>;
    }
}

(function () {
    function animateOverlayCurl(overlayElement: HTMLElement | null): Promise<void> {
        return new Promise((resolve) => {
            if (!overlayElement) return resolve();

            try {
                // Ensure overlay is visible so animation can run
                overlayElement.style.display = overlayElement.style.display || 'flex';

                // Force reflow and use requestAnimationFrame to avoid class-add-induced jumps
                // (ensures the browser has applied any inline display changes before animating)
                // eslint-disable-next-line no-unused-expressions
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
                    try { overlayElement.classList.remove('start-overlay-furling'); } catch (e) {}
                    try { overlayElement.style.display = 'none'; } catch (e) {}
                    resolve();
                };

                overlayElement.addEventListener('animationend', onEnd);

                // Fallback timeout in case animationend doesn't fire — slightly longer
                // than the CSS animation (1200ms) to be safe.
                setTimeout(() => {
                    try { overlayElement.classList.remove('start-overlay-furling'); } catch (e) {}
                    try { overlayElement.style.display = 'none'; } catch (e) {}
                    resolve();
                }, 2000);
            } catch (e) {
                try { overlayElement.style.display = 'none'; } catch (err) {}
                resolve();
            }
        });
    }

    // Expose globally for simple call from GameInitializer without module import
    try { window.animateOverlayCurl = animateOverlayCurl; } catch (e) { /* ignore */ }
})();
