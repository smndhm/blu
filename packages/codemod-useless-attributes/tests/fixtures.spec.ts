import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { transformHtml } from '../src/transform.js';

/**
 * Conventional codemod golden tests: each `<name>.input.<ext>` file in
 * ./fixtures is transformed and compared byte for byte to its
 * `<name>.expected.<ext>` sibling. Fixtures whose expected file equals the
 * input document the cases the codemod must leave alone.
 */
const FIXTURES_DIRECTORY = fileURLToPath(new URL('fixtures', import.meta.url));

const fixtures = readdirSync(FIXTURES_DIRECTORY)
  .filter(file => /\.input\.[^.]+$/.test(file))
  .map(file => {
    const expected = file.replace(/\.input\.([^.]+)$/, '.expected.$1');
    return { name: file.replace(/\.input\.[^.]+$/, ''), input: file, expected };
  });

describe('fixtures', () => {
  it('finds fixture pairs', () => {
    expect(fixtures.length).toBeGreaterThan(0);
  });

  it.each(fixtures)('$name: input transforms into expected', ({ input, expected }) => {
    const source = readFileSync(join(FIXTURES_DIRECTORY, input), 'utf8');
    const expectedOutput = readFileSync(join(FIXTURES_DIRECTORY, expected), 'utf8');
    expect(transformHtml(source).output).toBe(expectedOutput);
  });

  it.each(fixtures)('$name: expected output is stable (idempotence)', ({ expected }) => {
    const expectedOutput = readFileSync(join(FIXTURES_DIRECTORY, expected), 'utf8');
    const rerun = transformHtml(expectedOutput);
    expect(rerun.output).toBe(expectedOutput);
    expect(rerun.changed).toBe(false);
  });
});
