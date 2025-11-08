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
 * @param service - The service object to call the method on
 * @param methodName - The name of the method to call
 * @param args - Arguments to pass to the method
 * @returns The return value of the method, or undefined if the service/method doesn't exist
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
export function safeCall<T = unknown>(
    service: Record<string, unknown> | object | null | undefined,
    methodName: string,
    ...args: unknown[]
): T | undefined {
    if (!service) {
        return undefined;
    }

    const svc = service as Record<string, unknown>;
    if (typeof svc[methodName] !== 'function') {
        return undefined;
    }

    return (svc[methodName] as (...args: unknown[]) => T)(...args);
}

/**
 * Safely calls an async method on a service object with defensive checks.
 * Returns a promise that resolves to undefined if the service or method doesn't exist.
 *
 * @param service - The service object to call the method on
 * @param methodName - The name of the async method to call
 * @param args - Arguments to pass to the method
 * @returns Promise that resolves to the return value, or undefined if service/method doesn't exist
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
export async function safeCallAsync<T = unknown>(
    service: Record<string, unknown> | object | null | undefined,
    methodName: string,
    ...args: unknown[]
): Promise<T | undefined> {
    if (!service) {
        return undefined;
    }

    const svc = service as Record<string, unknown>;
    if (typeof svc[methodName] !== 'function') {
        return undefined;
    }

    return await (svc[methodName] as (...args: unknown[]) => Promise<T>)(...args);
}

/**
 * Safely gets a property value with nested path support.
 *
 * @param obj - The object to get the property from
 * @param path - Dot-separated property path (e.g., 'player.stats.musicEnabled')
 * @param defaultValue - Default value to return if property doesn't exist
 * @returns The property value or defaultValue
 *
 * @example
 * // Instead of:
 * const musicEnabled = this.game.player && this.game.player.stats && this.game.player.stats.musicEnabled;
 *
 * // Use:
 * const musicEnabled = safeGet(this.game, 'player.stats.musicEnabled', false);
 */
export function safeGet<T = unknown>(
    obj: Record<string, unknown> | object | null | undefined,
    path: string,
    defaultValue?: T
): T | undefined {
    if (!obj) {
        return defaultValue;
    }

    const keys = path.split('.');
    let current: unknown = obj;

    for (const key of keys) {
        if (current == null || typeof current !== 'object') {
            return defaultValue;
        }
        current = (current as Record<string, unknown>)[key];
    }

    return current !== undefined ? (current as T) : defaultValue;
}

/**
 * Checks if a service has a specific method.
 *
 * @param service - The service object to check
 * @param methodName - The name of the method to check for
 * @returns True if the service has the method
 *
 * @example
 * if (hasMethod(this.game.soundManager, 'playSound')) {
 *     // Service has the method
 * }
 */
export function hasMethod(service: Record<string, unknown> | object | null | undefined, methodName: string): boolean {
    if (!service) return false;
    const svc = service as Record<string, unknown>;
    return !!(svc && typeof svc[methodName] === 'function');
}
