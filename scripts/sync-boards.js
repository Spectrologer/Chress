#!/usr/bin/env node

/**
 * Sync board files from boards/ to public/boards/
 * This ensures the game loads the latest board data
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const sourceDir = path.join(rootDir, 'boards');
const targetDir = path.join(rootDir, 'public', 'boards');

/**
 * Recursively copy files from source to target
 */
function syncDirectory(source, target) {
    // Create target directory if it doesn't exist
    if (!fs.existsSync(target)) {
        fs.mkdirSync(target, { recursive: true });
        console.log(`Created directory: ${target}`);
    }

    const entries = fs.readdirSync(source, { withFileTypes: true });

    for (const entry of entries) {
        const sourcePath = path.join(source, entry.name);
        const targetPath = path.join(target, entry.name);

        if (entry.isDirectory()) {
            syncDirectory(sourcePath, targetPath);
        } else if (entry.isFile() && entry.name.endsWith('.json')) {
            // Read source file
            const sourceContent = fs.readFileSync(sourcePath, 'utf8');

            // Check if target exists and is different
            let needsUpdate = true;
            if (fs.existsSync(targetPath)) {
                const targetContent = fs.readFileSync(targetPath, 'utf8');
                needsUpdate = sourceContent !== targetContent;
            }

            if (needsUpdate) {
                fs.writeFileSync(targetPath, sourceContent, 'utf8');
                console.log(`✓ Synced: ${entry.name}`);
            } else {
                console.log(`  Skipped (up to date): ${entry.name}`);
            }
        }
    }
}

console.log('Syncing board files from boards/ to public/boards/...\n');

try {
    syncDirectory(sourceDir, targetDir);
    console.log('\n✓ Board sync complete!');
} catch (error) {
    console.error('✗ Error syncing boards:', error.message);
    process.exit(1);
}
