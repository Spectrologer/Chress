import logger from './logger.js';

/**
 * Error severity levels
 */
export const ErrorSeverity = {
    /** Critical errors that prevent the game from functioning */
    CRITICAL: 'critical',
    /** Errors that break features but allow the game to continue */
    ERROR: 'error',
    /** Warnings about potential issues */
    WARNING: 'warning',
    /** Informational messages for debugging */
    INFO: 'info'
};

/**
 * ErrorHandler - Centralized error handling and logging
 *
 * Provides:
 * - Consistent error logging with severity levels
 * - Stack trace preservation
 * - User-friendly error messages
 * - Optional error telemetry hooks
 * - Development vs production mode handling
 */
export class ErrorHandler {
    constructor() {
        this.errorListeners = [];
        this.isDevelopment = this._checkDevelopmentMode();
    }

    /**
     * Check if we're in development mode
     */
    _checkDevelopmentMode() {
        try {
            if (typeof window !== 'undefined' && window.DEBUG) return true;
            if (typeof process !== 'undefined' && process.env?.DEBUG) return true;
        } catch (e) {
            // Ignore
        }
        return false;
    }

    /**
     * Register a listener for error events
     * Useful for UI components that want to display errors
     *
     * @param {Function} listener - Called with (error, severity, context)
     * @returns {Function} Unsubscribe function
     */
    onError(listener) {
        this.errorListeners.push(listener);
        return () => {
            const index = this.errorListeners.indexOf(listener);
            if (index > -1) {
                this.errorListeners.splice(index, 1);
            }
        };
    }

    /**
     * Notify all error listeners
     */
    _notifyListeners(error, severity, context) {
        this.errorListeners.forEach(listener => {
            try {
                listener(error, severity, context);
            } catch (e) {
                // Don't let listener errors break error handling
                console.error('[ErrorHandler] Error in error listener:', e);
            }
        });
    }

    /**
     * Handle an error with proper logging and notification
     *
     * @param {Error|string} error - The error to handle
     * @param {ErrorSeverity} severity - Severity level
     * @param {Object} context - Additional context (component, action, etc.)
     * @returns {void}
     */
    handle(error, severity = ErrorSeverity.ERROR, context = {}) {
        // Normalize error to Error object
        const errorObj = error instanceof Error ? error : new Error(String(error));

        // Build error context
        const errorContext = {
            timestamp: new Date().toISOString(),
            severity,
            message: errorObj.message,
            stack: errorObj.stack,
            ...context
        };

        // Log based on severity
        this._logError(errorObj, severity, errorContext);

        // Notify listeners (for UI display, telemetry, etc.)
        this._notifyListeners(errorObj, severity, errorContext);

        // In development, also log to console for debugging
        if (this.isDevelopment && severity === ErrorSeverity.CRITICAL) {
            console.error('[ErrorHandler] CRITICAL ERROR:', errorObj);
            console.error('Context:', errorContext);
        }
    }

    /**
     * Log error using appropriate logger method
     */
    _logError(error, severity, context) {
        const logMessage = this._formatLogMessage(error, context);

        switch (severity) {
            case ErrorSeverity.CRITICAL:
            case ErrorSeverity.ERROR:
                logger.error(logMessage, error);
                break;
            case ErrorSeverity.WARNING:
                logger.warn(logMessage, error);
                break;
            case ErrorSeverity.INFO:
                logger.info(logMessage);
                break;
            default:
                logger.error(logMessage, error);
        }
    }

    /**
     * Format error message for logging
     */
    _formatLogMessage(error, context) {
        const parts = ['[ErrorHandler]'];

        if (context.component) {
            parts.push(`[${context.component}]`);
        }

        if (context.action) {
            parts.push(`During: ${context.action}`);
        }

        parts.push(error.message);

        return parts.join(' ');
    }

    /**
     * Wrap a function with error handling
     * Returns a new function that catches errors and handles them
     *
     * @param {Function} fn - Function to wrap
     * @param {Object} options - Options for error handling
     * @returns {Function} Wrapped function
     */
    wrap(fn, options = {}) {
        const {
            component = 'Unknown',
            action = 'Unknown action',
            severity = ErrorSeverity.ERROR,
            rethrow = false,
            defaultReturn = undefined
        } = options;

        return (...args) => {
            try {
                const result = fn(...args);

                // Handle async functions
                if (result instanceof Promise) {
                    return result.catch(error => {
                        this.handle(error, severity, { component, action });
                        if (rethrow) throw error;
                        return defaultReturn;
                    });
                }

                return result;
            } catch (error) {
                this.handle(error, severity, { component, action });
                if (rethrow) throw error;
                return defaultReturn;
            }
        };
    }

    /**
     * Try to execute a function with error handling
     * Useful for inline error handling without wrapping
     *
     * @param {Function} fn - Function to execute
     * @param {Object} options - Options for error handling
     * @returns {*} Function result or defaultReturn on error
     */
    try(fn, options = {}) {
        const {
            component = 'Unknown',
            action = 'Unknown action',
            severity = ErrorSeverity.ERROR,
            defaultReturn = undefined,
            silent = false
        } = options;

        try {
            return fn();
        } catch (error) {
            if (!silent) {
                this.handle(error, severity, { component, action });
            }
            return defaultReturn;
        }
    }

    /**
     * Assert a condition and throw/handle if false
     * Useful for validation
     *
     * @param {boolean} condition - Condition to check
     * @param {string} message - Error message if condition is false
     * @param {Object} context - Additional context
     */
    assert(condition, message, context = {}) {
        if (!condition) {
            const error = new Error(message);
            this.handle(error, ErrorSeverity.ERROR, context);
            throw error;
        }
    }

    /**
     * Log a warning (non-error issue)
     *
     * @param {string} message - Warning message
     * @param {Object} context - Additional context
     */
    warn(message, context = {}) {
        this.handle(new Error(message), ErrorSeverity.WARNING, context);
    }

    /**
     * Log info (for tracking non-error events)
     *
     * @param {string} message - Info message
     * @param {Object} context - Additional context
     */
    info(message, context = {}) {
        this.handle(new Error(message), ErrorSeverity.INFO, context);
    }
}

// Create and export singleton instance
export const errorHandler = new ErrorHandler();

// Export as default for convenience
export default errorHandler;
