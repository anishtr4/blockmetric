import { defineConfig } from 'vite';

export default defineConfig({
  root: 'sdk/demo',
  server: {
    port: 5001
  },
  build: {
    outDir: '../../dist/demo',
    emptyOutDir: true
  }
})