// @ts-check
/**
 * State type definitions and initial state factory
 *
 * Contains all TypeScript typedef comments and the initial state structure.
 * Separated from StateStore to reduce file size and improve maintainability.
 */

/**
 * @typedef {Object} Position
 * @property {number} x
 * @property {number} y
 * @property {number} lastX
 * @property {number} lastY
 */

/**
 * @typedef {Object} ZoneKey
 * @property {number} x
 * @property {number} y
 * @property {string} dimension
 * @property {number} depth
 */

/**
 * @typedef {Object} PlayerStats
 * @property {number} health
 * @property {number} maxHealth
 * @property {number} hunger
 * @property {number} thirst
 * @property {number} points
 * @property {number} consecutiveKills
 * @property {number} spentDiscoveries
 */

/**
 * @typedef {Object} SpawnFlags
 * @property {boolean} axeSpawned
 * @property {boolean} hammerSpawned
 * @property {boolean} spearSpawned
 * @property {boolean} horseIconSpawned
 * @property {boolean} noteSpawned
 * @property {boolean} penneSpawned
 * @property {boolean} squigSpawned
 * @property {boolean} shackSpawned
 * @property {boolean} GrateSpawned
 * @property {boolean} wellSpawned
 * @property {boolean} deadTreeSpawned
 * @property {boolean} warningSignPlaced
 */

/**
 * @typedef {Object} SpawnZones
 * @property {string|null} axeSpawnZone
 * @property {string|null} hammerSpawnZone
 * @property {string|null} spearSpawnZone
 * @property {string|null} horseIconSpawnZone
 * @property {string|null} noteSpawnZone
 */

/**
 * @typedef {Object} GameState
 * @property {PersistentState} persistent
 * @property {SessionState} session
 * @property {TransientState} transient
 * @property {UIState} ui
 * @property {MetaState} meta
 */

/**
 * @typedef {Object} PersistentState
 * @property {Object} player
 * @property {Position} player.position
 * @property {ZoneKey} player.currentZone
 * @property {Set<string>} player.visitedZones
 * @property {any[]} player.inventory
 * @property {any[]} player.radialInventory
 * @property {Set<string>} player.abilities
 * @property {PlayerStats} player.stats
 * @property {number} player.undergroundDepth
 * @property {string|null} player.lastActionType
 * @property {string|null} player.lastActionResult
 * @property {any} player.interactOnReach
 * @property {Map<string, any>} zones
 * @property {Set<string>} defeatedEnemies
 * @property {Map<string, any>} specialZones
 * @property {string[]} messageLog
 * @property {Map<string, any>} dialogueState
 * @property {string} currentRegion
 */

/**
 * @typedef {Object} SessionState
 * @property {boolean} gameStarted
 * @property {Object} zoneGeneration
 * @property {number} zoneGeneration.zoneCounter
 * @property {number} zoneGeneration.enemyCounter
 * @property {SpawnFlags} zoneGeneration.spawnFlags
 * @property {SpawnZones} zoneGeneration.spawnZones
 * @property {any} currentGrid
 * @property {any[]} enemies
 * @property {Set<string>} signSpawnedMessages
 */

/**
 * @typedef {Object} TransientState
 * @property {Object} combat
 * @property {boolean} combat.playerJustAttacked
 * @property {Object} interactions
 * @property {string|null} interactions.signMessage
 * @property {string|null} interactions.lastSignMessage
 * @property {{x: number, y: number}|null} interactions.currentNpcPosition
 * @property {Object} itemAbilities
 * @property {boolean} itemAbilities.pendingCharge
 * @property {boolean} itemAbilities.bombPlacementMode
 * @property {Array<{x: number, y: number}>} itemAbilities.bombPositions
 * @property {Object} zoneTransition
 * @property {boolean} zoneTransition.justEnteredZone
 * @property {string|null} zoneTransition.lastExitSide
 * @property {any} zoneTransition.portTransitionData
 * @property {boolean} zoneTransition.pitfallZoneActive
 * @property {number} zoneTransition.pitfallTurnsRemaining
 * @property {Object} turn
 * @property {boolean} turn.isPlayerTurn
 * @property {boolean} turn.justLeftExitTile
 * @property {any[]} turn.turnQueue
 * @property {Set<string>} turn.occupiedTilesThisTurn
 * @property {Set<string>} turn.initialEnemyTilesThisTurn
 * @property {Object} entrance
 * @property {boolean} entrance.animationInProgress
 * @property {{x: number, y: number}|null} entrance.newGameSpawnPosition
 */

/**
 * @typedef {Object} UIState
 * @property {Object} panels
 * @property {boolean} panels.statsOpen
 * @property {boolean} panels.configOpen
 * @property {boolean} panels.previewMode
 * @property {Object} radialMenu
 * @property {boolean} radialMenu.open
 * @property {any} radialMenu.snapshot
 * @property {Object} input
 * @property {{x: number, y: number}|null} input.lastHighlightedTile
 * @property {boolean} input.shovelMode
 * @property {Object} confirmations
 * @property {any} confirmations.pendingAction
 * @property {Object} settings
 * @property {boolean} settings.musicEnabled
 * @property {boolean} settings.sfxEnabled
 * @property {boolean} settings.verboseAnimations
 */

/**
 * @typedef {Object} MetaState
 * @property {number} version
 * @property {number|null} lastSaved
 * @property {number} saveCount
 */

/**
 * @typedef {Object} StateSnapshot
 * @property {GameState} state
 * @property {number} timestamp
 */

/**
 * @typedef {Object} StateMutation
 * @property {string} type
 * @property {string} path
 * @property {any} oldValue
 * @property {any} newValue
 * @property {number} timestamp
 */

/**
 * @callback StateListener
 * @param {any} sliceState - The state slice that changed
 * @param {string|null} path - The path that changed (if available)
 * @returns {void}
 */

/**
 * Creates the initial state structure
 * @returns {GameState}
 */
export function createInitialState() {
  return {
    // PERSISTENT STATE - Saved to storage, survives app restarts
    persistent: {
      player: {
        position: { x: 0, y: 0, lastX: 0, lastY: 0 },
        currentZone: { x: 0, y: 0, dimension: 'overworld', depth: 0 },
        visitedZones: new Set(),
        inventory: [],
        radialInventory: [],
        abilities: new Set(),
        stats: {
          health: 100,
          maxHealth: 100,
          hunger: 100,
          thirst: 100,
          points: 0,
          consecutiveKills: 0,
          spentDiscoveries: 0
        },
        undergroundDepth: 0,
        lastActionType: null,
        lastActionResult: null,
        interactOnReach: null
      },
      zones: new Map(),
      defeatedEnemies: new Set(),
      specialZones: new Map(),
      messageLog: [],
      dialogueState: new Map(),
      currentRegion: 'plains'
    },

    // SESSION STATE - Resets on game over, but persists during session
    session: {
      gameStarted: false,
      zoneGeneration: {
        zoneCounter: 0,
        enemyCounter: 0,
        spawnFlags: {
          axeSpawned: false,
          hammerSpawned: false,
          spearSpawned: false,
          horseIconSpawned: false,
          noteSpawned: false,
          penneSpawned: false,
          squigSpawned: false,
          shackSpawned: false,
          GrateSpawned: false,
          wellSpawned: false,
          deadTreeSpawned: false,
          warningSignPlaced: false
        },
        spawnZones: {
          axeSpawnZone: null,
          hammerSpawnZone: null,
          spearSpawnZone: null,
          horseIconSpawnZone: null,
          noteSpawnZone: null
        }
      },
      currentGrid: null,
      enemies: [],
      signSpawnedMessages: new Set()
    },

    // TRANSIENT STATE - Resets on zone transitions or specific actions
    transient: {
      combat: {
        playerJustAttacked: false
      },
      interactions: {
        signMessage: null,
        lastSignMessage: null,
        currentNpcPosition: null
      },
      itemAbilities: {
        pendingCharge: false,
        bombPlacementMode: false,
        bombPositions: []
      },
      zoneTransition: {
        justEnteredZone: false,
        lastExitSide: null,
        portTransitionData: null,
        pitfallZoneActive: false,
        pitfallTurnsRemaining: 0
      },
      turn: {
        isPlayerTurn: true,
        justLeftExitTile: false,
        turnQueue: [],
        occupiedTilesThisTurn: new Set(),
        initialEnemyTilesThisTurn: new Set()
      },
      entrance: {
        animationInProgress: false,
        newGameSpawnPosition: null
      }
    },

    // UI STATE - Never persisted, only affects visual/interaction state
    ui: {
      panels: {
        statsOpen: false,
        configOpen: false,
        previewMode: false
      },
      radialMenu: {
        open: false,
        snapshot: null
      },
      input: {
        lastHighlightedTile: null,
        shovelMode: false
      },
      confirmations: {
        pendingAction: null
      },
      settings: {
        musicEnabled: true,
        sfxEnabled: true,
        verboseAnimations: true
      }
    },

    // METADATA - Store metadata
    meta: {
      version: 3,
      lastSaved: null,
      saveCount: 0
    }
  };
}
