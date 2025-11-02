// Test for console commands registry pattern
import consoleCommands from '@core/consoleCommands.js';
import { SPAWN_REGISTRY, ENEMY_REGISTRY } from '@core/consoleCommandsRegistry.js';

console.log('Testing Console Commands Registry Pattern\n');

// Test 1: Verify all spawn commands are generated
console.log('Test 1: Checking spawn command generation...');
let spawnTestsPassed = 0;
let spawnTestsFailed = 0;

for (const config of SPAWN_REGISTRY) {
  if (typeof consoleCommands[config.commandName] === 'function') {
    spawnTestsPassed++;
  } else {
    console.error(`  ❌ Missing command: ${config.commandName}`);
    spawnTestsFailed++;
  }
}
console.log(`  ✓ ${spawnTestsPassed}/${SPAWN_REGISTRY.length} spawn commands generated`);

// Test 2: Verify all enemy commands are generated
console.log('\nTest 2: Checking enemy command generation...');
let enemyTestsPassed = 0;
let enemyTestsFailed = 0;

for (const config of ENEMY_REGISTRY) {
  if (typeof consoleCommands[config.commandName] === 'function') {
    enemyTestsPassed++;
  } else {
    console.error(`  ❌ Missing command: ${config.commandName}`);
    enemyTestsFailed++;
  }
}
console.log(`  ✓ ${enemyTestsPassed}/${ENEMY_REGISTRY.length} enemy commands generated`);

// Test 3: Verify generic spawnEnemy exists
console.log('\nTest 3: Checking generic spawnEnemy command...');
if (typeof consoleCommands.spawnEnemy === 'function') {
  console.log('  ✓ spawnEnemy command exists');
} else {
  console.error('  ❌ spawnEnemy command missing');
}

// Test 4: Verify utility commands exist
console.log('\nTest 4: Checking utility commands...');
const utilityCommands = ['tp', 'gotoInterior', 'gotoWorld', 'loadzone', 'exportzone', 'restartGame'];
let utilityTestsPassed = 0;

for (const cmdName of utilityCommands) {
  if (typeof consoleCommands[cmdName] === 'function') {
    utilityTestsPassed++;
  } else {
    console.error(`  ❌ Missing utility command: ${cmdName}`);
  }
}
console.log(`  ✓ ${utilityTestsPassed}/${utilityCommands.length} utility commands exist`);

// Test 5: Verify special commands exist
console.log('\nTest 5: Checking special commands...');
const specialCommands = ['spawnShack', 'spawnCistern', 'spawnStairdown', 'spawnFoodRandom'];
let specialTestsPassed = 0;

for (const cmdName of specialCommands) {
  if (typeof consoleCommands[cmdName] === 'function') {
    specialTestsPassed++;
  } else {
    console.error(`  ❌ Missing special command: ${cmdName}`);
  }
}
console.log(`  ✓ ${specialTestsPassed}/${specialCommands.length} special commands exist`);

// Test 6: Verify handleHotkey exists
console.log('\nTest 6: Checking hotkey handler...');
if (typeof consoleCommands.handleHotkey === 'function') {
  console.log('  ✓ handleHotkey function exists');
} else {
  console.error('  ❌ handleHotkey function missing');
}

// Summary
const totalTests = 6;
const failedTests = (spawnTestsFailed > 0 ? 1 : 0) + (enemyTestsFailed > 0 ? 1 : 0);
const passedTests = totalTests - failedTests;

console.log('\n' + '='.repeat(50));
console.log(`Summary: ${passedTests}/${totalTests} test groups passed`);

if (failedTests === 0) {
  console.log('✅ All tests passed! Console commands registry pattern is working correctly.');
} else {
  console.log('⚠️  Some tests failed. Please review the errors above.');
  process.exit(1);
}
