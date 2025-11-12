import texturePacker from 'free-tex-packer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.join(__dirname, '..');
const assetsDir = path.join(rootDir, 'static', 'assets');
const outputDir = path.join(rootDir, 'static', 'atlases');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

/**
 * Recursively get all PNG files from a directory
 */
function getAllPngFiles(dir, baseDir = dir) {
    const files = [];
    const items = fs.readdirSync(dir);

    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            files.push(...getAllPngFiles(fullPath, baseDir));
        } else if (item.endsWith('.png')) {
            // Store relative path for proper naming in atlas
            const relativePath = path.relative(baseDir, fullPath);
            files.push({ path: fullPath, name: relativePath });
        }
    }

    return files;
}

/**
 * Generate a texture atlas for a specific directory
 */
async function generateAtlas(name, sourceDir, options = {}) {
    console.log(`\nGenerating ${name} atlas...`);

    const files = getAllPngFiles(sourceDir);
    console.log(`  Found ${files.length} images`);

    if (files.length === 0) {
        console.log(`  Skipping ${name} (no images found)`);
        return;
    }

    const images = files.map(file => ({
        path: file.name.replace(/\\/g, '/').replace('.png', ''),
        contents: fs.readFileSync(file.path)
    }));

    const packerOptions = {
        textureName: name,
        width: options.width || 1024,  // Start with reasonable square size
        height: options.height || 1024,
        fixedSize: false,  // Let it find optimal size
        powerOfTwo: true,  // Use power-of-2 dimensions
        allowRotation: false,
        detectIdentical: true,
        allowTrim: false,
        extrude: 1,
        padding: 2,
        packer: 'MaxRectsBin',
        packerMethod: 'BestAreaFit',  // Try BestAreaFit for better 2D packing
        ...options
    };

    try {
        texturePacker(images, packerOptions, async (files, error) => {
            if (error) {
                console.error(`  Error generating ${name}:`, error);
                return;
            }

            // Save each generated file (can be multiple if images don't fit in one atlas)
            for (const item of files) {
                if (item.name.endsWith('.png')) {
                    // Convert PNG to WebP
                    const webpName = item.name.replace('.png', '.webp');
                    const outputPath = path.join(outputDir, webpName);

                    try {
                        await sharp(item.buffer)
                            .webp({ quality: 95, lossless: false })
                            .toFile(outputPath);

                        const pngSize = (item.buffer.length / 1024).toFixed(1);
                        const webpSize = (fs.statSync(outputPath).size / 1024).toFixed(1);
                        const savings = ((1 - fs.statSync(outputPath).size / item.buffer.length) * 100).toFixed(1);

                        console.log(`  Created: ${webpName} (${webpSize}KB, ${savings}% smaller than PNG)`);
                    } catch (err) {
                        console.error(`  Failed to convert ${item.name} to WebP:`, err);
                        // Fall back to PNG
                        const outputPath = path.join(outputDir, item.name);
                        fs.writeFileSync(outputPath, item.buffer);
                        console.log(`  Created: ${item.name} (PNG fallback)`);
                    }
                } else {
                    // Save JSON as-is, but update image reference to .webp
                    let content = item.buffer.toString();
                    content = content.replace(/"image":\s*"([^"]+)\.png"/, '"image": "$1.webp"');

                    const outputPath = path.join(outputDir, item.name);
                    fs.writeFileSync(outputPath, content);
                    console.log(`  Created: ${item.name}`);
                }
            }
        });
    } catch (err) {
        console.error(`  Failed to generate ${name}:`, err);
    }
}

/**
 * Main execution
 */
async function main() {
    console.log('=== Texture Atlas Generator ===');
    console.log(`Assets directory: ${assetsDir}`);
    console.log(`Output directory: ${outputDir}`);

    // Define atlas configurations
    const atlasConfigs = [
        {
            name: 'npcs',
            path: path.join(assetsDir, 'characters', 'npcs'),
            options: { width: 1024, height: 1024 }  // Start square, let it grow
        },
        {
            name: 'enemies',
            path: path.join(assetsDir, 'characters', 'enemies'),
            options: { width: 512, height: 512 }
        },
        {
            name: 'player',
            path: path.join(assetsDir, 'characters', 'player'),
            options: { width: 256, height: 256 }
        },
        {
            name: 'environment',
            path: path.join(assetsDir, 'environment'),
            options: { width: 1024, height: 1024 }
        },
        {
            name: 'items',
            path: path.join(assetsDir, 'items'),
            options: { width: 512, height: 512 }
        },
        {
            name: 'ui',
            path: path.join(assetsDir, 'ui'),
            options: { width: 2048, height: 2048 }
        }
    ];

    // Generate all atlases
    for (const config of atlasConfigs) {
        if (fs.existsSync(config.path)) {
            await generateAtlas(config.name, config.path, config.options);
        } else {
            console.log(`\nSkipping ${config.name} (directory not found: ${config.path})`);
        }
    }

    console.log('\n=== Atlas generation complete! ===');
}

main().catch(console.error);
