#!/usr/bin/env node

/**
 * TypeScript Strict Mode Migration Helper
 *
 * This script helps with the incremental migration to TypeScript strict mode.
 *
 * Usage:
 *   node scripts/typescript-migration-helper.js [command]
 *
 * Commands:
 *   errors        - Show error summary by type
 *   progress      - Show migration progress
 *   candidates    - Find good files to migrate next
 *   check-file    - Check specific file for strict mode errors
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function runTsc(additionalFlags = '') {
  try {
    execSync(`npx tsc --noEmit ${additionalFlags}`, { encoding: 'utf8' });
    return '';
  } catch (error) {
    return error.stdout || error.stderr || '';
  }
}

function showErrors() {
  console.log(`${colors.bold}${colors.cyan}Current TypeScript Errors${colors.reset}\n`);

  const output = runTsc();
  const errors = output.split('\n').filter(line => line.includes('error TS'));

  // Count by error code
  const errorCounts = {};
  errors.forEach(line => {
    const match = line.match(/error (TS\d+)/);
    if (match) {
      const code = match[1];
      errorCounts[code] = (errorCounts[code] || 0) + 1;
    }
  });

  // Sort by count
  const sorted = Object.entries(errorCounts).sort((a, b) => b[1] - a[1]);

  console.log(`${colors.bold}Error Summary:${colors.reset}`);
  console.log(`Total errors: ${colors.red}${errors.length}${colors.reset}\n`);

  console.log('Top errors by type:');
  sorted.slice(0, 10).forEach(([code, count]) => {
    const description = getErrorDescription(code);
    console.log(`  ${colors.yellow}${code}${colors.reset}: ${count.toString().padStart(4)} - ${description}`);
  });

  // Show strict mode errors
  console.log(`\n${colors.bold}Strict Mode Error Estimates:${colors.reset}`);

  const strictChecks = [
    { flag: '--noImplicitAny', name: 'noImplicitAny', codes: ['TS7'] },
    { flag: '--strictNullChecks', name: 'strictNullChecks', codes: ['TS2345', 'TS2322', 'TS2532', 'TS2531'] },
    { flag: '--strictFunctionTypes', name: 'strictFunctionTypes', codes: ['TS2322', 'TS2345'] },
    { flag: '--strictBindCallApply', name: 'strictBindCallApply', codes: ['TS2345'] },
    { flag: '--strictPropertyInitialization', name: 'strictPropertyInitialization', codes: ['TS2564'] },
  ];

  strictChecks.forEach(({ flag, name }) => {
    const output = runTsc(flag);
    const count = (output.match(/error TS/g) || []).length;
    const bar = '█'.repeat(Math.min(50, Math.floor(count / 20)));
    console.log(`  ${name.padEnd(30)} ${colors.red}${count.toString().padStart(5)}${colors.reset} ${bar}`);
  });
}

function getErrorDescription(code) {
  const descriptions = {
    'TS2345': 'Argument type mismatch',
    'TS2339': 'Property does not exist',
    'TS2322': 'Type assignment mismatch',
    'TS5097': 'Import declaration conflicts',
    'TS2307': 'Cannot find module',
    'TS2352': 'Conversion may be a mistake',
    'TS2341': 'Property is private',
    'TS2740': 'Type is missing properties',
    'TS2611': 'Property override conflict',
    'TS2554': 'Expected arguments count mismatch',
    'TS2739': 'Type is missing properties',
    'TS1345': 'Expression not callable',
    'TS2367': 'Cannot compare types',
    'TS2416': 'Property not assignable to base',
    'TS7006': 'Parameter implicitly has any',
    'TS7018': 'Property implicitly has any',
    'TS2532': 'Object is possibly undefined',
    'TS2531': 'Object is possibly null',
    'TS2564': 'Property has no initializer',
  };
  return descriptions[code] || 'Unknown error';
}

function showProgress() {
  console.log(`${colors.bold}${colors.cyan}Migration Progress${colors.reset}\n`);

  // Count total TypeScript files
  const output = execSync('find src -name "*.ts" -type f', { encoding: 'utf8' });
  const totalFiles = output.split('\n').filter(Boolean).length;

  // Count files with strict mode enabled (would need to scan for comments)
  // For now, show 0
  const strictFiles = 0;

  const percentage = ((strictFiles / totalFiles) * 100).toFixed(1);
  const barWidth = 50;
  const filledWidth = Math.floor((strictFiles / totalFiles) * barWidth);
  const bar = '█'.repeat(filledWidth) + '░'.repeat(barWidth - filledWidth);

  console.log(`Total TypeScript files: ${totalFiles}`);
  console.log(`Files with strict mode: ${strictFiles}`);
  console.log(`Progress: ${colors.green}${bar}${colors.reset} ${percentage}%`);

  console.log(`\n${colors.bold}Next Steps:${colors.reset}`);
  console.log('1. Fix existing errors in lenient mode (currently 619 errors)');
  console.log('2. Start migrating type definition files');
  console.log('3. Migrate utility files');
  console.log('4. Enable strict mode globally');

  console.log(`\n${colors.yellow}See docs/TYPESCRIPT_STRICT_MODE_MIGRATION.md for the full plan${colors.reset}`);
}

function findCandidates() {
  console.log(`${colors.bold}${colors.cyan}Good Migration Candidates${colors.reset}\n`);

  console.log('Finding small, low-complexity files to migrate first...\n');

  // Find utility files sorted by size
  const utilFiles = execSync(
    'find src/utils src/types src/core/constants -name "*.ts" -type f -exec wc -l {} \\; 2>/dev/null | sort -n',
    { encoding: 'utf8' }
  ).split('\n').filter(Boolean).slice(0, 20);

  console.log(`${colors.bold}Smallest utility/type files (good starting points):${colors.reset}`);
  utilFiles.forEach(line => {
    const [lines, file] = line.trim().split(/\s+/);
    if (file) {
      const fileName = path.basename(file);
      console.log(`  ${lines.padStart(4)} lines - ${colors.green}${file}${colors.reset}`);
    }
  });

  console.log(`\n${colors.yellow}Tip: Start with these smaller files to build momentum!${colors.reset}`);
}

function checkFile(filePath) {
  if (!filePath) {
    console.error(`${colors.red}Error: Please provide a file path${colors.reset}`);
    console.log(`Usage: node scripts/typescript-migration-helper.js check-file <path>`);
    process.exit(1);
  }

  console.log(`${colors.bold}${colors.cyan}Checking ${filePath}${colors.reset}\n`);

  // Check with different strict flags
  const checks = [
    { flag: '', name: 'Current (lenient)' },
    { flag: '--noImplicitAny', name: 'noImplicitAny' },
    { flag: '--strictNullChecks', name: 'strictNullChecks' },
    { flag: '--strict', name: 'Full strict mode' },
  ];

  checks.forEach(({ flag, name }) => {
    const output = runTsc(flag);
    const fileErrors = output.split('\n').filter(line =>
      line.includes(filePath.replace(/\\/g, '/')) && line.includes('error TS')
    );

    const status = fileErrors.length === 0
      ? `${colors.green}✓ PASS${colors.reset}`
      : `${colors.red}✗ ${fileErrors.length} errors${colors.reset}`;

    console.log(`${name.padEnd(25)} ${status}`);

    if (fileErrors.length > 0 && fileErrors.length <= 5) {
      fileErrors.forEach(error => {
        console.log(`  ${colors.yellow}${error.trim()}${colors.reset}`);
      });
    }
  });
}

function showHelp() {
  console.log(`${colors.bold}TypeScript Strict Mode Migration Helper${colors.reset}\n`);
  console.log('Usage: node scripts/typescript-migration-helper.js [command] [args]\n');
  console.log('Commands:');
  console.log(`  ${colors.green}errors${colors.reset}              Show error summary by type`);
  console.log(`  ${colors.green}progress${colors.reset}            Show migration progress`);
  console.log(`  ${colors.green}candidates${colors.reset}          Find good files to migrate next`);
  console.log(`  ${colors.green}check-file${colors.reset} <path>   Check specific file for strict mode errors`);
  console.log(`  ${colors.green}help${colors.reset}                Show this help message`);
  console.log(`\nSee ${colors.yellow}docs/TYPESCRIPT_STRICT_MODE_MIGRATION.md${colors.reset} for the full migration plan.`);
}

// Main
const command = process.argv[2] || 'help';

switch (command) {
  case 'errors':
    showErrors();
    break;
  case 'progress':
    showProgress();
    break;
  case 'candidates':
    findCandidates();
    break;
  case 'check-file':
    checkFile(process.argv[3]);
    break;
  case 'help':
  default:
    showHelp();
    break;
}
