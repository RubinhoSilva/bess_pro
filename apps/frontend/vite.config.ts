import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

// Detect if running in Docker (shared mounted at /app/shared)
// or locally (shared at ../../packages/shared)
const isDocker = process.env.DOCKER_ENV === 'true'
const sharedPath = isDocker
  ? '/app/shared/dist/index.esm.js'
  : path.resolve(__dirname, '../../packages/shared/dist/index.esm.js')

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production'
  const isStaging = mode === 'staging'

  return {
    plugins: [
      react(),
      // Bundle analyzer para produção
      ...(isProduction ? [visualizer({
        filename: 'dist/stats.html',
        open: false,
        gzipSize: true,
        brotliSize: true,
      })] : [])
    ],
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
      // Otimizações para produção
      minify: isProduction ? 'terser' : 'esbuild',
      sourcemap: isStaging ? true : false,
      
      // Configurações de chunk para melhor cache
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor libraries
            vendor: ['react', 'react-dom'],
            // Router e state management
            router: ['react-router-dom', 'react-router'],
            // UI libraries
            ui: ['lucide-react', 'clsx', 'tailwind-merge'],
            // Utils
            utils: ['axios', 'date-fns', 'uuid'],
            // Forms
            forms: ['react-hook-form', '@hookform/resolvers'],
            // Charts
            charts: ['recharts'],
            // 3D e maps
            three: ['three', '@react-three/fiber', '@react-three/drei'],
            maps: ['leaflet', 'react-leaflet'],
            // PDF e impressão
            pdf: ['jspdf', 'html2canvas', 'react-to-print']
          },
          // Nomes de arquivo para cache otimizado
          chunkFileNames: (chunkInfo) => {
            const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk'
            return `js/[name]-[hash].js`
          },
          entryFileNames: 'js/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.')
            const ext = info[info.length - 1]
            if (/\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/i.test(assetInfo.name)) {
              return `media/[name]-[hash][extname]`
            }
            if (/\.(png|jpe?g|gif|svg|webp|avif)(\?.*)?$/i.test(assetInfo.name)) {
              return `images/[name]-[hash][extname]`
            }
            if (/\.(woff2?|eot|ttf|otf)(\?.*)?$/i.test(assetInfo.name)) {
              return `fonts/[name]-[hash][extname]`
            }
            return `assets/[name]-[hash][extname]`
          }
        }
      },
      // Tamanho máximo de chunk
      chunkSizeWarningLimit: 1000,
      // Target para browsers modernos
      target: 'esnext',
      // Polyfills
      polyfillDynamicImport: true
    },
    // Otimizações de dependências
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'axios',
        'date-fns',
        'lucide-react'
      ]
    },
    // Define constantes globais
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString())
    }
  }
})
