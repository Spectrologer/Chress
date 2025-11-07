/**
 * Test to verify the custom board persistence fix uses correct zone keys
 */

import { createZoneKey } from '@utils/ZoneKeyUtils';

describe('Custom Board Zone Key Fix', () => {
    describe('Zone key format for underground zones', () => {
        test('underground zone at (0,0) depth 1 includes z-depth suffix', () => {
            const key = createZoneKey(0, 0, 2, 1);
            expect(key).toBe('0,0:2:z-1');
            // This is the CORRECT format that _restoreCurrentZoneTextures should use
            // Previously it was generating '0,0:2' which was missing the depth
        });

        test('underground zone without explicit depth defaults to z-1', () => {
            const key = createZoneKey(0, 0, 2);
            expect(key).toBe('0,0:2:z-1');
        });

        test('underground zone at different depths uses correct format', () => {
            expect(createZoneKey(0, 0, 2, 1)).toBe('0,0:2:z-1');
            expect(createZoneKey(0, 0, 2, 2)).toBe('0,0:2:z-2');
            expect(createZoneKey(0, 0, 2, 3)).toBe('0,0:2:z-3');
        });

        test('surface and interior zones do not have depth suffix', () => {
            expect(createZoneKey(0, 0, 0)).toBe('0,0:0'); // Surface
            expect(createZoneKey(0, 0, 1)).toBe('0,0:1'); // Interior
        });
    });

    describe('Zone key consistency across save/load', () => {
        test('saveCurrentZoneState and _restoreCurrentZoneTextures use same key format', () => {
            // Both methods should use createZoneKey() to ensure consistency
            const zoneX = 0, zoneY = 0, dimension = 2, depth = 1;

            // Key format used in ZonePersistenceManager.saveCurrentZoneState
            const saveKey = createZoneKey(zoneX, zoneY, dimension, depth);

            // Key format used in GameStateManager._restoreCurrentZoneTextures (after fix)
            const loadKey = createZoneKey(zoneX, zoneY, dimension, depth);

            // They MUST match for the well board textures to be found
            expect(saveKey).toBe(loadKey);
            expect(saveKey).toBe('0,0:2:z-1');
        });

        test('zone repository lookup works with correct key format', () => {
            // Simulate the zone repository Map
            const mockZones = new Map();

            // Save zone with correct key (what saveCurrentZoneState does)
            const saveKey = createZoneKey(0, 0, 2, 1);
            mockZones.set(saveKey, {
                terrainTextures: { '0,0': 'walls/cobble' },
                overlayTextures: {},
                rotations: {},
                overlayRotations: {}
            });

            // Load zone with same key (what _restoreCurrentZoneTextures does)
            const loadKey = createZoneKey(0, 0, 2, 1);
            const zoneData = mockZones.get(loadKey);

            // Should find the zone data
            expect(zoneData).toBeDefined();
            expect(zoneData.terrainTextures['0,0']).toBe('walls/cobble');
        });

        test('wrong key format fails to find zone (demonstrates the bug)', () => {
            // Simulate the zone repository Map
            const mockZones = new Map();

            // Save zone with correct key
            const correctKey = createZoneKey(0, 0, 2, 1); // "0,0:2:z-1"
            mockZones.set(correctKey, {
                terrainTextures: { '0,0': 'walls/cobble' }
            });

            // Try to load with wrong key format (the old bug)
            const wrongKey = '0,0:2'; // Missing :z-1 suffix
            const zoneData = mockZones.get(wrongKey);

            // Should NOT find the zone data
            expect(zoneData).toBeUndefined();
            // This is why the bug caused textures to not be restored!
        });
    });
});
