import { defineConfig } from 'vite';
import { resolve } from 'path';
import { VitePWA } from 'vite-plugin-pwa';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { npcDiscoveryPlugin } from './vite-plugin-npc-discovery.js';

const baseUrl = process.env.NODE_ENV === 'production' ? '/Chesse/' : '/';

export default defineConfig({
  // Base URL for GitHub Pages deployment
  base: baseUrl,

  // Build optimizations
  build: {
    target: 'esnext',
    minify: 'esbuild', // Changed from 'terser' to 'esbuild' - faster and avoids some minification issues
    // terserOptions: {
    //   compress: {
    //     drop_console: false, // Keep console for debugging, set to true to remove
    //     drop_debugger: true,
    //     pure_funcs: ['console.debug'], // Remove console.debug in production
    //   },
    // },

    // Code splitting configuration
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        'board-editor': resolve(__dirname, 'tools/board-editor.html'),
        'character-editor': resolve(__dirname, 'tools/character-editor.html'),
      },
      output: {
        manualChunks: {
          // Core game logic
          'game-core': [
            './src/core/game.ts',
            './src/core/constants/index.ts',
          ],

          // Managers
          'managers': [
            './src/managers/ZoneManager.ts',
            './src/managers/GridManager.ts',
            './src/managers/ActionManager.ts',
            './src/managers/InteractionManager.ts',
          ],

          // Inventory system
          'inventory': [
            './src/managers/inventory/InventoryService.ts',
            './src/managers/inventory/ItemRepository.ts',
            './src/managers/ItemManager.ts',
          ],

          // Rendering
          'renderers': [
            './src/renderers/RenderManager.ts',
            './src/renderers/TileRenderer.ts',
            './src/renderers/PlayerRenderer.ts',
            './src/renderers/EnemyRenderer.ts',
            './src/renderers/NPCRenderer.ts',
          ],

          // Enemy AI
          'enemy-ai': [
            './src/enemy/BaseEnemy.ts',
            './src/enemy/EnemyMovement.ts',
            './src/enemy/EnemyPathfinding.ts',
          ],

          // Utils (lazy loaded)
          'utils': [
            './src/utils/GridUtils.ts',
            './src/utils/TileUtils.ts',
          ],
        },

        // Asset file naming
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];

          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          } else if (/woff|woff2|eot|ttf|otf/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }

          return `assets/[name]-[hash][extname]`;
        },

        // Chunk file naming
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
      },
    },

    // Optimize chunk size
    chunkSizeWarningLimit: 1000,

    // Source maps for debugging production issues
    sourcemap: true,

    // Asset inlining threshold (smaller assets get inlined as base64)
    assetsInlineLimit: 4096,
  },

  // Development server configuration
  server: {
    port: 3000,
    host: '0.0.0.0',
    open: true,
    cors: true,
    hmr: true, // Hot Module Replacement
  },

  // Preview server (for testing production builds)
  preview: {
    port: 4173,
    host: '0.0.0.0',
    open: true,
    // Important: Preview server should use the same base as production to test correctly
    // This ensures assets load from the correct /Chesse/ path during preview
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
    },
  },

  // Optimize dependencies
  optimizeDeps: {
    include: ['@sentry/browser'],
    exclude: [], // Add any deps that shouldn't be pre-bundled
  },

  // Plugin configuration
  plugins: [
    npcDiscoveryPlugin(), // Auto-discover NPC JSON files
    viteStaticCopy({
      targets: [
        {
          src: 'src/characters/*.json',
          dest: 'characters'
        },
        {
          src: 'src/characters/gossip/*.json',
          dest: 'characters/gossip'
        },
        {
          src: 'src/characters/statues/*.json',
          dest: 'characters/statues'
        },
        {
          src: 'static/boards/canon/*.json',
          dest: 'boards/canon'
        },
        {
          src: 'static/boards/custom/*.json',
          dest: 'boards/custom'
        },
      ],
      // Watch for changes in development
      watch: {
        reloadPageOnChange: true
      }
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['**/*'],

      manifest: {
        name: 'Chesse: Chess 2 - The Sequel to Chess',
        short_name: 'Chesse',
        description: 'A browser-based RPG game with turn-based combat, zone exploration, and procedural generation',
        theme_color: '#3e2347',
        background_color: '#2d1b3d',
        display: 'standalone',
        orientation: 'any',
        scope: baseUrl,
        start_url: baseUrl,
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'icon-apple-touch.png',
            sizes: '180x180',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      },

      workbox: {
        globPatterns: ['**/*.{js,css,html,png,jpg,jpeg,gif,svg,woff,woff2,ttf,json}'],
        sourcemap: false, // Disable workbox source maps to prevent browser parsing errors

        // Cache strategy configuration
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          {
            urlPattern: /\.(?:js|css)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-resources',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              }
            }
          }
        ],

        // Don't cache these patterns
        navigateFallbackDenylist: [/^\/api\//, /^\/admin\//],

        // Maximum file size to precache (2 MB)
        maximumFileSizeToCacheInBytes: 2 * 1024 * 1024
      },

      devOptions: {
        enabled: false, // Disabled in dev to prevent Service Worker caching issues
        type: 'module',
        navigateFallback: 'index.html'
      }
    })
  ],

  // Asset handling
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg'],

  // Public directory for static assets
  publicDir: 'static',
});
