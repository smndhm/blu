/**
 * Sources of truth for "this literal value is already the default" decisions.
 *
 * Primary source: the `html-enumerated-attributes` package (MIT, unified
 * collective), which encodes the WHATWG "missing value default" of every
 * enumerated HTML attribute as equivalence classes of states. An attribute
 * is removable when its (case-folded) value belongs to the same state group
 * as the missing value default — i.e. removing it is a spec-level no-op.
 *
 * This module adds two overlays on top of that data:
 *
 * 1. `supplementaryRules`: attributes that are NOT enumerated (MIME types),
 *    so absent from the package, each entry sourced to the WHATWG HTML
 *    Living Standard and cross-checked with `html-minifier-terser`'s
 *    redundant-attribute handling.
 * 2. `conditionalAttributes`: attributes whose default is contextual. These
 *    are never treated as a flat default — they are either checked against
 *    the real condition (document scope, sibling attributes) or skipped and
 *    reported.
 */

/**
 * Identifiers of contextual conditions.
 *
 * - `no-base-target`: removing `target="_self"` is only a no-op when the
 *   document contains no `<base target>` (WHATWG: the missing `target`
 *   falls back to the base element's target). The condition is only
 *   checkable on a full document — fragments/partials may be included into
 *   a layout that declares a `<base>`, so they are always skipped.
 *   https://html.spec.whatwg.org/multipage/semantics.html#the-base-element
 * - `rel-stylesheet`: `type="text/css"` on `<link>` is only the default
 *   for `rel="stylesheet"` links.
 *   https://html.spec.whatwg.org/multipage/semantics.html#attr-link-type
 * - `form-association`: `<button type="submit">` is the missing value
 *   default per spec, but the effective behavior of a button depends on its
 *   form association (and historically diverged between browsers outside a
 *   form). Not automated in v1: always skipped and reported for manual
 *   review. https://html.spec.whatwg.org/multipage/form-elements.html#attr-button-type
 * - `excluded`: never removable; removing it would not be a local no-op at
 *   all (e.g. `target` on `<base>` sets the default for the whole document).
 */
export type ConditionId = 'no-base-target' | 'rel-stylesheet' | 'form-association' | 'excluded';

export interface SupplementaryRule {
  tag: string;
  attribute: string;
  /** Lowercased literal values equivalent to the attribute being absent. */
  equivalentToMissing: string[];
  condition?: ConditionId;
  /** Link to the normative definition this entry was checked against. */
  source: string;
  note: string;
}

/**
 * Non-enumerated attributes with a spec-defined default, verified entry by
 * entry against the WHATWG HTML Living Standard.
 */
export const supplementaryRules: SupplementaryRule[] = [
  {
    tag: 'script',
    attribute: 'type',
    equivalentToMissing: ['text/javascript'],
    source: 'https://html.spec.whatwg.org/multipage/scripting.html#attr-script-type',
    note:
      'Omitting the attribute, setting it to the empty string, or setting it to a JavaScript MIME type essence match all mean "classic script"; ' +
      'only the canonical `text/javascript` is removed (never `module`, `importmap`, or data blocks). ' +
      'Cross-checked with html-minifier-terser `removeScriptTypeAttributes`.',
  },
  {
    tag: 'style',
    attribute: 'type',
    equivalentToMissing: ['text/css'],
    source: 'https://html.spec.whatwg.org/multipage/semantics.html#attr-style-type',
    note: 'The type attribute of <style>, if present, must be `text/css` (ASCII case-insensitive); omitting it has the same meaning. Cross-checked with html-minifier-terser `removeStyleLinkTypeAttributes`.',
  },
  {
    tag: 'link',
    attribute: 'type',
    equivalentToMissing: ['text/css'],
    condition: 'rel-stylesheet',
    source: 'https://html.spec.whatwg.org/multipage/semantics.html#attr-link-type',
    note: 'For `rel="stylesheet"` links the default type is `text/css`; for any other rel the type attribute is meaningful and kept.',
  },
];

/**
 * Attributes present in the enumerated-attributes data whose "missing value
 * default" is contextual and must not be applied flatly.
 */
export const conditionalAttributes: Record<string, Record<string, ConditionId>> = {
  a: { target: 'no-base-target' },
  area: { target: 'no-base-target' },
  form: { target: 'no-base-target' },
  base: { target: 'excluded' },
  button: { type: 'form-association' },
};

/** Human-readable reasons used in dry-run reports for skipped conditionals. */
export const conditionReasons: Record<ConditionId, string> = {
  'no-base-target': 'target defaults depend on <base target>; only removed in a full document without one',
  'rel-stylesheet': 'type="text/css" is only the default when rel="stylesheet"',
  'form-association': 'button[type] default depends on form association; left for manual review (v1)',
  'excluded': 'never a local no-op (e.g. <base target> sets the document-wide default)',
};
