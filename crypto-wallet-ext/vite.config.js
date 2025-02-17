import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist', // the folder where Vite will output the build
    rollupOptions: {
      input: 'index.html', // entry point for your app
    },
  },
});