import { Sign } from '../ui/Sign.js';
import { validateLoadedGrid } from '../generators/GeneratorUtils.js';
import { logger } from './logger.js';

/**
 * Helper class for deserializing game state from a save format.
 * Extracted from GameStateManager to improve code organization.
 */
export class SaveDeserializer {
    /**
     * Deserializes player state from saved data.
     */
    static deserializePlayer(game: any, playerData: any): void {
        if (!playerData) return;

        game.player.x = playerData.x;
        game.player.y = playerData.y;
        game.player.currentZone = playerData.currentZone;
        game.player.setThirst(playerData.thirst);
        game.player.setHunger(playerData.hunger);
        game.player.inventory = playerData.inventory;
        game.player.abilities = new Set(playerData.abilities || []);
        game.player.setHealth(playerData.health);
        game.player.dead = playerData.dead;
        game.player.sprite = playerData.sprite;
        game.player.setPoints(playerData.points);
        game.player.visitedZones = new Set(playerData.visitedZones);
        game.player.setSpentDiscoveries(playerData.spentDiscoveries);
    }

    /**
     * Deserializes player settings/stats from saved data.
     */
    static deserializePlayerStats(game: any, statsData: any): void {
        if (!statsData) return;

        try {
            game.player.stats = game.player.stats || {};
            game.player.stats.musicEnabled = typeof statsData.musicEnabled !== 'undefined'
                ? !!statsData.musicEnabled
                : true;
            game.player.stats.sfxEnabled = typeof statsData.sfxEnabled !== 'undefined'
                ? !!statsData.sfxEnabled
                : true;

            // Do NOT call into SoundManager here
        } catch (e) {
            logger.warn('Failed to deserialize player stats:', e);
        }
    }

    /**
     * Deserializes game state (zones, grid, enemies, etc.) from saved data.
     */
    static deserializeGameState(game: any, gameStateData: any): void {
        // Restore game state with validation for grid data
        if (game.zoneRepository) {
            game.zoneRepository.restore(gameStateData.zones || []);
            game.zones = game.zoneRepository.getMap();
        } else {
            game.zones = new Map(gameStateData.zones || []);
        }

        game.grid = validateLoadedGrid(gameStateData.grid);
        // Modify enemies array in-place to preserve enemyCollection reference
        const loadedEnemies = (gameStateData.enemies || []).map((e: any) => new game.Enemy(e));
        game.enemies.length = 0;
        game.enemies.push(...loadedEnemies);
        game.defeatedEnemies = new Set(gameStateData.defeatedEnemies || []);
        game.specialZones = new Map(gameStateData.specialZones || []);
        game.messageLog = gameStateData.messageLog || [];
        game.currentRegion = gameStateData.currentRegion || null;
    }

    /**
     * Deserializes Sign spawned messages from saved data.
     */
    static deserializeSignMessages(signMessages: string[]): void {
        Sign.spawnedMessages = new Set(signMessages || []);
    }
}
