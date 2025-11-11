const fs = require('fs');
const css = fs.readFileSync('styles.css', 'utf-8');

// Extract all hex colors from CSS
const hexColors = css.match(/#[0-9a-fA-F]{3,8}/g) || [];
const uniqueColors = [...new Set(hexColors.map(c => c.toLowerCase()))];

// Pear36 palette
const pear36 = [
  '#050505', '#0f0f14', '#1a1a24', '#272736', '#3e3546', '#5e315b',
  '#8c3f5d', '#ba6156', '#f2a65e', '#ffe478', '#cfff70', '#8fde5d',
  '#3ca370', '#3d6e70', '#323e4f', '#4b5bab', '#4da6ff', '#c2c2d1',
  '#7e7e8f', '#606070', '#473b78', '#2b2b2b', '#414141', '#5c5c5c',
  '#8b8b8b', '#b0b0b0', '#d4d4d4', '#ffffeb', '#ffb5b5', '#ff6b97',
  '#9f4f69', '#7a3045', '#5c1f39', '#3f0d2b', '#2b0719', '#1a0410'
];

const nonPear36 = uniqueColors.filter(c => !pear36.includes(c));
console.log('Non-Pear36 colors found:');
console.log(nonPear36.join('\n'));
console.log('\nTotal unique colors: ' + uniqueColors.length);
console.log('Non-Pear36 colors: ' + nonPear36.length);
