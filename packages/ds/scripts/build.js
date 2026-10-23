// Writes dist/: the tokens as CSS custom properties (from src/tokens.js), modern-normalize and the base, the utilities
// and each component (from css/), each in its cascade layer, under any project's own CSS, and the heading font
import { copyFile, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
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

// Bricolage Grotesque, the heading font (SIL Open Font License): its Latin subsets, as `fonts/` next to fonts.css,
// under the family name of the heading token
const require = createRequire(import.meta.url);
const fontsource = dirname(require.resolve('@fontsource-variable/bricolage-grotesque/wght.css'));
await mkdir(new URL('fonts/', dist), { recursive: true });
const faces = [];
for (const face of (await readFile(join(fontsource, 'wght.css'), 'utf8')).match(/@font-face \{[^}]+\}/g)) {
  const file = /files\/([\w-]+\.woff2)/.exec(face)[1];
  if (!/-latin(-ext)?-/.test(file)) continue;
  await copyFile(join(fontsource, 'files', file), new URL(`fonts/${file}`, dist));
  faces.push(face.replace("'Bricolage Grotesque Variable'", "'Bricolage Grotesque'").replace(`./files/${file}`, `fonts/${file}`));
}
await writeFile(new URL('fonts.css', dist), `/* @dume/ds, built by scripts/build.js: Bricolage Grotesque (SIL Open Font License), its files in fonts/ */\n${faces.join('\n\n')}\n`);
