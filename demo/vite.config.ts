// vite.config.js
import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  resolve: {
    alias: {
      'maath': path.resolve('../packages/maath'),
    },
  },
  plugins: [react()],
})