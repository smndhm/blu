import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: 'src/index.ts',
        cli: 'src/cli.ts',
      },
      formats: ['es'],
      fileName: (format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      external: [/^node:/, 'parse5', 'html-enumerated-attributes'],
    },
    target: 'node20',
    ssr: true,
  },
  plugins: [dts()],
});
