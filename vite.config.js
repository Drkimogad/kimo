import { defineConfig } from 'vite';
import nodePolyfills from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    nodePolyfills({
      // Only polyfill the specific modules causing errors
      globals: {
        Buffer: true,  // Fixes "Buffer is not defined"
        Long: true     // Fixes protobufjs Long dependency
      }
    })
  ],
  resolve: {
    alias: {
      // Explicitly point to browser-friendly implementations
      buffer: 'buffer/',
      long: 'long'  // For protobufjs compatibility
    }
  }
});
