import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// BASE_PATH = '/thai-lotto-calc/' บน GitHub Pages · '/' ตอนพัฒนาในเครื่องหรือใช้โดเมนของตัวเอง
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
  server: { port: 3000 },
})
