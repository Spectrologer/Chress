// Auto-generated zone editor assets
// This file is generated at build time by scanning the assets directory
// Import this in zone-editor.html to get automatic asset discovery

import { ASSET_CATEGORIES, getAssetKeyWithCategory } from 'virtual:asset-manifest';

/**
 * Generate tile assets mapping for zone editor
 * Converts asset paths to zone editor format
 */
export function generateTileAssets(): Record<string, string> {
  const tileAssets: Record<string, string> = {};

  // Process walls
  ASSET_CATEGORIES.walls.forEach((assetPath: string) => {
    const key = getAssetKeyWithCategory(assetPath);
    tileAssets[key] = `../assets/${assetPath}`;
  });

  // Process floors
  ASSET_CATEGORIES.floors.forEach((assetPath: string) => {
    const key = getAssetKeyWithCategory(assetPath);
    tileAssets[key] = `../assets/${assetPath}`;
  });

  // Process trim
  ASSET_CATEGORIES.trim.forEach((assetPath: string) => {
    const key = getAssetKeyWithCategory(assetPath);
    tileAssets[key] = `../assets/${assetPath}`;
  });

  // Process obstacles
  ASSET_CATEGORIES.obstacles.forEach((assetPath: string) => {
    const key = getAssetKeyWithCategory(assetPath);
    tileAssets[key] = `../assets/${assetPath}`;
  });

  // Process doodads (structures)
  ASSET_CATEGORIES.doodads.forEach((assetPath: string) => {
    const filename = assetPath.split('/').pop()?.replace(/\.(png|jpg|jpeg|gif)$/, '') || '';
    tileAssets[filename] = `../assets/${assetPath}`;
  });

  // Process items
  ASSET_CATEGORIES.items.forEach((assetPath: string) => {
    const filename = assetPath.split('/').pop()?.replace(/\.(png|jpg|jpeg|gif)$/, '') || '';
    tileAssets[filename] = `../assets/${assetPath}`;
  });

  // Process characters (enemies and NPCs)
  ASSET_CATEGORIES.characters.forEach((assetPath: string) => {
    const filename = assetPath.split('/').pop()?.replace(/\.(png|jpg|jpeg|gif)$/, '') || '';
    // Skip portrait images (they're not used in zone editor)
    if (!filename.includes('face')) {
      tileAssets[filename] = `../assets/${assetPath}`;
    }
  });

  // Process UI elements
  ASSET_CATEGORIES.ui.forEach((assetPath: string) => {
    const filename = assetPath.split('/').pop()?.replace(/\.(png|jpg|jpeg|gif)$/, '') || '';
    tileAssets[filename] = `../assets/${assetPath}`;
  });

  return tileAssets;
}

/**
 * Generate default palettes for zone editor
 */
export function generateDefaultPalettes(): Record<string, (string | null)[]> {
  const palettes: Record<string, (string | null)[]> = {};

  // Generate FLOOR palette from discovered floor assets
  palettes.FLOOR = ASSET_CATEGORIES.floors.map((assetPath: string) => getAssetKeyWithCategory(assetPath));
  palettes.FLOOR.push(null); // Add null for eraser

  // Generate WALL palette from discovered wall assets
  palettes.WALL = ASSET_CATEGORIES.walls.map((assetPath: string) => getAssetKeyWithCategory(assetPath));
  palettes.WALL.push(null); // Add null for eraser

  // Generate TRIM palette
  palettes.TRIM = ASSET_CATEGORIES.trim.map((assetPath: string) => getAssetKeyWithCategory(assetPath));
  palettes.TRIM.push(null);

  // Generate OBSTACLES palette
  palettes.OBSTACLES = ASSET_CATEGORIES.obstacles.map((assetPath: string) => getAssetKeyWithCategory(assetPath));
  // Add common obstacles from doodads
  ['hole', 'pitfall'].forEach(name => {
    if (ASSET_CATEGORIES.doodads.some((path: string) => path.includes(name))) {
      palettes.OBSTACLES.push(name);
    }
  });
  palettes.OBSTACLES.push(null);

  // Generate STRUCTURE palette
  palettes.STRUCTURE = [];
  const structureNames = ['cistern', 'deadtree', 'club', 'shack', 'sign', 'table', 'well'];
  structureNames.forEach(name => {
    if (ASSET_CATEGORIES.doodads.some((path: string) => path.includes(name))) {
      palettes.STRUCTURE.push(name);
    }
  });
  palettes.STRUCTURE.push(null);

  // PORT palette (manual entries for special cases)
  palettes.PORT = [
    'exit_down', 'exit_left', 'exit_right', 'exit_up',
    'port_cistern', 'port_interior', 'port_stairdown', 'port_stairup',
    null
  ];

  // Generate ITEM palette
  palettes.ITEM = [
    'random_item', 'random_radial_item', 'random_food_water',
    // Add discovered items
    ...ASSET_CATEGORIES.items
      .filter((path: string) => !path.includes('portraits'))
      .map((path: string) => path.split('/').pop()?.replace(/\.(png|jpg|jpeg|gif)$/, '') || '')
      .filter((name: string) => !['heart', 'points', 'chest', 'arrow'].includes(name)), // Exclude system items
    null
  ];

  // Generate ENEMY palette
  palettes.ENEMY = ASSET_CATEGORIES.characters
    .filter((path: string) => path.includes('enemies'))
    .map((path: string) => path.split('/').pop()?.replace(/\.(png|jpg|jpeg|gif)$/, '') || '');
  palettes.ENEMY.push(null);

  // Generate NPC palette
  palettes.NPC = ['random_merchant'];
  ASSET_CATEGORIES.characters
    .filter((path: string) => path.includes('npcs') && !path.includes('face') && !path.includes('portraits'))
    .forEach((path: string) => {
      const name = path.split('/').pop()?.replace(/\.(png|jpg|jpeg|gif)$/, '') || '';
      palettes.NPC.push(name);
    });
  palettes.NPC.push(null);

  // Generate STATUE palette
  palettes.STATUE = [];
  // Add statues for key items
  ['bomb', 'book', 'bow', 'horse', 'shovel', 'spear'].forEach(name => {
    if (ASSET_CATEGORIES.items.some((path: string) => path.includes(name))) {
      palettes.STATUE.push(`${name}_statue`);
    }
  });
  // Add statues for enemies
  ASSET_CATEGORIES.characters
    .filter((path: string) => path.includes('enemies'))
    .forEach((path: string) => {
      const name = path.split('/').pop()?.replace(/\.(png|jpg|jpeg|gif)$/, '') || '';
      palettes.STATUE.push(`${name}_statue`);
    });
  palettes.STATUE.push(null);

  return palettes;
}

// Export for use in zone editor
export const AUTO_TILE_ASSETS = generateTileAssets();
export const AUTO_PALETTES = generateDefaultPalettes();
