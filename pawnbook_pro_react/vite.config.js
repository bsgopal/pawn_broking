import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // base: './' is required for Electron file:// loading.
  // Without this, Vite emits absolute paths like /assets/index.js
  // which fail when loaded from file:///path/to/index.html
  base: './',
})
