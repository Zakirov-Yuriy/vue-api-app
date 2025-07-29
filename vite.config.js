// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    // Эта строка решает 404 на прямых переходах
    historyApiFallback: true
  }
})
