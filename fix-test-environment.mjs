#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Function to remove jest-environment directives from a file
function removeJestEnvironment(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Remove @jest-environment jsdom comments
    content = content.replace(/\/\*\*\s*\n?\s*\*\s*@jest-environment\s+jsdom\s*\n?\s*\*\/\s*\n?/g, '');

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Removed @jest-environment from: ${path.relative(process.cwd(), filePath)}`);
        return true;
    }
    return false;
}

// Get all test files
const testFiles = await glob('tests/**/*.test.js', {
    ignore: ['**/node_modules/**']
});

console.log(`Found ${testFiles.length} test files to process...\n`);

let fixedCount = 0;
let errorCount = 0;

for (const file of testFiles) {
    try {
        if (removeJestEnvironment(file)) {
            fixedCount++;
        }
    } catch (error) {
        console.error(`❌ Error processing ${file}:`, error.message);
        errorCount++;
    }
}

console.log(`\n📊 Summary:`);
console.log(`   - Fixed: ${fixedCount} files`);
console.log(`   - Unchanged: ${testFiles.length - fixedCount - errorCount} files`);
console.log(`   - Errors: ${errorCount} files`);

if (fixedCount > 0) {
    console.log(`\n✅ Successfully removed @jest-environment directives from ${fixedCount} test files!`);
}