import { BaseCommand } from '../BaseCommand';

/**
 * RestartGameCommand - Prompts user and restarts the game
 */
export class RestartGameCommand extends BaseCommand {
    execute(game) {
        if (confirm('Are you sure you want to restart the game? All progress will be lost.')) {
            game.resetGame();
        }
    }
}
