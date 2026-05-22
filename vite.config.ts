import { defineConfig } from 'vitest/config' // <-- Change this import
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/OnlineJackCompiler',
  plugins: [
    react(),
    tailwindcss()
  ],
  test: {
    globals: true, 
    environment: 'node', 
  },
})