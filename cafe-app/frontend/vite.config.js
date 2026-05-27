import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'https://cafe-order-system-stl6.onrender.com',
      '/uploads': 'https://cafe-order-system-stl6.onrender.com'
    }
  }
})