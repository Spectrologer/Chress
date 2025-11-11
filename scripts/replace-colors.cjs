// Color replacement script - replaces non-palette colors with closest palette matches

const fs = require('fs');
const path = require('path');

// Color replacements map (old -> new)
const REPLACEMENTS = {
  '#888888': '#7e7e8f',
  '#808080': '#7e7e8f',
  '#708090': '#7e7e8f',
  '#a0a0a0': '#7e7e8f',
  '#8a6a82': '#7e7e8f',
  '#ffcb8d': '#ffe478',
  '#f4e8f0': '#ffffeb',
  '#ffffff': '#ffffeb',
  '#654321': '#57294b',
  '#696969': '#606070',
  '#666666': '#606070',
  '#6a4a62': '#606070',
  '#7a5a72': '#606070',
  '#b8a0b0': '#c2c2d1',
  '#5a3a52': '#5e315b',
  '#ffff00': '#cfff70',
  '#ffd700': '#f2a65e',
  '#ff4444': '#eb564b',
  '#ff6666': '#e36956',
  '#f44336': '#eb564b',
  '#ff0000': '#eb564b',
  '#66ff66': '#8fde5d',
  '#00ff00': '#3ca370',
  '#00ffff': '#66ffe3',
  '#2c1810': '#272736',
  '#003300': '#272736',
  '#001100': '#272736',
  '#111111': '#272736',
  '#006400': '#272736',
  '#005500': '#272736',
  '#000000': '#272736',
  '#ff00ff': '#ff6b97'
};

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

// Replace colors in a file
function replaceColorsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  const changes = [];

  for (const [oldColor, newColor] of Object.entries(REPLACEMENTS)) {
    // Case-insensitive regex
    const regex = new RegExp(oldColor, 'gi');

    if (regex.test(content)) {
      const matches = content.match(regex) || [];
      content = content.replace(regex, newColor);
      modified = true;
      changes.push(`  ${oldColor} -> ${newColor} (${matches.length} occurrences)`);
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    return changes;
  }

  return null;
}

// Main function
function replaceColors() {
  const srcDir = path.join(__dirname, '..', 'src');
  const files = findFiles(srcDir, ['.ts', '.json', '.js']);

  console.log('=== COLOR REPLACEMENT REPORT ===\n');
  console.log(`Scanning ${files.length} files...\n`);

  let filesModified = 0;
  let totalReplacements = 0;

  for (const file of files) {
    const changes = replaceColorsInFile(file);

    if (changes) {
      filesModified++;
      totalReplacements += changes.length;
      console.log(`Modified: ${path.relative(srcDir, file)}`);
      changes.forEach(change => console.log(change));
      console.log();
    }
  }

  console.log('=== SUMMARY ===');
  console.log(`Files modified: ${filesModified}`);
  console.log(`Total replacement types: ${totalReplacements}`);
  console.log('\nAll colors have been replaced with their closest Pear 36 palette matches!');
}

replaceColors();
