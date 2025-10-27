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
     * @param {Object} game - The game instance
     * @param {Object} playerData - The saved player data
     */
    static deserializePlayer(game, playerData) {
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
     * @param {Object} game - The game instance
     * @param {Object} statsData - The saved player stats data
     */
    static deserializePlayerStats(game, statsData) {
        if (!statsData) return;

        try {
            game.player.stats = game.player.stats || {};
            game.player.stats.musicEnabled = typeof statsData.musicEnabled !== 'undefined'
                ? !!statsData.musicEnabled
                : true;
            game.player.stats.sfxEnabled = typeof statsData.sfxEnabled !== 'undefined'
                ? !!statsData.sfxEnabled
                : true;
            game.player.stats.autoPathWithEnemies = typeof statsData.autoPathWithEnemies !== 'undefined'
                ? !!statsData.autoPathWithEnemies
                : false;

            // Do NOT call into SoundManager here. Applying audio settings may start
            // playback or create/resume an AudioContext before a user gesture which
            // violates autoplay policies. The overlay Start/Continue handlers will
            // resume the audio context and apply these saved preferences after a
            // user gesture.
        } catch (e) {
            logger.warn('Failed to deserialize player stats:', e);
        }
    }

    /**
     * Deserializes game state (zones, grid, enemies, etc.) from saved data.
     * @param {Object} game - The game instance
     * @param {Object} gameStateData - The saved game state data
     */
    static deserializeGameState(game, gameStateData) {
        // Restore game state with validation for grid data
        // Check if game has ZoneRepository (new approach) or uses Map directly (old approach)
        if (game.zoneRepository) {
            game.zoneRepository.restore(gameStateData.zones || []);
            game.zones = game.zoneRepository.getMap(); // Update backward compatibility reference
        } else {
            game.zones = new Map(gameStateData.zones || []);
        }

        game.grid = validateLoadedGrid(gameStateData.grid);
        game.enemies = (gameStateData.enemies || []).map(e => new game.Enemy(e));
        game.defeatedEnemies = new Set(gameStateData.defeatedEnemies || []);
        game.specialZones = new Map(gameStateData.specialZones || []);
        game.messageLog = gameStateData.messageLog || [];
        game.currentRegion = gameStateData.currentRegion || null;
        // Note: Transient state is reset on load by TransientGameState.resetAll(), not loaded from saves
    }

    /**
     * Deserializes Sign spawned messages from saved data.
     * @param {Array} signMessages - The saved sign messages
     */
    static deserializeSignMessages(signMessages) {
        Sign.spawnedMessages = new Set(signMessages || []);
    }
}
