interface Logger {
  log(...args: any[]): void;
  isDebug(): boolean;
  debug(...args: any[]): void;
  info(...args: any[]): void;
  warn(...args: any[]): void;
  error(...args: any[]): void;
  formatError(error: Error | any): string;
  errorWithContext(error: Error | any, context?: Record<string, any>): void;
}

export const logger: Logger = {
  log(...args: any[]): void {
    // Always show general logs
    // eslint-disable-next-line no-console
    console.log(...args);
  },

  isDebug(): boolean {
    try {
      if (typeof window !== 'undefined' && (window as any).DEBUG) return true;
    } catch (e) {
      // Ignore
    }
    try {
      if (typeof process !== 'undefined' && process.env && process.env.DEBUG) return true;
    } catch (e) {
      // Ignore
    }
    return false;
  },

  debug(...args: any[]): void {
    if (this.isDebug()) {
      // eslint-disable-next-line no-console
      console.log(...args);
    }
  },

  info(...args: any[]): void {
    // eslint-disable-next-line no-console
    console.info(...args);
  },

  warn(...args: any[]): void {
    // eslint-disable-next-line no-console
    console.warn(...args);
  },

  error(...args: any[]): void {
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

    // eslint-disable-next-line no-console
    console.error(...processedArgs);

    // In debug mode, also log stack traces separately for visibility
    if (this.isDebug()) {
      args.forEach(arg => {
        if (arg instanceof Error && arg.stack) {
          // eslint-disable-next-line no-console
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
  formatError(error: Error | any): string {
    if (!(error instanceof Error)) {
      return String(error);
    }

    let formatted = `${error.name}: ${error.message}`;

    if (this.isDebug() && error.stack) {
      formatted += '\n' + error.stack;
    }

    return formatted;
  },

  /**
   * Log an error with context information
   * @param error - The error to log
   * @param context - Additional context (component, action, etc.)
   */
  errorWithContext(error: Error | any, context: Record<string, any> = {}): void {
    const contextStr = Object.entries(context)
      .map(([key, value]) => `${key}=${value}`)
      .join(', ');

    if (contextStr) {
      this.error(`[${contextStr}]`, error);
    } else {
      this.error(error);
    }
  }
};
