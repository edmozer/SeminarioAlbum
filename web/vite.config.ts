import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Dev only: keep frontend calling same-origin /api
      '/api': 'http://localhost:3000',
    },
  },
})
