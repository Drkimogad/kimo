import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5173', // Your proxy server port
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/models': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  optimizeDeps: {
    exclude: ['@xenova/transformers']
  }
});
