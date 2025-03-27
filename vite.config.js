import { defineConfig } from 'vite';
import nodePolyfills from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    nodePolyfills({
      // Polyfill only necessary Node.js modules
      globals: {
        Buffer: true,
        process: true,
      },
      protocolImports: true,
    })
  ],
  resolve: {
    alias: {
      // Required for TensorFlow.js and other libs
      buffer: 'buffer',
      crypto: 'crypto-browserify',
      stream: 'stream-browserify',
      util: 'util'
    }
  },
  optimizeDeps: {
    // Add heavy dependencies for pre-bundling
    include: [
      '@tensorflow/tfjs',
      '@tensorflow-models/mobilenet',
      'tesseract.js'
    ],
  },
  build: {
    // Increase chunk size warning limit (for TF.js models)
    chunkSizeWarningLimit: 1600,
  }
});
