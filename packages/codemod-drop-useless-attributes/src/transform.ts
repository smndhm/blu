import { ErrorCodes, parse, parseFragment } from 'parse5';
import type { DefaultTreeAdapterMap, ParserError } from 'parse5';
import { enumeratedAttributes, type Definition } from 'html-enumerated-attributes';
import { find, html } from 'property-information';
import { conditionalAttributes, conditionReasons, supplementaryRules, type ConditionId } from './defaults.js';
import { ariaDefaults, duplicatedNative, implicitRole, keptRedundantRoles, type ElementView } from './aria.js';
import { ariaAttributes, ariaTokens, findKeywordAttribute, isValidKeyword, probableAriaAttribute } from './invalid.js';
import { collectReferences, createReferences, findReference, type AttributeReferences } from './references.js';

type Element = DefaultTreeAdapterMap['element'];
type ParentNode = DefaultTreeAdapterMap['parentNode'];
type Node = DefaultTreeAdapterMap['node'];

const HTML_NS = 'http://www.w3.org/1999/xhtml';

/**
 * Template syntaxes that make a value dynamic: any brace covers Nunjucks/Jinja/Liquid (`{{ }}`, `{% %}`), Angular and
 * Vue interpolation, template literals (`${}`), and the expressions of Svelte, Astro and JSX (`type={kind}`); plus EJS
 * and JSP (`<%= %>`), PHP (`<?php ?>`, `<?= ?>`) and Razor (`@Model.Type`, `@(x)`).
 */
const DYNAMIC_VALUE = /[{}]|<%|<\?|(?:^|[^\w.])@[\w(]|\\["']/;

/**
 * Parts of a template file that are not markup, though they may look like it: front matter (YAML, TOML, JSON, Astro's
 * script) and template tags, where `{{ " aria-current=\"page\"" }}` or `"<input type=\"range\">"` is a string.
 * PHP code runs to `?>`, or to the end of the file, as its style guides recommend leaving it unclosed.
 */
const NOT_MARKUP = [/^(---|\+\+\+)\r?\n[\s\S]*?\r?\n\1[ \t]*(?:\r?\n|$)/g, /\{\{[\s\S]*?\}\}/g, /\{%[\s\S]*?%\}/g, /\{#[\s\S]*?#\}/g, /<%[\s\S]*?%>/g, /<\?[\s\S]*?(?:\?>|$)/g];

function notMarkupRanges(source: string): [number, number][] {
  return NOT_MARKUP.flatMap(pattern => [...source.matchAll(pattern)].map(match => [match.index, match.index + match[0].length] as [number, number]));
}

/** A tag written in PascalCase in the source is a framework component (Vue, Svelte, Astro, JSX), not an HTML element */
function isComponentTag(source: string, element: Element): boolean {
  const offset = element.sourceCodeLocation?.startTag?.startOffset;
  if (offset === undefined) return false;
  const written = source.slice(offset + 1, offset + 1 + element.tagName.length);
  return written !== written.toLowerCase() && written !== written.toUpperCase();
}

/**
 * - `html-default`: a native attribute whose value is the one used when it is missing (`<input type="text">`)
 * - `boolean-value`: a boolean attribute written with a value (`disabled="disabled"` becomes `disabled`)
 * - `aria-default`: an ARIA state or property set to its default (`aria-hidden="false"`)
 * - `redundant-role`: a role the element already has (`<nav role="navigation">`)
 * - `aria-native`: an ARIA attribute repeating a native one (`aria-required="true"` next to `required`)
 * - `invalid-value`: a keyword attribute with a value the spec does not define, removed when the browser then does what
 *   it does without the attribute (`<input type="txt">`), reported otherwise (`hidden="no"` hides)
 */
export type RuleId = 'html-default' | 'boolean-value' | 'aria-default' | 'redundant-role' | 'aria-native' | 'invalid-value';

export const RULES: readonly RuleId[] = ['html-default', 'boolean-value', 'aria-default', 'redundant-role', 'aria-native', 'invalid-value'];

export interface Finding {
  /** `removed` and `rewritten` are applied; `skipped` is a candidate kept on purpose; `warning` needs a person */
  type: 'removed' | 'rewritten' | 'skipped' | 'warning';
  rule: RuleId;
  tag: string;
  attribute: string;
  value: string;
  line: number;
  column: number;
  reason?: string;
}

export interface TransformResult {
  output: string;
  findings: Finding[];
  changed: boolean;
}

export interface TransformOptions {
  /** Rules to apply (default: all) */
  rules?: readonly RuleId[];
  /** Attributes referenced by the project's stylesheets and scripts; the inline `<style>` and `<script>` are always read */
  references?: AttributeReferences;
  /** Name of the file in reports of inline references */
  fileName?: string;
}

interface DocumentContext {
  isFullDocument: boolean;
  hasBaseTarget: boolean;
}

interface Edit {
  startOffset: number;
  endOffset: number;
  text: string;
}

/** What a rule decides for one attribute */
type Decision = { action: 'remove' | 'rewrite' | 'skip' | 'warn'; rule: RuleId; reason?: string } | undefined;

function isElement(node: Node): node is Element {
  return 'tagName' in node;
}

function* walk(parent: ParentNode): Generator<Element> {
  for (const child of parent.childNodes) {
    if (!isElement(child)) continue;
    yield child;
    if ('content' in child) yield* walk(child.content);
    yield* walk(child);
  }
}

function getAttribute(element: Element, name: string): string | undefined {
  return element.attrs.find(attribute => attribute.name === name)?.value;
}

function view(element: Element | undefined): ElementView | undefined {
  if (!element || !isElement(element) || element.namespaceURI !== HTML_NS) return undefined;
  return {
    tagName: element.tagName,
    attribute: name => getAttribute(element, name),
    get parent() {
      return view(element.parentNode as Element | undefined);
    },
  };
}

/**
 * True when `value` is in the same state group as the definition's missing
 * value default, i.e. removing the attribute is a spec-level no-op.
 */
function matchesMissingValueDefault(definition: Definition, value: string): boolean {
  if (typeof definition.missing !== 'string') return false;
  const folded = definition.caseSensitive ? value : value.toLowerCase();
  for (const state of definition.states) {
    if (state === null) continue;
    const group = Array.isArray(state) ? state : [state];
    if (group.includes(folded)) return group.includes(definition.missing);
  }
  return false;
}

/** Selectors in the enumerated-attributes data are plain comma-separated tag names; anything else is treated as non-matching for safety. */
function selectorMatchesTag(selector: string | undefined, tagName: string): boolean {
  if (selector === undefined) return true;
  return selector.split(',').some(part => part.trim() === tagName);
}

function findEnumeratedDefinition(tagName: string, attributeName: string): Definition | undefined {
  const entry = (enumeratedAttributes as Record<string, Definition | Definition[]>)[attributeName];
  if (!entry) return undefined;
  const definitions = Array.isArray(entry) ? entry : [entry];
  return definitions.find(definition => selectorMatchesTag(definition.selector, tagName));
}

/** True when the attribute appears in one of the defaults tables, whatever its value. */
function isKnownAttribute(tagName: string, attributeName: string): boolean {
  return supplementaryRules.some(rule => rule.tag === tagName && rule.attribute === attributeName) || findEnumeratedDefinition(tagName, attributeName) !== undefined;
}

/** True when removing the attribute with this literal value is a spec-level no-op, conditions aside. */
function isRemovableDefault(tagName: string, attributeName: string, value: string): boolean {
  const supplementary = supplementaryRules.find(rule => rule.tag === tagName && rule.attribute === attributeName);
  if (supplementary) return supplementary.equivalentToMissing.includes(value.toLowerCase());
  const definition = findEnumeratedDefinition(tagName, attributeName);
  return definition !== undefined && matchesMissingValueDefault(definition, value);
}

function resolveCondition(condition: ConditionId, element: Element, context: DocumentContext): boolean {
  switch (condition) {
    case 'no-base-target':
      return context.isFullDocument && !context.hasBaseTarget;
    case 'rel-stylesheet': {
      const rel = getAttribute(element, 'rel');
      return rel !== undefined && !DYNAMIC_VALUE.test(rel) && rel.toLowerCase().split(/\s+/).includes('stylesheet');
    }
    case 'form-association':
    case 'excluded':
      return false;
  }
}

function conditionFor(tagName: string, attributeName: string): ConditionId | undefined {
  const supplementary = supplementaryRules.find(rule => rule.tag === tagName && rule.attribute === attributeName);
  return supplementary?.condition ?? conditionalAttributes[tagName]?.[attributeName];
}

/** Boolean attributes only; `hidden` and `download` (which also take other values) and `contenteditable`-like `true`/`false` ones are not */
function isBooleanAttribute(name: string): boolean {
  if (name.startsWith('aria-') || name.startsWith('data-')) return false;
  return find(html, name).boolean;
}

/** Whether a rule is concerned by the attribute at all, to report its dynamic values */
function concernedRule(element: Element, name: string, rules: ReadonlySet<RuleId>): RuleId | undefined {
  if (rules.has('html-default') && (conditionFor(element.tagName, name) !== undefined || isKnownAttribute(element.tagName, name))) return 'html-default';
  if (rules.has('aria-default') && name in ariaDefaults) return 'aria-default';
  if (rules.has('redundant-role') && name === 'role') return 'redundant-role';
  if (rules.has('invalid-value') && (findKeywordAttribute(element.tagName, name) || name in ariaTokens)) return 'invalid-value';
  return undefined;
}

function decideHtmlDefault(element: Element, name: string, value: string, context: DocumentContext): Decision {
  // An empty value is never a removable native default: it is either a boolean presence or an invalid value.
  if (value === '' || !isRemovableDefault(element.tagName, name, value)) return undefined;
  const condition = conditionFor(element.tagName, name);
  if (condition !== undefined && !resolveCondition(condition, element, context)) return { action: 'skip', rule: 'html-default', reason: conditionReasons[condition] };
  return { action: 'remove', rule: 'html-default' };
}

function decideBooleanValue(name: string, value: string, hasValue: boolean): Decision {
  if (!hasValue || !isBooleanAttribute(name)) return undefined;
  if (value === '' || value.toLowerCase() === name) return { action: 'rewrite', rule: 'boolean-value' };
  return {
    action: 'warn',
    rule: 'boolean-value',
    reason: `a boolean attribute is true whatever its value: ${name}="${value}" means ${name}; remove it to mean false, or write ${name} alone`,
  };
}

function decideAriaDefault(name: string, value: string): Decision {
  const definition = ariaDefaults[name];
  if (!definition) return undefined;
  if (value === '' || definition.equivalentToMissing.includes(value)) return { action: 'remove', rule: 'aria-default' };
  return undefined;
}

function decideRedundantRole(element: ElementView, value: string): Decision {
  // An empty role is as if there were none: the element keeps its implicit role
  if (value.trim() === '') return { action: 'remove', rule: 'redundant-role', reason: 'an empty role is as if there were none' };
  // A single role in lowercase only: a list of roles is a fallback chain, and the browser reads it from the left.
  if (!/^[a-z]+$/.test(value) || implicitRole(element) !== value) return undefined;
  const kept = keptRedundantRoles[element.tagName]?.[value];
  if (kept) return { action: 'skip', rule: 'redundant-role', reason: kept };
  return { action: 'remove', rule: 'redundant-role' };
}

function decideAriaNative(element: ElementView, name: string, value: string): Decision {
  const native = duplicatedNative(element, name, value);
  if (native) return { action: 'remove', rule: 'aria-native', reason: `repeats ${native}` };
  // A native checkbox or radio button exposes its own checked state, which aria-checked can only contradict
  const type = element.attribute('type')?.toLowerCase();
  if (name === 'aria-checked' && element.tagName === 'input' && (type === 'checkbox' || type === 'radio')) {
    if (value === 'false' && element.attribute('checked') === undefined) return { action: 'remove', rule: 'aria-native', reason: 'repeats the unchecked state' };
    return { action: 'warn', rule: 'aria-native', reason: `aria-checked="${value}" contradicts the native checked state; use checked or indeterminate instead` };
  }
  return undefined;
}

/** `hasValue` tells `disabled=""` from a bare `disabled`, which parse to the same empty value */
function decideInvalidValue(element: Element, name: string, value: string): Decision {
  // An attribute ARIA does not define does nothing, but what the author meant is lost if it goes: reported only
  if (name.startsWith('aria-') && !ariaAttributes.has(name)) {
    const meant = probableAriaAttribute(name);
    return { action: 'warn', rule: 'invalid-value', reason: `${name} is not an ARIA attribute, so it does nothing${meant ? `; did you mean ${meant}?` : ''}` };
  }
  const entry = findKeywordAttribute(element.tagName, name);
  if (entry) {
    if (isValidKeyword(entry, value)) return undefined;
    // A typo in spacing or case may hide the intended value: removing it would lose what the author meant
    if (isValidKeyword(entry, value.trim()) || isValidKeyword({ ...entry, caseSensitive: false }, value.trim())) {
      return { action: 'warn', rule: 'invalid-value', reason: `not a valid ${name} value, so the browser ignores it; did you mean "${value.trim()}"?` };
    }
    if (entry.invalidEffect) return { action: 'warn', rule: 'invalid-value', reason: `not a valid ${name} value: ${entry.invalidEffect}` };
    return { action: 'remove', rule: 'invalid-value', reason: `not a valid ${name} value; the browser does what it does without the attribute` };
  }
  const tokens = ariaTokens[name];
  if (tokens && value !== '' && !tokens.includes(value.toLowerCase())) {
    return { action: 'warn', rule: 'invalid-value', reason: `not a valid ${name} value (${tokens.join(', ')}); browsers differ on what they do with it` };
  }
  return undefined;
}

function decide(element: Element, name: string, value: string, hasValue: boolean, rules: ReadonlySet<RuleId>, context: DocumentContext): Decision {
  const elementView = view(element)!;
  return (
    (rules.has('aria-default') ? decideAriaDefault(name, value) : undefined) ??
    (rules.has('aria-native') && name.startsWith('aria-') ? decideAriaNative(elementView, name, value) : undefined) ??
    (rules.has('redundant-role') && name === 'role' ? decideRedundantRole(elementView, value) : undefined) ??
    (rules.has('html-default') ? decideHtmlDefault(element, name, value, context) : undefined) ??
    (rules.has('boolean-value') ? decideBooleanValue(name, value, hasValue) : undefined) ??
    (rules.has('invalid-value') ? decideInvalidValue(element, name, value) : undefined)
  );
}

/**
 * Remove (or, for boolean attributes, rewrite) the attributes that the HTML
 * and ARIA specifications make useless. Everything outside the edited
 * attribute ranges is preserved byte for byte, so the transform is safe on
 * HTML-ish templates (Nunjucks, Jinja...) as long as the edited attributes
 * themselves are static literals.
 */
export function transformHtml(source: string, options: TransformOptions = {}): TransformResult {
  const rules = new Set(options.rules ?? RULES);

  // A start tag containing a duplicate attribute has unreliable attribute locations: leave the whole tag untouched.
  const duplicateOffsets: number[] = [];
  const parserOptions = {
    sourceCodeLocationInfo: true,
    onParseError: (error: ParserError) => {
      if (error.code === ErrorCodes.duplicateAttribute) duplicateOffsets.push(error.startOffset);
    },
  };

  const isFullDocument = /^\s*<!doctype\s/i.test(source) || /<html[\s>]/i.test(source);
  const notMarkup = notMarkupRanges(source);
  const tree: ParentNode = isFullDocument ? parse(source, parserOptions) : parseFragment(source, parserOptions);

  const context: DocumentContext = { isFullDocument, hasBaseTarget: false };
  // The project's references, plus the inline styles and scripts of this file
  const references = createReferences();
  for (const [name, reference] of options.references ?? []) references.set(name, { anyValue: reference.anyValue, values: new Map(reference.values) });
  for (const element of walk(tree)) {
    if (element.namespaceURI !== HTML_NS) continue;
    if (element.tagName === 'base' && getAttribute(element, 'target') !== undefined) context.hasBaseTarget = true;
    if (element.tagName === 'style' || element.tagName === 'script') {
      const text = element.childNodes.map(child => ('value' in child ? child.value : '')).join('');
      const line = (element.sourceCodeLocation?.startTag?.endLine ?? 1) - 1;
      collectReferences(text, element.tagName === 'style' ? 'css' : 'js', options.fileName ?? 'inline', references, line);
    }
  }

  const findings: Finding[] = [];
  const edits: Edit[] = [];

  for (const element of walk(tree)) {
    if (element.namespaceURI !== HTML_NS) continue;
    // Custom elements and framework components define their own semantics; native defaults do not apply.
    if (element.tagName.includes('-') || isComponentTag(source, element)) continue;
    const location = element.sourceCodeLocation;
    if (!location?.startTag || !location.attrs) continue;
    const { startTag } = location;
    if (duplicateOffsets.some(offset => offset >= startTag.startOffset && offset < startTag.endOffset)) continue;

    for (const attribute of element.attrs) {
      const { name, value } = attribute;
      const attributeLocation = location.attrs[name];
      if (!attributeLocation) continue;
      // Its name inside front matter or a template tag: a string of another language, not an attribute (a value that is
      // a template tag is reported as dynamic below)
      if (notMarkup.some(([start, end]) => attributeLocation.startOffset >= start && attributeLocation.startOffset < end)) continue;

      const report = (type: Finding['type'], rule: RuleId, reason?: string) =>
        findings.push({ type, rule, tag: element.tagName, attribute: name, value, line: attributeLocation.startLine, column: attributeLocation.startCol, reason });

      if (DYNAMIC_VALUE.test(value)) {
        // Only worth reporting when the attribute is one we would otherwise consider.
        const rule = concernedRule(element, name, rules);
        if (rule) report('skipped', rule, 'dynamic value (template binding or interpolation)');
        continue;
      }

      const hasValue = attributeLocation.endOffset - attributeLocation.startOffset > name.length;
      const decision = decide(element, name, value, hasValue, rules, context);
      if (!decision) continue;
      if (decision.action === 'skip' || decision.action === 'warn') {
        report(decision.action === 'skip' ? 'skipped' : 'warning', decision.rule, decision.reason);
        continue;
      }

      const referencedAt = findReference(references, name, value, decision.action === 'rewrite', element.tagName);
      if (referencedAt) {
        report('skipped', decision.rule, `referenced by a selector or a script at ${referencedAt}`);
        continue;
      }

      if (decision.action === 'rewrite') {
        // Keep the name as written, drop `="value"`
        edits.push({ startOffset: attributeLocation.startOffset + name.length, endOffset: attributeLocation.endOffset, text: '' });
        report('rewritten', decision.rule, decision.reason);
        continue;
      }

      let start = attributeLocation.startOffset;
      while (start > 0 && /\s/.test(source[start - 1])) start -= 1;
      edits.push({ startOffset: start, endOffset: attributeLocation.endOffset, text: '' });
      report('removed', decision.rule, decision.reason);
    }
  }

  let output = source;
  edits.sort((a, b) => b.startOffset - a.startOffset);
  for (const edit of edits) {
    output = output.slice(0, edit.startOffset) + edit.text + output.slice(edit.endOffset);
  }

  return { output, findings, changed: output !== source };
}
