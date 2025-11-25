import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'webcompUtils', // Nom exporté dans window.webcompUtils
      fileName: format => `webcomp-utils.${format}.js`,
    },
    rollupOptions: {
      output: {
        globals: {}, // pas de dépendances externes
      },
    },
  },
  plugins: [dts()],
});
