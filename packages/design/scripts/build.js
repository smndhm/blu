// Writes dist/tokens.css, the tokens as CSS custom properties, from src/tokens.js
import { mkdir, writeFile } from 'node:fs/promises';
import { cssVariables } from '../src/tokens.js';

const dist = new URL('../dist/', import.meta.url);
await mkdir(dist, { recursive: true });
await writeFile(new URL('tokens.css', dist), `/* @dume/design tokens, built from src/tokens.js */\n${cssVariables()}`);
