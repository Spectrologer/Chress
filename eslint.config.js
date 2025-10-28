import enforceEventTypes from './eslint-rules/enforce-event-types.js';

export default [
  {
    files: ['**/*.js'],
    ignores: [
      'node_modules/**',
      '.git/**',
      'temp_*.js',
      'temp_*.cjs'
    ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        document: 'readonly',
        window: 'readonly',
        Image: 'readonly',
        localStorage: 'readonly',
        Audio: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        performance: 'readonly',
        navigator: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        fetch: 'readonly',
        Headers: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        AbortController: 'readonly',
        AbortSignal: 'readonly',
        Map: 'readonly',
        Set: 'readonly',
        WeakMap: 'readonly',
        WeakSet: 'readonly',
        Promise: 'readonly',
        Symbol: 'readonly',
        Proxy: 'readonly',
        Reflect: 'readonly',
        Object: 'readonly',
        Array: 'readonly',
        String: 'readonly',
        Number: 'readonly',
        Boolean: 'readonly',
        Math: 'readonly',
        Date: 'readonly',
        RegExp: 'readonly',
        JSON: 'readonly',
        Error: 'readonly',
        TypeError: 'readonly',
        RangeError: 'readonly',
        SyntaxError: 'readonly',
        ReferenceError: 'readonly',
        EvalError: 'readonly',
        URIError: 'readonly',
        parseInt: 'readonly',
        parseFloat: 'readonly',
        isNaN: 'readonly',
        isFinite: 'readonly',
        encodeURI: 'readonly',
        decodeURI: 'readonly',
        encodeURIComponent: 'readonly',
        decodeURIComponent: 'readonly',
        escape: 'readonly',
        unescape: 'readonly'
      }
    },
    plugins: {
      'custom-rules': {
        rules: {
          'enforce-event-types': enforceEventTypes
        }
      }
    },
    rules: {
      'custom-rules/enforce-event-types': 'error'
    }
  }
];
