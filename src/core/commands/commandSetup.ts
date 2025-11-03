import { CommandRegistry } from './CommandRegistry.js';
import {
    SpawnBombCommand,
    SpawnHorseIconCommand,
    SpawnHammerCommand,
    SpawnBishopSpearCommand,
    SpawnNoteCommand,
    SpawnHeartCommand,
    SpawnBookCommand,
    SpawnBowCommand,
    SpawnWaterCommand,
    SpawnFoodMeatCommand,
    SpawnFoodNutCommand,
    SpawnPenneCommand,
    SpawnSquigCommand,
    SpawnRuneCommand,
    SpawnNibCommand,
    SpawnMarkCommand,
    SpawnGougeCommand,
    SpawnShovelCommand,
    SpawnPitfallCommand,
    SpawnShackCommand,
    SpawnCisternCommand,
    SpawnStairdownCommand
} from './spawn/SpawnCommands.js';
import {
    SpawnEnemyCommand,
    SpawnLizardyCommand,
    SpawnLizardoCommand,
    SpawnLizardeauxCommand,
    SpawnLizordCommand,
    SpawnLazerdCommand,
    SpawnZardCommand
} from './spawn/EnemySpawnCommands.js';
import { RestartGameCommand } from './utility/UtilityCommands.js';

/**
 * Creates and configures the command registry with all commands
 * @returns {CommandRegistry} Configured command registry
 */
export function createCommandRegistry() {
    const registry = new CommandRegistry();

    // Register spawn commands
    registry.register('spawnBomb', new SpawnBombCommand());
    registry.register('spawnHorseIcon', new SpawnHorseIconCommand());
    registry.register('spawnHammer', new SpawnHammerCommand());
    registry.register('spawnBishopSpear', new SpawnBishopSpearCommand());
    registry.register('spawnNote', new SpawnNoteCommand());
    registry.register('spawnHeart', new SpawnHeartCommand());
    registry.register('spawnBook', new SpawnBookCommand());
    registry.register('spawnBow', new SpawnBowCommand());
    registry.register('spawnWater', new SpawnWaterCommand());
    registry.register('spawnFoodMeat', new SpawnFoodMeatCommand());
    registry.register('spawnFoodNut', new SpawnFoodNutCommand());
    registry.register('spawnPenne', new SpawnPenneCommand());
    registry.register('spawnSquig', new SpawnSquigCommand());
    registry.register('spawnRune', new SpawnRuneCommand());
    registry.register('spawnNib', new SpawnNibCommand());
    registry.register('spawnMark', new SpawnMarkCommand());
    registry.register('spawnGouge', new SpawnGougeCommand());
    registry.register('spawnShovel', new SpawnShovelCommand());
    registry.register('spawnPitfall', new SpawnPitfallCommand());
    registry.register('spawnShack', new SpawnShackCommand());
    registry.register('spawnCistern', new SpawnCisternCommand());
    registry.register('spawnStairdown', new SpawnStairdownCommand());

    // Register enemy spawn commands
    registry.register('spawnEnemy', new SpawnEnemyCommand());
    registry.register('spawnLizardy', new SpawnLizardyCommand());
    registry.register('spawnLizardo', new SpawnLizardoCommand());
    registry.register('spawnLizardeaux', new SpawnLizardeauxCommand());
    registry.register('spawnLizord', new SpawnLizordCommand());
    registry.register('spawnLazerd', new SpawnLazerdCommand());
    registry.register('spawnZard', new SpawnZardCommand());

    // Register utility commands
    registry.register('restartGame', new RestartGameCommand());

    // Register hotkeys
    setupHotkeys(registry);

    return registry;
}

/**
 * Set up hotkey mappings
 * @param {CommandRegistry} registry - Command registry
 */
function setupHotkeys(registry) {
    // Item spawn hotkeys
    registry.registerHotkey('escape', 'restartGame');
    registry.registerHotkey('b', 'spawnBomb');
    registry.registerHotkey('h', 'spawnHorseIcon');
    registry.registerHotkey('m', 'spawnHammer');
    registry.registerHotkey('v', 'spawnShovel');
    registry.registerHotkey('z', 'spawnBishopSpear');
    registry.registerHotkey('n', 'spawnNote');
    registry.registerHotkey('r', 'spawnHeart');
    registry.registerHotkey('k', 'spawnBook');
    registry.registerHotkey('y', 'spawnBow');
    registry.registerHotkey('i', 'spawnNib');
    registry.registerHotkey('e', 'spawnRune');
    registry.registerHotkey('w', 'spawnWater');
    registry.registerHotkey('u', 'spawnFoodNut');
    registry.registerHotkey('l', 'spawnPenne');
    registry.registerHotkey('g', 'spawnSquig');
    registry.registerHotkey('d', 'spawnGouge');
    registry.registerHotkey('x', 'spawnMark');
    registry.registerHotkey('j', 'spawnShack');
    registry.registerHotkey('c', 'spawnCistern');
    registry.registerHotkey('p', 'spawnPitfall');
    registry.registerHotkey('t', 'spawnStairdown');

    // Special hotkey for random food
    registry.register('spawnRandomFood', {
        execute: (game) => {
            const command = Math.random() < 0.5 ? 'spawnFoodMeat' : 'spawnFoodNut';
            registry.execute(command, game);
        }
    });
    registry.registerHotkey('f', 'spawnRandomFood');

    // Enemy spawn hotkeys (number keys)
    registry.registerHotkey('1', 'spawnLizardy');
    registry.registerHotkey('2', 'spawnLizardo');
    registry.registerHotkey('3', 'spawnLizardeaux');
    registry.registerHotkey('4', 'spawnLizord');
    registry.registerHotkey('5', 'spawnLazerd');
    registry.registerHotkey('6', 'spawnZard');
}
