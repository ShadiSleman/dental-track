import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:5051',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5051',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
