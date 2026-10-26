import { describe, expect, it } from 'vitest';
import { collectReferences, createReferences, findReference } from '../src/references.js';
import { transformHtml } from '../src/transform.js';

const referencesOf = (text: string, kind: 'css' | 'js' | 'mixed') => {
  const references = createReferences();
  collectReferences(text, kind, 'file', references);
  return references;
};

describe('collectReferences', () => {
  it('reads presence and value selectors in a stylesheet', () => {
    const references = referencesOf('input[type="text"] {}\ninput:not([type]) {}\n[aria-hidden=false] {}', 'css');
    expect(findReference(references, 'type', 'email')).toBe('file:2');
    expect(findReference(references, 'aria-hidden', 'false')).toBe('file:3');
    expect(findReference(references, 'aria-hidden', 'undefined')).toBeUndefined();
  });

  it('treats operators other than = as depending on any value', () => {
    expect(findReference(referencesOf('[role^="nav"] {}', 'css'), 'role', 'navigation')).toBe('file:1');
  });

  it('reads selectors in script strings and attribute calls, not property access', () => {
    const references = referencesOf("const items = list[index];\ndocument.querySelector('input[type=\"text\"]');\nel.getAttribute('role');", 'js');
    expect(findReference(references, 'index', 'x')).toBeUndefined();
    expect(findReference(references, 'type', 'text')).toBe('file:2');
    expect(findReference(references, 'role', 'button')).toBe('file:3');
  });

  it('keeps a boolean attribute rewrite when only its presence is selected', () => {
    const references = referencesOf('[disabled] {}\n[open="open"] {}', 'css');
    expect(findReference(references, 'disabled', 'disabled', true)).toBeUndefined();
    expect(findReference(references, 'open', 'open', true)).toBe('file:2');
  });
});

describe('transformHtml with references', () => {
  it('keeps an attribute a project stylesheet depends on, and says where', () => {
    const references = referencesOf('input:not([type]) { border: 0 }', 'css');
    const result = transformHtml('<input type="text">', { references });
    expect(result.output).toBe('<input type="text">');
    expect(result.findings).toMatchObject([{ type: 'skipped', reason: 'referenced by a selector or a script at file:1' }]);
  });

  it('reads the inline <style> and <script> of the file itself', () => {
    const source =
      '<style>\n[aria-hidden="false"] { display: block }\n</style>\n<div aria-hidden="false">a</div>\n<script>document.querySelectorAll("[role=navigation]")</script><nav role="navigation"></nav>';
    const result = transformHtml(source, { fileName: 'page.html' });
    expect(result.output).toBe(source);
    expect(result.findings.map(finding => finding.reason)).toEqual(['referenced by a selector or a script at page.html:2', 'referenced by a selector or a script at page.html:5']);
  });

  it('removes what no selector depends on', () => {
    expect(transformHtml('<input type="text" aria-hidden="false">', { references: referencesOf('input[type="email"] {}', 'css') }).output).toBe('<input>');
  });
});
