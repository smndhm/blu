import { describe, expect, it } from 'vitest';
import { transformHtml } from '../src/transform.js';

const removedAttributes = (source: string) => transformHtml(source).findings.filter(finding => finding.type === 'removed');
const skippedAttributes = (source: string) => transformHtml(source).findings.filter(finding => finding.type === 'skipped');

describe('button[type] conditional case (written before any flat rule — must never be treated as a flat default)', () => {
  it('does not remove type="submit" from a button inside a form', () => {
    const source = '<form action="/x"><button type="submit">Go</button></form>';
    const result = transformHtml(source);
    expect(result.output).toBe(source);
    expect(skippedAttributes(source)).toMatchObject([{ tag: 'button', attribute: 'type', value: 'submit' }]);
  });

  it('does not remove type="submit" from a button outside a form either', () => {
    const source = '<button type="submit">Go</button>';
    expect(transformHtml(source).output).toBe(source);
    expect(skippedAttributes(source)[0].reason).toContain('form association');
  });

  it('leaves non-default button types alone silently', () => {
    const source = '<button type="button">Go</button>';
    expect(transformHtml(source).output).toBe(source);
  });
});

describe('literal value equal to the spec default', () => {
  it.each([
    ['<input type="text">', '<input>'],
    ['<form method="get"></form>', '<form></form>'],
    ['<form method="GET"></form>', '<form></form>'],
    ['<form enctype="application/x-www-form-urlencoded"></form>', '<form></form>'],
    ['<form autocomplete="on"></form>', '<form></form>'],
    ['<img src="a.png" decoding="auto">', '<img src="a.png">'],
    ['<img src="a.png" loading="eager">', '<img src="a.png">'],
    ['<area shape="rect">', '<area>'],
    ['<textarea wrap="soft"></textarea>', '<textarea></textarea>'],
    ['<script type="text/javascript">x()</script>', '<script>x()</script>'],
    ['<style type="text/css">a{}</style>', '<style>a{}</style>'],
    ['<link rel="stylesheet" type="text/css" href="a.css">', '<link rel="stylesheet" href="a.css">'],
  ])('%s → %s', (source, expected) => {
    expect(transformHtml(source).output).toBe(expected);
  });

  it('keeps surrounding attributes and whitespace intact', () => {
    expect(transformHtml('<input class="a" type="text" required>').output).toBe('<input class="a" required>');
  });
});

describe('literal value different from the default', () => {
  it.each([
    '<input type="email">',
    '<form method="post"></form>',
    '<script type="module">x()</script>',
    '<script type="importmap">{}</script>',
    '<img src="a.png" loading="lazy">',
  ])('leaves %s untouched', source => {
    const result = transformHtml(source);
    expect(result.output).toBe(source);
    expect(result.findings).toEqual([]);
  });

  it('does not confuse defaults across attributes whose meaning depends on the effective type', () => {
    const source = '<input type="number" size="20">';
    expect(transformHtml(source).output).toBe(source);
  });
});

describe('dynamic bindings and interpolations', () => {
  it.each(['<input type="{{ inputType }}">', '<input type="{% if x %}text{% endif %}">', '<form method="<%= method %>"></form>', '<input type="$' + '{type}">'])(
    'never removes %s',
    source => {
      const result = transformHtml(source);
      expect(result.output).toBe(source);
      expect(result.findings).toMatchObject([{ type: 'skipped' }]);
    },
  );

  it('never matches framework binding attribute names (Vue/Angular prefixes)', () => {
    const source = '<input :type="x" v-bind:type="y" ng-type="z">';
    expect(transformHtml(source).output).toBe(source);
  });

  it('preserves template syntax outside removed attributes byte for byte', () => {
    const source = '{% block content %}<p>{{ title }}</p><input type="text">{% endblock %}';
    expect(transformHtml(source).output).toBe('{% block content %}<p>{{ title }}</p><input>{% endblock %}');
  });
});

describe('boolean attributes', () => {
  it.each([
    '<input disabled>',
    '<input required>',
    '<input checked type="checkbox">',
    '<select multiple></select>',
    '<script src="a.js" defer></script>',
    '<details open></details>',
  ])('never removes the boolean presence in %s', source => {
    expect(transformHtml(source).output).toBe(source);
  });

  it('never removes an attribute with an empty value, even when the empty string is the missing value default', () => {
    const source = '<a target="">x</a>';
    expect(transformHtml(source).output).toBe(source);
  });
});

describe('target and <base target> (real condition, not a flat default)', () => {
  const fullDocument = (body: string, head = '') => `<!doctype html>\n<html><head>${head}</head><body>${body}</body></html>`;

  it('removes target="_self" in a full document without <base target>', () => {
    const result = transformHtml(fullDocument('<a target="_self" href="/x">x</a>'));
    expect(result.output).toBe(fullDocument('<a href="/x">x</a>'));
  });

  it('keeps target="_self" when a <base target> exists anywhere in the document', () => {
    const source = fullDocument('<a target="_self" href="/x">x</a>', '<base target="_blank">');
    const result = transformHtml(source);
    expect(result.output).toBe(source);
    expect(result.findings).toMatchObject([{ type: 'skipped', tag: 'a', attribute: 'target' }]);
  });

  it('keeps target="_self" in a fragment (a partial may be included under a layout with <base>)', () => {
    const source = '<a target="_self" href="/x">x</a>';
    const result = transformHtml(source);
    expect(result.output).toBe(source);
    expect(result.findings).toMatchObject([{ type: 'skipped' }]);
  });

  it('never removes target from <base> itself', () => {
    const source = fullDocument('', '<base target="_self">');
    expect(transformHtml(source).output).toBe(source);
  });
});

describe('link[type] depends on rel="stylesheet" (real condition)', () => {
  it('keeps type="text/css" when rel is not stylesheet', () => {
    const source = '<link rel="preload" type="text/css" href="a.css">';
    const result = transformHtml(source);
    expect(result.output).toBe(source);
    expect(result.findings).toMatchObject([{ type: 'skipped' }]);
  });

  it('keeps type="text/css" when rel is dynamic', () => {
    const source = '<link rel="{{ rel }}" type="text/css" href="a.css">';
    expect(transformHtml(source).output).toBe(source);
  });

  it('handles multi-token rel values', () => {
    expect(transformHtml('<link rel="alternate stylesheet" type="text/css" href="a.css">').output).toBe('<link rel="alternate stylesheet" href="a.css">');
  });
});

describe('value normalization', () => {
  it('is ASCII case-insensitive for enumerated and MIME values', () => {
    expect(transformHtml('<input TYPE="TeXt">').output).toBe('<input>');
    expect(transformHtml('<script type="Text/JavaScript">x()</script>').output).toBe('<script>x()</script>');
  });

  it('respects case-sensitive enumerated attributes (ol[type])', () => {
    expect(transformHtml('<ol type="1"><li>a</li></ol>').output).toBe('<ol><li>a</li></ol>');
    const source = '<ol type="I"><li>a</li></ol>';
    expect(transformHtml(source).output).toBe(source);
  });

  it('handles single quotes and no quotes', () => {
    expect(transformHtml("<input type='text'>").output).toBe('<input>');
    expect(transformHtml('<input type=text>').output).toBe('<input>');
  });

  it('does not trim: a padded value is not an exact state match and is kept', () => {
    const source = '<input type=" text ">';
    expect(transformHtml(source).output).toBe(source);
  });
});

describe('safety guards', () => {
  it('skips a start tag containing duplicate attributes', () => {
    const source = '<input type="text" type="email">';
    expect(transformHtml(source).output).toBe(source);
  });

  it('ignores foreign (SVG) content sharing attribute names with HTML', () => {
    const source = '<svg><a target="_self"><text>x</text></a></svg>';
    expect(transformHtml(source).output).toBe(source);
  });

  it('processes elements inside <template>', () => {
    expect(transformHtml('<template><input type="text"></template>').output).toBe('<template><input></template>');
  });

  it('never touches custom elements', () => {
    const source = '<my-input type="text"></my-input>';
    expect(transformHtml(source).output).toBe(source);
  });
});

describe('idempotence', () => {
  it('a second run produces zero changes', () => {
    const source = '<!doctype html>\n<html><body><form method="get"><input type="text"><button type="submit">Go</button></form><a target="_self" href="/">x</a></body></html>';
    const first = transformHtml(source);
    expect(first.changed).toBe(true);
    const second = transformHtml(first.output);
    expect(second.changed).toBe(false);
    expect(second.output).toBe(first.output);
    expect(second.findings.filter(finding => finding.type === 'removed')).toEqual([]);
  });
});

describe('report', () => {
  it('reports line and column of each removal', () => {
    const findings = removedAttributes('<div>\n  <input type="text">\n</div>');
    expect(findings).toMatchObject([{ tag: 'input', attribute: 'type', value: 'text', line: 2, column: 10 }]);
  });
});
