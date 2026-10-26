// Builds dist/ with Vite+ (`vp pack`): the library, the Codemod CLI workflow entry and the command line, for Node
import { defineConfig } from 'vite-plus';

export default defineConfig({
  pack: {
    entry: { index: 'src/index.ts', codemod: 'src/codemod.ts', cli: 'src/cli.ts' },
    platform: 'node',
    dts: true,
    report: false,
  },
});
