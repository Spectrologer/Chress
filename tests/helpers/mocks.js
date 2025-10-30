/**
 * Common mock factories for testing
 * Provides reusable mock objects to standardize testing patterns
 */

import { TILE_TYPES, GRID_SIZE } from '../../src/core/constants/index.js';

/**
 * Creates a mock player object with common methods and properties
 */
export function createMockPlayer(overrides = {}) {
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
        getPosition: jest.fn().mockReturnValue({ x: 2, y: 1 }),
        getPositionObject: jest.fn().mockReturnValue({ x: 2, y: 1 }),
        setPosition: jest.fn(),

        // State checks
        isDead: jest.fn().mockReturnValue(false),
        isWalkable: jest.fn().mockReturnValue(true),

        // Movement
        move: jest.fn(),

        // Animation
        startAttackAnimation: jest.fn(),
        startBump: jest.fn(),

        // Combat
        takeDamage: jest.fn(),
        addPoints: jest.fn(),

        // Interaction
        setInteractOnReach: jest.fn(),
        clearInteractOnReach: jest.fn(),
        interactOnReach: null,

        // Zone management
        getCurrentZone: jest.fn().mockReturnValue({ x: 0, y: 0, dimension: 0 }),
        setCurrentZone: jest.fn(),
        hasVisitedZone: jest.fn().mockReturnValue(false),

        // Stats
        getHealth: jest.fn().mockReturnValue(100),
        getHunger: jest.fn().mockReturnValue(50),

        ...overrides,
    };
}

/**
 * Creates a mock enemy object
 */
export function createMockEnemy(overrides = {}) {
    const id = overrides.id || Math.random().toString(36).substr(2, 9);
    return {
        id,
        x: 5,
        y: 5,
        health: 50,
        isFrozen: false,
        showFrozenVisual: false,

        takeDamage: jest.fn(),
        getPoints: jest.fn().mockReturnValue(10),
        move: jest.fn(),

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
export function createMockGame(overrides = {}) {
    const mockPlayer = overrides.player || createMockPlayer();
    const mockGrid = overrides.grid || createMockGrid();

    return {
        player: mockPlayer,
        grid: mockGrid,
        enemies: [],
        npcs: [],

        // Canvas
        canvas: {
            getBoundingClientRect: jest.fn().mockReturnValue({
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
            handleTap: jest.fn().mockReturnValue(false),
        },

        combatManager: {
            addPointAnimation: jest.fn(),
            handlePlayerAttack: jest.fn(),
            defeatEnemy: jest.fn(),
        },

        uiManager: {
            isStatsPanelOpen: jest.fn().mockReturnValue(false),
            hideStatsPanel: jest.fn(),
            showStatsPanel: jest.fn(),
            updatePlayerStats: jest.fn(),
            showMessage: jest.fn(),
            hideMessage: jest.fn(),
        },

        consentManager: {
            forceShowConsentBanner: jest.fn(),
        },

        turnManager: {
            handleTurnCompletion: jest.fn(),
        },

        animationScheduler: {
            createSequence: jest.fn(() => ({
                add: jest.fn().mockReturnThis(),
                play: jest.fn().mockResolvedValue(undefined),
                cancel: jest.fn(),
            })),
        },

        eventBus: {
            on: jest.fn(),
            emit: jest.fn(),
            off: jest.fn(),
        },

        gridManager: {
            getTile: jest.fn((x, y) => {
                if (x < 0 || y < 0 || x >= GRID_SIZE || y >= GRID_SIZE) {
                    return undefined;
                }
                return mockGrid[y][x];
            }),
            setTile: jest.fn(),
            isWalkable: jest.fn().mockReturnValue(true),
        },

        // Game methods
        hideOverlayMessage: jest.fn(),
        transitionToZone: jest.fn(),
        handleEnemyMovements: jest.fn(),
        checkCollisions: jest.fn(),
        checkItemPickup: jest.fn(),
        updatePlayerPosition: jest.fn(),
        updatePlayerStats: jest.fn(),
        startEnemyTurns: jest.fn(),
        incrementBombActions: jest.fn(),

        ...overrides,
    };
}

/**
 * Creates a mock EventBus
 */
export function createMockEventBus() {
    const listeners = new Map();

    return {
        on: jest.fn((event, callback) => {
            if (!listeners.has(event)) {
                listeners.set(event, []);
            }
            listeners.get(event).push(callback);
        }),
        emit: jest.fn((event, data) => {
            if (listeners.has(event)) {
                listeners.get(event).forEach(callback => callback(data));
            }
        }),
        off: jest.fn((event, callback) => {
            if (listeners.has(event)) {
                const callbacks = listeners.get(event);
                const index = callbacks.indexOf(callback);
                if (index > -1) {
                    callbacks.splice(index, 1);
                }
            }
        }),
        clear: jest.fn(() => {
            listeners.clear();
        }),
    };
}

/**
 * Creates a mock InventoryService
 */
export function createMockInventoryService() {
    return {
        addItem: jest.fn(),
        removeItem: jest.fn(),
        hasItem: jest.fn().mockReturnValue(false),
        getItems: jest.fn().mockReturnValue([]),
        useItem: jest.fn(),
        equipItem: jest.fn(),
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
            add: jest.fn(),
            remove: jest.fn(),
            contains: jest.fn(),
            toggle: jest.fn(),
        },
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        querySelector: jest.fn(selector => {
            // Return a nested mock element
            return createMockElement(`${id}-${selector}`);
        }),
        querySelectorAll: jest.fn(() => []),
        appendChild: jest.fn(),
        removeChild: jest.fn(),
        remove: jest.fn(),
        getAttribute: jest.fn(),
        setAttribute: jest.fn(),
        hasAttribute: jest.fn(),
        removeAttribute: jest.fn(),
    };
    return element;
}
