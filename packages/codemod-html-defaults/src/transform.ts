import { ErrorCodes, parse, parseFragment } from 'parse5';
import type { DefaultTreeAdapterMap, ParserError } from 'parse5';
import { enumeratedAttributes, type Definition } from 'html-enumerated-attributes';
import { conditionalAttributes, conditionReasons, supplementaryRules, type ConditionId } from './defaults.js';

type Element = DefaultTreeAdapterMap['element'];
type ParentNode = DefaultTreeAdapterMap['parentNode'];
type Node = DefaultTreeAdapterMap['node'];

const HTML_NS = 'http://www.w3.org/1999/xhtml';

/** Template syntaxes (Nunjucks/Jinja, Angular/Vue interpolation, EJS, template literals) that make a value dynamic. */
const DYNAMIC_VALUE = /\{\{|\{%|<%|\$\{/;

export interface Finding {
  type: 'removed' | 'skipped';
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

interface DocumentContext {
  isFullDocument: boolean;
  hasBaseTarget: boolean;
}

interface Removal {
  startOffset: number;
  endOffset: number;
}

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

/**
 * Remove native HTML attributes whose literal value is already the spec
 * default. Everything outside the removed attribute ranges is preserved
 * byte for byte, so the transform is safe on HTML-ish templates (Nunjucks,
 * Jinja…) as long as removable attributes themselves are static literals.
 */
export function transformHtml(source: string): TransformResult {
  // A start tag containing a duplicate attribute has unreliable attribute locations — leave the whole tag untouched.
  const duplicateOffsets: number[] = [];
  const options = {
    sourceCodeLocationInfo: true,
    onParseError: (error: ParserError) => {
      if (error.code === ErrorCodes.duplicateAttribute) duplicateOffsets.push(error.startOffset);
    },
  };

  const isFullDocument = /^\s*<!doctype\s/i.test(source) || /<html[\s>]/i.test(source);
  const tree: ParentNode = isFullDocument ? parse(source, options) : parseFragment(source, options);

  const context: DocumentContext = { isFullDocument, hasBaseTarget: false };
  for (const element of walk(tree)) {
    if (element.tagName === 'base' && element.namespaceURI === HTML_NS && getAttribute(element, 'target') !== undefined) {
      context.hasBaseTarget = true;
    }
  }

  const findings: Finding[] = [];
  const removals: Removal[] = [];

  for (const element of walk(tree)) {
    if (element.namespaceURI !== HTML_NS) continue;
    // Custom elements define their own semantics; native defaults do not apply.
    if (element.tagName.includes('-')) continue;
    const location = element.sourceCodeLocation;
    if (!location?.startTag || !location.attrs) continue;
    const { startTag } = location;
    if (duplicateOffsets.some(offset => offset >= startTag.startOffset && offset < startTag.endOffset)) continue;

    for (const attribute of element.attrs) {
      const value = attribute.value;
      // Boolean-style presence (empty value) is never a removable default.
      if (value === '') continue;

      const attributeLocation = location.attrs[attribute.name];
      if (!attributeLocation) continue;

      const report = (type: Finding['type'], reason?: string) =>
        findings.push({ type, tag: element.tagName, attribute: attribute.name, value, line: attributeLocation.startLine, column: attributeLocation.startCol, reason });

      const condition = conditionFor(element.tagName, attribute.name);

      if (DYNAMIC_VALUE.test(value)) {
        // Only worth reporting when the attribute is one we would otherwise consider.
        if (condition !== undefined || isKnownAttribute(element.tagName, attribute.name)) {
          report('skipped', 'dynamic value (template binding or interpolation)');
        }
        continue;
      }

      if (!isRemovableDefault(element.tagName, attribute.name, value)) continue;

      if (condition !== undefined && !resolveCondition(condition, element, context)) {
        report('skipped', conditionReasons[condition]);
        continue;
      }

      let start = attributeLocation.startOffset;
      while (start > 0 && /\s/.test(source[start - 1])) start -= 1;
      removals.push({ startOffset: start, endOffset: attributeLocation.endOffset });
      report('removed');
    }
  }

  let output = source;
  for (const removal of [...removals].sort((a, b) => b.startOffset - a.startOffset)) {
    output = output.slice(0, removal.startOffset) + output.slice(removal.endOffset);
  }

  return { output, findings, changed: output !== source };
}
