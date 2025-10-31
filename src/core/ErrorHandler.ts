import { logger } from './logger.js';

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
} as const;

export type ErrorSeverityValue = typeof ErrorSeverity[keyof typeof ErrorSeverity];

export interface ErrorContext extends Record<string, any> {
    component?: string;
    action?: string;
    timestamp?: string;
    severity?: ErrorSeverityValue;
    message?: string;
    stack?: string;
}

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
    private errorListeners: Array<(error: Error, severity: ErrorSeverityValue, context: ErrorContext) => void> = [];
    private isDevelopment: boolean;

    constructor() {
        this.isDevelopment = this._checkDevelopmentMode();
    }

    /**
     * Check if we're in development mode
     */
    private _checkDevelopmentMode(): boolean {
        try {
            if (typeof window !== 'undefined' && (window as any).DEBUG) return true;
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
     * @param listener - Called with (error, severity, context)
     * @returns Unsubscribe function
     */
    onError(listener: (error: Error, severity: ErrorSeverityValue, context: ErrorContext) => void): () => void {
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
    private _notifyListeners(error: Error, severity: ErrorSeverityValue, context: ErrorContext): void {
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
     * @param error - The error to handle
     * @param severity - Severity level
     * @param context - Additional context (component, action, etc.)
     * @returns void
     */
    handle(error: Error | string | unknown, severity: ErrorSeverityValue = ErrorSeverity.ERROR, context: ErrorContext = {}): void {
        // Normalize error to Error object
        const errorObj = error instanceof Error ? error : new Error(String(error));

        // Build error context
        const errorContext: ErrorContext = {
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
    private _logError(error: Error, severity: ErrorSeverityValue, context: ErrorContext): void {
        const logMessage = this._formatLogMessage(error, context);

        switch (severity) {
            case ErrorSeverity.CRITICAL:
            case ErrorSeverity.ERROR:
                logger.error(logMessage, error);
                break;
            case ErrorSeverity.WARNING:
                logger.warn(logMessage);
                break;
            case ErrorSeverity.INFO:
                logger.info(logMessage);
                break;
            default:
                logger.error(logMessage, error);
        }
    }

    /**
     * Format a log message from error and context
     */
    private _formatLogMessage(error: Error, context: ErrorContext): string {
        const parts: string[] = [];

        if (context.component) {
            parts.push(`[${context.component}]`);
        }

        if (context.action) {
            parts.push(context.action);
        }

        parts.push(error.message);

        return parts.join(' ');
    }

    /**
     * Shorthand for warning-level errors
     */
    warn(message: string, context: ErrorContext = {}): void {
        this.handle(message, ErrorSeverity.WARNING, context);
    }

    /**
     * Shorthand for info-level messages
     */
    info(message: string, context: ErrorContext = {}): void {
        this.handle(message, ErrorSeverity.INFO, context);
    }

    /**
     * Shorthand for critical errors
     */
    critical(error: Error | string, context: ErrorContext = {}): void {
        this.handle(error, ErrorSeverity.CRITICAL, context);
    }
}

// Export singleton instance
const errorHandler = new ErrorHandler();

// Export both as default and named export for backward compatibility
export { errorHandler };
export default errorHandler;
