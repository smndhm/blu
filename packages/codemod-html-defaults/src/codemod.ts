import { transformHtml } from './transform.js';

/**
 * Entry point matching the Codemod CLI (`codemod:ast-grep`) workflow contract:
 * a default-exported `transform(root)` returning the new source, or `null`
 * when the file is untouched.
 *
 * The runtime provides the `SgRoot`; only the two members below are used, so
 * they are typed structurally here rather than importing `codemod:ast-grep`
 * (a virtual module that only resolves inside the Codemod runtime). The
 * transformation itself does not go through ast-grep: the whole source is
 * handed to the parse5-based engine, which edits byte ranges and returns the
 * full file — equivalent to `commitEdits` over the root node.
 */
export interface SgRootLike {
  root(): { text(): string };
  filename(): string;
}

async function transform(root: SgRootLike): Promise<string | null> {
  const source = root.root().text();
  const fileName = root.filename();
  const { output, findings, changed } = transformHtml(source);

  const skipped = findings.filter(finding => finding.type === 'skipped');
  for (const finding of skipped) {
    console.log(`ℹ️ ${fileName}:${finding.line}:${finding.column} - keeping <${finding.tag}> ${finding.attribute}="${finding.value}" (${finding.reason})`);
  }

  if (!changed) return null;

  const removed = findings.length - skipped.length;
  console.log(`${fileName} - Removing ${removed} native HTML default attribute(s)`);
  return output;
}

export default transform;
