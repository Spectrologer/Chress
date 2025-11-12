// Official Pear 36 color palette by PineappleOnPizza
// This is the design bible for all colors used in Chesse

export const PEAR36_PALETTE = {
  // Purple-Magentas
  DEEP_PURPLE: '#5e315b',
  DARK_MAGENTA: '#8c3f5d',
  MUTED_ROSE: '#ba6156',

  // Oranges-Yellows
  PEACH: '#f2a65e',
  LIGHT_YELLOW: '#ffe478',
  LIME_YELLOW: '#cfff70',

  // Greens
  LIME_GREEN: '#8fde5d',
  FOREST_GREEN: '#3ca370',
  TEAL_GREEN: '#3d6e70',

  // Blues-Cyans
  DARK_BLUE_GRAY: '#323e4f',
  DEEP_INDIGO: '#322947',
  PURPLE_BLUE: '#473b78',
  MEDIUM_BLUE: '#4b5bab',
  BRIGHT_BLUE: '#4da6ff',
  CYAN: '#66ffe3',

  // Neutrals
  OFF_WHITE: '#ffffeb',
  LIGHT_GRAY: '#c2c2d1',
  MEDIUM_GRAY: '#7e7e8f',
  DARK_GRAY: '#606070',
  DARKER_GRAY: '#43434f',
  DARKEST_GRAY: '#272736',

  // Purples-Magentas (Dark)
  DARK_PURPLE_RED: '#3e2347',
  BURGUNDY: '#57294b',
  DARK_RED: '#964253',

  // Reds-Oranges
  CORAL: '#e36956',
  LIGHT_ORANGE: '#ffb570',
  ORANGE: '#ff9166',
  RED_ORANGE: '#eb564b',
  CRIMSON: '#b0305c',
  DARK_MAGENTA_RED: '#73275c',

  // Purples (Dark)
  VERY_DARK_PURPLE: '#422445',
  PLUM: '#5a265e',
  MAGENTA_PURPLE: '#80366b',
  BRIGHT_MAGENTA: '#bd4882',

  // Pinks
  HOT_PINK: '#ff6b97',
  LIGHT_PINK: '#ffb5b5',
} as const;

// Reverse lookup: hex to name
export const HEX_TO_NAME: Record<string, keyof typeof PEAR36_PALETTE> = {
  '#5e315b': 'DEEP_PURPLE',
  '#8c3f5d': 'DARK_MAGENTA',
  '#ba6156': 'MUTED_ROSE',
  '#f2a65e': 'PEACH',
  '#ffe478': 'LIGHT_YELLOW',
  '#cfff70': 'LIME_YELLOW',
  '#8fde5d': 'LIME_GREEN',
  '#3ca370': 'FOREST_GREEN',
  '#3d6e70': 'TEAL_GREEN',
  '#323e4f': 'DARK_BLUE_GRAY',
  '#322947': 'DEEP_INDIGO',
  '#473b78': 'PURPLE_BLUE',
  '#4b5bab': 'MEDIUM_BLUE',
  '#4da6ff': 'BRIGHT_BLUE',
  '#66ffe3': 'CYAN',
  '#ffffeb': 'OFF_WHITE',
  '#c2c2d1': 'LIGHT_GRAY',
  '#7e7e8f': 'MEDIUM_GRAY',
  '#606070': 'DARK_GRAY',
  '#43434f': 'DARKER_GRAY',
  '#272736': 'DARKEST_GRAY',
  '#3e2347': 'DARK_PURPLE_RED',
  '#57294b': 'BURGUNDY',
  '#964253': 'DARK_RED',
  '#e36956': 'CORAL',
  '#ffb570': 'LIGHT_ORANGE',
  '#ff9166': 'ORANGE',
  '#eb564b': 'RED_ORANGE',
  '#b0305c': 'CRIMSON',
  '#73275c': 'DARK_MAGENTA_RED',
  '#422445': 'VERY_DARK_PURPLE',
  '#5a265e': 'PLUM',
  '#80366b': 'MAGENTA_PURPLE',
  '#bd4882': 'BRIGHT_MAGENTA',
  '#ff6b97': 'HOT_PINK',
  '#ffb5b5': 'LIGHT_PINK',
};

// Array of all palette colors for easy iteration
export const PALETTE_COLORS = Object.values(PEAR36_PALETTE);

// Helper function to check if a color is in the palette
export function isInPalette(hex: string): boolean {
  const normalized = hex.toLowerCase();
  return PALETTE_COLORS.includes(normalized as any);
}

// Helper function to convert RGB to hex
export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

// Helper function to convert hex to RGB
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Calculate color distance (Euclidean distance in RGB space)
export function colorDistance(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);

  if (!rgb1 || !rgb2) return Infinity;

  const dr = rgb1.r - rgb2.r;
  const dg = rgb1.g - rgb2.g;
  const db = rgb1.b - rgb2.b;

  return Math.sqrt(dr * dr + dg * dg + db * db);
}

// Find the closest palette color to a given hex color
export function findClosestPaletteColor(hex: string): string {
  let minDistance = Infinity;
  let closestColor = PEAR36_PALETTE.DEEP_PURPLE;

  for (const paletteColor of PALETTE_COLORS) {
    const distance = colorDistance(hex, paletteColor);
    if (distance < minDistance) {
      minDistance = distance;
      closestColor = paletteColor;
    }
  }

  return closestColor;
}
