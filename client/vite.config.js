import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  // Avoid the root-owned ./dist left by a prior sudo run.
  build: {
    outDir: 'build-out',
    emptyOutDir: true,
  },
})
