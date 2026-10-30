// Builds dist/ with Vite+ (`vp pack`): each stylesheet of css/ on its own, its imports in it (modern-normalize before the
// base, Prism's Okaidia theme before the code component), styles.css with all of them, the fonts' files (headings, printed text), and the web
// components, their styles in them
import { readdirSync } from 'node:fs';
import { defineConfig } from 'vite-plus';

const stylesheets = readdirSync('css', { recursive: true, encoding: 'utf8' }).filter(file => file.endsWith('.css'));

export default defineConfig({
  pack: {
    entry: {
      ...Object.fromEntries(stylesheets.map(file => [file.replace(/\.css$/, ''), `css/${file}`])),
      'web-components/banner': 'web-components/banner.ts',
    },
    platform: 'browser',
    dts: true,
    // Baseline widely available, and light-dark() as it is: no syntax lowered
    target: ['chrome123', 'edge123', 'firefox120', 'safari17.5'],
    css: { splitting: true },
    copy: [
      { from: 'node_modules/@fontsource-variable/bricolage-grotesque/files/*-latin{,-ext}-wght-normal.woff2', to: 'dist/fonts' },
      { from: 'node_modules/@fontsource-variable/instrument-sans/files/*-latin{,-ext}-wght-normal.woff2', to: 'dist/fonts' },
    ],
    report: false,
  },
});
