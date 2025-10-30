// @ts-check
/**
 * SafeServiceCall - Utility for safely calling service methods with defensive checks
 *
 * Eliminates repetitive null/undefined checks and typeof validations throughout the codebase.
 *
 * @module SafeServiceCall
 */

/**
 * Safely calls a method on a service object with defensive checks.
 * Returns undefined if the service or method doesn't exist.
 *
 * @param {Object|null|undefined} service - The service object to call the method on
 * @param {string} methodName - The name of the method to call
 * @param {...*} args - Arguments to pass to the method
 * @returns {*} The return value of the method, or undefined if the service/method doesn't exist
 *
 * @example
 * // Instead of:
 * if (this.game.gameStateManager && typeof this.game.gameStateManager.startAutoSave === 'function') {
 *     this.game.gameStateManager.startAutoSave();
 * }
 *
 * // Use:
 * safeCall(this.game.gameStateManager, 'startAutoSave');
 *
 * @example
 * // With arguments:
 * safeCall(this.game.soundManager, 'setMusicEnabled', true);
 *
 * @example
 * // With return value:
 * const zone = safeCall(this.game.player, 'getCurrentZone');
 */
export function safeCall(service, methodName, ...args) {
    if (!service) {
        return undefined;
    }

    if (typeof service[methodName] !== 'function') {
        return undefined;
    }

    return service[methodName](...args);
}

/**
 * Safely calls an async method on a service object with defensive checks.
 * Returns a promise that resolves to undefined if the service or method doesn't exist.
 *
 * @param {Object|null|undefined} service - The service object to call the method on
 * @param {string} methodName - The name of the async method to call
 * @param {...*} args - Arguments to pass to the method
 * @returns {Promise<*>} Promise that resolves to the return value, or undefined if service/method doesn't exist
 *
 * @example
 * // Instead of:
 * if (this.game.soundManager && typeof this.game.soundManager.resumeAudioContext === 'function') {
 *     await this.game.soundManager.resumeAudioContext();
 * }
 *
 * // Use:
 * await safeCallAsync(this.game.soundManager, 'resumeAudioContext');
 *
 * @example
 * // With error handling:
 * await safeCallAsync(this.game.soundManager, 'resumeAudioContext')
 *     .catch(err => console.error('Failed to resume audio', err));
 */
export async function safeCallAsync(service, methodName, ...args) {
    if (!service) {
        return undefined;
    }

    if (typeof service[methodName] !== 'function') {
        return undefined;
    }

    return await service[methodName](...args);
}

/**
 * Safely gets a property value with nested path support.
 *
 * @param {Object|null|undefined} obj - The object to get the property from
 * @param {string} path - Dot-separated property path (e.g., 'player.stats.musicEnabled')
 * @param {*} defaultValue - Default value to return if property doesn't exist
 * @returns {*} The property value or defaultValue
 *
 * @example
 * // Instead of:
 * const musicEnabled = this.game.player && this.game.player.stats && this.game.player.stats.musicEnabled;
 *
 * // Use:
 * const musicEnabled = safeGet(this.game, 'player.stats.musicEnabled', false);
 */
export function safeGet(obj, path, defaultValue = undefined) {
    if (!obj) {
        return defaultValue;
    }

    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
        if (current == null || typeof current !== 'object') {
            return defaultValue;
        }
        current = current[key];
    }

    return current !== undefined ? current : defaultValue;
}

/**
 * Checks if a service has a specific method.
 *
 * @param {Object|null|undefined} service - The service object to check
 * @param {string} methodName - The name of the method to check for
 * @returns {boolean} True if the service has the method
 *
 * @example
 * if (hasMethod(this.game.soundManager, 'playSound')) {
 *     // Service has the method
 * }
 */
export function hasMethod(service, methodName) {
    return !!(service && typeof service[methodName] === 'function');
}
