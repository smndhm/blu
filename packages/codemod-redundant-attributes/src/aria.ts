/**
 * ARIA attributes that the specifications make redundant, each table sourced to WAI-ARIA 1.3 or ARIA in HTML. Only the
 * cases whose removal is a no-op whatever the element's role are listed: a value whose meaning depends on the role (the
 * live region attributes on `alert` or `status`, `aria-haspopup` on `combobox`, `aria-orientation`) is never touched.
 */

/** The WAI-ARIA section on author errors: an empty value is treated as if the attribute were not specified. */
export const EMPTY_VALUE_SOURCE = 'https://w3c.github.io/aria/#document-handling_author-errors_states-properties';

export interface AriaDefault {
  /** Literal values (lowercase, exact: no trimming) equivalent to the attribute being absent. */
  equivalentToMissing: string[];
  source: string;
  note?: string;
}

/**
 * States and properties whose default value no role overrides, with the literal values equal to it. Values are
 * compared exactly: `aria-hidden="false "` or `aria-hidden="no"` are unknown values, which the specification treats as
 * `true` and Chrome hides, so they are never touched.
 */
export const ariaDefaults: Record<string, AriaDefault> = {
  'aria-hidden': {
    equivalentToMissing: ['undefined', 'false'],
    source: 'https://w3c.github.io/aria/#aria-hidden',
    note: 'As of ARIA 1.3, aria-hidden="false" is synonymous with aria-hidden="undefined", the default: its original intent (exposing content otherwise hidden) is no longer supported.',
  },
  'aria-checked': { equivalentToMissing: ['undefined'], source: 'https://w3c.github.io/aria/#aria-checked' },
  'aria-expanded': { equivalentToMissing: ['undefined'], source: 'https://w3c.github.io/aria/#aria-expanded' },
  'aria-pressed': { equivalentToMissing: ['undefined'], source: 'https://w3c.github.io/aria/#aria-pressed' },
  'aria-selected': { equivalentToMissing: ['undefined'], source: 'https://w3c.github.io/aria/#aria-selected' },
  'aria-busy': { equivalentToMissing: ['false'], source: 'https://w3c.github.io/aria/#aria-busy' },
  'aria-current': { equivalentToMissing: ['false'], source: 'https://w3c.github.io/aria/#aria-current' },
  'aria-disabled': { equivalentToMissing: ['false'], source: 'https://w3c.github.io/aria/#aria-disabled' },
  'aria-invalid': { equivalentToMissing: ['false'], source: 'https://w3c.github.io/aria/#aria-invalid' },
  'aria-multiline': { equivalentToMissing: ['false'], source: 'https://w3c.github.io/aria/#aria-multiline' },
  'aria-multiselectable': { equivalentToMissing: ['false'], source: 'https://w3c.github.io/aria/#aria-multiselectable' },
  'aria-readonly': { equivalentToMissing: ['false'], source: 'https://w3c.github.io/aria/#aria-readonly' },
  'aria-required': { equivalentToMissing: ['false'], source: 'https://w3c.github.io/aria/#aria-required' },
  'aria-autocomplete': { equivalentToMissing: ['none'], source: 'https://w3c.github.io/aria/#aria-autocomplete' },
  'aria-sort': { equivalentToMissing: ['none'], source: 'https://w3c.github.io/aria/#aria-sort' },
};

/** What the implicit role of an element depends on, read from the element itself */
export interface ElementView {
  tagName: string;
  attribute(name: string): string | undefined;
  /** The parent element, when it is an HTML element */
  parent: ElementView | undefined;
}

/** The ARIA in HTML document conformance table: https://www.w3.org/TR/html-aria/#docconformance */
export const IMPLICIT_ROLES_SOURCE = 'https://www.w3.org/TR/html-aria/#docconformance';

/** Elements whose implicit role does not depend on their attributes or context */
const unconditionalRoles: Record<string, string> = {
  address: 'group',
  article: 'article',
  blockquote: 'blockquote',
  button: 'button',
  code: 'code',
  datalist: 'listbox',
  dd: 'definition',
  del: 'deletion',
  details: 'group',
  dfn: 'term',
  dialog: 'dialog',
  dt: 'term',
  em: 'emphasis',
  fieldset: 'group',
  figure: 'figure',
  form: 'form',
  hgroup: 'group',
  hr: 'separator',
  ins: 'insertion',
  main: 'main',
  menu: 'list',
  meter: 'meter',
  nav: 'navigation',
  ol: 'list',
  optgroup: 'group',
  output: 'status',
  p: 'paragraph',
  progress: 'progressbar',
  search: 'search',
  strong: 'strong',
  sub: 'subscript',
  sup: 'superscript',
  table: 'table',
  tbody: 'rowgroup',
  textarea: 'textbox',
  tfoot: 'rowgroup',
  thead: 'rowgroup',
  time: 'time',
  tr: 'row',
  ul: 'list',
};

const LISTS = ['menu', 'ol', 'ul'];

/** `<input>` types and their implicit role; the text-like ones only without a `list` attribute (else combobox) */
const inputRoles: Record<string, string> = {
  button: 'button',
  checkbox: 'checkbox',
  image: 'button',
  number: 'spinbutton',
  radio: 'radio',
  range: 'slider',
  reset: 'button',
  submit: 'button',
};
const textInputRoles: Record<string, string> = { email: 'textbox', tel: 'textbox', text: 'textbox', url: 'textbox', search: 'searchbox' };

/**
 * The element's implicit role when it is certain from the markup alone, else undefined. Left out on purpose: headings
 * (an explicit `heading` role drops the level the tag gave), `aside`, `header`, `footer` and `section` (their role
 * depends on their ancestors or an accessible name), `img` with an empty `alt`, `option`, `td`, `th`, and `li` outside
 * a list that keeps its own role.
 */
export function implicitRole(element: ElementView): string | undefined {
  const { tagName } = element;
  if (tagName in unconditionalRoles) return unconditionalRoles[tagName];
  if (tagName === 'li') {
    const parent = element.parent;
    if (!parent || !LISTS.includes(parent.tagName)) return undefined;
    const parentRole = parent.attribute('role');
    return parentRole === undefined || parentRole === 'list' ? 'listitem' : undefined;
  }
  if (tagName === 'a' || tagName === 'area') return element.attribute('href') === undefined ? undefined : 'link';
  if (tagName === 'img') {
    const alt = element.attribute('alt');
    return alt !== undefined && alt !== '' ? 'img' : undefined;
  }
  if (tagName === 'input') {
    const type = (element.attribute('type') ?? 'text').toLowerCase();
    if (type in inputRoles) return inputRoles[type];
    if (type in textInputRoles) return element.attribute('list') === undefined ? textInputRoles[type] : undefined;
    return undefined;
  }
  if (tagName === 'select') {
    const size = element.attribute('size');
    if (element.attribute('multiple') !== undefined) return 'listbox';
    if (size === undefined) return 'combobox';
    return /^\d+$/.test(size) && Number(size) > 1 ? 'listbox' : /^[01]$/.test(size) ? 'combobox' : undefined;
  }
  return undefined;
}

/**
 * Redundant roles kept anyway, with why: removing them would change what people get from today's browsers.
 */
export const keptRedundantRoles: Record<string, Record<string, string>> = {
  ul: { list: 'WebKit (Safari, VoiceOver) drops the list semantics of a list styled with list-style: none; role="list" restores them' },
  ol: { list: 'WebKit (Safari, VoiceOver) drops the list semantics of a list styled with list-style: none; role="list" restores them' },
  menu: { list: 'WebKit (Safari, VoiceOver) drops the list semantics of a list styled with list-style: none; role="list" restores them' },
};

/** ARIA in HTML: authors SHOULD NOT use an ARIA attribute repeating a native one. https://www.w3.org/TR/html-aria/#docconformance-attr */
export const NATIVE_DUPLICATES_SOURCE = 'https://www.w3.org/TR/html-aria/#docconformance-attr';

export interface NativeDuplicate {
  aria: string;
  value: string;
  /** The native boolean attribute the ARIA one repeats */
  native: string;
  elements: string[];
}

export const nativeDuplicates: NativeDuplicate[] = [
  { aria: 'aria-required', value: 'true', native: 'required', elements: ['input', 'select', 'textarea'] },
  { aria: 'aria-disabled', value: 'true', native: 'disabled', elements: ['button', 'fieldset', 'input', 'optgroup', 'option', 'select', 'textarea'] },
  { aria: 'aria-readonly', value: 'true', native: 'readonly', elements: ['input', 'textarea'] },
  { aria: 'aria-checked', value: 'true', native: 'checked', elements: ['input'] },
];

/** The native attribute an ARIA attribute repeats on this element with this value, if any */
export function duplicatedNative(element: ElementView, aria: string, value: string): string | undefined {
  for (const duplicate of nativeDuplicates) {
    if (duplicate.aria !== aria || duplicate.value !== value || !duplicate.elements.includes(element.tagName)) continue;
    if (element.attribute(duplicate.native) === undefined) continue;
    // aria-checked only on the controls whose checkedness `checked` sets
    if (duplicate.native === 'checked' && !['checkbox', 'radio'].includes((element.attribute('type') ?? '').toLowerCase())) continue;
    return duplicate.native;
  }
  // `hidden` hides from everyone, but not hidden="until-found", which stays findable by the page search
  if (aria === 'aria-hidden' && value === 'true') {
    const hidden = element.attribute('hidden');
    if (hidden !== undefined && hidden.toLowerCase() !== 'until-found') return 'hidden';
  }
  return undefined;
}
