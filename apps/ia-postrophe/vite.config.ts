import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/ia-postrophe/' : '/',
  build: {
    outDir: 'dist/ia-postrophe',
  },
}));
