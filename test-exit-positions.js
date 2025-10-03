import { ConnectionManager } from './ConnectionManager.js';

const cm = new ConnectionManager();

cm.generateChunkConnections(0, 0);

const testZones = [
    {x: 0, y: 0},
    {x: 1, y: 0},
    {x: 0, y: 1},
    {x: -1, y: 0},
    {x: 0, y: -1},
];

for (const zone of testZones) {
    const connections = cm.getConnections(zone.x, zone.y);
    console.log(`Zone (${zone.x},${zone.y}) connections:`, connections);

    // Check that positions are between 3 and 6
    if (connections) {
        const directions = ['north', 'south', 'west', 'east'];
        directions.forEach(dir => {
            const pos = connections[dir];
            if (pos !== null) {
                if (pos >= 3 && pos <= 6) {
                    console.log(`  ${dir}: ${pos} - OK`);
                } else {
                    console.log(`  ${dir}: ${pos} - INVALID (should be 3-6)`);
                }
            }
        });
    }
}

// Test ensureMinimumConnectivity with a forced case
console.log('\nTesting forced connection:');
const testConnections = { north: null, south: null, west: null, east: null };
cm.ensureMinimumConnectivity(0, 0, testConnections);
console.log('Forced:', testConnections);
