import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['kage-mark.svg'],
      manifest: {
        name: 'KAGE ANIME',
        short_name: 'KAGE',
        description: 'Explore animes, acompanhe sua lista e retome seu histórico.',
        theme_color: '#09090f',
        background_color: '#09090f',
        display: 'standalone',
        start_url: '/',
        icons: [{ src: '/kage-mark.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,webmanifest,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.tenrai\.org\/v1\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'tenrai-metadata-v1',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 }
            }
          },
          {
            urlPattern: /^https:\/\/cdn\.myanimelist\.net\/images\/anime\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'anime-covers-v1',
              expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 30 }
            }
          }
        ]
      }
    })
  ],
  server: { host: '0.0.0.0', port: 3000, strictPort: true },
  preview: { host: '0.0.0.0', port: 3000, strictPort: true }
});
