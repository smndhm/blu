import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { processFiles, run } from '../src/cli.js';

const SAMPLE = '<!doctype html>\n<html><body><form method="get"><input type="text"></form></body></html>\n';
const CLEANED = '<!doctype html>\n<html><body><form><input></form></body></html>\n';

describe('processFiles', () => {
  let directory: string;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'codemod-html-defaults-'));
    await writeFile(join(directory, 'page.html'), SAMPLE);
    await writeFile(join(directory, 'partial.njk'), '<input type="text" value="{{ value }}">\n');
    await mkdir(join(directory, 'node_modules'));
    await writeFile(join(directory, 'node_modules', 'dep.html'), SAMPLE);
  });

  afterEach(async () => {
    await rm(directory, { recursive: true, force: true });
  });

  it('dry-run reports without writing', async () => {
    const reports = await processFiles([directory], { write: false, extensions: ['html'] });
    expect(reports).toHaveLength(1);
    expect(reports[0].changed).toBe(true);
    expect(reports[0].findings.filter(finding => finding.type === 'removed')).toHaveLength(2);
    expect(await readFile(join(directory, 'page.html'), 'utf8')).toBe(SAMPLE);
  });

  it('never descends into node_modules', async () => {
    const reports = await processFiles([directory], { write: false, extensions: ['html'] });
    expect(reports.map(report => report.file)).toEqual([join(directory, 'page.html')]);
  });

  it('--write applies the changes and a second run is a no-op', async () => {
    await processFiles([directory], { write: true, extensions: ['html'] });
    expect(await readFile(join(directory, 'page.html'), 'utf8')).toBe(CLEANED);

    const second = await processFiles([directory], { write: true, extensions: ['html'] });
    expect(second[0].changed).toBe(false);
    expect(await readFile(join(directory, 'page.html'), 'utf8')).toBe(CLEANED);
  });

  it('handles template files when their extension is opted in, leaving dynamic values alone', async () => {
    const reports = await processFiles([directory], { write: true, extensions: ['njk'] });
    expect(reports.map(report => report.file)).toEqual([join(directory, 'partial.njk')]);
    expect(await readFile(join(directory, 'partial.njk'), 'utf8')).toBe('<input value="{{ value }}">\n');
  });

  it('processes explicitly passed files regardless of extension filter', async () => {
    const file = join(directory, 'page.html');
    const reports = await processFiles([file], { write: false, extensions: ['njk'] });
    expect(reports.map(report => report.file)).toEqual([file]);
  });
});

describe('run', () => {
  let directory: string;
  let logged: string[];

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'codemod-html-defaults-run-'));
    await writeFile(join(directory, 'page.html'), SAMPLE);
    logged = [];
    vi.spyOn(console, 'log').mockImplementation((...parts: unknown[]) => {
      logged.push(parts.join(' '));
    });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(directory, { recursive: true, force: true });
  });

  it('--help prints usage and exits 0', async () => {
    expect(await run(['--help'])).toBe(0);
    expect(logged.join('\n')).toContain('Usage:');
  });

  it('dry-run reports each finding, the summary, and how to apply', async () => {
    expect(await run([directory])).toBe(0);
    const output = logged.join('\n');
    expect(output).toContain('remove <form> method="get"');
    expect(output).toContain('remove <input> type="text"');
    expect(output).toContain('2 removable attribute(s) in 1 file(s), 0 skipped — 1 file(s) scanned [dry-run]');
    expect(output).toContain('Run again with --write to apply.');
    expect(await readFile(join(directory, 'page.html'), 'utf8')).toBe(SAMPLE);
  });

  it('--write applies and reports the written mode', async () => {
    expect(await run(['--write', directory])).toBe(0);
    expect(logged.join('\n')).toContain('[written]');
    expect(await readFile(join(directory, 'page.html'), 'utf8')).toBe(CLEANED);
  });
});
