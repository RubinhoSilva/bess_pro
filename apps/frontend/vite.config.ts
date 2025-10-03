import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@bess-pro/shared': path.resolve(__dirname, '../../packages/shared/dist')
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
