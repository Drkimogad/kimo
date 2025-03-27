import { defineConfig } from 'vite';
import inject from '@rollup/plugin-inject';

export default defineConfig({
  plugins: [
    inject({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser',
    })
  ],
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
  }
});
