import errorHandler, { ErrorSeverity } from '../core/ErrorHandler.ts';

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

export interface MethodCallOptions<T = any> {
  defaultReturn?: T;
  context?: Record<string, any>;
  silent?: boolean;
  logMissing?: boolean;
}

export class MethodChecker {
  /**
   * Safely call a method on an object if it exists and is a function
   *
   * @param obj - The object to call the method on
   * @param methodName - The name of the method to call
   * @param args - Arguments to pass to the method
   * @param options - Additional options
   * @returns The return value of the method, or defaultReturn
   *
   * @example
   * MethodChecker.call(this.game.soundManager, 'playSound', ['click']);
   * MethodChecker.call(this.game.uiManager, 'renderZoneMap');
   */
  static call<T = any>(
    obj: any,
    methodName: string,
    args: any[] = [],
    options: MethodCallOptions<T> = {}
  ): T | undefined {
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
   * @param obj - The object to call the method on
   * @param methodName - The name of the method to call
   * @param args - Arguments to pass to the method
   * @param options - Additional options
   * @returns The return value of the method, or defaultReturn
   *
   * @example
   * await MethodChecker.callAsync(this.game.soundManager, 'resumeAudioContext');
   */
  static async callAsync<T = any>(
    obj: any,
    methodName: string,
    args: any[] = [],
    options: MethodCallOptions<T> = {}
  ): Promise<T | undefined> {
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
   * @param obj - The object to check
   * @param methodName - The name of the method to check
   * @returns True if the method exists and is callable
   *
   * @example
   * if (MethodChecker.exists(this.game.player, 'getCurrentZone')) {
   *     const zone = this.game.player.getCurrentZone();
   * }
   */
  static exists(obj: any, methodName: string): boolean {
    return obj && typeof obj[methodName] === 'function';
  }

  /**
   * Check if a nested path exists on an object
   *
   * @param obj - The object to check
   * @param path - Dot-separated path to check (e.g., 'game.player.stats')
   * @returns True if the path exists
   *
   * @example
   * if (MethodChecker.pathExists(this, 'game.soundManager.playSound')) {
   *     this.game.soundManager.playSound('click');
   * }
   */
  static pathExists(obj: any, path: string): boolean {
    if (!obj) return false;

    const parts = path.split('.');
    let current: any = obj;

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
   * @param obj - The root object
   * @param path - Dot-separated path to the method (e.g., 'game.player.getCurrentZone')
   * @param args - Arguments to pass to the method
   * @param options - Additional options
   * @returns The return value of the method, or defaultReturn
   *
   * @example
   * MethodChecker.callPath(this, 'game.soundManager.playSound', ['click']);
   */
  static callPath<T = any>(
    obj: any,
    path: string,
    args: any[] = [],
    options: MethodCallOptions<T> = {}
  ): T | undefined {
    if (!obj) return options.defaultReturn;

    const parts = path.split('.');
    let current: any = obj;

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
   * @param obj - The object to wrap
   * @param options - Options for all method calls
   * @returns A proxy that safely calls methods
   *
   * @example
   * const safeSoundManager = MethodChecker.wrap(this.game.soundManager);
   * safeSoundManager.playSound('click'); // Won't throw if playSound doesn't exist
   */
  static wrap<T extends object = any>(
    obj: T | null | undefined,
    options: MethodCallOptions = {}
  ): T {
    return new Proxy((obj || {}) as T, {
      get(target: any, prop: string | symbol) {
        const value = target[prop];

        if (typeof value === 'function') {
          return (...args: any[]) => MethodChecker.call(target, prop as string, args, options);
        }

        return value;
      }
    });
  }
}

// Export singleton for convenience
export default MethodChecker;
