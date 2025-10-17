import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Detect if running in Docker (shared mounted at /app/shared)
// or locally (shared at ../../packages/shared)
const isDocker = process.env.DOCKER_ENV === 'true'
const sharedPath = isDocker
  ? '/app/shared/dist/index.esm.js'
  : path.resolve(__dirname, '../../packages/shared/dist/index.esm.js')

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@bess-pro/shared': sharedPath
    }
  },
  server: {
    port: 3003,
    host: true
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['axios', 'date-fns'],
          ui: ['lucide-react', 'clsx']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})
