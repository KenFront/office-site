/// <reference types="vitest" />

import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import tsconfigPaths from 'vite-tsconfig-paths'

import manifest from './manifest.json'
// import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config https://vitest.dev/config
export default defineConfig(({ mode }) => {
  const isMock = mode === 'mock'
  const entryFile = isMock ? '/src/mockApp.tsx' : '/src/index.tsx'

  return {
    plugins: [
      react(),
      tsconfigPaths(),
      VitePWA({
        manifest,
        includeAssets: ['ken-mark.svg', 'robots.txt'],
        devOptions: { enabled: false },
        registerType: 'autoUpdate',
        workbox: {
          globPatterns: ['**/*.{js,css,html,woff2}', '**/*.{svg,png,jpg,gif}']
        }
      }),
      {
        name: 'html-transform',
        transformIndexHtml(html) {
          return html.replace(
            /<script type="module" src="\/src\/index.tsx"><\/script>/,
            `<script type="module" src="${entryFile}"></script>`
          )
        }
      }
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('/node_modules/three/')) return 'three'
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
  }
})
