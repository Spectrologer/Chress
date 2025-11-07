// Debug script to test board loading
import { BoardLoader } from './src/core/BoardLoader.js';
import fs from 'fs';

const boardLoader = new BoardLoader();
const museumData = JSON.parse(fs.readFileSync('./boards/canon/museum.json', 'utf8'));

console.log('Museum Board Data Analysis');
console.log('===========================\n');

// Check the board data structure
console.log('Size:', museumData.size);
console.log('Terrain entries:', museumData.terrain.length);
console.log('Features:', Object.keys(museumData.features).length);
console.log('Overlays:', Object.keys(museumData.overlays || {}).length);
console.log('Rotations:', Object.keys(museumData.rotations || {}).length);
console.log('Overlay Rotations:', Object.keys(museumData.overlayRotations || {}).length);

console.log('\n=== Bottom Row (y=9) Analysis ===\n');

const [width, height] = museumData.size;

for (let x = 0; x < width; x++) {
  const coord = `${x},9`;
  const index = 9 * width + x;
  const terrain = museumData.terrain[index];
  const overlay = museumData.overlays?.[coord];
  const rotation = museumData.rotations?.[coord];
  const overlayRotation = museumData.overlayRotations?.[coord];

  console.log(`Position ${coord}:`);
  console.log(`  Terrain: ${terrain}`);
  console.log(`  Overlay: ${overlay || 'none'}`);
  console.log(`  Terrain Rotation: ${rotation !== undefined ? rotation : 'none'}`);
  console.log(`  Overlay Rotation: ${overlayRotation !== undefined ? overlayRotation : 'none'}`);
  console.log('');
}

console.log('\n=== Converting to grid ===\n');
const result = boardLoader.convertBoardToGrid(museumData, []);

console.log('Terrain textures on bottom row:');
for (let x = 0; x < width; x++) {
  const coord = `${x},9`;
  console.log(`${coord}: terrain=${result.terrainTextures[coord]}, rotation=${result.rotations[coord] || 0}`);
}

console.log('\nOverlay textures on bottom row:');
for (let x = 0; x < width; x++) {
  const coord = `${x},9`;
  if (result.overlayTextures[coord]) {
    console.log(`${coord}: overlay=${result.overlayTextures[coord]}, rotation=${result.overlayRotations[coord] || 0}`);
  }
}
