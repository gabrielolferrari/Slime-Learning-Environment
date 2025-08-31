import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: 'index.html'
    }
  },
  server: {
    port: 3001,
    open: true
  }
});