import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

// Configuration Vite : alias « @ » vers src, build 100 % statique (hors ligne).
export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: { chunkSizeWarningLimit: 2000 },
  test: { environment: 'node' },
})
