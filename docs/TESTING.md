# Chress RPG - Testing Documentation

## Table of Contents
1. [Test Coverage Status](#test-coverage-status)
2. [Running Tests](#running-tests)
3. [Test Organization](#test-organization)
4. [Writing Tests](#writing-tests)
5. [Coverage Goals](#coverage-goals)
6. [CI/CD Integration](#cicd-integration)

---

## Test Coverage Status

### Current Coverage (as of Phase 1 completion)

**Overall Coverage:**
- **Statements:** 24.09% (3,344/13,879)
- **Branches:** 16.98% (1,414/8,327)
- **Functions:** 24.39% (650/2,664)
- **Lines:** 24.75% (3,221/13,013)

**Test Results:**
- **Test Suites:** 24 passing, 43 failing, 67 total
- **Tests:** 443 passing, 106 failing, 549 total
- **Duration:** ~10 seconds

### Well-Tested Areas ✅

1. **Core Position Class** - 99 tests, ~90%+ coverage
   - [tests/Position.test.js](../tests/Position.test.js)

2. **Grid Utilities** - 35 tests
   - [tests/GridIterator.test.js](../tests/GridIterator.test.js)

3. **Event System** - 24+ tests
   - [tests/EventValidator.test.js](../tests/EventValidator.test.js)
   - [tests/UIEventCoordinator.test.js](../tests/UIEventCoordinator.test.js)

4. **Zone Management** - Multiple test files
   - [tests/ZoneManager.test.js](../tests/ZoneManager.test.js)
   - [tests/ZoneStateManager.test.js](../tests/ZoneStateManager.test.js)
   - [tests/BoardLoader.test.js](../tests/BoardLoader.test.js)

5. **Enemy AI - Freezing Behavior** - 21 tests
   - [tests/EnemyExitFreeze.test.js](../tests/EnemyExitFreeze.test.js)

### Areas Needing Improvement ⚠️

1. **UI Components** - Only ~15% have tests (5/33 components)
2. **Integration Tests** - Minimal coverage
3. **Input System** - Some tests failing due to mock setup issues
4. **Dialogue System** - Tests failing due to async module loading
5. **Content Registry** - Missing config files causing test failures

---

## Running Tests

### Basic Test Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with interactive UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- Position.test.js

# Run tests matching a pattern
npm test -- --grep="Position"
```

### Viewing Coverage Reports

After running `npm run test:coverage`, open the HTML coverage report:

```bash
# Windows
start coverage/index.html

# Mac/Linux
open coverage/index.html
```

---

## Test Organization

### Directory Structure

```
tests/
├── Position.test.js              # Core data structure (99 tests)
├── GridIterator.test.js          # Grid utilities (35 tests)
├── EventValidator.test.js        # Event validation (24 tests)
├── UIEventCoordinator.test.js    # UI events (20 tests)
├── EnemyExitFreeze.test.js       # Enemy freezing (21 tests)
│
├── managers/
│   ├── CombatActionManager.test.js
│   ├── CombatManager.test.js
│   ├── InputManager.test.js
│   ├── InteractionManager.test.js
│   ├── InventoryManager.test.js
│   ├── ZoneManager.test.js
│   └── ...
│
├── ui/
│   ├── InventoryUI.test.js
│   ├── RadialInventory.test.js
│   ├── BarterWindow.test.js
│   ├── ConfigOverlay.test.js
│   └── StartOverlay.test.js
│
├── integration/
│   └── BombShovelIntegration.test.js
│
└── utils/
    ├── DirectionUtils.test.js
    ├── LineOfSightUtils.test.js
    └── ...
```

### Test File Naming Convention

- Unit tests: `[ClassName].test.js`
- Integration tests: `[Feature]Integration.test.js`
- E2E tests (future): `[UserFlow].spec.js`

---

## Writing Tests

### Test Structure

All tests follow this pattern:

```javascript
import { MyClass } from '../src/path/to/MyClass.js';
import { TILE_TYPES } from '../src/core/constants/index.js';

describe('MyClass', () => {
  let instance;
  let mockDependency;

  beforeEach(() => {
    // Setup fresh instance for each test
    mockDependency = { method: vi.fn() };
    instance = new MyClass(mockDependency);
  });

  describe('methodName', () => {
    test('should do expected behavior', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = instance.methodName(input);

      // Assert
      expect(result).toBe('expected');
      expect(mockDependency.method).toHaveBeenCalledWith(input);
    });

    test('should handle edge case', () => {
      expect(() => instance.methodName(null)).toThrow();
    });
  });
});
```

### Mock Patterns

#### Mocking Game Object

```javascript
const mockGame = {
  player: {
    x: 5,
    y: 5,
    getPosition: vi.fn(() => ({ x: 5, y: 5 })),
    move: vi.fn(),
  },
  grid: Array(10).fill().map(() => Array(10).fill(TILE_TYPES.FLOOR)),
  enemies: [],
  uiManager: {
    showMessage: vi.fn(),
    hideMessage: vi.fn(),
  },
  eventBus: {
    on: vi.fn(),
    emit: vi.fn(),
    off: vi.fn(),
  },
};
```

#### Mocking DOM Elements

```javascript
beforeEach(() => {
  // Setup DOM fixture
  document.body.innerHTML = `
    <div id="game-container">
      <div id="inventory"></div>
      <div id="message-log"></div>
    </div>
  `;
});

afterEach(() => {
  // Cleanup
  document.body.innerHTML = '';
});
```

#### Mocking Global Window Object

```javascript
beforeEach(() => {
  global.window = {
    gameInstance: {
      player: mockPlayer,
      startEnemyTurns: vi.fn(),
    },
    soundManager: {
      playSound: vi.fn(),
    },
  };
});
```

### Testing Async Code

```javascript
test('should handle async operations', async () => {
  const result = await myAsyncFunction();
  expect(result).toBeDefined();
});

test('should handle promises', () => {
  return myPromiseFunction().then(result => {
    expect(result).toBe('expected');
  });
});
```

### Testing Event Emission

```javascript
test('should emit event when action occurs', () => {
  const emitSpy = vi.spyOn(eventBus, 'emit');

  instance.performAction();

  expect(emitSpy).toHaveBeenCalledWith(
    EventTypes.ACTION_PERFORMED,
    expect.objectContaining({
      action: 'test',
    })
  );
});
```

---

## Configuration

### Vitest Configuration

Located in [vitest.config.js](../vitest.config.js):

- **Test Environment:** happy-dom (fast DOM implementation)
- **Transform:** Vite's native ESM support (no Babel needed)
- **Module Mapping:** Path aliases (@/, @core/, @managers/, etc.)
- **Coverage Provider:** v8 (faster than istanbul)
- **Coverage Thresholds:**
  - Statements: 30%
  - Branches: 30%
  - Functions: 30%
  - Lines: 30%

### Benefits of Vitest

- **Faster:** Uses Vite's transformation pipeline
- **Better DX:** Hot Module Reloading for tests
- **Native ESM:** No transpilation needed
- **UI Mode:** Run `npm run test:ui` for interactive testing
- **Compatible:** Drop-in replacement for Jest API

---

## Coverage Goals

### Short Term (Next 2-3 months)
- **Overall:** 50% coverage
- **Core Systems:** 80% coverage
- **UI Components:** 50% coverage
- **All existing tests passing:** 100%

### Medium Term (6 months)
- **Overall:** 70% coverage
- **Core Systems:** 90% coverage
- **UI Components:** 70% coverage
- **Integration tests:** 20 test suites
- **E2E tests:** 10 critical flows

### Long Term (1 year)
- **Overall:** 80% coverage
- **Core Systems:** 95% coverage
- **UI Components:** 80% coverage
- **Integration tests:** 50+ scenarios
- **E2E tests:** 30+ user flows

---

## CI/CD Integration

### GitHub Actions (Planned)

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Generate coverage
        run: npm run test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

### Pre-commit Hooks (Planned)

Using Husky:

```bash
npm install --save-dev husky
npx husky init
echo "npm test" > .husky/pre-commit
```

---

## Known Issues

### Failing Tests (106 total)

1. **Input System Tests** - Mock setup issues with InputManager
2. **Dialogue Tests** - Async module loading with top-level await
3. **Content Registry** - Missing `ContentRegistrations.js` file
4. **Controller Tests** - Missing controller files or incorrect paths
5. **Service Container** - DOM element mock issues

### Next Steps to Fix

1. Fix mock setup for InputManager tests
2. Refactor dialogue tests to handle async properly
3. Verify all file paths in test imports
4. Add missing configuration files
5. Improve DOM mocking for UI-heavy tests

---

## Best Practices

### DO ✅
- Write tests before fixing bugs (TDD for bug fixes)
- Use descriptive test names that explain what is being tested
- Keep tests isolated and independent
- Use beforeEach/afterEach for setup/teardown
- Mock external dependencies
- Test edge cases and error conditions
- Keep tests fast (< 100ms per unit test)

### DON'T ❌
- Test implementation details
- Create test interdependencies
- Use real network calls or file I/O
- Commit failing tests
- Skip writing tests for "simple" code
- Use setTimeout in tests (use vi.useFakeTimers())
- Test third-party library code

---

## Resources

- [Vitest Documentation](https://vitest.dev/guide/)
- [Vitest API Reference](https://vitest.dev/api/)
- [Happy DOM](https://github.com/capricorn86/happy-dom)
- [Testing Best Practices](https://testingjavascript.com/)
- [Test Coverage Interpretation](https://martinfowler.com/bliki/TestCoverage.html)
- [Migrating from Jest](https://vitest.dev/guide/migration.html)

---

## Contributing

When adding new features:

1. Write tests first (or alongside code)
2. Ensure all tests pass: `npm test`
3. Check coverage: `npm run test:coverage`
4. Aim for >80% coverage on new code
5. Update this documentation if needed
