import { logger } from '../logger.js';
import { ZoneStateManager } from '../../generators/ZoneStateManager.js';
import { BaseZoneHandler } from './BaseZoneHandler.js';
import { SPAWN_PROBABILITIES } from '../constants/index.js';
import { boardLoader } from '../BoardLoader.js';

class SurfaceHandler extends BaseZoneHandler {
    constructor(zoneGen, zoneX, zoneY, zoneConnections, foodAssets) {
        super(zoneGen, zoneX, zoneY, foodAssets, 0, 0);
        this.zoneConnections = zoneConnections;
    }

    generate() {
        this.zoneGen.addRegionNotes(`${this.zoneX},${this.zoneY}`, this.structureGenerator);

        if (this.isHomeZone) {
            this.handleHomeZone();
        }

        this.generateExits(this.zoneConnections);
        this.handleFrontierSign();

        if (!this.isHomeZone) {
            this.handleNonHomeZone();
        }

        this.ensureExitAccess();
        this.zoneGen.playerSpawn = this.findPlayerSpawn();

        return this.buildResult();
    }

    handleHomeZone() {
        this.structureGenerator.addHouse(this.zoneX, this.zoneY);
        this.structureGenerator.addSign("WOODCUTTERS<br>CLUB", this.zoneX, this.zoneY);
    }

    handleFrontierSign() {
        if (this.zoneLevel === 4 && !ZoneStateManager.firstFrontierSignPlaced) {
            this.structureGenerator.addSign("TURN BACK");
            ZoneStateManager.firstFrontierSignPlaced = true;
        }
    }

    handleNonHomeZone() {
        this.incrementZoneCounter();
        this.addRandomFeatures();

        this.handleLevelSpecificStructures();
        this.handleRandomCistern();
        this.addLevelBasedFoodAndWater();
        this.handleEnemySpawning();
        this.addSpecialZoneItems();
    }

    handleLevelSpecificStructures() {
        // Level 4: Well
        if (this.zoneLevel === 4 && !ZoneStateManager.wellSpawned) {
            this.structureGenerator.addWell(this.zoneX, this.zoneY);
        }

        // Level 3: Wilds Shack
        if (this.zoneLevel === 3 && !ZoneStateManager.wildsShackSpawned) {
            if (!ZoneStateManager.firstWildsZonePlaced) {
                this.zoneGen.clearZoneForShackOnly();
                if (this.zoneGen.forcePlaceShackInCenter(this.zoneX, this.zoneY)) {
                    ZoneStateManager.wildsShackSpawned = true;
                    ZoneStateManager.wildsShackSpawnZone = { x: this.zoneX, y: this.zoneY };
                    ZoneStateManager.firstWildsZonePlaced = true;
                    // Register and load the gouges board for this shack's interior
                    this.registerGougesBoard();
                    logger.log(`FIRST WILDS ZONE: Shack placed in zone (${this.zoneX}, ${this.zoneY}) - no other features`);
                }
            } else {
                if (this.structureGenerator.addShack(this.zoneX, this.zoneY)) {
                    ZoneStateManager.wildsShackSpawned = true;
                    ZoneStateManager.wildsShackSpawnZone = { x: this.zoneX, y: this.zoneY };
                    // Register and load the gouges board for this shack's interior
                    this.registerGougesBoard();
                }
            }
        }

        // Level 2: Dead Tree and Hammer Warning Sign
        if (this.zoneLevel === 2) {
            if (!ZoneStateManager.deadTreeSpawned) {
                this.structureGenerator.addDeadTree(this.zoneX, this.zoneY);
            }
            if (!ZoneStateManager.hammerWarningSignPlaced) {
                this.structureGenerator.addSign("FIND THE HAMMER<br>IN THE WOODS");
                ZoneStateManager.hammerWarningSignPlaced = true;
            }
        }
    }

    handleRandomCistern() {
        if (Math.random() < SPAWN_PROBABILITIES.CISTERN) {
            this.structureGenerator.addCistern(this.zoneX, this.zoneY, false);
        }
    }

    handleEnemySpawning() {
        const baseProbabilities = {
            1: SPAWN_PROBABILITIES.SURFACE_ENEMY.HOME,
            2: SPAWN_PROBABILITIES.SURFACE_ENEMY.WOODS,
            3: SPAWN_PROBABILITIES.SURFACE_ENEMY.WILDS,
            4: SPAWN_PROBABILITIES.SURFACE_ENEMY.FRONTIER
        };
        const enemyProbability = this.calculateEnemyProbability(baseProbabilities);
        this.spawnEnemyIfProbable(enemyProbability);
    }

    registerGougesBoard() {
        // Register the gouges board for this shack's interior
        boardLoader.registerBoard(this.zoneX, this.zoneY, 1, 'gouges', 'canon');
        // Load it immediately so it's available when the player enters
        boardLoader.loadBoard(this.zoneX, this.zoneY, 1).catch(err => {
            logger.error(`Failed to load gouges board for zone (${this.zoneX},${this.zoneY}):`, err);
        });
    }
}

export function handleSurface(zoneGen, zoneX, zoneY, zoneConnections, foodAssets) {
    const handler = new SurfaceHandler(zoneGen, zoneX, zoneY, zoneConnections, foodAssets);
    return handler.generate();
}
