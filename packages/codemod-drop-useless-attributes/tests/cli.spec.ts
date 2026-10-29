import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { processFiles, run } from '../src/cli.js';

const SAMPLE = '<!doctype html>\n<html><body><form method="get"><input type="text"></form></body></html>\n';
const CLEANED = '<!doctype html>\n<html><body><form><input></form></body></html>\n';

describe('processFiles', () => {
  let directory: string;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'codemod-drop-useless-attributes-'));
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

  it('keeps an attribute a stylesheet of the project selects, and reads stylesheets from --references too', async () => {
    await writeFile(join(directory, 'style.css'), 'form[method="get"] { margin: 0 }');
    const reports = await processFiles([join(directory, 'page.html')], { write: false, extensions: ['html'], references: [directory] });
    expect(reports[0].findings).toMatchObject([
      { type: 'skipped', attribute: 'method', reason: expect.stringContaining('style.css:1') },
      { type: 'removed', attribute: 'type' },
    ]);
    const unchecked = await processFiles([join(directory, 'page.html')], { write: false, extensions: ['html'], references: false });
    expect(unchecked[0].findings.filter(finding => finding.type === 'removed')).toHaveLength(2);
  });

  it('applies only the rules asked for', async () => {
    const reports = await processFiles([directory], { write: false, extensions: ['html'], rules: ['aria-default'] });
    expect(reports[0].changed).toBe(false);
  });

  it('skips hidden directories, such as a vendored .yarn release, for files and selectors alike', async () => {
    await mkdir(join(directory, '.yarn'));
    await writeFile(join(directory, '.yarn', 'release.cjs'), 'document.querySelector("form[method]")');
    await writeFile(join(directory, '.yarn', 'page.html'), SAMPLE);
    const reports = await processFiles([directory], { write: false, extensions: ['html'] });
    expect(reports.map(report => report.file)).toEqual([join(directory, 'page.html')]);
    expect(reports[0].findings.filter(finding => finding.type === 'removed')).toHaveLength(2);
  });

  it('skips symbolic links inside a directory, broken or looping', async () => {
    await symlink(join(directory, 'missing'), join(directory, 'broken.html'));
    await symlink(directory, join(directory, 'loop'));
    const reports = await processFiles([directory], { write: false, extensions: ['html'] });
    expect(reports.map(report => report.file)).toEqual([join(directory, 'page.html')]);
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
    directory = await mkdtemp(join(tmpdir(), 'codemod-drop-useless-attributes-run-'));
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
    expect(output).toContain('remove  <form> method="get" [html-default]');
    expect(output).toContain('remove  <input> type="text" [html-default]');
    expect(output).toContain('2 removable and 0 rewritable attribute(s) in 1 file(s), 0 skipped, 0 warning(s), 1 file(s) scanned [dry-run]');
    expect(output).toContain('Run again with --write to apply.');
    expect(await readFile(join(directory, 'page.html'), 'utf8')).toBe(SAMPLE);
  });

  it('rejects an unknown rule', async () => {
    const errors: string[] = [];
    vi.spyOn(console, 'error').mockImplementation((...parts: unknown[]) => {
      errors.push(parts.join(' '));
    });
    expect(await run(['--rules', 'html-default,nope', directory])).toBe(2);
    expect(errors.join('\n')).toContain('Unknown rule(s): nope');
  });

  it('--write applies and reports the written mode', async () => {
    expect(await run(['--write', directory])).toBe(0);
    expect(logged.join('\n')).toContain('[written]');
    expect(await readFile(join(directory, 'page.html'), 'utf8')).toBe(CLEANED);
  });
});
