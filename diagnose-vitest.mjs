// Diagnostic script using Vitest's internal loader
import { startVitest } from 'vitest/node';

const testFile = process.argv[2] || 'tests/CombatManager.test.ts';

console.log(`\n🔍 Diagnosing test file: ${testFile}\n`);

try {
  const vitest = await startVitest('test', [testFile], {
    watch: false,
    run: true,
    reporters: ['verbose'],
    logLevel: 'error'
  });

  if (vitest) {
    await vitest.close();
  }
} catch (error) {
  console.log('❌ Error during test execution:');
  console.log(error);
}
