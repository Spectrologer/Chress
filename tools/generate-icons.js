/**
 * Simple PWA Icon Generator
 * Creates placeholder PWA icons by copying and noting the required sizes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.join(__dirname, '..');
const assetsUiPath = path.join(projectRoot, 'assets', 'ui');
const sourcePath = path.join(assetsUiPath, 'title.png');

const icons = [
  { name: 'icon-192.png', size: '192x192' },
  { name: 'icon-512.png', size: '512x512' },
  { name: 'icon-apple-touch.png', size: '180x180' }
];

console.log('Generating PWA icons...');
console.log('Source:', sourcePath);

// Ensure source exists
if (!fs.existsSync(sourcePath)) {
  console.error('❌ Source image not found:', sourcePath);
  process.exit(1);
}

// Create icons by copying the source
// Note: These will not be resized, just placeholder copies
// For production, use proper image processing tools
icons.forEach(icon => {
  const destPath = path.join(assetsUiPath, icon.name);

  try {
    fs.copyFileSync(sourcePath, destPath);
    console.log(`✓ Created ${icon.name} (placeholder - needs ${icon.size})`);
  } catch (err) {
    console.error(`❌ Failed to create ${icon.name}:`, err.message);
  }
});

console.log('\n✓ Icon generation complete!');
console.log('\nNote: These are placeholder copies of title.png');
console.log('For production, create properly sized icons:');
icons.forEach(icon => {
  console.log(`  - ${icon.name}: ${icon.size}`);
});
