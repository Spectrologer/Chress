import { ZoneStateManager } from '../generators/ZoneStateManager.js';

describe('ZoneStateManager', () => {
  test('getZoneLevel returns correct levels', () => {
    expect(ZoneStateManager.getZoneLevel(0, 0)).toBe(1);
    expect(ZoneStateManager.getZoneLevel(1, 1)).toBe(1);
    expect(ZoneStateManager.getZoneLevel(2, 0)).toBe(1);
    expect(ZoneStateManager.getZoneLevel(3, 0)).toBe(2);
    expect(ZoneStateManager.getZoneLevel(8, 0)).toBe(2);
    expect(ZoneStateManager.getZoneLevel(9, 0)).toBe(3);
    expect(ZoneStateManager.getZoneLevel(16, 0)).toBe(3);
    expect(ZoneStateManager.getZoneLevel(17, 0)).toBe(4);
  });

  test('hashCode returns consistent values', () => {
    const hash1 = ZoneStateManager.hashCode('test');
    const hash2 = ZoneStateManager.hashCode('test');
    expect(hash1).toBe(hash2);
    expect(typeof hash1).toBe('number');
  });

  test('hashCode returns different values for different inputs', () => {
    const hash1 = ZoneStateManager.hashCode('test1');
    const hash2 = ZoneStateManager.hashCode('test2');
    expect(hash1).not.toBe(hash2);
  });
});
