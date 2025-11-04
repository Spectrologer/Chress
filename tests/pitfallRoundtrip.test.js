import { ZoneTransitionManager } from '@managers/ZoneTransitionManager';
import { ZoneManager } from '@managers/ZoneManager';
import { TILE_TYPES, GRID_SIZE } from '@core/constants/index';

// This test simulates falling into a pitfall and then exiting back to surface,
// asserting the player returns to the original hole coordinates.

describe('Pitfall round-trip', () => {
    test('player returns to original hole after falling and exiting', () => {
        // Minimal game mock with necessary pieces
        const game = {
            grid: Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(TILE_TYPES.FLOOR)),
            portTransitionData: null,
            specialZones: new Map(),
            player: {
                x: 2,
                y: 2,
                lastX: 2,
                lastY: 2,
                currentZone: { x: 0, y: 0, dimension: 0, depth: 0 },
                undergroundDepth: 0,
                setCurrentZone(x, y, dim) { this.currentZone.x = x; this.currentZone.y = y; if (typeof dim === 'number') this.currentZone.dimension = dim; },
                setPosition(x, y) { this.x = x; this.y = y; },
                setLastPosition(x, y) { this.lastX = x; this.lastY = y; },
                getPosition() { return { x: this.x, y: this.y }; },
                getCurrentZone() { return { ...this.currentZone }; },
                getZoneDimension() { return this.currentZone.dimension; },
                ensureValidPosition() {},
                onZoneTransition() {}
            },
            uiManager: { generateRegionName() { return 'Test'; }, showRegionNotification() {}, updateZoneDisplay() {}, updatePlayerPosition() {}, updatePlayerStats() {}, addMessageToLog() {} },
            zoneGenerator: { generateZone: vi.fn(), grid: [], clearPathToExit: vi.fn() },
            connectionManager: { generateChunkConnections() {} },
            availableFoodAssets: [],
            enemies: [],
            zones: new Map(),
            lastExitSide: null,
            justEnteredZone: false,
            defeatedEnemies: new Set(),
            gameStateManager: { saveGameState() {} },
            gridManager: {
                getTile: vi.fn((x, y) => game.grid[y]?.[x]),
                setTile: vi.fn((x, y, tile) => { if (game.grid[y]) game.grid[y][x] = tile; }),
                setGrid: vi.fn(),
                isWithinBounds: vi.fn((x, y) => x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE),
                isTileType: vi.fn(),
                findFirst: vi.fn(() => null)
            },
            transientGameState: {
                getPortTransitionData: vi.fn().mockReturnValue(null),
                clearPortTransitionData: vi.fn(),
                setPortTransitionData: vi.fn((data) => { game.portTransitionData = data; }),
                enterPitfallZone: vi.fn(),
                exitPitfallZone: vi.fn(),
                isInPitfallZone: vi.fn().mockReturnValue(false),
                getPitfallTurnsSurvived: vi.fn().mockReturnValue(0),
                clearLastSignMessage: vi.fn(),
                clearDisplayingSignMessage: vi.fn(),
                clearCurrentNPCPosition: vi.fn(),
                isDisplayingSignMessage: vi.fn().mockReturnValue(false)
            },
            zoneRepository: {
                hasByKey: vi.fn((key) => game.zones.has(key)),
                getByKey: vi.fn((key) => game.zones.get(key)),
                setByKey: vi.fn((key, data) => game.zones.set(key, data))
            },
            spawnTreasuresOnGrid: vi.fn()
        };

        // Add playerFacade reference
        game.playerFacade = game.player;

        const zoneManager = new ZoneManager(game);
        const zoneTransition = new ZoneTransitionManager(game, { handleKeyPress() {} });
    // In the real game, transitionToZone is provided by the ZoneManager; bind it here so ZoneTransitionManager can call it
    game.transitionToZone = zoneManager.transitionToZone.bind(zoneManager);
    // Provide generateZone method expected by ZoneManager.transitionToZone
    game.generateZone = zoneManager.generateZone.bind(zoneManager);

        // Place a pitfall at (2,2) and simulate player stepping on it.
        game.grid[2][2] = TILE_TYPES.PITFALL;

        // call handlePitfallTransition which should set portTransitionData and transition
        zoneTransition.handlePitfallTransition(2, 2);

        // After transition, portTransitionData should be set
        expect(game.portTransitionData).not.toBeNull();
        expect(game.portTransitionData.from).toBe('pitfall');
        expect(game.portTransitionData.x).toBe(2);
        expect(game.portTransitionData.y).toBe(2);

        // Simulate zone generation for underground dimension (ZoneManager.generateZone calls zoneGenerator.generateZone)
        // We'll emulate what ZoneGenerator would return for the underground zone: include playerSpawn and returnToSurface
        const undergroundZoneKey = `${game.player.currentZone.x},${game.player.currentZone.y}:2:z-1`;
        const zoneData = {
            grid: Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(TILE_TYPES.FLOOR)),
            enemies: [],
            playerSpawn: { x: 4, y: 4 },
            returnToSurface: { from: 'pitfall', x: 2, y: 2 }
        };
        game.zones.set(undergroundZoneKey, zoneData);
        // Ensure zoneGenerator.generateZone returns our prepared zone when ZoneManager regenerates on port transitions
        game.zoneGenerator.generateZone = vi.fn(() => ({ ...zoneData }));

        // When zoneManager.generateZone is called it will set game.grid from zoneData
        game.player.currentZone.dimension = 2;
        game.player.undergroundDepth = 1;
        zoneManager.generateZone();

        // Player should be placed on the underground spawn when entering
        // (ZoneManager.transitionToZone calls positionPlayerAfterTransition with exitSide 'port' and player's pos)
        // Simulate that the last transition was a port entry
        game.lastExitSide = 'port';

        // Now simulate exiting back to surface by calling handlePortTransition
        // Place the player on a PORT tile in underground zone so handlePortTransition will treat it as a port
        const playerPos = game.player.getPosition();
        game.grid[playerPos.y][playerPos.x] = TILE_TYPES.PORT;

        // Manually set currentDim to underground to emulate being underground
        game.player.currentZone.dimension = 2;
        // Call handlePortTransition to go back to surface
        zoneTransition.handlePortTransition();

        // After transitioning back, the zoneManager.positionPlayerAfterTransition logic should place player at original hole
        // The ZoneManager sets game.portTransitionData to null after transition completes; but the player's actual position should be set
        // Check that the player's position is the original hole coordinates
        expect(game.player.x).toBe(2);
        expect(game.player.y).toBe(2);
    });
});
