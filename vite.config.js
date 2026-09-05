import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { mpesaPlugin } from './scripts/vite-mpesa-plugin.js'

export default defineConfig({
  plugins: [react(), mpesaPlugin()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})