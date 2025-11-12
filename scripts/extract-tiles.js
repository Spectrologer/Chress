const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

async function extractTiles() {
  const inputPath = path.join(__dirname, '..', 'static', 'assets', 'hidden', 'museum_tiles.png');
  const outputDir = path.join(__dirname, '..', 'static', 'assets', 'hidden');

  // Load the image
  const image = await loadImage(inputPath);
  const width = image.width;
  const height = image.height;

  console.log(`Image dimensions: ${width}x${height}`);

  const tileSize = 16;
  const tilesX = Math.floor(width / tileSize);
  const tilesY = Math.floor(height / tileSize);

  console.log(`Extracting ${tilesX * tilesY} tiles (${tilesX}x${tilesY})...`);

  let tileIndex = 0;

  for (let y = 0; y < tilesY; y++) {
    for (let x = 0; x < tilesX; x++) {
      const canvas = createCanvas(tileSize, tileSize);
      const ctx = canvas.getContext('2d');

      // Draw the tile portion of the image
      ctx.drawImage(
        image,
        x * tileSize, y * tileSize, tileSize, tileSize,
        0, 0, tileSize, tileSize
      );

      // Save the tile
      const outputPath = path.join(outputDir, `museum_tile_${tileIndex}.png`);
      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(outputPath, buffer);

      console.log(`Extracted tile ${tileIndex}: museum_tile_${tileIndex}.png (position: ${x},${y})`);
      tileIndex++;
    }
  }

  console.log(`\nSuccessfully extracted ${tileIndex} tiles!`);
}

extractTiles().catch(err => {
  console.error('Error extracting tiles:', err);
  process.exit(1);
});
