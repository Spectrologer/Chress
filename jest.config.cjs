module.exports = {
  // Test environment
  testEnvironment: 'jsdom',

  // Transform ES modules
  transform: {
    '^.+\\.js$': 'babel-jest',
  },

  // Don't transform node_modules except for ES modules
  transformIgnorePatterns: [
    'node_modules/(?!(@sentry)/)',
  ],

  // Module name mapper for path aliases (matching vite.config.js)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@managers/(.*)$': '<rootDir>/src/managers/$1',
    '^@renderers/(.*)$': '<rootDir>/src/renderers/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@enemy/(.*)$': '<rootDir>/src/enemy/$1',
    '^@npc/(.*)$': '<rootDir>/src/npc/$1',
    '^@facades/(.*)$': '<rootDir>/src/facades/$1',

    // Fix relative imports from tests/ directory
    '^../src/(.*)$': '<rootDir>/src/$1',
    '^../(entities|managers|core|ui|renderers|utils|enemy|npc|facades|generators|controllers|config|state)/(.*)$': '<rootDir>/src/$1/$2',
  },

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/*.spec.js',
    '!**/node_modules/**',
    '!**/vendor/**',
  ],

  // Coverage thresholds (start conservative, increase over time)
  coverageThreshold: {
    global: {
      branches: 30,
      functions: 30,
      lines: 30,
      statements: 30,
    },
  },

  // Coverage reporters
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json',
  ],

  // Coverage directory
  coverageDirectory: 'coverage',

  // Test match patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js',
  ],

  // Setup files
  setupFilesAfterEnv: [],

  // Module file extensions
  moduleFileExtensions: ['js', 'json', 'jsx', 'node'],

  // Verbose output
  verbose: true,

  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // The maximum amount of workers used to run your tests
  maxWorkers: '50%',

  // Indicates whether each individual test should be reported during the run
  testTimeout: 10000,
};
