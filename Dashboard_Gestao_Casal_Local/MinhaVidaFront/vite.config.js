import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    sourcemap: false,
    cssCodeSplit: true,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('react-dom') || id.includes('react-router-dom') || id.includes('/react/')) {
            return 'react-vendor'
          }

          if (id.includes('@tanstack/react-query') || id.includes('axios')) {
            return 'data-vendor'
          }

          if (id.includes('lucide-react')) {
            return 'icons-vendor'
          }
        },
      },
    },
  },
})
