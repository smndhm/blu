// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import { transformHtml } from '../src/transform.js';

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

const reflect = (html: string) => {
  const { window } = new JSDOM(html);
  const document = window.document;
  const input = document.querySelector('input')!;
  const textarea = document.querySelector('textarea')!;
  const canvas = document.querySelector('canvas')!;
  return [input.disabled, input.required, input.readOnly, input.size, textarea.rows, textarea.cols, canvas.width, canvas.height, document.querySelector('details')!.open];
};

describe('functional no-op on boolean attributes and numeric defaults', () => {
  const source = `<!doctype html>
<html><body>
<input disabled="disabled" required="" readonly="readonly" size="20">
<textarea rows="2" cols="20"></textarea>
<canvas width="300" height="150"></canvas>
<details open="open"><summary>a</summary></details>
</body></html>`;

  it('the browser sees the same values before and after', () => {
    const result = transformHtml(source);
    expect(result.changed).toBe(true);
    expect(reflect(result.output)).toEqual(reflect(source));
  });
});

const reflectInvalid = (html: string) => {
  const { window } = new JSDOM(html);
  const document = window.document;
  const form = document.forms[0];
  const div = document.querySelector('div')!;
  return [
    form.method,
    form.enctype,
    document.querySelector('input')!.type,
    document.querySelector('button')!.type,
    document.querySelector('p')!.dir,
    document.querySelector('th')!.scope,
    div.draggable,
    div.translate,
  ];
};

describe('functional no-op on invalid keyword values', () => {
  const source = `<!doctype html>
<html><body>
<form method="put" enctype="json"><input type="txt"><button type="sumbit">Go</button></form>
<p dir="left">a</p>
<table><tr><th scope="column">a</th></tr></table>
<div draggable="yes" translate="false"></div>
</body></html>`;

  it('the browser sees the same states before and after', () => {
    const result = transformHtml(source);
    expect(result.changed).toBe(true);
    expect(reflectInvalid(result.output)).toEqual(reflectInvalid(source));
  });
});
