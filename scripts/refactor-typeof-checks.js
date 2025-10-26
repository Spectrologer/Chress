#!/usr/bin/env node

/**
 * Migration script to refactor defensive typeof checks to use MethodChecker
 *
 * This script automatically refactors patterns like:
 *   if (obj && typeof obj.method === 'function') { obj.method(args); }
 *
 * To:
 *   MethodChecker.call(obj, 'method', [args]);
 *
 * Usage:
 *   node scripts/refactor-typeof-checks.js [--dry-run] [file1] [file2] ...
 *
 * Options:
 *   --dry-run    Show what would be changed without modifying files
 *   --all        Process all files with typeof checks
 *   [files]      Specific files to process
 */

import fs from 'fs';
import path from 'path';

// Files with typeof checks (from grep results)
const FILES_TO_REFACTOR = [
    'ui/OverlayManager.js',
    'core/GameInitializer.js',
    'managers/inventory/effects/SpecialEffects.js',
    'core/GameAudio.js',
    'utils/AudioManager.js',
    'ui/StatsPanelManager.js',
    'managers/inventory/InventoryService.js',
    'managers/CombatManager.js',
    'core/TurnManager.js',
    'core/ConsentManager.js',
    'core/GlobalErrorHandler.js',
    'ui/BarterWindow.js',
    'controllers/PathfindingController.js',
    'core/AnimationScheduler.js',
    'core/SoundManager.js',
    'managers/CombatActionManager.js',
    'managers/BombManager.js',
    'managers/EnemyDefeatFlow.js',
    'managers/ZoneTransitionManager.js',
    'managers/InteractionManager.js',
    'managers/inventory/effects/BaseItemEffect.js',
    'ui/TypewriterEffect.js',
    'ui/RecordsPanelManager.js',
    'ui/PanelEventHandler.js',
    'ui/MessageManager.js'
];

class TypeOfRefactorer {
    constructor(options = {}) {
        this.dryRun = options.dryRun || false;
        this.stats = {
            filesProcessed: 0,
            filesModified: 0,
            checksRefactored: 0,
            errors: []
        };
    }

    /**
     * Parse a typeof check pattern and extract components
     */
    parseTypeOfCheck(line) {
        // Pattern 1: if (obj && typeof obj.method === 'function')
        const pattern1 = /if\s*\(\s*(.+?)\s*&&\s*typeof\s+(.+?)\.(\w+)\s*===\s*['"]function['"]\s*\)/;
        const match1 = line.match(pattern1);
        if (match1) {
            return {
                type: 'if-check',
                object: match1[2],
                method: match1[3],
                fullMatch: match1[0]
            };
        }

        // Pattern 2: just the typeof check (inside another if)
        const pattern2 = /typeof\s+(.+?)\.(\w+)\s*===\s*['"]function['"]/;
        const match2 = line.match(pattern2);
        if (match2) {
            return {
                type: 'inline-check',
                object: match2[1],
                method: match2[2],
                fullMatch: match2[0]
            };
        }

        return null;
    }

    /**
     * Extract method call from next lines
     */
    extractMethodCall(lines, startIndex, methodInfo) {
        // Look for the method call in the next few lines
        for (let i = startIndex; i < Math.min(startIndex + 5, lines.length); i++) {
            const line = lines[i];
            const callPattern = new RegExp(`${methodInfo.object}\\.${methodInfo.method}\\s*\\(([^)]*)\\)`);
            const match = line.match(callPattern);
            if (match) {
                const args = match[1].trim();
                return {
                    lineIndex: i,
                    args: args ? `[${args}]` : '[]',
                    awaitUsed: line.trim().startsWith('await')
                };
            }
        }
        return null;
    }

    /**
     * Refactor a file
     */
    refactorFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const lines = content.split('\n');

            let modified = false;
            let checksFound = 0;
            let newLines = [...lines];

            // Check if MethodChecker import already exists
            const hasImport = lines.some(line => line.includes('MethodChecker'));

            // Process lines
            for (let i = 0; i < newLines.length; i++) {
                const line = newLines[i];
                const methodInfo = this.parseTypeOfCheck(line);

                if (methodInfo) {
                    checksFound++;

                    // Try to find the method call
                    const callInfo = this.extractMethodCall(newLines, i + 1, methodInfo);

                    if (callInfo) {
                        // Found a complete pattern to refactor
                        const indent = line.match(/^\s*/)[0];
                        const methodCall = callInfo.awaitUsed
                            ? `${indent}await MethodChecker.callAsync(${methodInfo.object}, '${methodInfo.method}', ${callInfo.args});`
                            : `${indent}MethodChecker.call(${methodInfo.object}, '${methodInfo.method}', ${callInfo.args});`;

                        // Replace the if block with the MethodChecker call
                        newLines[i] = methodCall;

                        // Mark subsequent lines for removal (the method call and closing brace)
                        for (let j = i + 1; j <= callInfo.lineIndex + 1; j++) {
                            if (j < newLines.length) {
                                newLines[j] = ''; // Will be filtered out
                            }
                        }

                        modified = true;
                        this.stats.checksRefactored++;
                    }
                }
            }

            // Remove empty lines that were marked for deletion
            newLines = newLines.filter(line => line !== '');

            // Add import if needed and file was modified
            if (modified && !hasImport) {
                // Find the last import statement
                let lastImportIndex = -1;
                for (let i = 0; i < newLines.length; i++) {
                    if (newLines[i].trim().startsWith('import ')) {
                        lastImportIndex = i;
                    } else if (lastImportIndex !== -1 && !newLines[i].trim().startsWith('import ')) {
                        break;
                    }
                }

                // Calculate relative path to utils/MethodChecker.js
                const fileDir = path.dirname(filePath);
                const rootDir = process.cwd();
                const relPath = path.relative(fileDir, path.join(rootDir, 'utils', 'MethodChecker.js')).replace(/\\/g, '/');
                const importPath = relPath.startsWith('.') ? relPath : `./${relPath}`;

                const importStatement = `import MethodChecker from '${importPath}';`;

                if (lastImportIndex !== -1) {
                    newLines.splice(lastImportIndex + 1, 0, importStatement);
                } else {
                    newLines.unshift(importStatement);
                }
            }

            if (modified) {
                const newContent = newLines.join('\n');

                if (!this.dryRun) {
                    fs.writeFileSync(filePath, newContent, 'utf-8');
                    console.log(`✓ Refactored ${filePath} (${checksFound} checks found)`);
                } else {
                    console.log(`[DRY RUN] Would refactor ${filePath} (${checksFound} checks found)`);
                }

                this.stats.filesModified++;
            } else if (checksFound > 0) {
                console.log(`⚠ Found ${checksFound} checks in ${filePath} but couldn't auto-refactor (manual review needed)`);
            }

            this.stats.filesProcessed++;
        } catch (error) {
            console.error(`✗ Error processing ${filePath}:`, error.message);
            this.stats.errors.push({ file: filePath, error: error.message });
        }
    }

    /**
     * Print statistics
     */
    printStats() {
        console.log('\n' + '='.repeat(60));
        console.log('Refactoring Statistics:');
        console.log('='.repeat(60));
        console.log(`Files processed:     ${this.stats.filesProcessed}`);
        console.log(`Files modified:      ${this.stats.filesModified}`);
        console.log(`Checks refactored:   ${this.stats.checksRefactored}`);
        console.log(`Errors:              ${this.stats.errors.length}`);

        if (this.stats.errors.length > 0) {
            console.log('\nErrors:');
            this.stats.errors.forEach(({ file, error }) => {
                console.log(`  ${file}: ${error}`);
            });
        }

        console.log('='.repeat(60));
    }
}

// Main execution
function main() {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');
    const processAll = args.includes('--all');

    const filesToProcess = processAll
        ? FILES_TO_REFACTOR
        : args.filter(arg => !arg.startsWith('--'));

    if (filesToProcess.length === 0) {
        console.log('Usage: node scripts/refactor-typeof-checks.js [--dry-run] [--all] [file1] [file2] ...');
        console.log('\nOptions:');
        console.log('  --dry-run    Show what would be changed without modifying files');
        console.log('  --all        Process all files with typeof checks');
        console.log('\nExample:');
        console.log('  node scripts/refactor-typeof-checks.js --dry-run --all');
        console.log('  node scripts/refactor-typeof-checks.js ui/OverlayManager.js');
        process.exit(1);
    }

    console.log(`Starting refactoring (dry-run: ${dryRun})...\n`);

    const refactorer = new TypeOfRefactorer({ dryRun });

    filesToProcess.forEach(file => {
        const fullPath = path.join(process.cwd(), file);
        if (fs.existsSync(fullPath)) {
            refactorer.refactorFile(fullPath);
        } else {
            console.error(`✗ File not found: ${fullPath}`);
        }
    });

    refactorer.printStats();
}

main();
