import { parseArgs } from 'node:util';
import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';
import { transformHtml, type Finding } from './transform.js';

const IGNORED_DIRECTORIES = new Set(['node_modules', 'dist', 'build', 'coverage', '.git']);

const HELP = `codemod-html-defaults — remove native HTML attributes whose value is already the spec default

Usage:
  codemod-html-defaults [options] [paths...]

Paths can be files or directories (default: current directory).
Directories are walked recursively; node_modules, dist, build, coverage and .git are skipped.

Options:
  --write         Apply the changes. Without it the codemod runs in dry-run mode and only reports.
  --ext <list>    Comma-separated extensions handled when walking directories (default: "html,htm").
                  Files passed explicitly are always processed. Example: --ext html,njk
  --help          Show this help.
`;

export interface FileReport {
  file: string;
  findings: Finding[];
  changed: boolean;
}

async function collectFiles(paths: string[], extensions: Set<string>): Promise<string[]> {
  const files: string[] = [];
  const visit = async (path: string, explicit: boolean): Promise<void> => {
    const stats = await stat(path);
    if (stats.isDirectory()) {
      for (const entry of await readdir(path)) {
        if (IGNORED_DIRECTORIES.has(entry)) continue;
        await visit(join(path, entry), false);
      }
    } else if (explicit || extensions.has(extname(path).slice(1).toLowerCase())) {
      files.push(path);
    }
  };
  for (const path of paths) await visit(path, true);
  return files;
}

export async function processFiles(paths: string[], options: { write: boolean; extensions: string[] }): Promise<FileReport[]> {
  const files = await collectFiles(paths.length > 0 ? paths : ['.'], new Set(options.extensions.map(extension => extension.toLowerCase())));
  const reports: FileReport[] = [];
  for (const file of files) {
    const source = await readFile(file, 'utf8');
    const { output, findings, changed } = transformHtml(source);
    if (changed && options.write) await writeFile(file, output, 'utf8');
    reports.push({ file, findings, changed });
  }
  return reports;
}

function formatFinding(file: string, finding: Finding): string {
  const location = `${relative(process.cwd(), file)}:${finding.line}:${finding.column}`;
  const attribute = `<${finding.tag}> ${finding.attribute}="${finding.value}"`;
  return finding.type === 'removed' ? `${location} remove ${attribute}` : `${location} skip   ${attribute} (${finding.reason})`;
}

export async function run(argv: string[]): Promise<number> {
  const { values, positionals } = parseArgs({
    args: argv,
    options: {
      write: { type: 'boolean', default: false },
      ext: { type: 'string', default: 'html,htm' },
      help: { type: 'boolean', default: false },
    },
    allowPositionals: true,
  });

  if (values.help) {
    console.log(HELP);
    return 0;
  }

  const reports = await processFiles(positionals, { write: values.write, extensions: values.ext.split(',').map(extension => extension.trim()) });

  let removed = 0;
  let skipped = 0;
  for (const report of reports) {
    for (const finding of report.findings) {
      if (finding.type === 'removed') removed += 1;
      else skipped += 1;
      console.log(formatFinding(report.file, finding));
    }
  }

  const changedFiles = reports.filter(report => report.changed).length;
  const mode = values.write ? 'written' : 'dry-run';
  console.log(`\n${removed} removable attribute(s) in ${changedFiles} file(s), ${skipped} skipped — ${reports.length} file(s) scanned [${mode}]`);
  if (!values.write && removed > 0) console.log('Run again with --write to apply.');
  return 0;
}
