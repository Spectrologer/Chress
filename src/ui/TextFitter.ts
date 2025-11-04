// Utility to scale text down so it fits within a container element.
// Designed to be safe for mobile where native text sizes can cause clipping.
import { UI_RENDERING_CONSTANTS } from '@core/constants/rendering';

interface FitTextOptions {
    childSelector?: string | null;
    minFontSize?: number;
    maxIterations?: number;
}

export function fitTextToContainer(container: HTMLElement | null, options: FitTextOptions = {}): void {
    if (!container) return;
    const {
        childSelector = null,
        minFontSize = UI_RENDERING_CONSTANTS.TEXT_MIN_FONT_SIZE,
        maxIterations = UI_RENDERING_CONSTANTS.TEXT_FIT_MAX_ITERATIONS
    } = options;
    const el = childSelector ? container.querySelector<HTMLElement>(childSelector) : container;
    if (!el) return;

    // If the content contains lists or explicit scrollable regions, skip fitting
    // (lists are allowed to scroll per requirement).
    try {
        if (el.querySelector && (el.querySelector('ul') || el.querySelector('ol') || el.querySelector('.scrollable'))) {
            return;
        }
    } catch (e) {}

    // Save original inline styles so we can preserve them if needed
    const originalFontSize = el.style.fontSize || '';
    const originalTransform = el.style.transform || '';
    const originalTransformOrigin = el.style.transformOrigin || '';

    // Helper to test whether the element content fits its container
    const fits = (): boolean => {
        // Use a small epsilon to avoid off-by-one layout differences
        try {
            return el.scrollWidth <= el.clientWidth + 1 && el.scrollHeight <= el.clientHeight + 1;
        } catch (e) {
            return true;
        }
    };

    // If it already fits, ensure no transform is applied and we're done
    if (fits()) {
        el.style.transform = originalTransform;
        el.style.transformOrigin = originalTransformOrigin;
        return;
    }

    // Compute the starting font size from computed styles
    let computed = window.getComputedStyle(el);
    let fontSize = parseFloat(computed.fontSize) || 16;

    // Iteratively reduce font-size (px) until it fits or we hit minFontSize
    let iterations = 0;
    while (!fits() && fontSize > minFontSize && iterations < maxIterations) {
        fontSize = Math.max(minFontSize, fontSize - 1);
        el.style.fontSize = `${fontSize}px`;
        // Force layout
        // eslint-disable-next-line no-unused-expressions
        el.getBoundingClientRect && el.getBoundingClientRect();
        iterations++;
    }

    // If still not fitting, apply a conservative scale transform to avoid overflow
    if (!fits()) {
        try {
            const scaleX = Math.min(1, (el.clientWidth || 1) / (el.scrollWidth || el.clientWidth || 1));
            const scaleY = Math.min(1, (el.clientHeight || 1) / (el.scrollHeight || el.clientHeight || 1));
            const scale = Math.max(0.6, Math.min(scaleX, scaleY)); // don't scale below 60%
            el.style.transformOrigin = 'left top';
            el.style.transform = `scale(${scale}, ${scale})`;
        } catch (e) {}
    } else {
        // Remove any transform we might have applied previously
        el.style.transform = '';
        el.style.transformOrigin = '';
    }

    // Note: we intentionally do not restore the original inline fontSize if we've changed it
    // because the goal is to keep the text readable while preventing clipping on small devices.
}
