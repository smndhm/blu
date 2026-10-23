// Writes dist/ from css/, whose files each declare their cascade layer: the layers' order on top of each, modern-normalize
// before the base, Prism's Okaidia theme before the code component, the heading font, and ds.css, all of them in one
// stylesheet
import { copyFile, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const dist = new URL('../dist/', import.meta.url);
const css = new URL('../css/', import.meta.url);
// The layers' order, at the top of each file: whichever a page loads first sets it, under any project's own CSS
const order = '@layer ds.normalize, ds.base, ds.layout, ds.components, ds.utilities;';
const write = (path, ...parts) => writeFile(new URL(path, dist), `/* @dume/ds, built by scripts/build.js */\n${order}\n\n${parts.join('\n')}`);
const read = path => readFile(new URL(path, css), 'utf8');
const dependency = async (name, layer) => `@layer ds.${layer} {\n${(await readFile(require.resolve(name), 'utf8')).trim()}\n}\n`;

await mkdir(new URL('components/', dist), { recursive: true });
await mkdir(new URL('layout/', dist), { recursive: true });
await write('tokens.css', await read('tokens.css'));
await write('base.css', await dependency('modern-normalize', 'normalize'), await read('base.css'));
await write('utilities.css', await read('utilities.css'));
for (const file of await readdir(new URL('layout/', css))) await write(`layout/${file}`, await read(`layout/${file}`));
const okaidia = await dependency('prismjs/themes/prism-okaidia.css', 'components');
for (const file of await readdir(new URL('components/', css))) {
  await write(`components/${file}`, ...(file === 'code.css' ? [okaidia] : []), await read(`components/${file}`));
}

// Bricolage Grotesque, the heading font (SIL Open Font License): its Latin subsets, as `fonts/` next to fonts.css,
// under the family name of the heading token
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

// ds.css: all of the above in one stylesheet, for a site that takes the whole design system (its fonts/ next to it)
const parts = ['fonts.css', 'tokens.css', 'base.css', 'utilities.css'];
for (const folder of ['layout', 'components']) {
  for (const file of (await readdir(new URL(`${folder}/`, dist))).toSorted()) parts.push(`${folder}/${file}`);
}
const all = await Promise.all(parts.map(part => readFile(new URL(part, dist), 'utf8')));
await writeFile(new URL('ds.css', dist), all.join('\n'));
