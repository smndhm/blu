import { parseArgs } from 'node:util';
import { lstat, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';
import { RULES, transformHtml, type Finding, type RuleId } from './transform.js';
import { collectReferences, createReferences, SOURCE_KINDS, type AttributeReferences } from './references.js';

// Besides hidden entries (.git, .yarn, .next, .svelte-kit, .astro, .cache...): dependencies, tooling and build output
const IGNORED_DIRECTORIES = new Set(['node_modules', 'dist', 'build', 'coverage']);

const HELP = `codemod-drop-useless-attributes: remove the HTML attributes that have no effect, per the HTML and ARIA specifications

Usage:
  codemod-drop-useless-attributes [options] [paths...]

Paths can be files or directories (default: current directory).
Directories are walked recursively; node_modules, dist, build, coverage and hidden entries (.git, .yarn...) are skipped.

Options:
  --write              Apply the changes. Without it the codemod runs in dry-run mode and only reports.
  --ext <list>         Comma-separated extensions handled when walking directories (default: "html,htm").
                       Files passed explicitly are always processed. Example: --ext html,njk
  --rules <list>       Comma-separated rules to apply (default: all):
                       ${RULES.join(', ')}
  --references <path>  Also read the stylesheets and scripts of this path for attribute selectors (repeatable).
                       The paths to transform are always read.
  --no-references      Do not read stylesheets and scripts: an attribute a selector depends on may be removed.
  --help               Show this help.
`;

export interface FileReport {
  file: string;
  findings: Finding[];
  changed: boolean;
}

export interface ProcessOptions {
  write: boolean;
  extensions: string[];
  rules?: readonly RuleId[];
  /** Extra paths whose stylesheets and scripts are read; false to read none */
  references?: string[] | false;
}

async function collectFiles(paths: string[], accept: (path: string, explicit: boolean) => boolean): Promise<string[]> {
  const files: string[] = [];
  const visit = async (path: string, explicit: boolean): Promise<void> => {
    // A path given is followed; inside a directory, a symbolic link is not (it may loop, or point nowhere)
    const stats = await (explicit ? stat : lstat)(path);
    if (stats.isSymbolicLink()) return;
    if (stats.isDirectory()) {
      for (const entry of await readdir(path)) {
        if (IGNORED_DIRECTORIES.has(entry) || entry.startsWith('.')) continue;
        await visit(join(path, entry), false);
      }
    } else if (accept(path, explicit)) {
      files.push(path);
    }
  };
  for (const path of paths) await visit(path, true);
  return files;
}

const extensionOf = (path: string) => extname(path).slice(1).toLowerCase();

/** Reads the attribute selectors and attribute calls of every stylesheet and script under `paths` */
export async function readReferences(paths: string[]): Promise<AttributeReferences> {
  const references = createReferences();
  const files = await collectFiles(paths, path => extensionOf(path) in SOURCE_KINDS);
  for (const file of new Set(files)) {
    collectReferences(await readFile(file, 'utf8'), SOURCE_KINDS[extensionOf(file)], relative(process.cwd(), file), references);
  }
  return references;
}

export async function processFiles(paths: string[], options: ProcessOptions): Promise<FileReport[]> {
  const roots = paths.length > 0 ? paths : ['.'];
  const extensions = new Set(options.extensions.map(extension => extension.toLowerCase()));
  const files = await collectFiles(roots, (path, explicit) => explicit || extensions.has(extensionOf(path)));
  const references = options.references === false ? undefined : await readReferences([...roots, ...(options.references ?? [])]);
  const reports: FileReport[] = [];
  for (const file of files) {
    const source = await readFile(file, 'utf8');
    const { output, findings, changed } = transformHtml(source, { rules: options.rules, references, fileName: relative(process.cwd(), file) });
    if (changed && options.write) await writeFile(file, output, 'utf8');
    reports.push({ file, findings, changed });
  }
  return reports;
}

const VERBS: Record<Finding['type'], string> = { removed: 'remove ', rewritten: 'rewrite', skipped: 'skip   ', warning: 'warning' };

function formatFinding(file: string, finding: Finding): string {
  const location = `${relative(process.cwd(), file)}:${finding.line}:${finding.column}`;
  const attribute = `<${finding.tag}> ${finding.attribute}="${finding.value}"`;
  const reason = finding.reason ? ` (${finding.reason})` : '';
  return `${location} ${VERBS[finding.type]} ${attribute} [${finding.rule}]${reason}`;
}

function parseRules(list: string): RuleId[] {
  const rules = list
    .split(',')
    .map(rule => rule.trim())
    .filter(Boolean);
  const unknown = rules.filter(rule => !RULES.includes(rule as RuleId));
  if (unknown.length > 0) throw new Error(`Unknown rule(s): ${unknown.join(', ')}. Available: ${RULES.join(', ')}`);
  return rules as RuleId[];
}

export async function run(argv: string[]): Promise<number> {
  const { values, positionals } = parseArgs({
    args: argv,
    options: {
      'write': { type: 'boolean', default: false },
      'ext': { type: 'string', default: 'html,htm' },
      'rules': { type: 'string', default: RULES.join(',') },
      'references': { type: 'string', multiple: true, default: [] },
      'no-references': { type: 'boolean', default: false },
      'help': { type: 'boolean', default: false },
    },
    allowPositionals: true,
  });

  if (values.help) {
    console.log(HELP);
    return 0;
  }

  let rules: RuleId[];
  try {
    rules = parseRules(values.rules);
  } catch (error) {
    console.error((error as Error).message);
    return 2;
  }

  const reports = await processFiles(positionals, {
    write: values.write,
    extensions: values.ext.split(',').map(extension => extension.trim()),
    rules,
    references: values['no-references'] ? false : values.references,
  });

  const counts: Record<Finding['type'], number> = { removed: 0, rewritten: 0, skipped: 0, warning: 0 };
  for (const report of reports) {
    for (const finding of report.findings) {
      counts[finding.type] += 1;
      console.log(formatFinding(report.file, finding));
    }
  }

  const changedFiles = reports.filter(report => report.changed).length;
  const mode = values.write ? 'written' : 'dry-run';
  console.log(
    `\n${counts.removed} removable and ${counts.rewritten} rewritable attribute(s) in ${changedFiles} file(s), ${counts.skipped} skipped, ${counts.warning} warning(s), ${reports.length} file(s) scanned [${mode}]`,
  );
  if (!values.write && counts.removed + counts.rewritten > 0) console.log('Run again with --write to apply.');
  return 0;
}
