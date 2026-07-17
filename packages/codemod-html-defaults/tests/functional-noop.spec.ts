// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import { transformHtml } from '../src/transform.js';

/**
 * Functional no-op proof (not a snapshot): the transformed document must
 * expose the exact same form submission behavior as the original, as
 * reflected by the WHATWG IDL attributes jsdom implements.
 */
describe('functional no-op on forms', () => {
  const source = `<!doctype html>
<html><body>
<form method="get" enctype="application/x-www-form-urlencoded" autocomplete="on" action="/search">
  <input type="text" name="q" required>
  <select name="s"><option selected>a</option></select>
  <textarea wrap="soft" name="t"></textarea>
  <button type="submit">Go</button>
</form>
</body></html>`;

  const probe = (html: string) => {
    const { window } = new JSDOM(html, { url: 'https://example.com/' });
    const document = window.document;
    const form = document.forms[0];
    const input = document.querySelector('input')!;
    const button = document.querySelector('button')!;
    const textarea = document.querySelector('textarea')!;
    return {
      method: form.method,
      enctype: form.enctype,
      action: form.action,
      inputType: input.type,
      inputRequired: input.required,
      inputName: input.name,
      buttonType: button.type,
      textareaName: textarea.name,
      elementCount: form.elements.length,
    };
  };

  it('submission-related behavior is identical before and after the transform', () => {
    const { output, changed } = transformHtml(source);
    expect(changed).toBe(true);
    expect(probe(output)).toEqual(probe(source));
  });

  it('the transform removed the redundant attributes it claims to', () => {
    const { output } = transformHtml(source);
    expect(output).not.toContain('method="get"');
    expect(output).not.toContain('type="text"');
    expect(output).not.toContain('enctype=');
    expect(output).not.toContain('wrap="soft"');
    // Conditional case: left in place.
    expect(output).toContain('type="submit"');
  });
});
