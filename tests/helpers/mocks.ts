/**
 * Common mock factories for testing
 * Provides reusable mock objects to standardize testing patterns
 *
 * Uses vi.fn() from Vitest for creating mock functions
 */

import { TILE_TYPES, GRID_SIZE } from '../../src/core/constants/index';

/**
 * Creates a mock player object with common methods and properties
 */
export function createMockPlayer(overrides: Record<string, any> = {}) {
    return {
        x: 2,
        y: 1,
        stats: {
            verbosePathAnimations: true,
            health: 100,
            maxHealth: 100,
            hunger: 50,
            maxHunger: 100,
        },
        inventory: [],
        abilities: new Set(),
        visitedZones: new Set(['0,0,0']),

        // Position methods
        getPosition: vi.fn().mockReturnValue({ x: 2, y: 1 }),
        getPositionObject: vi.fn().mockReturnValue({ x: 2, y: 1 }),
        setPosition: vi.fn(),

        // State checks
        isDead: vi.fn().mockReturnValue(false),
        isWalkable: vi.fn().mockReturnValue(true),

        // Movement
        move: vi.fn(),

        // Animation
        startAttackAnimation: vi.fn(),
        startBump: vi.fn(),

        // Combat
        takeDamage: vi.fn(),
        addPoints: vi.fn(),

        // Stats methods
        getThirst: vi.fn().mockReturnValue(50),
        getHunger: vi.fn().mockReturnValue(50),

        // Interaction
        setInteractOnReach: vi.fn(),
        clearInteractOnReach: vi.fn(),
        interactOnReach: null,

        // Zone management
        getCurrentZone: vi.fn().mockReturnValue({ x: 0, y: 0, dimension: 0 }),
        setCurrentZone: vi.fn(),
        hasVisitedZone: vi.fn().mockReturnValue(false),

        // Stats
        getHealth: vi.fn().mockReturnValue(100),

        ...overrides,
    };
}

/**
 * Creates a mock enemy object
 */
export function createMockEnemy(overrides: Record<string, any> = {}) {
    const id = (overrides.id as string | undefined) || Math.random().toString(36).substr(2, 9);
    return {
        id,
        x: 5,
        y: 5,
        health: 50,
        isFrozen: false,
        showFrozenVisual: false,

        takeDamage: vi.fn(),
        getPoints: vi.fn().mockReturnValue(10),
        move: vi.fn(),
        isDead: vi.fn().mockReturnValue(false),

        ...overrides,
    };
}

/**
 * Creates a mock grid with optional custom tiles
 */
export function createMockGrid(size = GRID_SIZE, defaultTile = TILE_TYPES.FLOOR) {
    return Array(size).fill().map(() => Array(size).fill(defaultTile));
}

/**
 * Creates a mock game object with all common dependencies
 */
export function createMockGame(overrides: Record<string, any> = {}) {
    const mockPlayer = overrides.player || createMockPlayer();
    const mockGrid = overrides.grid || createMockGrid();

    return {
        player: mockPlayer,
        playerFacade: overrides.playerFacade || {
            getCurrentZone: mockPlayer.getCurrentZone,
            getUndergroundDepth: mockPlayer.getUndergroundDepth || vi.fn().mockReturnValue(1),
            getPositionObject: mockPlayer.getPositionObject || mockPlayer.getPosition || vi.fn().mockReturnValue({ x: 0, y: 0 }),
        },
        grid: mockGrid,
        enemies: [],
        npcs: [],

        // Canvas
        canvas: {
            getBoundingClientRect: vi.fn().mockReturnValue({
                left: 0,
                top: 0,
                width: 360,
                height: 360,
            }),
        },

        // State
        pendingCharge: null,
        bombPlacementMode: false,
        bombPlacementPositions: [],
        defeatedEnemies: new Set(),
        zones: new Map(),
        displayingMessageForSign: null,
        justEnteredZone: false,
        isPlayerTurn: true,

        // Managers
        interactionManager: {
            handleTap: vi.fn().mockReturnValue(false),
        },

        combatManager: {
            addPointAnimation: vi.fn(),
            handlePlayerAttack: vi.fn(),
            defeatEnemy: vi.fn(),
        },

        uiManager: {
            isStatsPanelOpen: vi.fn().mockReturnValue(false),
            hideStatsPanel: vi.fn(),
            showStatsPanel: vi.fn(),
            updatePlayerStats: vi.fn(),
            showMessage: vi.fn(),
            hideMessage: vi.fn(),
        },

        consentManager: {
            forceShowConsentBanner: vi.fn(),
        },

        turnManager: {
            handleTurnCompletion: vi.fn(),
        },

        animationScheduler: {
            createSequence: vi.fn(() => ({
                add: vi.fn().mockReturnThis(),
                play: vi.fn().mockResolvedValue(undefined),
                cancel: vi.fn(),
            })),
        },

        eventBus: {
            on: vi.fn(),
            emit: vi.fn(),
            off: vi.fn(),
        },

        gridManager: {
            getTile: vi.fn((x, y) => {
                if (x < 0 || y < 0 || x >= GRID_SIZE || y >= GRID_SIZE) {
                    return undefined;
                }
                return mockGrid[y][x];
            }),
            setTile: vi.fn(),
            isWalkable: vi.fn().mockReturnValue(true),
        },

        // Game methods
        hideOverlayMessage: vi.fn(),
        transitionToZone: vi.fn(),
        handleEnemyMovements: vi.fn(),
        checkCollisions: vi.fn(),
        checkItemPickup: vi.fn(),
        updatePlayerPosition: vi.fn(),
        updatePlayerStats: vi.fn(),
        startEnemyTurns: vi.fn(),
        incrementBombActions: vi.fn(),

        ...overrides,
    };
}

/**
 * Creates a mock EventBus
 */
export function createMockEventBus() {
    const listeners = new Map();

    return {
        on: vi.fn((event, callback: any) => {
            if (!listeners.has(event)) {
                listeners.set(event, []);
            }
            listeners.get(event).push(callback);
        }),
        emit: vi.fn((event, data) => {
            if (listeners.has(event)) {
                listeners.get(event).forEach((callback: any) => callback(data));
            }
        }),
        off: vi.fn((event, callback) => {
            if (listeners.has(event)) {
                const callbacks = listeners.get(event);
                const index = callbacks.indexOf(callback);
                if (index > -1) {
                    callbacks.splice(index, 1);
                }
            }
        }),
        clear: vi.fn(() => {
            listeners.clear();
        }),
    };
}

/**
 * Creates a mock InventoryService
 */
export function createMockInventoryService() {
    return {
        addItem: vi.fn(),
        removeItem: vi.fn(),
        hasItem: vi.fn().mockReturnValue(false),
        getItems: vi.fn().mockReturnValue([]),
        useItem: vi.fn(),
        equipItem: vi.fn(),
    };
}

/**
 * Sets up a basic DOM fixture for UI tests
 */
export function setupDOMFixture() {
    document.body.innerHTML = `
        <div id="game-container">
            <canvas id="game-canvas" width="360" height="360"></canvas>
            <div id="ui-container">
                <div id="inventory"></div>
                <div id="message-log"></div>
                <div id="stats-panel"></div>
                <div id="dialogue-container"></div>
            </div>
        </div>
    `;
}

/**
 * Clears the DOM fixture
 */
export function teardownDOMFixture() {
    document.body.innerHTML = '';
}

/**
 * Creates a mock DOM element with querySelector support
 */
export function createMockElement(id = 'mock-element') {
    const element = {
        id,
        innerHTML: '',
        style: {},
        classList: {
            add: vi.fn(),
            remove: vi.fn(),
            contains: vi.fn(),
            toggle: vi.fn(),
        },
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        querySelector: vi.fn(selector => {
            // Return a nested mock element
            return createMockElement(`${id}-${selector}`);
        }),
        querySelectorAll: vi.fn(() => []),
        appendChild: vi.fn(),
        removeChild: vi.fn(),
        remove: vi.fn(),
        getAttribute: vi.fn(),
        setAttribute: vi.fn(),
        hasAttribute: vi.fn(),
        removeAttribute: vi.fn(),
    };
    return element;
}
