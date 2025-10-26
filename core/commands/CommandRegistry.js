/**
 * CommandRegistry - Central registry for console commands
 *
 * Manages registration, retrieval, and execution of commands.
 * Replaces the god object pattern with a flexible registry pattern.
 */
export class CommandRegistry {
    constructor() {
        this.commands = new Map();
        this.hotkeyMap = new Map();
    }

    /**
     * Register a command
     * @param {string} name - Command name
     * @param {Object} command - Command object with execute method
     */
    register(name, command) {
        if (!command || typeof command.execute !== 'function') {
            throw new Error(`Command ${name} must have an execute method`);
        }
        this.commands.set(name, command);
    }

    /**
     * Register multiple commands at once
     * @param {Object} commands - Object with command name -> command object pairs
     */
    registerBatch(commands) {
        for (const [name, command] of Object.entries(commands)) {
            this.register(name, command);
        }
    }

    /**
     * Get a command by name
     * @param {string} name - Command name
     * @returns {Object|undefined} Command object or undefined
     */
    get(name) {
        return this.commands.get(name);
    }

    /**
     * Execute a command by name
     * @param {string} name - Command name
     * @param {Object} game - Game instance
     * @param {...any} args - Additional arguments
     * @returns {any} Command execution result
     */
    execute(name, game, ...args) {
        const command = this.get(name);
        if (!command) {
            throw new Error(`Command ${name} not found`);
        }
        return command.execute(game, ...args);
    }

    /**
     * Register a hotkey mapping
     * @param {string} key - Key identifier (lowercase)
     * @param {string} commandName - Command name to execute
     * @param {Object} options - Additional options (shiftKey, etc)
     */
    registerHotkey(key, commandName, options = {}) {
        const hotkeyId = this._getHotkeyId(key, options.shiftKey);
        this.hotkeyMap.set(hotkeyId, commandName);
    }

    /**
     * Get command name for a hotkey
     * @param {string} key - Key identifier
     * @param {boolean} shiftKey - Whether shift is pressed
     * @returns {string|undefined} Command name or undefined
     */
    getHotkeyCommand(key, shiftKey = false) {
        const hotkeyId = this._getHotkeyId(key.toLowerCase(), shiftKey);
        return this.hotkeyMap.get(hotkeyId);
    }

    /**
     * Handle hotkey execution
     * @param {Object} game - Game instance
     * @param {string} key - Key identifier
     * @param {boolean} shiftKey - Whether shift is pressed
     * @returns {boolean} Whether hotkey was handled
     */
    handleHotkey(game, key, shiftKey = false) {
        const commandName = this.getHotkeyCommand(key, shiftKey);
        if (!commandName) {
            return false;
        }

        try {
            this.execute(commandName, game);
            return true;
        } catch (error) {
            console.error(`Error executing hotkey command ${commandName}:`, error);
            return false;
        }
    }

    /**
     * Get hotkey ID for lookup
     * @private
     */
    _getHotkeyId(key, shiftKey) {
        return shiftKey ? `shift+${key}` : key;
    }

    /**
     * Get all registered command names
     * @returns {string[]} Array of command names
     */
    getCommandNames() {
        return Array.from(this.commands.keys());
    }

    /**
     * Check if a command exists
     * @param {string} name - Command name
     * @returns {boolean} Whether command exists
     */
    has(name) {
        return this.commands.has(name);
    }
}
