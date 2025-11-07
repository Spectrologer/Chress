import type { GameContext } from './GameContext';
import type { SaveGameData, SavedPlayerData, SavedPlayerStats, SavedEnemyData, Grid } from './SharedTypes';
import type { Player } from '@entities/Player';
import type { PlayerStats } from '@entities/PlayerStats';
import type { Enemy } from '@entities/Enemy';
import type { ZoneRepository } from '@repositories/ZoneRepository';

/**
 * Helper class for serializing game state to a save format.
 * Extracted from GameStateManager to improve code organization.
 */
export class SaveSerializer {
    /**
     * Serializes the current game state into a plain object ready for JSON serialization.
     */
    static serializeGameState(game: GameContext & { zoneRepository?: ZoneRepository; messageLog?: string[] }): SaveGameData {
        return {
            // Player state
            player: SaveSerializer.serializePlayer(game.world.player),
            // Player UI/settings (persist toggles - music/sfx)
            playerStats: SaveSerializer.serializePlayerStats(game.world.player),
            // Game state - save all zones across all dimensions
            zones: game.zoneRepository?.entries() || Array.from(game.world.zones.entries()),
            grid: game.world.grid as Grid,
            enemies: SaveSerializer.serializeEnemies(game.world.enemies),
            defeatedEnemies: Array.from(game.world.defeatedEnemies),
            specialZones: Array.from(game.world.specialZones.entries()),
            messageLog: game.messageLog || [],
            currentRegion: game.world.currentRegion || ''
        };
    }

    /**
     * Serializes player data.
     */
    static serializePlayer(player: Player): SavedPlayerData {
        return {
            x: player.x,
            y: player.y,
            currentZone: player.currentZone,
            thirst: player.getThirst(),
            hunger: player.getHunger(),
            inventory: player.inventory,
            abilities: Array.from(player.abilities),
            health: player.getHealth(),
            dead: player.stats.dead,
            sprite: player.sprite,
            points: player.getPoints(),
            visitedZones: Array.from(player.visitedZones),
            spentDiscoveries: player.getSpentDiscoveries()
        };
    }

    /**
     * Serializes player settings/stats.
     */
    static serializePlayerStats(player: Player): SavedPlayerStats {
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
     */
    static serializeEnemies(enemies: Enemy[]): SavedEnemyData[] {
        return enemies.map(enemy => ({
            x: enemy.x,
            y: enemy.y,
            enemyType: enemy.enemyType,
            health: enemy.health,
            id: enemy.id
        }));
    }
}
