// vite.config.js
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [nodePolyfills()],
  build: {
    target: 'esnext', // Ensures modern build
    rollupOptions: {
      output: {
        // Prevent dynamic import warnings
        manualChunks: {
          onnxruntime: ['onnxruntime-web'], // Optional to reduce bundle size
        },
      },
    },
  },
});
