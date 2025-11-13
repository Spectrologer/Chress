const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

async function extractTilesFromImage(inputFilename, outputPrefix) {
  const inputPath = path.join(__dirname, '..', 'static', 'assets', 'hidden', inputFilename);
  const outputDir = path.join(__dirname, '..', 'static', 'assets', 'hidden', outputPrefix);

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Load the image
  const image = await loadImage(inputPath);
  const width = image.width;
  const height = image.height;

  console.log(`\n${inputFilename}:`);
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
      const outputPath = path.join(outputDir, `${outputPrefix}_tile_${tileIndex}.png`);
      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(outputPath, buffer);

      console.log(`Extracted tile ${tileIndex}: ${outputPrefix}_tile_${tileIndex}.png (position: ${x},${y})`);
      tileIndex++;
    }
  }

  console.log(`Successfully extracted ${tileIndex} tiles from ${inputFilename}!`);
}

async function extractAllMuseumExteriors() {
  try {
    await extractTilesFromImage('white_mus_exterior.png', 'white_mus_exterior');
    await extractTilesFromImage('black_mus_exterior.png', 'black_mus_exterior');
    console.log('\n✓ All museum exterior tiles extracted successfully!');
  } catch (err) {
    console.error('Error extracting tiles:', err);
    process.exit(1);
  }
}

extractAllMuseumExteriors();
