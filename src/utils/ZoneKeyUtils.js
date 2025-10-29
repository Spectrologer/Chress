/**
 * ZoneKeyUtils.js
 *
 * Centralized utility for generating and parsing zone keys.
 * Zone key format: "x,y:dimension" or "x,y:dimension:z-depth" for underground zones
 *
 * Examples:
 *   Surface zone (0,0): "0,0:0"
 *   Interior zone (1,2): "1,2:1"
 *   Underground zone (0,0) depth 1: "0,0:2:z-1"
 *   Underground zone (0,0) depth 3: "0,0:2:z-3"
 */

/**
 * Creates a zone key string from coordinates and dimension information.
 *
 * @param {number} x - The x coordinate of the zone
 * @param {number} y - The y coordinate of the zone
 * @param {number} dimension - The dimension (0=surface, 1=interior, 2=underground)
 * @param {number} [depth] - The depth level for underground zones (defaults to 1 if dimension is 2)
 * @returns {string} The zone key in format "x,y:dimension" or "x,y:dimension:z-depth"
 */
export function createZoneKey(x, y, dimension, depth) {
    const depthSuffix = (dimension === 2) ? `:z-${depth || 1}` : '';
    return `${x},${y}:${dimension}${depthSuffix}`;
}

/**
 * Parses a zone key string into its component parts.
 *
 * @param {string} zoneKey - The zone key to parse (format: "x,y:dimension" or "x,y:dimension:z-depth")
 * @returns {{x: number, y: number, dimension: number, depth: number|null}} The parsed zone data
 * @throws {Error} If the zone key format is invalid
 */
export function parseZoneKey(zoneKey) {
    if (typeof zoneKey !== 'string') {
        throw new Error('Zone key must be a string');
    }

    // Split by colon to get parts: ["x,y", "dimension", "z-depth"]
    const parts = zoneKey.split(':');

    if (parts.length < 2) {
        throw new Error(`Invalid zone key format: ${zoneKey}`);
    }

    // Parse coordinates
    const coords = parts[0].split(',');
    if (coords.length !== 2) {
        throw new Error(`Invalid coordinates in zone key: ${zoneKey}`);
    }

    const x = parseInt(coords[0], 10);
    const y = parseInt(coords[1], 10);
    const dimension = parseInt(parts[1], 10);

    if (isNaN(x) || isNaN(y) || isNaN(dimension)) {
        throw new Error(`Invalid numeric values in zone key: ${zoneKey}`);
    }

    // Parse depth if present (underground zones)
    let depth = null;
    if (parts.length >= 3 && parts[2].startsWith('z-')) {
        const depthStr = parts[2].substring(2); // Remove "z-" prefix
        depth = parseInt(depthStr, 10);
        if (isNaN(depth)) {
            throw new Error(`Invalid depth value in zone key: ${zoneKey}`);
        }
    }

    return { x, y, dimension, depth };
}

/**
 * Validates whether a string is a valid zone key format.
 *
 * @param {string} zoneKey - The zone key to validate
 * @returns {boolean} True if the zone key is valid, false otherwise
 */
export function isValidZoneKey(zoneKey) {
    try {
        parseZoneKey(zoneKey);
        return true;
    } catch (e) {
        return false;
    }
}
