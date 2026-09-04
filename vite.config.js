import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000', // Puero de tu backend FastAPI
        changeOrigin: true,
        // Si tu backend NO incluye '/api' en sus routers, desbloquea esta línea:
        // rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})