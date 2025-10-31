import { vi } from 'vitest';

// Make vi available globally as jest for backward compatibility
// This allows existing tests using jest.fn() and jest.spyOn() to work without changes
global.jest = vi;
