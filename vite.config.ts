import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.png', 'logo-192.png', 'logo-512.png', 'logo-192-maskable.png', 'logo-512-maskable.png', 'favicon.png', 'favicon-32.png'],
      // Use the existing manifest.json instead of generating one
      manifest: {
        name: 'GAZI DENT — מעקב עבודות',
        short_name: 'GAZI DENT',
        description: 'מרפאה ומעבדת שיניים דיגיטלית מתקדמת',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#1a3a6b',
        theme_color: '#1a3a6b',
        lang: 'he',
        dir: 'rtl',
        icons: [
          {
            src: '/logo-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/logo-192-maskable.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/logo-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/logo-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // skipWaiting + clientsClaim: new SW activates immediately on all tabs
        // This prevents old cached JS from mixing with new HTML after deploy
        skipWaiting: true,
        clientsClaim: true,
        // Do NOT cache HTML — always serve fresh from network so it always points
        // to the correct hashed JS/CSS bundles (prevents version mismatch crashes)
        globPatterns: ['**/*.{js,css,ico,png,svg,woff2}'],
        // Never serve index.html from cache
        navigateFallback: null,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
          {
            // API: NetworkFirst — always try network, fall back to cache if offline
            urlPattern: /\/api\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'api-cache', expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 }, networkTimeoutSeconds: 8 },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:5051',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
