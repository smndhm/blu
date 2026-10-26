import { describe, expect, it } from 'vitest';
import { transformHtml, type RuleId } from '../src/transform.js';

const output = (source: string, rules?: RuleId[]) => transformHtml(source, { rules }).output;
const findings = (source: string) => transformHtml(source).findings;

describe('boolean-value', () => {
  it.each([
    ['<input disabled="">', '<input disabled>'],
    ['<input disabled="disabled">', '<input disabled>'],
    ['<input DISABLED="Disabled">', '<input DISABLED>'],
    ["<option selected='selected'>a</option>", '<option selected>a</option>'],
    ['<script src="a.js" defer="defer" async=""></script>', '<script src="a.js" defer async></script>'],
    ['<details open = "open"></details>', '<details open></details>'],
  ])('%s -> %s', (source, expected) => {
    expect(output(source)).toBe(expected);
  });

  it('reports the rewrite', () => {
    expect(findings('<input required="required">')).toMatchObject([{ type: 'rewritten', rule: 'boolean-value', attribute: 'required' }]);
  });

  it.each(['<input disabled="false">', '<input checked="true" type="checkbox">', '<input readonly="no">'])('warns about %s, true whatever its value, and leaves it', source => {
    expect(output(source)).toBe(source);
    expect(findings(source)).toMatchObject([{ type: 'warning', rule: 'boolean-value' }]);
  });

  it.each([
    '<div hidden="until-found">a</div>',
    '<div hidden="">a</div>',
    '<a download="file.pdf" href="f">a</a>',
    '<a download="" href="f">a</a>',
    '<div contenteditable="true"></div>',
    '<div spellcheck="false"></div>',
    '<img draggable="false" alt="">',
    '<p translate="no">a</p>',
  ])('leaves %s alone: not a plain boolean attribute', source => {
    expect(output(source)).toBe(source);
    expect(findings(source)).toEqual([]);
  });
});

describe('aria-default', () => {
  it.each([
    ['<div aria-hidden="false">a</div>', '<div>a</div>'],
    ['<div aria-hidden="undefined">a</div>', '<div>a</div>'],
    ['<div aria-hidden="">a</div>', '<div>a</div>'],
    ['<div role="checkbox" aria-checked="undefined" tabindex="0"></div>', '<div role="checkbox" tabindex="0"></div>'],
    ['<button aria-expanded="undefined">a</button>', '<button>a</button>'],
    ['<button aria-pressed="undefined">a</button>', '<button>a</button>'],
    ['<div aria-busy="false"></div>', '<div></div>'],
    ['<a href="/" aria-current="false">a</a>', '<a href="/">a</a>'],
    ['<input aria-invalid="false" aria-required="false" aria-readonly="false" aria-disabled="false">', '<input>'],
    ['<input role="combobox" aria-autocomplete="none">', '<input role="combobox">'],
    ['<th aria-sort="none">a</th>', '<th>a</th>'],
  ])('%s -> %s', (source, expected) => {
    expect(output(source)).toBe(expected);
  });

  it.each([
    '<div aria-hidden="false ">a</div>',
    '<div aria-hidden="no">a</div>',
    '<div aria-hidden="False">a</div>',
    '<div aria-hidden="0">a</div>',
    '<div aria-hidden="true">a</div>',
  ])('leaves %s alone: only exact default values are removed (an unknown value can hide content)', source => {
    expect(output(source)).toBe(source);
  });

  it.each([
    '<div role="alert" aria-live="assertive">a</div>',
    '<div aria-live="off">a</div>',
    '<div aria-atomic="false">a</div>',
    '<button aria-haspopup="false">a</button>',
    '<div role="separator" aria-orientation="horizontal"></div>',
    '<div aria-relevant="additions text"></div>',
    '<button aria-expanded="false">a</button>',
    '<button aria-pressed="false">a</button>',
  ])('leaves %s alone: the default depends on the role, or false is a state of its own', source => {
    expect(output(source)).toBe(source);
  });
});

describe('redundant-role', () => {
  it.each([
    ['<nav role="navigation"></nav>', '<nav></nav>'],
    ['<main role="main"></main>', '<main></main>'],
    ['<button role="button">a</button>', '<button>a</button>'],
    ['<a href="/" role="link">a</a>', '<a href="/">a</a>'],
    ['<img src="a.png" alt="A" role="img">', '<img src="a.png" alt="A">'],
    ['<input type="checkbox" role="checkbox">', '<input type="checkbox">'],
    ['<input role="textbox">', '<input>'],
    ['<input type="search" role="searchbox">', '<input type="search">'],
    ['<select role="combobox"></select>', '<select></select>'],
    ['<select multiple role="listbox"></select>', '<select multiple></select>'],
    ['<table role="table"><tr role="row"><td>a</td></tr></table>', '<table><tr><td>a</td></tr></table>'],
    ['<ul><li role="listitem">a</li></ul>', '<ul><li>a</li></ul>'],
    ['<dl><dt role="term">a</dt><dd role="definition">b</dd></dl>', '<dl><dt>a</dt><dd>b</dd></dl>'],
  ])('%s -> %s', (source, expected) => {
    expect(output(source)).toBe(expected);
  });

  it.each([
    '<a role="link">a</a>',
    '<img src="a.png" alt="" role="img">',
    '<input list="l" role="textbox">',
    '<select size="4" role="combobox"></select>',
    '<h2 role="heading">a</h2>',
    '<section role="region" aria-label="a"></section>',
    '<header role="banner"></header>',
    '<aside role="complementary"></aside>',
    '<ul role="none"><li role="listitem">a</li></ul>',
    '<nav role="navigation menu"></nav>',
    '<nav role="Navigation"></nav>',
    '<my-nav role="navigation"></my-nav>',
  ])('leaves %s alone', source => {
    expect(output(source)).toBe(source);
  });

  it('keeps role="list" on a list and says why (Safari drops list semantics with list-style: none)', () => {
    const source = '<ul role="list"><li>a</li></ul>';
    expect(output(source)).toBe(source);
    expect(findings(source)).toMatchObject([{ type: 'skipped', rule: 'redundant-role', reason: expect.stringContaining('list-style: none') }]);
  });

  it('still removes the redundant listitem role in a list kept with role="list"', () => {
    expect(output('<ul role="list"><li role="listitem">a</li></ul>')).toBe('<ul role="list"><li>a</li></ul>');
  });
});

describe('aria-native', () => {
  it.each([
    ['<input required aria-required="true">', '<input required>'],
    ['<select required aria-required="true"></select>', '<select required></select>'],
    ['<button disabled aria-disabled="true">a</button>', '<button disabled>a</button>'],
    ['<textarea readonly aria-readonly="true"></textarea>', '<textarea readonly></textarea>'],
    ['<div hidden aria-hidden="true">a</div>', '<div hidden>a</div>'],
    ['<input type="checkbox" checked aria-checked="true">', '<input type="checkbox" checked>'],
    ['<input type="radio" aria-checked="false">', '<input type="radio">'],
  ])('%s -> %s', (source, expected) => {
    expect(output(source)).toBe(expected);
  });

  it.each([
    '<div hidden="until-found" aria-hidden="true">a</div>',
    '<input aria-required="true">',
    '<div required aria-required="true"></div>',
    '<a href="/" disabled aria-disabled="true">a</a>',
    '<div aria-hidden="true">a</div>',
  ])('leaves %s alone: nothing native says the same', source => {
    expect(output(source)).toBe(source);
  });

  it.each(['<input type="checkbox" aria-checked="true">', '<input type="checkbox" checked aria-checked="false">', '<input type="checkbox" aria-checked="mixed">'])(
    'warns about %s, which contradicts the native state, and leaves it',
    source => {
      expect(output(source)).toBe(source);
      expect(findings(source)).toMatchObject([{ type: 'warning', rule: 'aria-native' }]);
    },
  );
});

describe('rule selection', () => {
  const source = '<nav role="navigation" aria-hidden="false"><input type="text" disabled="disabled"></nav>';

  it('applies every rule by default', () => {
    expect(output(source)).toBe('<nav><input disabled></nav>');
  });

  it('applies only the rules asked for', () => {
    expect(output(source, ['aria-default'])).toBe('<nav role="navigation"><input type="text" disabled="disabled"></nav>');
    expect(output(source, ['html-default', 'boolean-value'])).toBe('<nav role="navigation" aria-hidden="false"><input disabled></nav>');
  });

  it('reports the rule of each finding', () => {
    expect(findings(source).map(finding => finding.rule)).toEqual(['redundant-role', 'aria-default', 'html-default', 'boolean-value']);
  });

  it('reports dynamic ARIA and role values as skipped', () => {
    expect(findings('<div aria-hidden="{{ hidden }}" role="{{ role }}"></div>')).toMatchObject([
      { type: 'skipped', rule: 'aria-default' },
      { type: 'skipped', rule: 'redundant-role' },
    ]);
  });
});
