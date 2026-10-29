/**
 * Attributes that stylesheets and scripts depend on. Removing `type="text"` is a no-op for the browser, but not for
 * `input[type="text"]` or `input:not([type])` in a stylesheet, nor for `getAttribute('type')` in a script: such an
 * attribute is kept and reported with where it is referenced.
 */

export type SourceKind = 'css' | 'js' | 'mixed';

/** Where an attribute is referenced, as `file:line` */
export interface AttributeReference {
  /** Set when the presence of the attribute matters, whatever its value: `[type]`, `[type^="t"]`, `getAttribute('type')`, `hasAttribute('type')`, `toggleAttribute('type')` */
  anyValue?: string;
  /** Values compared with `=`, lowercased */
  values: Map<string, string>;
}

/** Keyed by attribute name and the element the selector is limited to (`input[type]`), `*` for any (`[type]`, `.a[type]`) */
export type AttributeReferences = Map<string, AttributeReference>;

const keyOf = (name: string, tag: string) => `${name.toLowerCase()} ${tag.toLowerCase()}`;

/**
 * The element a selector limits the attribute to: the type selector of its compound (`input` in `input.a[type]`, and in
 * `input:not([type])`), or `*` when there is none, or when the attribute is that of another element (`:has([type])`).
 */
function compoundTag(text: string, index: number): string {
  let start = index;
  for (;;) {
    // Walk back over the compound: names, classes, ids, pseudo-classes, and whole [attribute] selectors
    while (start > 0) {
      const char = text[start - 1];
      if (char === ']') {
        const open = text.lastIndexOf('[', start - 1);
        if (open === -1) return '*';
        start = open;
      } else if (/[\w\-.#:*]/.test(char)) {
        start -= 1;
      } else {
        break;
      }
    }
    // Inside :not(), :is() or :where(), the attribute is still the outer compound's element
    const pseudo = /:(?:not|is|where)\($/i.exec(text.slice(Math.max(0, start - 7), start));
    if (!pseudo) break;
    start -= pseudo[0].length;
  }
  // Only a compound that starts after a combinator, a comma, a brace or a quote is trusted; else any element
  if (start > 0 && !/[\s,>+~{}('"`]/.test(text[start - 1])) return '*';
  return /^[a-z][\w-]*/i.exec(text.slice(start, index))?.[0] ?? '*';
}

export function createReferences(): AttributeReferences {
  return new Map();
}

const ATTRIBUTE_SELECTOR = /\[\s*([A-Za-z_][\w:-]*)\s*(?:([~|^$*]?=)\s*(?:"([^"]*)"|'([^']*)'|([^\]\s'"]+)))?\s*(?:[iIsS]\s*)?\]/g;
// removeAttribute() and setAttribute() write without reading: what the markup had does not change what they do
const ATTRIBUTE_METHOD = /\b(get|has|toggle)Attribute(?:NS)?\s*\(\s*(?:[^,()]+,\s*)?(["'`])([^"'`]+)\2\s*\)/g;
/** A value read with getAttribute() and compared to a literal right away: only that literal matters */
const COMPARED_TO = /^\s*[!=]==?\s*(["'`])([^"'`$]*)\1/;
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
  const add = (name: string, offset: number, operator?: string, value?: string, tag = '*') => {
    const at = `${location}:${lineAt(text, offset) + lineOffset}`;
    const key = keyOf(name, tag);
    const reference: AttributeReference = references.get(key) ?? { values: new Map() };
    references.set(key, reference);
    if (operator === '=' && value !== undefined) {
      if (!reference.values.has(value.toLowerCase())) reference.values.set(value.toLowerCase(), at);
    } else {
      reference.anyValue ??= at;
    }
  };
  const scanSelectors = (chunk: string, base: number) => {
    for (const match of chunk.matchAll(ATTRIBUTE_SELECTOR)) add(match[1], base + match.index, match[2], match[3] ?? match[4] ?? match[5], compoundTag(chunk, match.index));
  };

  if (kind === 'js') {
    for (const literal of text.matchAll(STRING_LITERAL)) scanSelectors(literal[0], literal.index);
  } else {
    scanSelectors(text, 0);
  }
  if (kind !== 'css') {
    for (const match of text.matchAll(ATTRIBUTE_METHOD)) {
      const compared = match[1] === 'get' ? COMPARED_TO.exec(text.slice(match.index + match[0].length)) : null;
      if (compared) add(match[3], match.index, '=', compared[2]);
      else add(match[3], match.index);
    }
  }
}

/**
 * Where removing the attribute, or rewriting `value` away, would change what a selector or a script sees. With
 * `presenceKept`, the attribute stays and only its value goes (a boolean attribute written bare). With `tagName`, only
 * the references to any element and to that element count.
 */
export function findReference(references: AttributeReferences, name: string, value: string, presenceKept = false, tagName?: string): string | undefined {
  const prefix = `${name.toLowerCase()} `;
  for (const [key, reference] of references) {
    if (!key.startsWith(prefix)) continue;
    const tag = key.slice(prefix.length);
    if (tagName !== undefined && tag !== '*' && tag !== tagName.toLowerCase()) continue;
    if (!presenceKept && reference.anyValue) return reference.anyValue;
    const at = reference.values.get(value.toLowerCase());
    if (at) return at;
  }
  return undefined;
}
