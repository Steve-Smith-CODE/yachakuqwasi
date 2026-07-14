import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Config aparte solo para *.real.test.jsx (ver comentario en vite.config.js):
// no reutiliza `exclude` de vite.config.js via mergeConfig porque Vite
// concatena arrays en vez de reemplazarlos, y ese exclude excluye justo
// estos archivos.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    globals: true,
    include: ['src/**/*.real.test.jsx']
  }
})
