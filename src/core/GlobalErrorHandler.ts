import { errorHandler, ErrorSeverity } from './ErrorHandler.js';
import { logger } from './logger.js';

interface ErrorContext {
  source?: string;
  lineno?: number;
  colno?: number;
  type?: string;
  promise?: Promise<any>;
  errorCount?: number;
  [key: string]: any;
}

interface GameInstance {
  showOverlayMessage?(message: string, duration: number): void;
  overlayManager?: {
    showMessage?(message: string, duration: number): void;
  };
  [key: string]: any;
}

/**
 * GlobalErrorHandler - Sets up global error boundaries
 *
 * Catches:
 * - Uncaught exceptions (window.onerror)
 * - Unhandled promise rejections (window.onunhandledrejection)
 *
 * Prevents the game from completely crashing and provides user feedback
 */
export class GlobalErrorHandler {
  private game: GameInstance;
  private isInitialized: boolean;
  private errorCount: number;
  private maxErrorsBeforeAlert: number;

  constructor(game: GameInstance) {
    this.game = game;
    this.isInitialized = false;
    this.errorCount = 0;
    this.maxErrorsBeforeAlert = 5;
  }

  /**
   * Initialize global error handlers
   * Should be called once during game initialization
   */
  initialize(): void {
    if (this.isInitialized) {
      logger.warn('[GlobalErrorHandler] Already initialized, skipping');
      return;
    }

    this.setupWindowErrorHandler();
    this.setupUnhandledRejectionHandler();

    this.isInitialized = true;
  }

  /**
   * Set up window.onerror for uncaught exceptions
   */
  setupWindowErrorHandler(): void {
    const previousHandler = window.onerror;

    window.onerror = (message, source, lineno, colno, error) => {
      // Call previous handler if it exists
      if (typeof previousHandler === 'function') {
        previousHandler(message, source, lineno, colno, error);
      }

      // Extract actual error object
      // Sometimes browsers pass ErrorEvent instead of Error
      let actualError: Error = error as Error;
      if (!actualError || typeof actualError !== 'object' || !actualError.message) {
        // If error is not a proper Error object, create one from the message
        actualError = new Error(String(message));
      } else if (actualError instanceof ErrorEvent) {
        // If it's an ErrorEvent, extract the error property
        actualError = (actualError as any).error || new Error((actualError as any).message || String(message));
      }

      // Handle the error
      this.handleUncaughtError(actualError, {
        source,
        lineno,
        colno,
        type: 'uncaught_exception'
      });

      // Return true to prevent default browser error handling
      return true;
    };
  }

  /**
   * Set up window.onunhandledrejection for unhandled promise rejections
   */
  setupUnhandledRejectionHandler(): void {
    const previousHandler = window.onunhandledrejection;

    window.onunhandledrejection = (event: PromiseRejectionEvent) => {
      // Call previous handler if it exists
      if (typeof previousHandler === 'function') {
        previousHandler.call(window, event);
      }

      // Handle the error
      const error = event.reason instanceof Error
        ? event.reason
        : new Error(String(event.reason));

      this.handleUncaughtError(error, {
        type: 'unhandled_rejection',
        promise: event.promise
      });

      // Prevent default browser handling
      event.preventDefault();
    };
  }

  /**
   * Handle an uncaught error
   */
  handleUncaughtError(error: Error, context: ErrorContext = {}): void {
    this.errorCount++;

    // Log critical error
    errorHandler.handle(error, ErrorSeverity.CRITICAL, {
      component: 'GlobalErrorHandler',
      action: 'Uncaught error',
      ...context,
      errorCount: this.errorCount
    });

    // Show user-friendly message if we have a game instance
    if (this.game && this.game.showOverlayMessage) {
      const userMessage = this.getUserFriendlyMessage(error, context);
      this.showErrorToUser(userMessage);
    }

    // If too many errors, show a more serious message
    if (this.errorCount >= this.maxErrorsBeforeAlert) {
      this.showCriticalErrorMessage();
      this.errorCount = 0; // Reset to avoid spam
    }
  }

  /**
   * Convert technical error to user-friendly message
   */
  getUserFriendlyMessage(error: Error, context: ErrorContext): string {
    // Check for common error patterns
    const message = error.message || String(error);

    // Network/loading errors
    if (message.includes('fetch') || message.includes('load') || message.includes('network')) {
      return 'Failed to load game resources. Please check your internet connection.';
    }

    // Storage errors
    if (message.includes('storage') || message.includes('quota')) {
      return 'Browser storage is full. Try clearing some space or refreshing the page.';
    }

    // Audio errors
    if (message.includes('audio') || message.includes('sound')) {
      return 'Audio error occurred. The game will continue without sound.';
    }

    // Zone/rendering errors
    if (message.includes('zone') || message.includes('render')) {
      return 'Rendering error occurred. The game may not display correctly.';
    }

    // Generic error
    return 'An unexpected error occurred. The game will attempt to continue.';
  }

  /**
   * Show error message to user
   */
  showErrorToUser(message: string): void {
    try {
      // Try to use game's overlay system
      if (this.game.showOverlayMessage) {
        this.game.showOverlayMessage(message, 5000);
      } else if (this.game.overlayManager?.showMessage) {
        this.game.overlayManager.showMessage(message, 5000);
      } else {
        // Fallback to alert (not ideal but better than nothing)
        console.error('[GlobalErrorHandler] Could not show overlay, error was:', message);
      }
    } catch (e) {
      // Even error display failed - just log it
      logger.error('[GlobalErrorHandler] Failed to show error to user:', e);
    }
  }

  /**
   * Show critical error message when too many errors occur
   */
  showCriticalErrorMessage(): void {
    const message = 'Multiple errors detected. Consider refreshing the page.';

    try {
      if (this.game.showOverlayMessage) {
        this.game.showOverlayMessage(message, 8000);
      } else if (confirm(message + '\n\nRefresh now?')) {
        window.location.reload();
      }
    } catch (e) {
      logger.error('[GlobalErrorHandler] Failed to show critical error:', e);
    }
  }

  /**
   * Manually trigger error handling (for testing)
   */
  triggerTestError(message: string = 'Test error'): never {
    throw new Error(message);
  }

  /**
   * Reset error count (useful after recovery)
   */
  resetErrorCount(): void {
    this.errorCount = 0;
  }

  /**
   * Clean up error handlers (for testing/cleanup)
   */
  destroy(): void {
    window.onerror = null;
    window.onunhandledrejection = null;
    this.isInitialized = false;
    logger.info('[GlobalErrorHandler] Error handlers removed');
  }
}
