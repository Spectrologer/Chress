/**
 * ZonePersistenceManager - Handles zone state persistence
 *
 * Extracted from ZoneManager to reduce file size.
 * Manages saving current zone state to the zone repository.
 */

import { logger } from '../core/logger';
import { createZoneKey } from '../utils/ZoneKeyUtils';
import type { Game } from '../core/game';
import type { Grid } from '../core/SharedTypes';
import type { Enemy as EnemyType } from '../entities/Enemy';

interface EnemyData {
    x: number;
    y: number;
    enemyType: string;
    health: number;
    id: string;
}

interface ZoneState {
    grid: Grid;
    enemies: Array<{
        x: number;
        y: number;
        enemyType: string;
        health: number;
        id: string;
    }>;
    playerSpawn: null;
    terrainTextures: Record<string, any>;
    overlayTextures: Record<string, any>;
    rotations: Record<string, any>;
    overlayRotations: Record<string, any>;
}

export class ZonePersistenceManager {
    private game: Game;

    constructor(game: Game) {
        this.game = game;
    }

    /**
     * Saves the current zone's state to the zone repository.
     * Preserves grid changes and enemy positions for future visits.
     */
    public saveCurrentZoneState(): void {
        const currentZone = (this.game.player as any).getCurrentZone();
        const depth = currentZone.depth || ((this.game.player as any).undergroundDepth || 1);
        const zoneKey = createZoneKey(currentZone.x, currentZone.y, currentZone.dimension, depth);

        // Save current zone state to preserve any changes made during gameplay
        const enemyCollection = this.game.enemyCollection;
        const zoneGenerator = (this.game as any).zoneGenerator;

        const zoneState: ZoneState = {
            grid: JSON.parse(JSON.stringify(this.game.grid)),
            enemies: (enemyCollection as any).map((enemy: EnemyType) => ({
                x: enemy.x,
                y: enemy.y,
                enemyType: enemy.enemyType,
                health: enemy.health,
                id: enemy.id
            })) as Array<{
                x: number;
                y: number;
                enemyType: string;
                health: number;
                id: string;
            }>,
            playerSpawn: null,
            // Preserve terrain textures, overlay textures, rotations, and overlay rotations for custom boards
            terrainTextures: zoneGenerator.terrainTextures || {},
            overlayTextures: zoneGenerator.overlayTextures || {},
            rotations: zoneGenerator.rotations || {},
            overlayRotations: zoneGenerator.overlayRotations || {}
        };

        this.game.zoneRepository.setByKey(zoneKey, zoneState);

        logger.debug(`Saved current zone state for ${zoneKey}`);
    }
}
