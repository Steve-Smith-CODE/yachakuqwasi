import { defineConfig } from 'vite'
import { configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    port: 5173,
    host: 'localhost',
    cors: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild'
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    globals: true,
    // *.real.test.jsx pega por HTTP a un backend real (ver scripts/serve-test.js
    // en backend/); se excluye del `vitest run` normal (y por lo tanto de CI)
    // porque necesita ese servidor levantado. Se corre aparte con
    // `npm run local:test:frontend-real` desde la raiz del repo.
    exclude: [...configDefaults.exclude, '**/*.real.test.jsx']
  }
})
