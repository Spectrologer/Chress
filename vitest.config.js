import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { assetDiscoveryPlugin } from './vite-plugin-asset-discovery.js';
import { npcDiscoveryPlugin } from './vite-plugin-npc-discovery.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// IMPORTANT: public/assets directory has been intentionally removed
// DO NOT create public/assets - tests should work without it
// The error "Could not scan directory public/assets" is expected and harmless

export default defineConfig({
  plugins: [
    assetDiscoveryPlugin(),
    npcDiscoveryPlugin(),
  ],

  test: {
    // Test environment (happy-dom for browser-like environment)
    environment: 'happy-dom',

    // Global test APIs (describe, test, expect, etc.)
    globals: true,

    // Setup files (run before each test file)
    setupFiles: ['./tests/setup.js'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html', 'lcov', 'json'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.js',
        '**/*.spec.js',
        'vite.config.js',
        'vitest.config.js',
        'babel.config.cjs',
      ],
      // Coverage thresholds
      thresholds: {
        lines: 30,
        functions: 30,
        branches: 30,
        statements: 30,
      },
    },

    // Test match patterns
    include: ['tests/**/*.test.js', 'tests/**/*.spec.js'],

    // Clear mocks between tests
    clearMocks: true,

    // Test timeout
    testTimeout: 10000,

    // Pool options
    pool: 'threads',
    poolOptions: {
      threads: {
        maxThreads: 4,
        minThreads: 1,
      },
    },
  },

  // Module resolution
  resolve: {
    alias: [
      { find: '@', replacement: resolve(__dirname, './src') },
      { find: '@core', replacement: resolve(__dirname, './src/core') },
      { find: '@managers', replacement: resolve(__dirname, './src/managers') },
      { find: '@renderers', replacement: resolve(__dirname, './src/renderers') },
      { find: '@utils', replacement: resolve(__dirname, './src/utils') },
      { find: '@enemy', replacement: resolve(__dirname, './src/enemy') },
      { find: '@npc', replacement: resolve(__dirname, './src/npc') },
      { find: '@facades', replacement: resolve(__dirname, './src/facades') },
      // Fix relative imports from tests/ directory to src/
      { find: /^\.\.\/(.*)$/, replacement: resolve(__dirname, './src/$1') },
    ],
  },
});
