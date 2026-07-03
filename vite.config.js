import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Configuración estándar y segura para compilar en Vercel
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173
  }
})
