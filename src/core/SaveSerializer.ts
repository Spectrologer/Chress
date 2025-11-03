import { Sign } from '../ui/Sign.js';
import type { GameContext } from './GameContext.js';

/**
 * Helper class for serializing game state to a save format.
 * Extracted from GameStateManager to improve code organization.
 */
export class SaveSerializer {
    /**
     * Serializes the current game state into a plain object ready for JSON serialization.
     */
    static serializeGameState(game: any): any {
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
        };
    }

    /**
     * Serializes player data.
     */
    static serializePlayer(player: any): any {
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
     */
    static serializePlayerStats(player: any): any {
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
    static serializeEnemies(enemies: any[]): any[] {
        return enemies.map(enemy => ({
            x: enemy.x,
            y: enemy.y,
            enemyType: enemy.enemyType,
            health: enemy.health,
            id: enemy.id
        }));
    }
}
