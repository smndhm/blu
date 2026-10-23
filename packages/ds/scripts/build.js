// Writes dist/: the tokens as CSS custom properties (from src/tokens.js), modern-normalize and the base, the utilities
// and each component (from css/), each in its cascade layer, under any project's own CSS
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { cssVariables } from '../src/tokens.js';

const dist = new URL('../dist/', import.meta.url);
const css = new URL('../css/', import.meta.url);
// The layers' order, at the top of each file: whichever comes first sets it
const order = '@layer ds.normalize, ds.base, ds.components, ds.utilities;';
const layer = (name, content) => `@layer ds.${name} {\n${content.trim()}\n}\n`;
const write = (path, ...layers) => writeFile(new URL(path, dist), `/* @dume/ds, built by scripts/build.js */\n${order}\n\n${layers.join('\n')}`);
const read = path => readFile(new URL(path, css), 'utf8');

await mkdir(new URL('components/', dist), { recursive: true });
await write('tokens.css', layer('base', cssVariables()));
const normalize = await readFile(createRequire(import.meta.url).resolve('modern-normalize'), 'utf8');
await write('base.css', layer('normalize', normalize), layer('base', await read('base.css')));
await write('utilities.css', layer('utilities', await read('utilities.css')));
for (const file of await readdir(new URL('components/', css))) {
  await write(`components/${file}`, layer('components', await read(`components/${file}`)));
}
