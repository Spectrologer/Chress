# ESLint Rule: enforce-event-types

## Overview

This custom ESLint rule enforces the use of `EventTypes` constants instead of string literals when calling `eventBus` methods (`emit`, `on`, `once`, `off`).

## Motivation

String-based event types are prone to typos and make refactoring difficult. By enforcing the use of constants from `EventTypes`, we gain:

- **Type safety**: IDE autocomplete helps prevent typos
- **Refactoring safety**: Renaming events updates all usages
- **Documentation**: All available events are listed in one place
- **Consistency**: Uniform event naming across the codebase

## Rule Details

### ❌ Examples of **incorrect** code:

```javascript
// String literals are not allowed
eventBus.emit('player:moved', { x: 10, y: 20 });
eventBus.on('enemy:defeated', handleEnemyDefeat);
eventBus.once('zone:changed', handleZoneChange);
eventBus.off('combat:started', handleCombatStart);

// Unknown events will also fail
eventBus.emit('unknown:event', {});
```

### ✅ Examples of **correct** code:

```javascript
import { EventTypes } from './core/EventTypes.js';

// Use EventTypes constants
eventBus.emit(EventTypes.PLAYER_MOVED, { x: 10, y: 20 });
eventBus.on(EventTypes.ENEMY_DEFEATED, handleEnemyDefeat);
eventBus.once(EventTypes.ZONE_CHANGED, handleZoneChange);
eventBus.off(EventTypes.COMBAT_STARTED, handleCombatStart);
```

## Error Messages

The rule provides helpful error messages:

1. **Known event with constant available**:
   ```
   Use EventTypes.PLAYER_MOVED instead of string literal 'player:moved' in eventBus.emit()
   ```

2. **Unknown event**:
   ```
   Unknown event 'my:event' in eventBus.emit(). Add it to EventTypes or use a constant
   ```

## Configuration

The rule is configured in `eslint.config.js`:

```javascript
rules: {
  'custom-rules/enforce-event-types': 'error'
}
```

You can change it to `'warn'` if you prefer warnings instead of errors.

## Adding New Events

When adding a new event type:

1. **Add to `core/EventTypes.js`**:
   ```javascript
   export const EventTypes = {
     // ... existing events
     MY_NEW_EVENT: 'my:new:event',
   };
   ```

2. **Update the ESLint rule** at `eslint-rules/enforce-event-types.js`:
   ```javascript
   const eventNameToConstant = {
     // ... existing mappings
     'my:new:event': 'MY_NEW_EVENT',
   };
   ```

3. **Use the new event**:
   ```javascript
   eventBus.emit(EventTypes.MY_NEW_EVENT, data);
   ```

## Running the Linter

```bash
# Check all files
npm run lint

# Auto-fix issues (this rule doesn't support auto-fix yet)
npm run lint:fix
```

## Exceptions

The rule automatically skips checking:
- The `core/EventBus.js` file (implementation details)
- Files in `node_modules/`
- Files in `.git/`
- Temporary test files (`temp_*.js`, `temp_*.cjs`)

## Benefits in Practice

### Before (String-based):
```javascript
// File A
eventBus.emit('player:moved', data);

// File B - Typo! Will silently fail
eventBus.on('player:move', handler);
```

### After (EventTypes constants):
```javascript
// File A
eventBus.emit(EventTypes.PLAYER_MOVED, data);

// File B - Typo caught by IDE/ESLint
eventBus.on(EventTypes.PLAYER_MOVE, handler);
//                    ^^^^^^^^^^ - Error: Property doesn't exist
```

## Future Enhancements

Potential improvements to this rule:

1. **Auto-fix**: Automatically replace string literals with EventTypes constants
2. **TypeScript support**: Generate TypeScript types from EventTypes
3. **Event payload validation**: Validate event data shapes match expected types
4. **Unused event detection**: Flag EventTypes constants that are never used
5. **Event flow analysis**: Track emit → on relationships to find orphaned listeners

## Maintenance

When the EventTypes mapping gets out of sync with `core/EventTypes.js`, you'll see errors for new events. Simply update both files to keep them in sync.

## Related Files

- `core/EventTypes.js` - Event type constants and JSDoc type definitions
- `eslint.config.js` - ESLint configuration
- `eslint-rules/enforce-event-types.js` - The custom rule implementation
- `core/EventBus.js` - Event bus implementation
