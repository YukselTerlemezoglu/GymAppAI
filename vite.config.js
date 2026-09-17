import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      // Ana bundle 2 MiB'i astigi icin varsayilan precache limiti yetmiyor;
      // limit asilirsa ana JS precache DISINDA kalir ve offline calisma kirilir.
      // 3 MiB: mevcut bundle (2.16 MB) + buyume payi.
      injectManifest: {
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024
      },
      includeAssets: ['favicon-64.png', 'apple-touch-icon.png', 'icon.svg'],
      manifest: {
        name: 'GymApp AI - AI Powered Workout Manager',
        short_name: 'GymAppAI',
        description: 'Yapay Zeka Destekli, Modern ve Profesyonel Vücut Geliştirme Asistanı',
        theme_color: '#0f1115',
        background_color: '#0f1115',
        display: 'standalone',
        orientation: 'portrait-primary',
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
      }
    })
  ],
  server: {
    port: 8080,
    host: true,
    // NOT: /api proxy'si su an KULLANILMIYOR (dev-api-server.cjs diye bir
    // dosya yok; prod'da /api Vercel serverless'a gider). Dev'de AI cagrilari
    // dogrudan prod /api endpoint'ine gider. Kaldirilmadi cunku zararsiz;
    // dosya bir gun geri gelirse proxy tekrar devreye girer.
    proxy: {
      '/api': {
        target: 'http://localhost:5174',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ''),
      },
    },
  },
})
