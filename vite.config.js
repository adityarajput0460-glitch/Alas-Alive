import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.svg',
        'apple-touch-icon.png',
        'assets/fonts/**/*.pbf',
        'assets/sprites/**/*',
        'data/wiki/**/*.json'
      ],
      manifest: {
        name: 'ATLAS ALIVE — Survival Navigation',
        short_name: 'ATLAS ALIVE',
        description: 'Offline-first survival mapping and navigation for crisis scenarios. Works without internet, cell towers, or infrastructure.',
        theme_color: '#0a0e1a',
        background_color: '#0a0e1a',
        display: 'standalone',
        orientation: 'portrait',
        categories: ['navigation', 'utilities', 'health'],
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,pbf,json}'],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10MB for Tier 1 map
        runtimeCaching: [
          {
            urlPattern: /\.pmtiles$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'atlas-map-tiles',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 30 * 24 * 60 * 60
              }
            }
          }
        ]
      }
    })
  ],
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: false
  },
  server: {
    port: 5173,
    host: true
  }
});
