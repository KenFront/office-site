/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tsconfigPaths from 'vite-tsconfig-paths'
// import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config https://vitest.dev/config
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
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
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: '.vitest/setup',
    include: ['**/test.{ts,tsx}']
  }
})
