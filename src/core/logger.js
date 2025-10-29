export const logger = {
    log(...args) {
        // Always show general logs
        // eslint-disable-next-line no-console
        console.log(...args);
    },
    isDebug() {
        try {
            if (typeof window !== 'undefined' && window.DEBUG) return true;
        } catch (e) {}
        try {
            if (typeof process !== 'undefined' && process.env && process.env.DEBUG) return true;
        } catch (e) {}
        return false;
    },
    debug(...args) {
        if (this.isDebug()) {
            // eslint-disable-next-line no-console
            console.log(...args);
        }
    },
    info(...args) {
        // eslint-disable-next-line no-console
        console.info(...args);
    },
    warn(...args) {
        // eslint-disable-next-line no-console
        console.warn(...args);
    },
    error(...args) {
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
     * @param {Error} error - The error to format
     * @returns {string} Formatted error message
     */
    formatError(error) {
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
     * @param {Error} error - The error to log
     * @param {Object} context - Additional context (component, action, etc.)
     */
    errorWithContext(error, context = {}) {
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
