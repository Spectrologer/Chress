/**
 * BaseCommand - Abstract base class for commands
 *
 * Provides common functionality for all commands.
 */
export class BaseCommand {
    /**
     * Execute the command
     * @param {Object} game - Game instance
     * @param {...any} args - Additional arguments
     * @abstract
     */
    execute(game, ...args) {
        throw new Error('execute method must be implemented');
    }

    /**
     * Get command name
     * @returns {string} Command name
     */
    get name() {
        return this.constructor.name;
    }
}
