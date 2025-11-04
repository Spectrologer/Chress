import { ZoneTransitionManager } from '@managers/ZoneTransitionManager';
import { ZoneManager } from '@managers/ZoneManager';
import { TILE_TYPES, GRID_SIZE } from '@core/constants/index';

jest.mock('../renderers/MultiTileHandler.js');
import { MultiTileHandler } from '@renderers/MultiTileHandler';

describe('Hole and Cistern depth setting', () => {
    const createGameMock = () => ({
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
            getPosition() { return { x: this.x, y: this.y }; },
            getCurrentZone() { return { ...this.currentZone }; },
            ensureValidPosition() {},
            onZoneTransition() {}
        },
        uiManager: {
            generateRegionName() { return 'Test'; },
            showRegionNotification() {},
            updateZoneDisplay() {},
            updatePlayerPosition() {},
            updatePlayerStats() {},
            addMessageToLog() {}
        },
        zoneGenerator: { generateZone: jest.fn(), grid: [] },
        connectionManager: { generateChunkConnections() {} },
        availableFoodAssets: [],
        enemies: [],
        zones: new Map(),
        lastExitSide: null,
        justEnteredZone: false,
        defeatedEnemies: new Set(),
        gameStateManager: { saveGameState() {} }
    });

    test('undergroundDepth is set to 1 when entering via hole', () => {
        const game = createGameMock();
        const zoneManager = new ZoneManager(game);
        const zoneTransition = new ZoneTransitionManager(game, { handleKeyPress() {} });
        game.transitionToZone = zoneManager.transitionToZone.bind(zoneManager);
        game.generateZone = zoneManager.generateZone.bind(zoneManager);

        // Mock isHole to return true for hole tile
        MultiTileHandler.isHole.mockImplementation((x, y) => x === 2 && y === 2);

        // Place hole tile at player position
        game.grid[2][2] = TILE_TYPES.HOLE;
        // Make it a PORT interaction
        game.grid[2][2] = TILE_TYPES.PORT;

        // Verify initial state
        expect(game.player.undergroundDepth).toBe(0);
        expect(game.player.currentZone.depth).toBe(0);

        // Simulate port transition
        zoneTransition.handlePortTransition();

        // Verify depth is set to 1
        expect(game.player.undergroundDepth).toBe(1);
        expect(game.player.currentZone.depth).toBe(1);
        expect(game.portTransitionData.from).toBe('hole');
    });

    test('undergroundDepth is set to 1 when entering via cistern', () => {
        const game = createGameMock();
        const zoneManager = new ZoneManager(game);
        const zoneTransition = new ZoneTransitionManager(game, { handleKeyPress() {} });
        game.transitionToZone = zoneManager.transitionToZone.bind(zoneManager);
        game.generateZone = zoneManager.generateZone.bind(zoneManager);

        // Mock findCisternPosition to return a cistern position
        MultiTileHandler.findCisternPosition.mockReturnValue({ x: 2, y: 3 });
        MultiTileHandler.isHole.mockReturnValue(false);

        // Place cistern tiles (not strictly necessary but for completeness)
        game.grid[2][3] = TILE_TYPES.CISTERN;
        // Make player position a PORT
        game.grid[2][2] = TILE_TYPES.PORT;

        // Verify initial state
        expect(game.player.undergroundDepth).toBe(0);
        expect(game.player.currentZone.depth).toBe(0);

        // Simulate port transition
        zoneTransition.handlePortTransition();

        // Verify depth is set to 1
        expect(game.player.undergroundDepth).toBe(1);
        expect(game.player.currentZone.depth).toBe(1);
        expect(game.portTransitionData.from).toBe('cistern');
    });

    test('stairdown correctly increments depth after entering via hole', () => {
        const game = createGameMock();
        const zoneManager = new ZoneManager(game);
        const zoneTransition = new ZoneTransitionManager(game, { handleKeyPress() {} });
        game.transitionToZone = zoneManager.transitionToZone.bind(zoneManager);
        game.generateZone = zoneManager.generateZone.bind(zoneManager);

        // First, enter via hole
        game.grid[2][2] = TILE_TYPES.HOLE;
        game.grid[2][2] = TILE_TYPES.PORT; // Simulate as port

        // Enter underground via hole
        zoneTransition.handlePortTransition();
        expect(game.player.undergroundDepth).toBe(1);
        expect(game.player.currentZone.depth).toBe(1);

        // Now, simulate being underground and using a stairdown
        game.player.currentZone.dimension = 2;

        // Place stairdown at current position
        game.grid[2][2] = { type: TILE_TYPES.PORT, portKind: 'stairdown' };

        // Use stairdown transition
        zoneTransition.handlePortTransition();

        // Depth should increment from 1 to 2
        expect(game.player.undergroundDepth).toBe(2);
        expect(game.player.currentZone.depth).toBe(2);
    });
});
