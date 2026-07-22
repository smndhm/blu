import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import transform, { type SgRootLike } from '../src/codemod.js';

const fakeRoot = (source: string, fileName = 'page.html'): SgRootLike => ({
  root: () => ({ text: () => source }),
  filename: () => fileName,
});

describe('codemod workflow entry (codemod:ast-grep contract)', () => {
  let logged: string[];

  beforeEach(() => {
    logged = [];
    vi.spyOn(console, 'log').mockImplementation((...parts: unknown[]) => {
      logged.push(parts.join(' '));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the transformed source and logs the file with a count', async () => {
    const result = await transform(fakeRoot('<form method="get"><input type="text"></form>'));
    expect(result).toBe('<form><input></form>');
    expect(logged.join('\n')).toContain('page.html - Removing 2 native HTML default attribute(s)');
  });

  it('returns null when the file is untouched', async () => {
    expect(await transform(fakeRoot('<input type="email">'))).toBeNull();
    expect(logged).toEqual([]);
  });

  it('logs conditional skips with their reason, and still returns null when nothing is removed', async () => {
    const result = await transform(fakeRoot('<button type="submit">Go</button>'));
    expect(result).toBeNull();
    expect(logged.join('\n')).toContain('ℹ️ page.html:1:9 - keeping <button> type="submit"');
  });

  it('is idempotent through the workflow contract (second pass returns null)', async () => {
    const first = await transform(fakeRoot('<input type="text">'));
    expect(first).toBe('<input>');
    expect(await transform(fakeRoot(first as string))).toBeNull();
  });
});
