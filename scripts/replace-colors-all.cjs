// Comprehensive color replacement for ALL files (JS, TS, JSON, CSS, HTML)

const fs = require('fs');
const path = require('path');

// Comprehensive replacements - using closest palette matches
const REPLACEMENTS = {
  // Grays/Browns
  '888888': '7e7e8f',
  '808080': '7e7e8f',
  '708090': '7e7e8f',
  'a0a0a0': '7e7e8f',
  '8a6a82': '7e7e8f',
  '696969': '606070',
  '666666': '606070',
  '6a4a62': '606070',
  '7a5a72': '606070',
  '999999': '7e7e8f',
  'b8a0b0': 'c2c2d1',
  '5a3a52': '5e315b',
  '111111': '272736',
  '000000': '272736',

  // Beiges/Tans - common in UI
  'fffbe9': 'ffffeb',
  'f4e8f0': 'ffffeb',
  'ffffff': 'ffffeb',
  'e2cfa2': 'ffb5b5',
  'f5deb3': 'ffb5b5',
  'd2b48c': 'ffb570',
  'deb887': 'ffb570',
  'f5e6c0': 'ffe478',
  'e6d3a3': 'ffb5b5',
  'f5f1d9': 'ffffeb',
  'fffdf6': 'ffffeb',
  'd1b089': 'ffb570',
  'c2b280': 'f2a65e',
  'c19a6b': 'ba6156',
  'd4c4a0': 'ffb5b5',

  // Browns - walls, structures
  '8b4513': '964253',
  '654321': '57294b',
  '3a2418': '272736',
  '7a5c2e': '964253',
  '2c1810': '272736',
  '2f1b14': '272736',
  '4a2f1a': '272736',
  '6b4858': '57294b',
  '8b6b7a': '7e7e8f',
  '61382b': '57294b',
  '6a5a4a': '57294b',
  'a56a43': 'ba6156',
  '4a3228': '43434f',

  // Oranges/Golds
  'd2691e': 'eb564b',
  'cd853f': 'e36956',
  'b8860b': 'ba6156',
  'ffcb8d': 'ffe478',
  'ffd700': 'f2a65e',
  'b8985e': 'ba6156',
  'b89b5e': 'ba6156',

  // Yellows
  'ffff00': 'cfff70',
  'f0e68c': 'ffe478',
  'f4e4bc': 'ffe478',
  'dcc086': 'f2a65e',
  'd4b478': 'f2a65e',

  // Reds/Pinks
  'ff4444': 'eb564b',
  'ff6666': 'e36956',
  'f44336': 'eb564b',
  'ff0000': 'eb564b',
  'c0392b': 'b0305c',
  'd84315': 'eb564b',
  'd32f2f': 'eb564b',
  'ff5252': 'eb564b',

  // Purples/Magentas
  'ff00ff': 'ff6b97',
  'd4a8b8': 'ffb5b5',
  'b8a6c8': 'c2c2d1',
  '9e8cb8': '80366b',
  'c6b4d6': 'c2c2d1',
  'ac9ac6': 'bd4882',
  '7d6a8f': '80366b',
  'a68a9e': '80366b',
  '92768a': '80366b',
  '725e70': '73275c',
  'b498ac': 'bd4882',
  'a08498': '80366b',
  '8a2be2': '4b5bab',
  'ff69b4': 'ff6b97',
  '4b0082': '5a265e',
  'ff1493': 'bd4882',
  '9d174d': 'b0305c',
  '8b008b': '80366b',
  'ba55d3': 'bd4882',
  'da70d6': 'ff6b97',
  'dda0dd': 'c2c2d1',

  // Greens
  '66ff66': '8fde5d',
  '00ff00': '3ca370',
  '006400': '272736',
  '005500': '272736',
  '003300': '272736',
  '001100': '272736',
  '228b22': '3ca370',
  '32cd32': '3ca370',
  '4caf50': '3ca370',
  '4a8a59': '3ca370',
  '90ee90': '8fde5d',
  '98fb98': '8fde5d',
  '9acd32': '8fde5d',
  '8fbc8f': '8fde5d',
  '7cfc00': '8fde5d',
  '4a5d23': '43434f',
  '2f3a14': '272736',
  '556b2f': '43434f',
  '20b2aa': '3ca370',
  '0f766e': '3d6e70',
  'a8bcb8': '7e7e8f',
  '8fa8a4': '7e7e8f',
  '6e8a86': '606070',
  'b6cac6': 'c2c2d1',
  '9db6b2': '7e7e8f',

  // Blues/Cyans
  '00ffff': '66ffe3',
  '1976d2': '4b5bab',
  '4169e1': '4b5bab',
  '448aff': '4b5bab',
  '87ceeb': '66ffe3',
  '4682b4': '4b5bab',
  '00ced1': '4da6ff',
  '7fffd4': '66ffe3',
  '5b21b6': '4b5bab',
  '2f4f4f': '323e4f',
  'e0ffff': 'ffffeb',

  // Peachy/Salmon
  'e8b4a0': 'eb564b',
  'd69b85': 'ba6156',
  'b07860': 'ba6156',
  'ecc0ae': 'ffb5b5',
  'dca793': 'e36956',
  'e8c88c': 'ffe478',
  'f0d49a': 'ffe478',

  // Earthy tones
  '9a8a7a': '7e7e8f',
  '867666': '7e7e8f',
  'a89888': 'c2c2d1',
  '948474': '7e7e8f',
  'c8b99c': 'c2c2d1',

  // More reds
  'dc143c': 'b0305c',
  '8b0000': '57294b',
  'b45309': 'ba6156',
  'b87333': 'ba6156',
  'a0522d': '964253',
  'cd5c5c': 'ba6156',
  'ff6347': 'eb564b',

  // Grays
  'd3d3d3': 'c2c2d1',
  'c0c0c0': 'c2c2d1',
  'a9a9a9': 'c2c2d1',
  '4b4b4b': '43434f',
  '3c3c3c': '43434f',
  '2d2d2d': '272736',
  '1e1e1e': '272736',
  '0f0f0f': '272736',
  '555555': '43434f',

  // Pinks/light colors
  'ffe4e1': 'ffffeb',
  'faebd7': 'ffffeb',
  'fffaf0': 'ffffeb',
  'ffb6c1': 'ffb5b5',
  'ffe4b5': 'ffb5b5',

  // Purples (gradients in CSS)
  'f5e8e0': 'ffffeb',
  'edd8cf': 'ffb5b5',
  'e8d5d5': 'ffb5b5',

  // Light purples
  '9370db': '7e7e8f',

  // Background greens for state demo
  '252': '3ca370',

  // Additional colors found in tools/demos
  '5a4223': '57294b',
  '3a2a1a': '272736',
  'a89968': 'ba6156',
  'd4b8c8': 'c2c2d1',
  'd4a574': 'f2a65e',
  '3d2845': '3e2347',
  '4a3428': '43434f',
  '9a8468': '7e7e8f',
  'd8c8a8': 'ffb5b5',
  'c8a478': 'ba6156',
  'f8f4e8': 'ffffeb',
  'e8dcc8': 'ffb5b5',
  '8a7458': '7e7e8f',
  'd8cca8': 'ffb5b5',
  'c8b898': 'ffb570',
  'b8a888': 'c2c2d1',
  'a89878': 'ba6156',
  '988868': '7e7e8f',
  '887858': '7e7e8f',
  '786848': '606070',
  'e8d8b8': 'ffb5b5',
  'c8b088': 'ba6156',
  'b8a078': 'ba6156',
  'a89068': 'ba6156',
  '988058': '7e7e8f',
  '887048': '606070',
  'c4b49c': 'c2c2d1',
  'b4a48c': 'ba6156',
  'a4947c': 'ba6156',
  '94846c': '7e7e8f',
  '84745c': '7e7e8f',
  '74644c': '606070',
  'e0d4c0': 'ffffeb',
  'd0c4b0': 'ffb5b5',
  'c0b4a0': 'c2c2d1',
  'b0a490': 'ba6156',
  'a09480': 'ba6156',
  '908470': '7e7e8f',
  '807460': '7e7e8f',
  '706450': '606070',
  'fce8d8': 'ffffeb',
  'ecd8c8': 'ffb5b5',
  'dcc8b8': 'ffb570',
  'ccb8a8': 'c2c2d1',
  'bca898': 'ba6156',
  'ac9888': 'ba6156',
  '9c8878': '7e7e8f',
  '8c7868': '7e7e8f',
  '7c6858': '606070',
  'e4d8cc': 'ffb5b5',
  'd4c8bc': 'ffb570',
  'c4b8ac': 'c2c2d1',
  'b4a89c': 'ba6156',
  'a4988c': 'ba6156',
  '94887c': '7e7e8f',
  '84786c': '7e7e8f',
  '74685c': '606070',
  'f4ece4': 'ffffeb',
  'e4dcd4': 'ffffeb',
  'd4ccc4': 'ffb5b5',
  'c4bcb4': 'c2c2d1',
  'b4aca4': 'c2c2d1',
  'a49c94': 'ba6156'
};

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

function replaceColorsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  const changes = [];

  for (const [oldColorLower, newColorLower] of Object.entries(REPLACEMENTS)) {
    const oldColorUpper = oldColorLower.toUpperCase();
    const newColorUpper = newColorLower.toUpperCase();

    // Uppercase
    const regexUpper = new RegExp(`#${oldColorUpper}\\b`, 'g');
    if (regexUpper.test(content)) {
      const matches = content.match(regexUpper) || [];
      content = content.replace(regexUpper, `#${newColorUpper}`);
      modified = true;
      changes.push(`  #${oldColorUpper} -> #${newColorUpper} (${matches.length})`);
    }

    // Lowercase
    const regexLower = new RegExp(`#${oldColorLower}\\b`, 'g');
    if (regexLower.test(content)) {
      const matches = content.match(regexLower) || [];
      content = content.replace(regexLower, `#${newColorLower}`);
      modified = true;
      changes.push(`  #${oldColorLower} -> #${newColorLower} (${matches.length})`);
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    return changes;
  }
  return null;
}

function replaceColors() {
  const rootDir = path.join(__dirname, '..');
  const files = findFiles(rootDir, ['.ts', '.json', '.js', '.css', '.html']);

  console.log('=== COMPREHENSIVE COLOR REPLACEMENT ===\n');
  console.log(`Scanning ${files.length} files...\n`);

  let filesModified = 0;
  let totalReplacements = 0;

  for (const file of files) {
    const changes = replaceColorsInFile(file);
    if (changes) {
      filesModified++;
      totalReplacements += changes.length;
      console.log(`Modified: ${path.relative(rootDir, file)}`);
      changes.forEach(change => console.log(change));
      console.log();
    }
  }

  console.log('=== SUMMARY ===');
  console.log(`Files modified: ${filesModified}`);
  console.log(`Replacement operations: ${totalReplacements}`);
  console.log('\nAll colors replaced with Pear 36 palette!');
}

replaceColors();
