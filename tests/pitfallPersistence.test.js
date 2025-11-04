import { ZoneManager } from '@managers/ZoneManager';
import { TILE_TYPES, GRID_SIZE } from '@core/constants/index';

// Tests to lock in pitfall/hole metadata persistence and ensure port transitions
// don't unintentionally overwrite saved underground zone return coordinates.

describe('Pitfall persistence', () => {
    test('preserves returnToSurface when reusing saved zone', () => {
        const game = {
            grid: Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(TILE_TYPES.FLOOR)),
            portTransitionData: null,
            specialZones: new Map(),
            player: {
                x: 1,
                y: 1,
                lastX: 1,
                lastY: 1,
                currentZone: { x: 5, y: 6, dimension: 2, depth: 1 },
                undergroundDepth: 1,
                setCurrentZone(x, y, dim) { this.currentZone.x = x; this.currentZone.y = y; if (typeof dim === 'number') this.currentZone.dimension = dim; },
                setPosition(x, y) { this.x = x; this.y = y; },
                getPosition() { return { x: this.x, y: this.y }; },
                getCurrentZone() { return { ...this.currentZone }; },
                ensureValidPosition() {},
                onZoneTransition() {}
            },
            uiManager: { generateRegionName() { return 'Test'; }, showRegionNotification() {}, updateZoneDisplay() {}, updatePlayerPosition() {}, updatePlayerStats() {}, addMessageToLog() {} },
            zoneGenerator: { generateZone: jest.fn(), grid: [] },
            connectionManager: { generateChunkConnections() {} },
            availableFoodAssets: [],
            enemies: [],
            zones: new Map(),
            lastExitSide: null,
            justEnteredZone: false,
            defeatedEnemies: new Set(),
            gameStateManager: { saveGameState() {} }
        };

        const zoneManager = new ZoneManager(game);

        // Create and persist an underground zone with returnToSurface
        const undergroundZoneKey = `${game.player.currentZone.x},${game.player.currentZone.y}:2:z-1`;
        const savedZone = {
            grid: Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(TILE_TYPES.FLOOR)),
            enemies: [],
            playerSpawn: { x: 4, y: 4 },
            returnToSurface: { from: 'pitfall', x: 7, y: 8 }
        };
        game.zones.set(undergroundZoneKey, savedZone);

        // Simulate entering using a port: lastExitSide === 'port'
        game.lastExitSide = 'port';
        game.player.currentZone.dimension = 2;

        // Call generateZone which should reuse the saved zone and not overwrite returnToSurface
        zoneManager.generateZone();

        const loaded = game.zones.get(undergroundZoneKey);
        expect(loaded).toBeDefined();
        expect(loaded.returnToSurface).toEqual({ from: 'pitfall', x: 7, y: 8 });
    });

    test('does not overwrite returnToSurface on port transition when zone exists', () => {
        const game = {
            grid: Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(TILE_TYPES.FLOOR)),
            portTransitionData: { from: 'pitfall', x: 3, y: 3 },
            specialZones: new Map(),
            player: {
                x: 2,
                y: 2,
                lastX: 2,
                lastY: 2,
                currentZone: { x: 4, y: 4, dimension: 2, depth: 1 },
                undergroundDepth: 1,
                setCurrentZone(x, y, dim) { this.currentZone.x = x; this.currentZone.y = y; if (typeof dim === 'number') this.currentZone.dimension = dim; },
                setPosition(x, y) { this.x = x; this.y = y; },
                getPosition() { return { x: this.x, y: this.y }; },
                getCurrentZone() { return { ...this.currentZone }; },
                ensureValidPosition() {},
                onZoneTransition() {}
            },
            uiManager: { generateRegionName() { return 'Test'; }, showRegionNotification() {}, updateZoneDisplay() {}, updatePlayerPosition() {}, updatePlayerStats() {}, addMessageToLog() {} },
            zoneGenerator: { generateZone: jest.fn(() => ({ grid: Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(TILE_TYPES.FLOOR)), enemies: [], playerSpawn: { x: 5, y: 5 } })), grid: [] },
            connectionManager: { generateChunkConnections() {} },
            availableFoodAssets: [],
            enemies: [],
            zones: new Map(),
            lastExitSide: 'port',
            justEnteredZone: false,
            defeatedEnemies: new Set(),
            gameStateManager: { saveGameState() {} }
        };

        const zoneManager = new ZoneManager(game);

        // Pre-save an underground zone with returnToSurface different from current portTransitionData
        const undergroundZoneKey = `${game.player.currentZone.x},${game.player.currentZone.y}:2:z-1`;
        const savedZone = {
            grid: Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(TILE_TYPES.FLOOR)),
            enemies: [],
            playerSpawn: { x: 6, y: 6 },
            returnToSurface: { from: 'pitfall', x: 9, y: 9 }
        };
        game.zones.set(undergroundZoneKey, savedZone);

        // Call generateZone which should reuse saved zone (not invoke zoneGenerator) and keep returnToSurface
        zoneManager.generateZone();

        const final = game.zones.get(undergroundZoneKey);
        expect(final.returnToSurface).toEqual({ from: 'pitfall', x: 9, y: 9 });
        // Ensure zoneGenerator.generateZone was NOT used to override the saved zone
        expect(game.zoneGenerator.generateZone).not.toHaveBeenCalled();
    });
});
