# Error Handling Guidelines

This document describes the error handling strategy for the Chress codebase.

## Overview

The codebase uses a centralized error handling system with three main components:

1. **ErrorHandler** (`core/ErrorHandler.js`) - Centralized error management
2. **GlobalErrorHandler** (`core/GlobalErrorHandler.js`) - Global error boundaries
3. **Enhanced Logger** (`core/logger.js`) - Improved error logging

## Error Severity Levels

Use appropriate severity levels when handling errors:

```javascript
import { errorHandler, ErrorSeverity } from '../core/ErrorHandler.js';

// CRITICAL - Game cannot continue
errorHandler.handle(error, ErrorSeverity.CRITICAL, { ... });

// ERROR - Feature is broken but game can continue
errorHandler.handle(error, ErrorSeverity.ERROR, { ... });

// WARNING - Non-critical issue, graceful degradation
errorHandler.handle(error, ErrorSeverity.WARNING, { ... });

// INFO - Informational, not an actual error
errorHandler.handle(error, ErrorSeverity.INFO, { ... });
```

## When to Use Each Severity

### CRITICAL
- Asset loading failures that prevent game rendering
- Critical game state corruption
- Fatal initialization errors
- Anything that makes the game unplayable

### ERROR
- Failed game logic (combat, movement, inventory)
- UI component failures
- State management errors
- Failed event emissions

### WARNING
- Optional feature failures (animations, sounds)
- Pointer capture failures
- Audio context resume failures
- Non-essential UI updates

### INFO
- Successful recovery from errors
- Feature availability changes
- State transitions

## Usage Patterns

### Basic Error Handling

```javascript
try {
    riskyOperation();
} catch (error) {
    errorHandler.handle(error, ErrorSeverity.ERROR, {
        component: 'ComponentName',
        action: 'what you were trying to do'
    });
}
```

### Wrapping Functions

```javascript
const safeFunction = errorHandler.wrap(riskyFunction, {
    component: 'ComponentName',
    action: 'perform risky action',
    severity: ErrorSeverity.WARNING,
    defaultReturn: null
});
```

### Inline Try

```javascript
const result = errorHandler.try(() => riskyOperation(), {
    component: 'ComponentName',
    action: 'perform operation',
    defaultReturn: fallbackValue
});
```

### Silent Operations (Use Sparingly!)

```javascript
// Only when you really want to suppress errors
const result = errorHandler.try(() => operation(), {
    silent: true,
    defaultReturn: null
});
```

## Context Information

Always provide context when handling errors:

```javascript
errorHandler.handle(error, ErrorSeverity.ERROR, {
    component: 'GestureDetector',  // Which component/file
    action: 'convert screen to grid', // What was being attempted
    x: screenX,  // Any relevant data
    y: screenY
});
```

## Global Error Boundaries

The GlobalErrorHandler catches:
- Uncaught exceptions (`window.onerror`)
- Unhandled promise rejections (`window.onunhandledrejection`)

It automatically:
- Logs errors with full context
- Shows user-friendly messages
- Prevents game crashes
- Tracks error frequency

##Migration from Silent Catches

### Before

```javascript
try {
    dangerousOperation();
} catch (e) {}
```

### After

```javascript
try {
    dangerousOperation();
} catch (e) {
    errorHandler.handle(e, ErrorSeverity.WARNING, {
        component: 'MyComponent',
        action: 'perform dangerous operation'
    });
}
```

## Best Practices

### DO

✅ Always provide component and action context
✅ Use appropriate severity levels
✅ Log errors even in defensive catches
✅ Provide fallback values for non-critical operations
✅ Add comments explaining why errors are caught

### DON'T

❌ Use silent `catch (e) {}` blocks
❌ Swallow errors without logging
❌ Use CRITICAL for non-critical errors
❌ Catch errors just to re-throw them
❌ Include sensitive data in error context

## Error Monitoring

### Listening to Errors

```javascript
const unsubscribe = errorHandler.onError((error, severity, context) => {
    // Send to analytics
    // Update UI
    // Log to external service
});

// Clean up when done
unsubscribe();
```

### Checking Error State

```javascript
if (game.globalErrorHandler) {
    const errorCount = game.globalErrorHandler.errorCount;
    // Take action based on error frequency
}
```

## Common Scenarios

### Pointer/Touch Events

```javascript
try {
    e.target.setPointerCapture?.(e.pointerId);
} catch (err) {
    // Pointer capture may fail in some browsers - non-critical
    errorHandler.handle(err, ErrorSeverity.WARNING, {
        component: 'GestureDetector',
        action: 'setPointerCapture'
    });
}
```

### Audio Operations

```javascript
try {
    soundManager.resumeAudioContext();
} catch (e) {
    // Audio context resume can fail - non-critical
    errorHandler.handle(e, ErrorSeverity.WARNING, {
        component: 'ComponentName',
        action: 'resume audio context'
    });
}
```

### Animation/Visual Effects

```javascript
try {
    player.animations.bowShot = { frames: 20, totalFrames: 20, power: 1.4 };
} catch (e) {
    // Animation failures are non-critical
    errorHandler.handle(e, ErrorSeverity.WARNING, {
        component: 'ActionManager',
        action: 'set bow shot animation'
    });
}
```

### Async/Promise Operations

```javascript
errorHandler.try(() => {
    import('./Module.js')
        .then(m => m.doSomething())
        .catch(err => {
            errorHandler.handle(err, ErrorSeverity.WARNING, {
                component: 'ComponentName',
                action: 'dynamic module import'
            });
        });
}, {
    component: 'ComponentName',
    action: 'import module',
    severity: ErrorSeverity.WARNING
});
```

## Testing Error Handling

### Trigger Test Error

```javascript
if (window.DEBUG) {
    game.globalErrorHandler.triggerTestError('Test error message');
}
```

### Reset Error Count

```javascript
game.globalErrorHandler.resetErrorCount();
```

## Files Updated

The following files have been updated with proper error handling:

### Core Infrastructure (4 files)
- ✅ `core/ErrorHandler.js` - **Created** - Centralized error management with severity levels
- ✅ `core/GlobalErrorHandler.js` - **Created** - Global error boundaries (window.onerror, unhandledrejection)
- ✅ `core/logger.js` - **Enhanced** - Added error object support, stack traces, and context logging
- ✅ `core/ServiceContainer.js` - **Integrated** - Added GlobalErrorHandler to service initialization

### Controllers (2 files)
- ✅ `controllers/GestureDetector.js` - **Updated** - Replaced 7 silent catches with proper error handling
- ✅ `controllers/ZoneTransitionController.js` - **Updated** - Replaced 7 logger.error calls with errorHandler

### Managers (2 files)
- ✅ `managers/ActionManager.js` - **Updated** - Replaced 6 silent catches with proper error handling
- ✅ `managers/CombatManager.js` - **Updated** - Replaced 1 silent catch with proper error handling

### Entities (1 file)
- ✅ `entities/Player.js` - **Updated** - Replaced 2 silent catches with proper error handling

### Utils (1 file)
- ✅ `utils/AudioManager.js` - **Updated** - Replaced 1 silent catch with proper error handling

**Total: 10 files updated with 24+ error handling improvements**

### Files Remaining

The following files still contain silent catch blocks and should be updated using the patterns above:

- `utils/ZoneKeyUtils.js` - 1 silent catch
- `managers/ZoneTransitionManager.js` - 3 silent catches
- `managers/InventoryUI.js` - Multiple catches
- `managers/InteractionManager.js` - Multiple catches
- `managers/RadialPersistence.js` - Multiple catches
- `core/EventBus.js` - Already has good error handling
- And ~15-20 other files

Use this guide to update them with proper error handling. The pattern is consistent across all files.

## Performance Considerations

- Error handling has minimal performance impact in the happy path
- Stack trace extraction only happens when errors occur
- Debug mode provides additional logging (check `logger.isDebug()`)
- Global error handler limits message frequency to avoid spam

## Future Improvements

Consider implementing:
- Error telemetry integration (Sentry, LogRocket, etc.)
- Error recovery strategies
- User-facing error reporting UI
- Error rate limiting per component
- Error aggregation and deduplication
