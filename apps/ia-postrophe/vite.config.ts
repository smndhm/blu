import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/blu/ia-postrophe/' : '/',
  build: {
    outDir: 'dist/ia-postrophe',
  },
}));
