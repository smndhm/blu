import { defineConfig } from 'vite';

// Builds a single script, served by the simon.duhem.fr site on the /ia-postrophe/ page
export default defineConfig({
  build: {
    rollupOptions: {
      input: 'src/main.ts',
      output: {
        entryFileNames: 'ia-postrophe.js',
      },
    },
  },
});
