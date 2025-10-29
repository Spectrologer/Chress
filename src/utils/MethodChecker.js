import errorHandler, { ErrorSeverity } from '../core/ErrorHandler.js';

/**
 * MethodChecker - Utility for safely calling methods with defensive checks
 *
 * Replaces the repetitive pattern of:
 * if (obj && typeof obj.method === 'function') {
 *     obj.method();
 * }
 *
 * With cleaner patterns like:
 * MethodChecker.call(obj, 'method');
 */
export class MethodChecker {
    /**
     * Safely call a method on an object if it exists and is a function
     *
     * @param {Object} obj - The object to call the method on
     * @param {string} methodName - The name of the method to call
     * @param {Array} args - Arguments to pass to the method
     * @param {Object} options - Additional options
     * @returns {*} The return value of the method, or defaultReturn
     *
     * @example
     * MethodChecker.call(this.game.soundManager, 'playSound', ['click']);
     * MethodChecker.call(this.game.uiManager, 'renderZoneMap');
     */
    static call(obj, methodName, args = [], options = {}) {
        const {
            defaultReturn = undefined,
            context = {},
            silent = true,
            logMissing = false
        } = options;

        // Check if object exists
        if (!obj) {
            if (logMissing && !silent) {
                errorHandler.warn(`Object is null/undefined when calling ${methodName}`, {
                    component: context.component || 'MethodChecker',
                    action: context.action || `call ${methodName}`
                });
            }
            return defaultReturn;
        }

        // Check if method exists and is a function
        if (typeof obj[methodName] !== 'function') {
            if (logMissing && !silent) {
                errorHandler.warn(`Method ${methodName} is not a function`, {
                    component: context.component || 'MethodChecker',
                    action: context.action || `call ${methodName}`
                });
            }
            return defaultReturn;
        }

        // Try to call the method
        try {
            return obj[methodName](...args);
        } catch (error) {
            if (!silent) {
                errorHandler.handle(error, ErrorSeverity.ERROR, {
                    component: context.component || 'MethodChecker',
                    action: context.action || `calling ${methodName}`,
                    methodName,
                    ...context
                });
            }
            return defaultReturn;
        }
    }

    /**
     * Safely call an async method on an object if it exists and is a function
     *
     * @param {Object} obj - The object to call the method on
     * @param {string} methodName - The name of the method to call
     * @param {Array} args - Arguments to pass to the method
     * @param {Object} options - Additional options
     * @returns {Promise<*>} The return value of the method, or defaultReturn
     *
     * @example
     * await MethodChecker.callAsync(this.game.soundManager, 'resumeAudioContext');
     */
    static async callAsync(obj, methodName, args = [], options = {}) {
        const {
            defaultReturn = undefined,
            context = {},
            silent = true,
            logMissing = false
        } = options;

        // Check if object exists
        if (!obj) {
            if (logMissing && !silent) {
                errorHandler.warn(`Object is null/undefined when calling ${methodName}`, {
                    component: context.component || 'MethodChecker',
                    action: context.action || `call ${methodName}`
                });
            }
            return defaultReturn;
        }

        // Check if method exists and is a function
        if (typeof obj[methodName] !== 'function') {
            if (logMissing && !silent) {
                errorHandler.warn(`Method ${methodName} is not a function`, {
                    component: context.component || 'MethodChecker',
                    action: context.action || `call ${methodName}`
                });
            }
            return defaultReturn;
        }

        // Try to call the method
        try {
            return await obj[methodName](...args);
        } catch (error) {
            if (!silent) {
                errorHandler.handle(error, ErrorSeverity.ERROR, {
                    component: context.component || 'MethodChecker',
                    action: context.action || `calling ${methodName}`,
                    methodName,
                    ...context
                });
            }
            return defaultReturn;
        }
    }

    /**
     * Check if a method exists and is callable on an object
     *
     * @param {Object} obj - The object to check
     * @param {string} methodName - The name of the method to check
     * @returns {boolean} True if the method exists and is callable
     *
     * @example
     * if (MethodChecker.exists(this.game.player, 'getCurrentZone')) {
     *     const zone = this.game.player.getCurrentZone();
     * }
     */
    static exists(obj, methodName) {
        return obj && typeof obj[methodName] === 'function';
    }

    /**
     * Check if a nested path exists on an object
     *
     * @param {Object} obj - The object to check
     * @param {string} path - Dot-separated path to check (e.g., 'game.player.stats')
     * @returns {boolean} True if the path exists
     *
     * @example
     * if (MethodChecker.pathExists(this, 'game.soundManager.playSound')) {
     *     this.game.soundManager.playSound('click');
     * }
     */
    static pathExists(obj, path) {
        if (!obj) return false;

        const parts = path.split('.');
        let current = obj;

        for (let i = 0; i < parts.length - 1; i++) {
            if (!current || typeof current !== 'object') {
                return false;
            }
            current = current[parts[i]];
        }

        const lastPart = parts[parts.length - 1];
        return current && typeof current[lastPart] === 'function';
    }

    /**
     * Safely call a method on a nested path
     *
     * @param {Object} obj - The root object
     * @param {string} path - Dot-separated path to the method (e.g., 'game.player.getCurrentZone')
     * @param {Array} args - Arguments to pass to the method
     * @param {Object} options - Additional options
     * @returns {*} The return value of the method, or defaultReturn
     *
     * @example
     * MethodChecker.callPath(this, 'game.soundManager.playSound', ['click']);
     */
    static callPath(obj, path, args = [], options = {}) {
        if (!obj) return options.defaultReturn;

        const parts = path.split('.');
        let current = obj;

        // Navigate to the object containing the method
        for (let i = 0; i < parts.length - 1; i++) {
            if (!current || typeof current !== 'object') {
                return options.defaultReturn;
            }
            current = current[parts[i]];
        }

        const methodName = parts[parts.length - 1];
        return MethodChecker.call(current, methodName, args, options);
    }

    /**
     * Create a safe wrapper around an object that automatically checks methods
     *
     * @param {Object} obj - The object to wrap
     * @param {Object} options - Options for all method calls
     * @returns {Proxy} A proxy that safely calls methods
     *
     * @example
     * const safeSoundManager = MethodChecker.wrap(this.game.soundManager);
     * safeSoundManager.playSound('click'); // Won't throw if playSound doesn't exist
     */
    static wrap(obj, options = {}) {
        return new Proxy(obj || {}, {
            get(target, prop) {
                const value = target[prop];

                if (typeof value === 'function') {
                    return (...args) => MethodChecker.call(target, prop, args, options);
                }

                return value;
            }
        });
    }
}

// Export singleton for convenience
export default MethodChecker;
