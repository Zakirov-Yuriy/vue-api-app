import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {  // Все запросы, начинающиеся с /api, будут проксироваться
        target: 'http://109.73.206.144:6969',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        secure: false
      }
    },
    historyApiFallback: true
  },
  define: {
    'process.env': {}
  }
})