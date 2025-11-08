// Diagnostic script to trace import errors
import { createRequire } from 'module';
import { pathToFileURL } from 'url';

const testFile = process.argv[2] || 'tests/CombatManager.test.ts';

console.log(`\n🔍 Diagnosing imports for: ${testFile}\n`);

try {
  // Try to import the test file directly
  const testUrl = pathToFileURL(testFile).href;
  console.log(`Attempting to import: ${testUrl}`);

  await import(testUrl);

  console.log('✅ Test file imported successfully!');
} catch (error) {
  console.log('❌ Import failed with error:');
  console.log(error.message);
  console.log('\nFull stack trace:');
  console.log(error.stack);
}
