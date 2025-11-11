// Color replacement script for uppercase hex colors

const fs = require('fs');
const path = require('path');

// Color replacements map (lowercase old -> new)
const REPLACEMENTS = {
  '8b4513': '964253',
  '228b22': '3ca370',
  'd2691e': 'eb564b',
  '4169e1': '4b5bab',
  'ff6347': 'eb564b',
  '32cd32': '3ca370',
  '8a2be2': '4b5bab',
  'ff69b4': 'ff6b97',
  'a0522d': '964253',
  '87ceeb': '66ffe3',
  '9370db': '7e7e8f',
  '2f4f4f': '323e4f',
  'd3d3d3': 'c2c2d1',
  'a9a9a9': 'c2c2d1',
  '8fbc8f': '8fde5d',
  '4682b4': '4b5bab',
  'dc143c': 'b0305c',
  'f0e68c': 'ffe478',
  'c0c0c0': 'c2c2d1',
  '7fffd4': '66ffe3',
  'ffe4e1': 'ffffeb',
  'ba55d3': 'bd4882',
  'faebd7': 'ffffeb',
  'dda0dd': 'c2c2d1',
  'f5deb3': 'ffb5b5',
  'cd5c5c': 'ba6156',
  '00ced1': '4da6ff',
  '20b2aa': '3ca370',
  '556b2f': '43434f',
  'b8860b': 'ba6156',
  'fffaf0': 'ffffeb',
  'ffb6c1': 'ffb5b5',
  'da70d6': 'ff6b97',
  'd2b48c': 'ffb570',
  'e0ffff': 'ffffeb',
  'ffe4b5': 'ffb5b5',
  '98fb98': '8fde5d',
  'deb887': 'ffb570',
  '4b0082': '5a265e',
  'ff1493': 'bd4882',
  '9acd32': '8fde5d',
  '8b008b': '80366b',
  '90ee90': '8fde5d',
  '7cfc00': '8fde5d',
  '4b4b4b': '43434f',
  '3c3c3c': '43434f',
  '2d2d2d': '272736',
  '1e1e1e': '272736',
  '0f0f0f': '272736',
  '4a5d23': '43434f',
  '2f3a14': '272736',
  'c2b280': 'f2a65e',
  'e6d3a3': 'ffb5b5',
  '2f1b14': '272736',
  'c8b99c': 'c2c2d1',
  'cd853f': 'e36956',
  '8b0000': '57294b',
  'b45309': 'ba6156',
  'b87333': 'ba6156',
  '5b21b6': '4b5bab',
  '9d174d': 'b0305c',
  '0f766e': '3d6e70',
  '4caf50': '3ca370'
};

// Recursively find all files
function findFiles(dir, extensions, files = []) {
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (!item.includes('node_modules') && !item.includes('dist') && !item.includes('.git') && !item.includes('scripts')) {
        findFiles(fullPath, extensions, files);
      }
    } else if (extensions.some(ext => item.endsWith(ext))) {
      files.push(fullPath);
    }
  }

  return files;
}

// Replace colors in a file, preserving case
function replaceColorsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  const changes = [];

  for (const [oldColorLower, newColorLower] of Object.entries(REPLACEMENTS)) {
    // Try both uppercase and lowercase versions
    const oldColorUpper = oldColorLower.toUpperCase();
    const newColorUpper = newColorLower.toUpperCase();

    // Replace uppercase #8B4513 style
    const regexUpper = new RegExp(`#${oldColorUpper}\\b`, 'g');
    if (regexUpper.test(content)) {
      const matches = content.match(regexUpper) || [];
      content = content.replace(regexUpper, `#${newColorUpper}`);
      modified = true;
      changes.push(`  #${oldColorUpper} -> #${newColorUpper} (${matches.length} occurrences)`);
    }

    // Replace lowercase #8b4513 style
    const regexLower = new RegExp(`#${oldColorLower}\\b`, 'g');
    if (regexLower.test(content)) {
      const matches = content.match(regexLower) || [];
      content = content.replace(regexLower, `#${newColorLower}`);
      modified = true;
      changes.push(`  #${oldColorLower} -> #${newColorLower} (${matches.length} occurrences)`);
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

  console.log('=== UPPERCASE COLOR REPLACEMENT REPORT ===\n');
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
  console.log('\nAll uppercase colors have been replaced!');
}

replaceColors();
