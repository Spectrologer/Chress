// Color audit script - finds all hex colors in the codebase and checks against Pear 36 palette

const fs = require('fs');
const path = require('path');

// Pear 36 palette
const PALETTE = [
  '#5e315b', '#8c3f5d', '#ba6156', '#f2a65e', '#ffe478', '#cfff70',
  '#8fde5d', '#3ca370', '#3d6e70', '#323e4f', '#322947', '#473b78',
  '#4b5bab', '#4da6ff', '#66ffe3', '#ffffeb', '#c2c2d1', '#7e7e8f',
  '#606070', '#43434f', '#272736', '#3e2347', '#57294b', '#964253',
  '#e36956', '#ffb570', '#ff9166', '#eb564b', '#b0305c', '#73275c',
  '#422445', '#5a265e', '#80366b', '#bd4882', '#ff6b97', '#ffb5b5'
];

// Helper: convert RGB to hex
function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

// Helper: convert hex to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Calculate Euclidean color distance
function colorDistance(hex1, hex2) {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);

  if (!rgb1 || !rgb2) return Infinity;

  const dr = rgb1.r - rgb2.r;
  const dg = rgb1.g - rgb2.g;
  const db = rgb1.b - rgb2.b;

  return Math.sqrt(dr * dr + dg * dg + db * db);
}

// Find closest palette color
function findClosestPaletteColor(hex) {
  let minDistance = Infinity;
  let closestColor = PALETTE[0];

  for (const paletteColor of PALETTE) {
    const distance = colorDistance(hex, paletteColor);
    if (distance < minDistance) {
      minDistance = distance;
      closestColor = paletteColor;
    }
  }

  return { color: closestColor, distance: minDistance };
}

// Recursively find all files
function findFiles(dir, extensions, files = []) {
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (!item.includes('node_modules') && !item.includes('dist') && !item.includes('.git')) {
        findFiles(fullPath, extensions, files);
      }
    } else if (extensions.some(ext => item.endsWith(ext))) {
      files.push(fullPath);
    }
  }

  return files;
}

// Extract colors from content
function extractColors(content) {
  const hexRegex = /#[0-9a-fA-F]{6}\b/g;
  const matches = content.match(hexRegex);
  return matches ? [...new Set(matches.map(c => c.toLowerCase()))] : [];
}

// Main audit
function auditColors() {
  const srcDir = path.join(__dirname, '..', 'src');
  const files = findFiles(srcDir, ['.ts', '.json', '.js']);

  const colorUsage = new Map();

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const colors = extractColors(content);

    for (const color of colors) {
      if (!colorUsage.has(color)) {
        colorUsage.set(color, []);
      }

      // Find line numbers
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (line.includes(color)) {
          colorUsage.get(color).push({
            file: path.relative(srcDir, file),
            line: index + 1,
            context: line.trim()
          });
        }
      });
    }
  }

  // Analyze results
  const inPalette = [];
  const notInPalette = [];

  for (const [color, locations] of colorUsage) {
    const isInPalette = PALETTE.includes(color);

    if (isInPalette) {
      inPalette.push({ color, count: locations.length, locations });
    } else {
      const closest = findClosestPaletteColor(color);
      notInPalette.push({
        color,
        count: locations.length,
        locations,
        closestColor: closest.color,
        distance: closest.distance.toFixed(2)
      });
    }
  }

  // Output results
  console.log('=== COLOR AUDIT REPORT ===\n');

  console.log(`Colors in palette: ${inPalette.length}`);
  console.log(`Colors NOT in palette: ${notInPalette.length}`);
  console.log(`Total unique colors: ${colorUsage.size}\n`);

  if (notInPalette.length > 0) {
    console.log('=== COLORS NOT IN PALETTE ===\n');

    notInPalette.sort((a, b) => b.count - a.count);

    for (const item of notInPalette) {
      console.log(`Color: ${item.color} (used ${item.count} times)`);
      console.log(`  Closest palette color: ${item.closestColor} (distance: ${item.distance})`);
      console.log(`  Locations:`);

      // Show first 5 locations
      const locationsToShow = item.locations.slice(0, 5);
      for (const loc of locationsToShow) {
        console.log(`    ${loc.file}:${loc.line}`);
        console.log(`      ${loc.context}`);
      }

      if (item.locations.length > 5) {
        console.log(`    ... and ${item.locations.length - 5} more`);
      }

      console.log();
    }
  }

  // Generate replacement recommendations
  console.log('\n=== RECOMMENDED REPLACEMENTS ===\n');

  const replacements = notInPalette.map(item => ({
    old: item.color,
    new: item.closestColor,
    count: item.count,
    distance: item.distance
  }));

  console.log(JSON.stringify(replacements, null, 2));
}

auditColors();
