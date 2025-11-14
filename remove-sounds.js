const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/core/sound/MusicPatterns.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Remove all .sound("gm_*") calls
content = content.replace(/\s*\.sound\("gm_[^"]*"\)/g, '');

fs.writeFileSync(filePath, content);
console.log('Removed all .sound() calls');
