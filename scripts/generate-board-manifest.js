/**
 * Generate a manifest file listing all custom boards
 * Run this script after adding new boards to static/boards/custom/
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const customBoardsDir = path.join(__dirname, '../static/boards/custom');
const manifestPath = path.join(customBoardsDir, 'manifest.json');

try {
    // Read all JSON files in the custom boards directory
    const files = fs.readdirSync(customBoardsDir);
    const boards = files
        .filter(file => file.endsWith('.json') && file !== 'manifest.json')
        .map(file => {
            const boardName = file.replace('.json', '');
            const boardPath = path.join(customBoardsDir, file);
            const boardData = JSON.parse(fs.readFileSync(boardPath, 'utf8'));

            return {
                name: boardName,
                displayName: boardData.metadata?.description || boardData.name || boardName,
                gameMode: boardData.metadata?.gameMode || 'CHESSE',
                size: boardData.size,
                created: boardData.metadata?.created || null
            };
        })
        .sort((a, b) => a.name.localeCompare(b.name));

    // Write manifest
    const manifest = {
        version: '1.0.0',
        generated: new Date().toISOString(),
        boards: boards
    };

    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

    console.log(`✅ Generated board manifest with ${boards.length} boards:`);
    boards.forEach(board => {
        console.log(`   - ${board.name} (${board.gameMode})`);
    });
    console.log(`\n📝 Manifest saved to: ${manifestPath}`);
} catch (error) {
    console.error('❌ Error generating board manifest:', error);
    process.exit(1);
}
