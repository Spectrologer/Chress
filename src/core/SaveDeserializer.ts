import { TextBox } from '@ui/textbox';
import { validateLoadedGrid } from '@generators/GeneratorUtils';
import { logger } from './logger';
import type { GameContext } from './context/GameContextCore';
import type { SavedPlayerData, SavedPlayerStats, SaveGameData } from './SharedTypes';
import type { ZoneRepository } from '@repositories/ZoneRepository';
import type { EnemyData } from '@entities/Enemy';

/**
 * Helper class for deserializing game state from a save format.
 * Extracted from GameStateManager to improve code organization.
 */
export class SaveDeserializer {
    /**
     * Deserializes player state from saved data.
     */
    static deserializePlayer(game: GameContext, playerData: SavedPlayerData): void {
        if (!playerData || !game.world.player) return;

        game.world.player.x = playerData.x;
        game.world.player.y = playerData.y;
        game.world.player.currentZone = playerData.currentZone;
        game.world.player.setThirst(playerData.thirst);
        game.world.player.setHunger(playerData.hunger);
        game.world.player.inventory = playerData.inventory;
        game.world.player.abilities = new Set(playerData.abilities || []);
        game.world.player.setHealth(playerData.health);
        game.world.player.stats.dead = playerData.dead;
        game.world.player.sprite = playerData.sprite;
        game.world.player.setPoints(playerData.points);
        game.world.player.visitedZones = new Set(playerData.visitedZones);
        game.world.player.setSpentDiscoveries(playerData.spentDiscoveries);
    }

    /**
     * Deserializes player settings/stats from saved data.
     */
    static deserializePlayerStats(game: GameContext, statsData: SavedPlayerStats): void {
        if (!statsData || !game.world.player) return;

        try {
            if (!game.world.player.stats) {
                throw new Error('Player stats not initialized');
            }
            game.world.player.stats.musicEnabled = typeof statsData.musicEnabled !== 'undefined'
                ? !!statsData.musicEnabled
                : true;
            game.world.player.stats.sfxEnabled = typeof statsData.sfxEnabled !== 'undefined'
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
    static deserializeGameState(game: GameContext & { zoneRepository?: ZoneRepository; messageLog?: string[] }, gameStateData: Partial<SaveGameData>): void {
        // Restore game state with validation for grid data
        if (game.zoneRepository) {
            game.zoneRepository.restore(gameStateData.zones || []);
            game.world.zones = game.zoneRepository.getMap();
        } else {
            game.world.zones = new Map(gameStateData.zones || []);
        }

        game.world.grid = validateLoadedGrid(gameStateData.grid);
        // Modify enemies array in-place to preserve enemyCollection reference
        const loadedEnemies = (gameStateData.enemies || []).map((e) => new game.Enemy(e as EnemyData));
        game.world.enemies.length = 0;
        game.world.enemies.push(...loadedEnemies);
        game.world.defeatedEnemies = new Set(gameStateData.defeatedEnemies || []);
        game.world.specialZones = new Map(gameStateData.specialZones || []);
        game.messageLog = gameStateData.messageLog || [];
        game.world.currentRegion = gameStateData.currentRegion || null;
    }

    /**
     * Deserializestextbox spawned messages from saved data.
     */
    static deserializeSignMessages(signMessages: string[]): void {
        TextBox.spawnedMessages = new Set(signMessages || []);
    }
}
