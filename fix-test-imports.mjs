#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Function to fix imports in a file
function fixImportsInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    const originalContent = content;

    // Fix imports with path aliases and .js extensions
    // Pattern 1: import { X } from '@alias/file.js'
    content = content.replace(/from\s+['"](@[^'"]+)\.js['"]/g, (match, p1) => {
        modified = true;
        return `from '${p1}'`;
    });

    // Pattern 2: import X from '@alias/file.js'
    content = content.replace(/import\s+(\w+)\s+from\s+['"](@[^'"]+)\.js['"]/g, (match, p1, p2) => {
        modified = true;
        return `import ${p1} from '${p2}'`;
    });

    // Pattern 3: require('@alias/file.js')
    content = content.replace(/require\(['"](@[^'"]+)\.js['"]\)/g, (match, p1) => {
        modified = true;
        return `require('${p1}')`;
    });

    // Pattern 4: require('../path/file.js') - for relative paths to TS files
    content = content.replace(/require\(['"](\.\.\/[^'"]+)\.js['"]\)/g, (match, p1) => {
        // Check if the .ts version exists
        const tsPath = path.resolve(path.dirname(filePath), p1 + '.ts');
        if (fs.existsSync(tsPath)) {
            modified = true;
            return `require('${p1}')`;
        }
        return match;
    });

    // Pattern 5: import from '../path/file.js' - for relative paths to TS files
    content = content.replace(/from\s+['"](\.\.\/[^'"]+)\.js['"]/g, (match, p1) => {
        // Check if the .ts version exists
        const tsPath = path.resolve(path.dirname(filePath), p1 + '.ts');
        if (fs.existsSync(tsPath)) {
            modified = true;
            return `from '${p1}'`;
        }
        return match;
    });

    // Pattern 6: Fix .ts extensions in imports (should not have extensions)
    content = content.replace(/from\s+['"](\.\.\/[^'"]+)\.ts['"]/g, (match, p1) => {
        modified = true;
        return `from '${p1}'`;
    });

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Fixed imports in: ${path.relative(process.cwd(), filePath)}`);
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
        if (fixImportsInFile(file)) {
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
    console.log(`\n✅ Successfully fixed import statements in ${fixedCount} test files!`);
}