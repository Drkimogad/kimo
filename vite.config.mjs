// vite.config.mjs
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: true,  // Ensures the server can be accessed from external devices
    hmr: {
      clientPort: 5173,  // Fixes WebSocket connection issue
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5173',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/models': {
        target: 'http://localhost:5173',
        changeOrigin: true,
      },
    },
  },
  configureServer: (server) => {
    server.middlewares.use((req, res, next) => {
      // Setting the correct MIME type for model files
      if (req.url.endsWith('.json') || req.url.endsWith('.onnx')) {
        res.setHeader('Content-Type', 'application/json');  // Handle JSON properly
      }
      next();
    });
  },
  optimizeDeps: {
    exclude: ['@xenova/transformers'],  // Exclude heavy dependencies from optimization
  },
});
