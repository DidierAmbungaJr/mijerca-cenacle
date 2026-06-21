import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // ─── Configuration des tests unitaires (Vitest) ─────────────────
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.js', 'src/**/*.test.jsx'],
    reporters: ['verbose']
  },
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'MIJERCA Cénacle',
        short_name: 'Cénacle',
        description: 'Application de gestion et d\'engagement pour les jeunes du Cénacle',
        theme_color: '#4F1E6F',
        background_color: '#0E0B16',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'icon.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: 'icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ]
})
