// Centralized logger module to handle all logging operations
const logger = {
  log: (...args) => console.log(...args),
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args),
  info: (...args) => console.info(...args),
  debug: (...args) => console.debug(...args),
  table: (...data) => console.table(...data),
  trace: (...args) => console.trace(...args),
  help: () => {
    console.log('=== Debug Commands ===');
    console.log('Enemy Spawning:');
    console.log('  1: Spawn Lizardy enemy');
    console.log('  2: Spawn Lizardeaux enemy');
    console.log('  3: Spawn Lizardea enemy');
    console.log('  4: Spawn Lizardo enemy');
    console.log('  5: Spawn Lizalad enemy');
    console.log('Weapon/Axe/Hammer/Spear Spawning:');
    console.log('  f: Spawn Axe');
    console.log('  g: Spawn Hammer');
    console.log('  h: Spawn Bishop Spear');
    console.log('Special Spawn Locations:');
    console.log('  s: Force Whispering Canyon spawn');
    console.log('  p: Show puzzle zone message');
    console.log('  j: Teleport to food/water room');
    console.log('God Mode Items:');
    console.log('  k: Spawn Two-Handed Sword');
    console.log('  l: Spawn Giant Axe');
    console.log('Other:');
    console.log('  x: Clear enemies');
    console.log('  Press any key for its code');
    console.log('===================');
  }
};

export default logger;
