interface Logger {
  log(...args: unknown[]): void;
  isDebug(): boolean;
  debug(...args: unknown[]): void;
  info(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
  formatError(error: Error | unknown): string;
  errorWithContext(error: Error | unknown, context?: Record<string, unknown>): void;
}

export const logger: Logger = {
  log(...args: unknown[]): void {
    // Always show general logs

    console.log(...args);
  },

  isDebug(): boolean {
    try {
      if (typeof window !== 'undefined' && (window as Window & { DEBUG?: boolean }).DEBUG) return true;
    } catch (_e: unknown) {
      // Ignore
    }
    try {
      if (typeof process !== 'undefined' && process.env && process.env.DEBUG) return true;
    } catch (_e: unknown) {
      // Ignore
    }
    return false;
  },

  debug(...args: unknown[]): void {
    const debugMode: boolean = this.isDebug();
    if (debugMode) {

      console.log(...args);
    }
  },

  info(...args: unknown[]): void {

    console.info(...args);
  },

  warn(...args: unknown[]): void {

    console.warn(...args);
  },

  error(...args: unknown[]): void {
    // Enhanced error logging that handles Error objects properly
    const processedArgs = args.map(arg => {
      if (arg instanceof Error) {
        // For Error objects, log both message and stack
        return {
          message: arg.message,
          stack: arg.stack,
          name: arg.name,
          ...arg // Include any additional properties
        };
      }
      return arg;
    });

     
    console.error(...processedArgs);

    // In debug mode, also log stack traces separately for visibility
    const debugMode: boolean = this.isDebug();
    if (debugMode) {
      args.forEach(arg => {
        if (arg instanceof Error && arg.stack) {

          console.error('Stack trace:', arg.stack);
        }
      });
    }
  },

  /**
   * Format an error object for readable logging
   * @param error - The error to format
   * @returns Formatted error message
   */
  formatError(error: Error | unknown): string {
    if (!(error instanceof Error)) {
      return String(error);
    }

    let formatted = `${error.name}: ${error.message}`;

    const debugMode: boolean = this.isDebug();
    if (debugMode && error.stack) {
      formatted += '\n' + error.stack;
    }

    return formatted;
  },

  /**
   * Log an error with context information
   * @param error - The error to log
   * @param context - Additional context (component, action, etc.)
   */
  errorWithContext(error: Error | unknown, context: Record<string, unknown> = {}): void {
    const contextStr: string = Object.entries(context)
      .map(([key, value]) => `${key}=${value}`)
      .join(', ');

    if (contextStr) {
      this.error(`[${contextStr}]`, error);
    } else {
      this.error(error);
    }
  }
};
