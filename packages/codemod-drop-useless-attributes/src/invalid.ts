/**
 * Invalid values of keyword attributes. The spec gives each keyword attribute an "invalid value default": the state a
 * value outside its keywords maps to. When that state is the "missing value default" too, an invalid value does
 * exactly what no attribute does, and removing it is a no-op. When the two differ (`crossorigin="foo"` means
 * anonymous, no attribute means no CORS; `hidden="foo"` hides), the value does something, so it is reported, never
 * removed.
 *
 * Keywords are listed here from the current WHATWG HTML Living Standard rather than taken from
 * `html-enumerated-attributes`, whose data lacks recent keywords (`contenteditable="plaintext-only"`,
 * `hidden="until-found"`) and lists `target`, which takes any navigable name, as a keyword attribute.
 */

const SPEC = 'https://html.spec.whatwg.org/multipage/';

export interface KeywordAttribute {
  attribute: string;
  /** Elements it applies to; undefined for a global attribute */
  tags?: string[];
  /** Valid keywords, lowercase unless `caseSensitive` */
  keywords: string[];
  caseSensitive?: boolean;
  /** Undefined when an invalid value maps to the missing value default; else what an invalid value does */
  invalidEffect?: string;
  source: string;
}

export const keywordAttributes: KeywordAttribute[] = [
  {
    attribute: 'type',
    tags: ['input'],
    keywords: [
      'hidden',
      'text',
      'search',
      'tel',
      'url',
      'email',
      'password',
      'date',
      'month',
      'week',
      'time',
      'datetime-local',
      'number',
      'range',
      'color',
      'checkbox',
      'radio',
      'file',
      'submit',
      'image',
      'reset',
      'button',
    ],
    source: `${SPEC}input.html#attr-input-type`,
  },
  { attribute: 'type', tags: ['button'], keywords: ['submit', 'reset', 'button'], source: `${SPEC}form-elements.html#attr-button-type` },
  { attribute: 'method', tags: ['form'], keywords: ['get', 'post', 'dialog'], source: `${SPEC}form-control-infrastructure.html#attr-fs-method` },
  {
    attribute: 'enctype',
    tags: ['form'],
    keywords: ['application/x-www-form-urlencoded', 'multipart/form-data', 'text/plain'],
    source: `${SPEC}form-control-infrastructure.html#attr-fs-enctype`,
  },
  { attribute: 'autocomplete', tags: ['form'], keywords: ['on', 'off'], source: `${SPEC}forms.html#attr-form-autocomplete` },
  { attribute: 'decoding', tags: ['img'], keywords: ['sync', 'async', 'auto'], source: `${SPEC}images.html#attr-img-decoding` },
  { attribute: 'loading', tags: ['img', 'iframe'], keywords: ['lazy', 'eager'], source: `${SPEC}urls-and-fetching.html#lazy-loading-attributes` },
  { attribute: 'fetchpriority', tags: ['img', 'link', 'script', 'iframe'], keywords: ['high', 'low', 'auto'], source: `${SPEC}urls-and-fetching.html#fetch-priority-attributes` },
  { attribute: 'wrap', tags: ['textarea'], keywords: ['soft', 'hard'], source: `${SPEC}form-elements.html#attr-textarea-wrap` },
  { attribute: 'shape', tags: ['area'], keywords: ['circle', 'circ', 'default', 'poly', 'polygon', 'rect', 'rectangle'], source: `${SPEC}image-maps.html#attr-area-shape` },
  {
    attribute: 'referrerpolicy',
    tags: ['a', 'area', 'iframe', 'img', 'link', 'script'],
    keywords: [
      '',
      'no-referrer',
      'no-referrer-when-downgrade',
      'same-origin',
      'origin',
      'strict-origin',
      'origin-when-cross-origin',
      'strict-origin-when-cross-origin',
      'unsafe-url',
    ],
    source: `${SPEC}urls-and-fetching.html#referrer-policy-attributes`,
  },
  { attribute: 'preload', tags: ['audio', 'video'], keywords: ['none', 'metadata', 'auto', ''], source: `${SPEC}media.html#attr-media-preload` },
  { attribute: 'scope', tags: ['th'], keywords: ['row', 'col', 'rowgroup', 'colgroup'], source: `${SPEC}tables.html#attr-th-scope` },
  { attribute: 'type', tags: ['ol'], keywords: ['1', 'a', 'A', 'i', 'I'], caseSensitive: true, source: `${SPEC}grouping-content.html#attr-ol-type` },
  { attribute: 'dir', keywords: ['ltr', 'rtl', 'auto'], source: `${SPEC}dom.html#the-dir-attribute` },
  { attribute: 'inputmode', keywords: ['none', 'text', 'tel', 'url', 'email', 'numeric', 'decimal', 'search'], source: `${SPEC}interaction.html#attr-inputmode` },
  { attribute: 'enterkeyhint', keywords: ['enter', 'done', 'go', 'next', 'previous', 'search', 'send'], source: `${SPEC}interaction.html#attr-enterkeyhint` },
  { attribute: 'spellcheck', keywords: ['true', 'false', ''], source: `${SPEC}interaction.html#attr-spellcheck` },
  { attribute: 'draggable', keywords: ['true', 'false'], source: `${SPEC}dnd.html#the-draggable-attribute` },
  { attribute: 'translate', keywords: ['yes', 'no', ''], source: `${SPEC}dom.html#attr-translate` },
  { attribute: 'contenteditable', keywords: ['true', 'false', 'plaintext-only', ''], source: `${SPEC}interaction.html#attr-contenteditable` },
  {
    attribute: 'crossorigin',
    tags: ['audio', 'img', 'link', 'script', 'video'],
    keywords: ['anonymous', 'use-credentials', ''],
    invalidEffect: 'an invalid value means anonymous, while no attribute means no CORS request: write crossorigin to keep it, or remove it',
    source: `${SPEC}urls-and-fetching.html#cors-settings-attributes`,
  },
  {
    attribute: 'kind',
    tags: ['track'],
    keywords: ['subtitles', 'captions', 'descriptions', 'chapters', 'metadata'],
    invalidEffect: 'an invalid value means metadata, a track that is never shown, while no attribute means subtitles',
    source: `${SPEC}media.html#attr-track-kind`,
  },
  {
    attribute: 'formmethod',
    tags: ['button', 'input'],
    keywords: ['get', 'post', 'dialog'],
    invalidEffect: "an invalid value means get, while no attribute means the form's method",
    source: `${SPEC}form-control-infrastructure.html#attr-fs-formmethod`,
  },
  {
    attribute: 'formenctype',
    tags: ['button', 'input'],
    keywords: ['application/x-www-form-urlencoded', 'multipart/form-data', 'text/plain'],
    invalidEffect: "an invalid value means application/x-www-form-urlencoded, while no attribute means the form's enctype",
    source: `${SPEC}form-control-infrastructure.html#attr-fs-formenctype`,
  },
  {
    attribute: 'hidden',
    keywords: ['', 'hidden', 'until-found'],
    invalidEffect: 'an invalid value hides the element: write hidden to keep it hidden, or remove it to show it',
    source: `${SPEC}interaction.html#the-hidden-attribute`,
  },
  {
    attribute: 'popover',
    keywords: ['auto', 'manual', 'hint', ''],
    invalidEffect: 'an invalid value means manual, while no attribute means no popover',
    source: `${SPEC}popover.html#attr-popover`,
  },
];

export function findKeywordAttribute(tagName: string, attribute: string): KeywordAttribute | undefined {
  return keywordAttributes.find(entry => entry.attribute === attribute && (entry.tags === undefined || entry.tags.includes(tagName)));
}

export function isValidKeyword(entry: KeywordAttribute, value: string): boolean {
  return entry.keywords.includes(entry.caseSensitive ? value : value.toLowerCase());
}

/**
 * ARIA states and properties taking a fixed set of tokens. Browsers differ on unknown values (Chrome hides content
 * with `aria-hidden="no"`; the spec treats an unknown `aria-invalid` or `aria-current` as true), so an invalid value is
 * only reported. https://w3c.github.io/aria/#state_prop_def
 */
export const ariaTokens: Record<string, string[]> = {
  'aria-atomic': ['true', 'false'],
  'aria-autocomplete': ['inline', 'list', 'both', 'none'],
  'aria-busy': ['true', 'false'],
  'aria-checked': ['true', 'false', 'mixed', 'undefined'],
  'aria-current': ['page', 'step', 'location', 'date', 'time', 'true', 'false'],
  'aria-disabled': ['true', 'false'],
  'aria-expanded': ['true', 'false', 'undefined'],
  'aria-haspopup': ['false', 'true', 'menu', 'listbox', 'tree', 'grid', 'dialog'],
  'aria-hidden': ['true', 'false', 'undefined'],
  'aria-invalid': ['grammar', 'false', 'spelling', 'true'],
  'aria-live': ['assertive', 'off', 'polite'],
  'aria-modal': ['true', 'false'],
  'aria-multiline': ['true', 'false'],
  'aria-multiselectable': ['true', 'false'],
  'aria-orientation': ['horizontal', 'undefined', 'vertical'],
  'aria-pressed': ['true', 'false', 'mixed', 'undefined'],
  'aria-readonly': ['true', 'false'],
  'aria-required': ['true', 'false'],
  'aria-selected': ['true', 'false', 'undefined'],
  'aria-sort': ['ascending', 'descending', 'none', 'other'],
};
