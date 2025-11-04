import { eventBus } from '@core/EventBus';
import { EventTypes } from '@core/EventTypes';

describe('EventBus System Integration', () => {
  beforeEach(() => {
    // Clear all listeners before each test
    Object.values(EventTypes).forEach(eventType => {
      eventBus.clear(eventType);
    });
  });

  afterEach(() => {
    // Clean up after each test
    Object.values(EventTypes).forEach(eventType => {
      eventBus.clear(eventType);
    });
  });

  describe('EventBus Core Functionality', () => {
    test('on() subscribes to events and emit() triggers callbacks', () => {
      const mockCallback = jest.fn();

      eventBus.on(EventTypes.ENEMY_DEFEATED, mockCallback);
      eventBus.emit(EventTypes.ENEMY_DEFEATED, { points: 100 });

      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith({ points: 100 });
    });

    test('multiple listeners can subscribe to same event', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      eventBus.on(EventTypes.PLAYER_MOVED, callback1);
      eventBus.on(EventTypes.PLAYER_MOVED, callback2);
      eventBus.emit(EventTypes.PLAYER_MOVED, { x: 5, y: 10 });

      expect(callback1).toHaveBeenCalledWith({ x: 5, y: 10 });
      expect(callback2).toHaveBeenCalledWith({ x: 5, y: 10 });
    });

    test('once() subscribes to events that fire only once', () => {
      const mockCallback = jest.fn();

      eventBus.once(EventTypes.GAME_RESET, mockCallback);

      eventBus.emit(EventTypes.GAME_RESET, {});
      eventBus.emit(EventTypes.GAME_RESET, {});

      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    test('off() unsubscribes from events', () => {
      const mockCallback = jest.fn();

      eventBus.on(EventTypes.ZONE_CHANGED, mockCallback);
      eventBus.emit(EventTypes.ZONE_CHANGED, {});

      eventBus.off(EventTypes.ZONE_CHANGED, mockCallback);
      eventBus.emit(EventTypes.ZONE_CHANGED, {});

      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    test('on() returns unsubscribe function', () => {
      const mockCallback = jest.fn();

      const unsubscribe = eventBus.on(EventTypes.COMBO_ACHIEVED, mockCallback);
      eventBus.emit(EventTypes.COMBO_ACHIEVED, {});

      unsubscribe();
      eventBus.emit(EventTypes.COMBO_ACHIEVED, {});

      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    test('clear() removes all listeners for an event', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      eventBus.on(EventTypes.TREASURE_FOUND, callback1);
      eventBus.on(EventTypes.TREASURE_FOUND, callback2);

      eventBus.clear(EventTypes.TREASURE_FOUND);
      eventBus.emit(EventTypes.TREASURE_FOUND, {});

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
    });

    test('listenerCount() returns correct number of listeners', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      expect(eventBus.listenerCount(EventTypes.ANIMATION_REQUESTED)).toBe(0);

      eventBus.on(EventTypes.ANIMATION_REQUESTED, callback1);
      expect(eventBus.listenerCount(EventTypes.ANIMATION_REQUESTED)).toBe(1);

      eventBus.on(EventTypes.ANIMATION_REQUESTED, callback2);
      expect(eventBus.listenerCount(EventTypes.ANIMATION_REQUESTED)).toBe(2);
    });

    test('errors in listeners do not prevent other listeners from executing', () => {
      const errorCallback = jest.fn(() => {
        throw new Error('Test error');
      });
      const normalCallback = jest.fn();

      // Spy on console.error to suppress error output in tests
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      eventBus.on(EventTypes.PLAYER_STATS_CHANGED, errorCallback);
      eventBus.on(EventTypes.PLAYER_STATS_CHANGED, normalCallback);

      eventBus.emit(EventTypes.PLAYER_STATS_CHANGED, {});

      expect(errorCallback).toHaveBeenCalled();
      expect(normalCallback).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Event Types Coverage', () => {
    test('all event type constants are unique', () => {
      const eventValues = Object.values(EventTypes);
      const uniqueValues = new Set(eventValues);

      expect(uniqueValues.size).toBe(eventValues.length);
    });

    test('event types follow naming convention', () => {
      Object.entries(EventTypes).forEach(([key, value]) => {
        expect(typeof value).toBe('string');
        expect(value).toMatch(/^[a-z_]+:[a-z_:]+$/); // e.g., "enemy:defeated" or "game:exit:shovel_mode"
        expect(key).toMatch(/^[A-Z_]+$/); // e.g., "ENEMY_DEFEATED"
      });
    });
  });

  describe('Event System Integration Scenarios', () => {
    test('Combat to UI flow: enemy defeated triggers stats update', () => {
      const uiUpdateCallback = jest.fn();

      // Simulate UIManager listening to ENEMY_DEFEATED
      eventBus.on(EventTypes.ENEMY_DEFEATED, uiUpdateCallback);

      // Simulate CombatManager emitting event
      eventBus.emit(EventTypes.ENEMY_DEFEATED, {
        enemy: { id: 'e1' },
        points: 100,
        x: 5,
        y: 5,
        isComboKill: false
      });

      expect(uiUpdateCallback).toHaveBeenCalledWith({
        enemy: { id: 'e1' },
        points: 100,
        x: 5,
        y: 5,
        isComboKill: false
      });
    });

    test('Zone change triggers multiple manager updates', () => {
      const uiCallback = jest.fn();
      const soundCallback = jest.fn();

      // Simulate UIManager and SoundManager listening
      eventBus.on(EventTypes.ZONE_CHANGED, uiCallback);
      eventBus.on(EventTypes.ZONE_CHANGED, soundCallback);

      // Simulate ZoneManager emitting zone change
      eventBus.emit(EventTypes.ZONE_CHANGED, {
        x: 1,
        y: 0,
        dimension: 0,
        regionName: 'Forest'
      });

      expect(uiCallback).toHaveBeenCalled();
      expect(soundCallback).toHaveBeenCalled();
    });

    test('Animation request routing', () => {
      const animationCallback = jest.fn();

      // Simulate AnimationManager listening
      eventBus.on(EventTypes.ANIMATION_REQUESTED, animationCallback);

      // Simulate CombatManager requesting point animation
      eventBus.emit(EventTypes.ANIMATION_REQUESTED, {
        type: 'point',
        x: 3,
        y: 4,
        data: { amount: 50 }
      });

      expect(animationCallback).toHaveBeenCalledWith({
        type: 'point',
        x: 3,
        y: 4,
        data: { amount: 50 }
      });
    });

    test('Player movement triggers UI position update', () => {
      const positionCallback = jest.fn();

      eventBus.on(EventTypes.PLAYER_MOVED, positionCallback);

      eventBus.emit(EventTypes.PLAYER_MOVED, { x: 5, y: 8 });

      expect(positionCallback).toHaveBeenCalledWith({ x: 5, y: 8 });
    });
  });

  describe('Event System Performance', () => {
    test('handles many listeners efficiently', () => {
      const callbacks = Array(100).fill(null).map(() => jest.fn());

      callbacks.forEach(cb => eventBus.on(EventTypes.PLAYER_STATS_CHANGED, cb));

      const startTime = performance.now();
      eventBus.emit(EventTypes.PLAYER_STATS_CHANGED, { health: 100 });
      const endTime = performance.now();

      callbacks.forEach(cb => expect(cb).toHaveBeenCalled());

      // Should complete in reasonable time (< 100ms for 100 listeners)
      expect(endTime - startTime).toBeLessThan(100);
    });

    test('handles many sequential events efficiently', () => {
      const callback = jest.fn();
      eventBus.on(EventTypes.ANIMATION_REQUESTED, callback);

      const startTime = performance.now();
      for (let i = 0; i < 1000; i++) {
        eventBus.emit(EventTypes.ANIMATION_REQUESTED, { type: 'point', x: i, y: i });
      }
      const endTime = performance.now();

      expect(callback).toHaveBeenCalledTimes(1000);

      // Should complete in reasonable time (< 500ms for 1000 events)
      expect(endTime - startTime).toBeLessThan(500);
    });
  });
});
