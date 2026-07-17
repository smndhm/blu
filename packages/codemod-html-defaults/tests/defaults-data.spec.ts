// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { enumeratedAttributes, type Definition } from 'html-enumerated-attributes';
import { conditionalAttributes, supplementaryRules } from '../src/defaults.js';
import { transformHtml } from '../src/transform.js';

/**
 * The defaults data must never be trusted from memory: every default the
 * codemod can act on is verified here against jsdom, which implements the
 * WHATWG reflection rules ("missing value default") for form controls and
 * embedded content. Attributes jsdom does not reflect are covered by the
 * sourced entries in `supplementaryRules` and by the upstream
 * `html-enumerated-attributes` data (itself generated against the spec).
 */
describe('empirical verification against jsdom (WHATWG reflection)', () => {
  it.each([
    ['input', 'type', 'text'],
    ['form', 'method', 'get'],
    ['form', 'enctype', 'application/x-www-form-urlencoded'],
  ])('a bare <%s> reflects %s = %j', (tag, property, expected) => {
    const element = document.createElement(tag) as unknown as Record<string, unknown>;
    expect(element[property]).toBe(expected);
  });

  it('td/th colSpan and rowSpan default to 1 (not encoded as removable — documented candidate only)', () => {
    const cell = document.createElement('td');
    expect(cell.colSpan).toBe(1);
    expect(cell.rowSpan).toBe(1);
  });

  it('button.type reflects "submit" when missing — and is still guarded as conditional, never removed flatly', () => {
    expect(document.createElement('button').type).toBe('submit');
    expect(conditionalAttributes.button.type).toBe('form-association');
  });
});

describe('assumptions about the html-enumerated-attributes data', () => {
  const allDefinitions: Definition[] = Object.values(enumeratedAttributes).flatMap(entry => (Array.isArray(entry) ? entry : [entry]));

  it('selectors are plain comma-separated tag names (the transform relies on this)', () => {
    for (const definition of allDefinitions) {
      if (definition.selector === undefined) continue;
      for (const part of definition.selector.split(',')) {
        expect(part.trim()).toMatch(/^[a-z][a-z0-9]*$/);
      }
    }
  });

  it('a missing value default outside any state group means "never removable" (e.g. li[type]: missing is an unnamed state)', () => {
    // The transform only removes a value whose state group CONTAINS the
    // missing value default. When the missing default belongs to no group
    // (an unnamed state), no literal value can ever match it — verified
    // here on li[type], the one entry in the current data shaped that way.
    const source = '<ul><li type="disc">x</li></ul>';
    expect(transformHtml(source).output).toBe(source);
  });

  it('contains the defaults the codemod relies on, matching jsdom above', () => {
    const type = enumeratedAttributes.type as Definition[];
    expect(type.find(definition => definition.selector === 'input')?.missing).toBe('text');
    expect((enumeratedAttributes.method as Definition).missing).toBe('get');
    expect((enumeratedAttributes.enctype as Definition).missing).toBe('application/x-www-form-urlencoded');
    expect((enumeratedAttributes.shape as Definition).missing).toBe('rect');
    expect((enumeratedAttributes.loading as Definition).missing).toBe('eager');
    expect((enumeratedAttributes.wrap as Definition).missing).toBe('soft');
  });
});

describe('supplementary rules hygiene', () => {
  const BOOLEAN_ATTRIBUTES = ['allowfullscreen', 'async', 'autofocus', 'checked', 'defer', 'disabled', 'hidden', 'multiple', 'open', 'readonly', 'required', 'selected'];

  it('every entry is sourced to the WHATWG spec', () => {
    for (const rule of supplementaryRules) {
      expect(rule.source).toMatch(/^https:\/\/html\.spec\.whatwg\.org\//);
      expect(rule.note.length).toBeGreaterThan(0);
      expect(rule.equivalentToMissing.length).toBeGreaterThan(0);
    }
  });

  it('never lists a boolean attribute (presence must never be removed)', () => {
    for (const rule of supplementaryRules) {
      expect(BOOLEAN_ATTRIBUTES).not.toContain(rule.attribute);
    }
  });

  it('defaults are stored lowercased so case-insensitive comparison works', () => {
    for (const rule of supplementaryRules) {
      for (const value of rule.equivalentToMissing) {
        expect(value).toBe(value.toLowerCase());
      }
    }
  });
});
