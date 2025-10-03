import { ConnectionManager } from './ConnectionManager.js';

// Test script to validate connection probabilities
console.log('Testing connection probabilities...\n');

const cm = new ConnectionManager();

// Test zones: (0,0), adjacent (0,1), (1,0), (-1,0), (0,-1), and a further one (2,2)
const testZones = [
    {x: 0, y: 0, name: '(0,0) Start Zone'},
    {x: 0, y: 1, name: '(0,1) Adjacent North'},
    {x: 1, y: 0, name: '(1,0) Adjacent East'},
    {x: 0, y: -1, name: '(0,-1) Adjacent South'},
    {x: -1, y: 0, name: '(-1,0) Adjacent West'},
    {x: 2, y: 2, name: '(2,2) Distant'},
];

// Run multiple times to average
const runs = 100;

let results = {};

testZones.forEach(zone => {
    results[zone.name] = { totalExits: 0, runsWith0: 0, runsWith1: 0, runsWith2: 0, runsWith3: 0, runsWith4: 0 };
});

for (let run = 0; run < runs; run++) {
    cm.clear(); // Reset for each run
    cm.generateChunkConnections(0, 0); // Generate around 0,0

    testZones.forEach(zone => {
        const connections = cm.getConnections(zone.x, zone.y);
        if (connections) {
            const exits = ['north', 'south', 'west', 'east'].filter(dir => connections[dir] !== null).length;
            results[zone.name].totalExits += exits;
            if (exits === 0) results[zone.name].runsWith0++;
            if (exits === 1) results[zone.name].runsWith1++;
            if (exits === 2) results[zone.name].runsWith2++;
            if (exits === 3) results[zone.name].runsWith3++;
            if (exits === 4) results[zone.name].runsWith4++;
        } else {
            // If no connections generated, count as 0
            results[zone.name].runsWith0++;
        }
    });
}

console.log(`Averaged over ${runs} runs:\n`);

testZones.forEach(zone => {
    const avg = (results[zone.name].totalExits / runs).toFixed(2);
    console.log(`${zone.name}:`);
    console.log(`  Average exits: ${avg}`);
    console.log(`  % with 0 exits: ${(results[zone.name].runsWith0 / runs * 100).toFixed(1)}%`);
    console.log(`  % with 1+ exits: ${((runs - results[zone.name].runsWith0) / runs * 100).toFixed(1)}%`);
    console.log('');
});

console.log('Expected: Adjacent zones should have higher connectivity than distant zones.');
