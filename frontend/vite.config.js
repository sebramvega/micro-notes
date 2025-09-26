import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api/users': { target: 'http://localhost:8001', changeOrigin: true, rewrite: p => p.replace(/^\/api\/users/, '') },
      '/api/notes': { target: 'http://localhost:8002', changeOrigin: true, rewrite: p => p.replace(/^\/api\/notes/, '') },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    globals: true,
  },
})
