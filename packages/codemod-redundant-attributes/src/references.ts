/**
 * Attributes that stylesheets and scripts depend on. Removing `type="text"` is a no-op for the browser, but not for
 * `input[type="text"]` or `input:not([type])` in a stylesheet, nor for `getAttribute('type')` in a script: such an
 * attribute is kept and reported with where it is referenced.
 */

export type SourceKind = 'css' | 'js' | 'mixed';

/** Where an attribute is referenced, as `file:line` */
export interface AttributeReference {
  /** Set when the presence of the attribute matters, whatever its value: `[type]`, `[type^="t"]`, `getAttribute('type')` */
  anyValue?: string;
  /** Values compared with `=`, lowercased */
  values: Map<string, string>;
}

export type AttributeReferences = Map<string, AttributeReference>;

export function createReferences(): AttributeReferences {
  return new Map();
}

const ATTRIBUTE_SELECTOR = /\[\s*([A-Za-z_][\w:-]*)\s*(?:([~|^$*]?=)\s*(?:"([^"]*)"|'([^']*)'|([^\]\s'"]+)))?\s*(?:[iIsS]\s*)?\]/g;
const ATTRIBUTE_METHOD = /\b(?:get|has|remove|toggle)Attribute(?:NS)?\s*\(\s*(?:[^,()]+,\s*)?(["'`])([^"'`]+)\1/g;
const STRING_LITERAL = /'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`/g;

export const SOURCE_KINDS: Record<string, SourceKind> = {
  css: 'css',
  scss: 'css',
  sass: 'css',
  less: 'css',
  styl: 'css',
  js: 'js',
  mjs: 'js',
  cjs: 'js',
  jsx: 'js',
  ts: 'js',
  mts: 'js',
  cts: 'js',
  tsx: 'js',
  vue: 'mixed',
  svelte: 'mixed',
  astro: 'mixed',
};

function lineAt(text: string, offset: number): number {
  let line = 1;
  for (let index = text.indexOf('\n'); index !== -1 && index < offset; index = text.indexOf('\n', index + 1)) line += 1;
  return line;
}

/**
 * Adds the attributes referenced in `text` to `references`. Selectors are read from the whole text of a stylesheet,
 * and only from string literals in a script, so that `items[index]` is not taken for a selector.
 */
export function collectReferences(text: string, kind: SourceKind, location: string, references: AttributeReferences, lineOffset = 0): void {
  const add = (name: string, offset: number, operator?: string, value?: string) => {
    const at = `${location}:${lineAt(text, offset) + lineOffset}`;
    const key = name.toLowerCase();
    const reference: AttributeReference = references.get(key) ?? { values: new Map() };
    references.set(key, reference);
    if (operator === '=' && value !== undefined) {
      if (!reference.values.has(value.toLowerCase())) reference.values.set(value.toLowerCase(), at);
    } else {
      reference.anyValue ??= at;
    }
  };
  const scanSelectors = (chunk: string, base: number) => {
    for (const match of chunk.matchAll(ATTRIBUTE_SELECTOR)) add(match[1], base + match.index, match[2], match[3] ?? match[4] ?? match[5]);
  };

  if (kind === 'js') {
    for (const literal of text.matchAll(STRING_LITERAL)) scanSelectors(literal[0], literal.index);
  } else {
    scanSelectors(text, 0);
  }
  if (kind !== 'css') {
    for (const match of text.matchAll(ATTRIBUTE_METHOD)) add(match[2], match.index);
  }
}

/**
 * Where removing the attribute, or rewriting `value` away, would change what a selector or a script sees. With
 * `presenceKept`, the attribute stays and only its value goes (a boolean attribute written bare).
 */
export function findReference(references: AttributeReferences, name: string, value: string, presenceKept = false): string | undefined {
  const reference = references.get(name.toLowerCase());
  if (!reference) return undefined;
  if (!presenceKept && reference.anyValue) return reference.anyValue;
  return reference.values.get(value.toLowerCase());
}
