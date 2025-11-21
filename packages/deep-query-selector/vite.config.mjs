import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'DeepQuerySelector',
      fileName: 'index',
      formats: ['es', 'cjs'],
    },
    minify: true,
    sourcemap: true,
    outDir: 'dist',
    rollupOptions: {
      external: [],
    },
  },
  plugins: [dts()],
});
