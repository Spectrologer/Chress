import { GRID_SIZE } from './constants.js';

export class ConnectionManager {
    constructor() {
        this.zoneConnections = new Map(); // Stores exit connections between zones
    }

    getZoneKey(x, y) {
        return `${x},${y}`;
    }

    generateChunkConnections(centerX, centerY) {
        // Generate connections for a 3x3 chunk centered on the given coordinates
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const zoneX = centerX + dx;
                const zoneY = centerY + dy;
                const zoneKey = this.getZoneKey(zoneX, zoneY);
                
                // Skip if connections already exist for this zone
                if (this.zoneConnections.has(zoneKey)) {
                    continue;
                }
                
                // Generate deterministic exits for this zone (some may be null)
                const connections = {
                    north: this.getDeterministicExit('north', zoneX, zoneY),
                    south: this.getDeterministicExit('south', zoneX, zoneY),
                    west: this.getDeterministicExit('west', zoneX, zoneY),
                    east: this.getDeterministicExit('east', zoneX, zoneY)
                };
                
                // Ensure minimum connectivity - every zone needs at least one connection
                this.ensureMinimumConnectivity(zoneX, zoneY, connections);
                
                // Store the connections
                this.zoneConnections.set(zoneKey, connections);
                
                // Ensure adjacent zones have matching connections
                this.ensureAdjacentConnections(zoneX, zoneY, connections);
            }
        }
    }

    getDeterministicExit(side, zoneX, zoneY) {
        // Create deterministic exit positions based on zone coordinates
        // Not all sides will have exits - some zones may be dead ends or have limited connections

        // Special case: randomize exits for the starting zone (0,0) to add variation
        if (zoneX === 0 && zoneY === 0) {
            // Use random chance for exits instead of deterministic
            if (Math.random() < 0.7) { // 70% chance of having an exit
                // Convert to valid exit position (avoiding corners and edges)
                const validRange = GRID_SIZE - 4; // Avoid 2 tiles from each edge
                // Use zone coordinates for some determinacy in position while still randomizing existence
                const seed = (zoneX * 73 + zoneY * 97) % validRange;
                const position = seed + 2;
                return position;
            }
            return null;
        }

        let seed;

        switch (side) {
            case 'north':
                seed = (zoneX * 73 + (zoneY - 1) * 97) % 1000;
                break;
            case 'south':
                seed = (zoneX * 73 + (zoneY + 1) * 97) % 1000;
                break;
            case 'west':
                seed = ((zoneX - 1) * 73 + zoneY * 97) % 1000;
                break;
            case 'east':
                seed = ((zoneX + 1) * 73 + zoneY * 97) % 1000;
                break;
        }

        // Increase connection probability for zones adjacent to (0,0)
        const isAdjacentToStart = Math.max(Math.abs(zoneX), Math.abs(zoneY)) === 1;
        const nullThreshold = isAdjacentToStart ? 20 : 30; // 80% chance for adjacent zones, 70% otherwise

        // Chance of having an exit on this side
        if ((seed % 100) < nullThreshold) {
            return null; // No exit on this side
        }

        // Convert seed to valid exit position (avoiding corners and edges)
        const validRange = GRID_SIZE - 4; // Avoid 2 tiles from each edge
        const position = (seed % validRange) + 2;

        return position;
    }

    ensureMinimumConnectivity(zoneX, zoneY, connections) {
        // Count existing connections
        const hasConnections = [
            connections.north !== null,
            connections.south !== null, 
            connections.west !== null,
            connections.east !== null
        ].filter(Boolean).length;
        
        // If no connections exist, force at least one
        if (hasConnections === 0) {
            // Choose a direction based on zone coordinates to ensure deterministic behavior
            const seed = (zoneX * 137 + zoneY * 149) % 4;
            const directions = ['north', 'south', 'west', 'east'];
            const forcedDirection = directions[seed];
            
            // Force an exit in the chosen direction
            const validRange = GRID_SIZE - 4;
            const position = ((zoneX * 73 + zoneY * 97) % validRange) + 2;
            connections[forcedDirection] = position;
        }
        
        // Special case: ensure the starting zone (0,0) has multiple connections with variation
        if (zoneX === 0 && zoneY === 0 && hasConnections < 2) {
            // Force at least 2 connections for the starting zone, but with random directions
            const directions = ['north', 'south', 'west', 'east'];
            const availableDirections = directions.filter(dir => connections[dir] === null);

            // Shuffle available directions for randomness
            for (let i = availableDirections.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [availableDirections[i], availableDirections[j]] = [availableDirections[j], availableDirections[i]];
            }

            // Add connections to ensure we have at least 2
            const connectionsNeeded = Math.min(2 - hasConnections, availableDirections.length);
            for (let i = 0; i < connectionsNeeded; i++) {
                const direction = availableDirections[i];
                connections[direction] = Math.floor(GRID_SIZE / 2);
            }
        }
    }

    ensureAdjacentConnections(zoneX, zoneY, connections) {
        // Ensure adjacent zones have matching exit positions
        // Only create connections where both zones agree to have an exit
        
        // North connection
        if (connections.north !== null) {
            const northKey = this.getZoneKey(zoneX, zoneY - 1);
            let northConnections = this.zoneConnections.get(northKey);
            if (!northConnections) {
                northConnections = {
                    north: this.getDeterministicExit('north', zoneX, zoneY - 1),
                    south: connections.north, // Match this zone's north exit
                    west: this.getDeterministicExit('west', zoneX, zoneY - 1),
                    east: this.getDeterministicExit('east', zoneX, zoneY - 1)
                };
                // Ensure minimum connectivity for newly created adjacent zone
                this.ensureMinimumConnectivity(zoneX, zoneY - 1, northConnections);
                this.zoneConnections.set(northKey, northConnections);
            } else {
                // Both zones want a connection here
                northConnections.south = connections.north;
            }
        }
        
        // South connection
        if (connections.south !== null) {
            const southKey = this.getZoneKey(zoneX, zoneY + 1);
            let southConnections = this.zoneConnections.get(southKey);
            if (!southConnections) {
                southConnections = {
                    north: connections.south, // Match this zone's south exit
                    south: this.getDeterministicExit('south', zoneX, zoneY + 1),
                    west: this.getDeterministicExit('west', zoneX, zoneY + 1),
                    east: this.getDeterministicExit('east', zoneX, zoneY + 1)
                };
                // Ensure minimum connectivity for newly created adjacent zone
                this.ensureMinimumConnectivity(zoneX, zoneY + 1, southConnections);
                this.zoneConnections.set(southKey, southConnections);
            } else {
                southConnections.north = connections.south;
            }
        }
        
        // West connection
        if (connections.west !== null) {
            const westKey = this.getZoneKey(zoneX - 1, zoneY);
            let westConnections = this.zoneConnections.get(westKey);
            if (!westConnections) {
                westConnections = {
                    north: this.getDeterministicExit('north', zoneX - 1, zoneY),
                    south: this.getDeterministicExit('south', zoneX - 1, zoneY),
                    west: this.getDeterministicExit('west', zoneX - 1, zoneY),
                    east: connections.west // Match this zone's west exit
                };
                // Ensure minimum connectivity for newly created adjacent zone
                this.ensureMinimumConnectivity(zoneX - 1, zoneY, westConnections);
                this.zoneConnections.set(westKey, westConnections);
            } else {
                westConnections.east = connections.west;
            }
        }
        
        // East connection
        if (connections.east !== null) {
            const eastKey = this.getZoneKey(zoneX + 1, zoneY);
            let eastConnections = this.zoneConnections.get(eastKey);
            if (!eastConnections) {
                eastConnections = {
                    north: this.getDeterministicExit('north', zoneX + 1, zoneY),
                    south: this.getDeterministicExit('south', zoneX + 1, zoneY),
                    west: connections.east, // Match this zone's east exit
                    east: this.getDeterministicExit('east', zoneX + 1, zoneY)
                };
                // Ensure minimum connectivity for newly created adjacent zone
                this.ensureMinimumConnectivity(zoneX + 1, zoneY, eastConnections);
                this.zoneConnections.set(eastKey, eastConnections);
            } else {
                eastConnections.west = connections.east;
            }
        }
    }

    getConnections(zoneX, zoneY) {
        return this.zoneConnections.get(this.getZoneKey(zoneX, zoneY));
    }

    hasConnection(zoneX, zoneY, direction) {
        const connections = this.getConnections(zoneX, zoneY);
        return connections && connections[direction] !== null;
    }

    getExitPosition(zoneX, zoneY, direction) {
        const connections = this.getConnections(zoneX, zoneY);
        return connections ? connections[direction] : null;
    }

    // Clear all connections (useful for resetting the game)
    clear() {
        this.zoneConnections.clear();
    }
}
