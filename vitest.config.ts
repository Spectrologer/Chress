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

  define: {
    'import.meta.env.VITEST': 'true',
  },

  test: {
    // Test environment (happy-dom for browser-like environment)
    environment: 'happy-dom',

    // Global test APIs (describe, test, expect, etc.)
    globals: true,

    // Setup files (run before each test file)
    setupFiles: ['./tests/setup.ts'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html', 'lcov', 'json'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.js',
        '**/*.test.ts',
        '**/*.spec.js',
        '**/*.spec.ts',
        'vite.config.js',
        'vite.config.ts',
        'vitest.config.js',
        'vitest.config.ts',
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
    include: ['tests/**/*.test.js', 'tests/**/*.spec.js', 'tests/**/*.test.ts', 'tests/**/*.spec.ts'],

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
    alias: {
      '@': resolve(__dirname, './src'),
      '@core': resolve(__dirname, './src/core'),
      '@managers': resolve(__dirname, './src/managers'),
      '@renderers': resolve(__dirname, './src/renderers'),
      '@utils': resolve(__dirname, './src/utils'),
      '@enemy': resolve(__dirname, './src/enemy'),
      '@npc': resolve(__dirname, './src/npc'),
      '@facades': resolve(__dirname, './src/facades'),
      '@services': resolve(__dirname, './src/services'),
      '@config': resolve(__dirname, './src/config'),
      '@entities': resolve(__dirname, './src/entities'),
      '@state': resolve(__dirname, './src/state'),
      '@generators': resolve(__dirname, './src/generators'),
      '@repositories': resolve(__dirname, './src/repositories'),
      '@ui': resolve(__dirname, './src/ui'),
      '@controllers': resolve(__dirname, './src/controllers'),
      '@types': resolve(__dirname, './src/types'),
      '@loaders': resolve(__dirname, './src/loaders'),
    },
  },
});
