// @ts-check
import { readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

/**
 * Recursively scan a directory for PNG files
 * @param {string} dir - Directory to scan
 * @param {string} baseDir - Base directory for relative paths
 * @param {string[]} fileList - Accumulated list of files
 * @returns {string[]} Array of relative file paths
 */
function scanDirectory(dir, baseDir, fileList = []) {
    try {
        const files = readdirSync(dir);

        files.forEach(file => {
            const filePath = join(dir, file);
            const stat = statSync(filePath);

            if (stat.isDirectory()) {
                // Recursively scan subdirectories
                scanDirectory(filePath, baseDir, fileList);
            } else if (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.gif')) {
                // Add image files with relative paths
                const relativePath = relative(baseDir, filePath).replace(/\\/g, '/');
                fileList.push(relativePath);
            }
        });
    } catch (error) {
        console.warn(`Could not scan directory ${dir}:`, error.message);
    }

    return fileList;
}

/**
 * Categorize assets by their path structure
 * @param {string[]} assets - Array of asset paths
 * @returns {Object} Categorized assets
 */
function categorizeAssets(assets) {
    const categories = {
        walls: [],
        floors: [],
        flora: [],
        doodads: [],
        obstacles: [],
        trim: [],
        characters: [],
        items: [],
        ui: [],
        effects: [],
        other: []
    };

    assets.forEach(asset => {
        if (asset.startsWith('environment/walls/')) {
            categories.walls.push(asset);
        } else if (asset.startsWith('environment/floors/')) {
            categories.floors.push(asset);
        } else if (asset.startsWith('environment/flora/')) {
            categories.flora.push(asset);
        } else if (asset.startsWith('environment/doodads/')) {
            categories.doodads.push(asset);
        } else if (asset.startsWith('environment/obstacles/')) {
            categories.obstacles.push(asset);
        } else if (asset.startsWith('environment/trim/')) {
            categories.trim.push(asset);
        } else if (asset.startsWith('environment/effects/')) {
            categories.effects.push(asset);
        } else if (asset.startsWith('characters/')) {
            categories.characters.push(asset);
        } else if (asset.startsWith('items/')) {
            categories.items.push(asset);
        } else if (asset.startsWith('ui/')) {
            categories.ui.push(asset);
        } else {
            categories.other.push(asset);
        }
    });

    return categories;
}

/**
 * Vite plugin for automatic asset discovery
 * Scans the assets directory and generates asset constants at build time
 */
export function assetDiscoveryPlugin() {
    let assetsDir = '';
    let scannedAssets = [];
    let categorizedAssets = {};

    return {
        name: 'vite-plugin-asset-discovery',

        configResolved(config) {
            // Get the assets directory from Vite config
            // Scan from public/assets/ subdirectory, not public/ root
            const publicDir = config.publicDir || join(config.root, 'public');
            assetsDir = join(publicDir, 'assets');
            console.log('[Asset Discovery] Scanning assets directory:', assetsDir);

            // Scan the assets directory
            scannedAssets = scanDirectory(assetsDir, assetsDir);
            categorizedAssets = categorizeAssets(scannedAssets);

            console.log('[Asset Discovery] Found assets:');
            console.log(`  - Walls: ${categorizedAssets.walls.length}`);
            console.log(`  - Floors: ${categorizedAssets.floors.length}`);
            console.log(`  - Flora: ${categorizedAssets.flora.length}`);
            console.log(`  - Doodads: ${categorizedAssets.doodads.length}`);
            console.log(`  - Obstacles: ${categorizedAssets.obstacles.length}`);
            console.log(`  - Trim: ${categorizedAssets.trim.length}`);
            console.log(`  - Characters: ${categorizedAssets.characters.length}`);
            console.log(`  - Items: ${categorizedAssets.items.length}`);
            console.log(`  - UI: ${categorizedAssets.ui.length}`);
            console.log(`  - Effects: ${categorizedAssets.effects.length}`);
            console.log(`  - Other: ${categorizedAssets.other.length}`);
            console.log(`  - Total: ${scannedAssets.length}`);
        },

        resolveId(id) {
            // Intercept imports to our virtual module
            if (id === 'virtual:asset-manifest') {
                return '\0virtual:asset-manifest';
            }
            return null;
        },

        load(id) {
            // Provide the virtual module content
            if (id === '\0virtual:asset-manifest') {
                // Generate the JavaScript module
                const code = `// Auto-generated by vite-plugin-asset-discovery
// DO NOT EDIT MANUALLY - This file is automatically generated at build time

/**
 * All discovered image assets
 * @type {string[]}
 */
export const IMAGE_ASSETS = ${JSON.stringify(scannedAssets, null, 2)};

/**
 * Assets categorized by type
 * @type {Object}
 */
export const ASSET_CATEGORIES = ${JSON.stringify(categorizedAssets, null, 2)};

/**
 * Wall assets for zone editor
 * @type {string[]}
 */
export const WALL_ASSETS = ${JSON.stringify(categorizedAssets.walls, null, 2)};

/**
 * Floor assets for zone editor
 * @type {string[]}
 */
export const FLOOR_ASSETS = ${JSON.stringify(categorizedAssets.floors, null, 2)};

/**
 * Flora assets for zone editor
 * @type {string[]}
 */
export const FLORA_ASSETS = ${JSON.stringify(categorizedAssets.flora, null, 2)};

/**
 * Doodad assets for zone editor
 * @type {string[]}
 */
export const DOODAD_ASSETS = ${JSON.stringify(categorizedAssets.doodads, null, 2)};

/**
 * Get asset key from path (e.g., 'environment/walls/clubwall6.png' -> 'clubwall6')
 * @param {string} assetPath - The asset path
 * @returns {string} The asset key
 */
export function getAssetKey(assetPath) {
    const parts = assetPath.split('/');
    const filename = parts[parts.length - 1];
    return filename.replace(/\\.(png|jpg|jpeg|gif)$/, '');
}

/**
 * Get asset key with category prefix (e.g., 'environment/walls/clubwall6.png' -> 'walls/clubwall6')
 * @param {string} assetPath - The asset path
 * @returns {string} The asset key with category
 */
export function getAssetKeyWithCategory(assetPath) {
    if (assetPath.startsWith('environment/')) {
        const withoutEnv = assetPath.replace('environment/', '');
        const parts = withoutEnv.split('/');
        if (parts.length >= 2) {
            const category = parts[0];
            const filename = parts[parts.length - 1].replace(/\\.(png|jpg|jpeg|gif)$/, '');
            return \`\${category}/\${filename}\`;
        }
    }
    // For non-environment assets, just return the filename
    const parts = assetPath.split('/');
    const filename = parts[parts.length - 1];
    return filename.replace(/\\.(png|jpg|jpeg|gif)$/, '');
}
`;
                return code;
            }
            return null;
        },

        // Hot reload support for development
        handleHotUpdate({ file, server }) {
            // If an asset file is added/removed/changed, rescan and reload
            if (file.startsWith(assetsDir) && /\\.(png|jpg|jpeg|gif)$/.test(file)) {
                console.log('[Asset Discovery] Asset change detected, rescanning...');
                scannedAssets = scanDirectory(assetsDir, assetsDir);
                categorizedAssets = categorizeAssets(scannedAssets);

                // Invalidate the virtual module to trigger reload
                const module = server.moduleGraph.getModuleById('\0virtual:asset-manifest');
                if (module) {
                    server.moduleGraph.invalidateModule(module);
                }

                return [];
            }
        }
    };
}
