#!/usr/bin/env node
/**
 * Completes PDFs printed by Chromium to conform to PDF/UA-1, in place.
 * Usage: pdf-ua <file.pdf>...
 */
import { readFile, writeFile } from 'node:fs/promises';
import process from 'node:process';
import pdfUa from './index.js';

const files = process.argv.slice(2);
if (!files.length) {
  console.error('Usage: pdf-ua <file.pdf>...');
  process.exit(1);
}
for (const file of files) {
  await writeFile(file, await pdfUa(await readFile(file)));
  console.log(`PDF/UA-1: ${file}`);
}
