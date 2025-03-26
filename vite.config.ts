/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tsconfigPaths from 'vite-tsconfig-paths'
import { VitePWA } from 'vite-plugin-pwa'

import manifest from './manifest.json'
// import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config https://vitest.dev/config
export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    VitePWA({
      manifest,
      includeAssets: ['favicon.svg', 'robots.txt', 'apple-touch-icon.png'],
      devOptions: { enabled: false },
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html}', '**/*.{svg,png,jpg,gif}']
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id, { getModuleInfo }) {
          if (id.includes('node_modules')) {
            const moduleInfo = getModuleInfo(id)
            const importers = moduleInfo?.importers || []
            if (importers.length > 1) {
              return 'vendor'
            }
          }
        }
      },
      plugins: [
        // visualizer({
        //   filename: 'stats.html',
        //   open: true
        // })
      ]
    }
  }
})
