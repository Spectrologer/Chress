import { Sign } from '../ui/Sign.js';

/**
 * Helper class for serializing game state to a save format.
 * Extracted from GameStateManager to improve code organization.
 */
export class SaveSerializer {
    /**
     * Serializes the current game state into a plain object ready for JSON serialization.
     * @param {Object} game - The game instance
     * @returns {Object} The serialized game state
     */
    static serializeGameState(game) {
        return {
            // Player state
            player: SaveSerializer.serializePlayer(game.player),
            // Player UI/settings (persist toggles - music/sfx)
            playerStats: SaveSerializer.serializePlayerStats(game.player),
            // Game state - save all zones across all dimensions
            zones: game.zoneRepository.entries(),
            grid: game.grid,
            enemies: SaveSerializer.serializeEnemies(game.enemies),
            defeatedEnemies: Array.from(game.defeatedEnemies),
            specialZones: Array.from(game.specialZones.entries()),
            messageLog: game.messageLog,
            currentRegion: game.currentRegion
            // Note: Transient state (bomb placement, pitfall, etc.) is NOT persisted - managed by TransientGameState
            // Note: Zone generation state is now saved directly via game.zoneGenState.serialize() in GameStateManager
        };
    }

    /**
     * Serializes player data.
     * @param {Object} player - The player instance
     * @returns {Object} Serialized player data
     */
    static serializePlayer(player) {
        return {
            x: player.x,
            y: player.y,
            currentZone: player.currentZone,
            thirst: player.getThirst(),
            hunger: player.getHunger(),
            inventory: player.inventory,
            abilities: Array.from(player.abilities),
            health: player.getHealth(),
            dead: player.dead,
            sprite: player.sprite,
            points: player.getPoints(),
            visitedZones: Array.from(player.visitedZones),
            spentDiscoveries: player.getSpentDiscoveries()
        };
    }

    /**
     * Serializes player settings/stats.
     * @param {Object} player - The player instance
     * @returns {Object} Serialized player stats
     */
    static serializePlayerStats(player) {
        return {
            musicEnabled: (player.stats && typeof player.stats.musicEnabled !== 'undefined')
                ? !!player.stats.musicEnabled
                : true,
            sfxEnabled: (player.stats && typeof player.stats.sfxEnabled !== 'undefined')
                ? !!player.stats.sfxEnabled
                : true
        };
    }

    /**
     * Serializes enemy data.
     * @param {Array} enemies - Array of enemy instances
     * @returns {Array} Serialized enemy data
     */
    static serializeEnemies(enemies) {
        return enemies.map(enemy => ({
            x: enemy.x,
            y: enemy.y,
            enemyType: enemy.enemyType, // Use enemyType property instead of type
            health: enemy.health,
            id: enemy.id
        }));
    }

    // Note: serializeZoneStateManager() removed - zone generation state is now
    // saved via game.zoneGenState.serialize() in GameStateManager
}
