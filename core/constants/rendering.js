// Rendering constants for drawing, strokes, and visual effects

export const STROKE_CONSTANTS = {
    // Line widths (in pixels)
    POINT_ANIMATION_STROKE: 6, // Stroke width for point animations
    ENEMY_OUTLINE_STROKE: 4, // Stroke width for enemy outlines

    // Stroke widths as fractions of TILE_SIZE
    ZONE_BORDER_STROKE_RATIO: 0.04, // Zone border line width (4% of tile size, min 2px)
    ZONE_EXIT_STROKE_RATIO: 0.02, // Zone exit line width (2% of tile size, min 1px)
    CURRENT_TILE_OUTLINE_RATIO: 0.03, // Current tile highlight outline (3% of tile size, min 1px)

    // Insets and spacing
    TILE_DRAWING_INSET: 8, // Pixel inset for tile border drawing
    FALLBACK_TILE_PADDING: 8, // Padding for fallback tile rendering (creates 16px total inset)
    ZONE_BORDER_INSET_RATIO: 0.06, // Zone border inset (6% of tile size)

    // Dashed line parameters
    DASH_LENGTH_RATIO: 0.09, // Length of dash segments (9% of tile size, min 4px)
    DASH_ANIMATION_DURATION: 800, // Animation period for dashed lines (ms)
};

export const COLOR_CONSTANTS = {
    // Opacity values for flashing (already in RENDERING_CONSTANTS in animation.js)
    // UI flash opacities
    UI_FLASH_BASE_ALPHA: 0.6, // Base alpha for UI flash (range: 0.4-0.8)
    UI_FLASH_AMPLITUDE: 0.2, // Alpha variation amplitude

    UI_FLASH_ALT_BASE_ALPHA: 0.5, // Alt base alpha (range: 0.2-0.8)
    UI_FLASH_ALT_AMPLITUDE: 0.3, // Alt alpha variation
};

export const TEXTURE_CONSTANTS = {
    // Texture loading and processing
    COLOR_MATCH_TOLERANCE: 12, // RGB color matching tolerance for transparency
    RGBA_STRIDE: 4, // Bytes per pixel in RGBA image data
    RGBA_ALPHA_OFFSET: 3, // Byte offset to alpha channel in RGBA
};

export const UI_RENDERING_CONSTANTS = {
    // UI layout dimensions
    TOOLTIP_WIDTH: 200, // Tooltip width in pixels

    // Minimap
    MINIMAP_VISIBLE_ZONE_COUNT: 15, // Number of zones visible in minimap
};
