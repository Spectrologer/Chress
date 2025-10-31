import { defineConfig } from 'vite';
import { resolve } from 'path';
import { VitePWA } from 'vite-plugin-pwa';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { npcDiscoveryPlugin } from './vite-plugin-npc-discovery.js';
import { assetDiscoveryPlugin } from './vite-plugin-asset-discovery.js';

export default defineConfig({
  // Base URL for GitHub Pages deployment
  base: process.env.NODE_ENV === 'production' ? '/Chress/' : '/',

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
      output: {
        manualChunks: {
          // Core game logic
          'game-core': [
            './src/core/game.js',
            './src/core/constants/index.js',
          ],

          // Managers
          'managers': [
            './src/managers/ZoneManager.js',
            './src/managers/GridManager.js',
            './src/managers/ActionManager.js',
            './src/managers/InteractionManager.js',
          ],

          // Inventory system
          'inventory': [
            './src/managers/inventory/InventoryService.js',
            './src/managers/inventory/ItemRepository.js',
            './src/managers/ItemManager.js',
          ],

          // Rendering
          'renderers': [
            './src/renderers/RenderManager.js',
            './src/renderers/TileRenderer.js',
            './src/renderers/PlayerRenderer.js',
            './src/renderers/EnemyRenderer.js',
            './src/renderers/NPCRenderer.js',
          ],

          // Enemy AI
          'enemy-ai': [
            './src/enemy/BaseEnemy.js',
            './src/enemy/EnemyMovement.js',
            './src/enemy/EnemyPathfinding.js',
          ],

          // Utils (lazy loaded)
          'utils': [
            './src/utils/GridUtils.js',
            './src/utils/TileUtils.js',
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
    // This ensures assets load from the correct /Chress/ path during preview
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
    },
  },

  // Optimize dependencies
  optimizeDeps: {
    include: ['@sentry/browser'],
    exclude: [], // Add any deps that shouldn't be pre-bundled
  },

  // Plugin configuration
  plugins: [
    assetDiscoveryPlugin(), // Auto-discover image assets
    npcDiscoveryPlugin(), // Auto-discover NPC JSON files
    viteStaticCopy({
      targets: [
        {
          src: 'src/characters/*.json',
          dest: 'characters'
        }
      ]
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['**/*'],

      manifest: {
        name: 'Chress: Chess 2 - The Sequel to Chess',
        short_name: 'Chress',
        description: 'A browser-based RPG game with turn-based combat, zone exploration, and procedural generation',
        theme_color: '#3d2845',
        background_color: '#2d1b3d',
        display: 'standalone',
        orientation: 'any',
        scope: process.env.NODE_ENV === 'production' ? '/Chress/' : '/',
        start_url: process.env.NODE_ENV === 'production' ? '/Chress/' : '/',
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
        sourcemap: process.env.NODE_ENV !== 'production', // Enable source maps in dev for debugging

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
        enabled: true, // Enable in dev to test PWA functionality
        type: 'module'
      }
    })
  ],

  // Asset handling
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg'],

  // Public directory for static assets
  publicDir: 'public',
});
