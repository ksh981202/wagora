import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined

          const normalizedId = id.replace(/\\/g, '/')

          if (
            normalizedId.includes('/node_modules/react/') ||
            normalizedId.includes('/node_modules/react-dom/') ||
            normalizedId.includes('/node_modules/react-router-dom/')
          ) {
            return 'vendor_react'
          }

          if (normalizedId.includes('/node_modules/@supabase/')) {
            return 'vendor_supabase'
          }

          if (normalizedId.includes('/node_modules/@tanstack/react-query/')) {
            return 'vendor_query'
          }

          if (
            normalizedId.includes('/node_modules/lucide-react/') ||
            normalizedId.includes('/node_modules/framer-motion/')
          ) {
            return 'vendor_ui'
          }

          if (
            normalizedId.includes('/node_modules/@aws-sdk/') ||
            normalizedId.includes('/node_modules/@smithy/') ||
            normalizedId.includes('/node_modules/papaparse/') ||
            normalizedId.includes('/node_modules/browser-image-compression/')
          ) {
            return 'vendor_admin'
          }

          return undefined
        },
      },
    },
  },
})
