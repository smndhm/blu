import { describe, expect, it } from 'vitest';
import { transformHtml } from '../src/transform.js';

const removedAttributes = (source: string) => transformHtml(source).findings.filter(finding => finding.type === 'removed');
const skippedAttributes = (source: string) => transformHtml(source).findings.filter(finding => finding.type === 'skipped');

describe('button[type] conditional case (written before any flat rule: must never be treated as a flat default)', () => {
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
    ['<canvas width="300" height="150"></canvas>', '<canvas></canvas>'],
    ['<input size="20">', '<input>'],
    ['<textarea rows="2" cols="20"></textarea>', '<textarea></textarea>'],
    [
      '<table><colgroup span="1"><col span="1"></colgroup><tr><td colspan="1" rowspan="1">a</td><th colspan="1">b</th></tr></table>',
      '<table><colgroup><col></colgroup><tr><td>a</td><th>b</th></tr></table>',
    ],
    ['<progress max="1"></progress>', '<progress></progress>'],
    ['<meter min="0" max="1" value="0.5"></meter>', '<meter value="0.5"></meter>'],
  ])('%s -> %s', (source, expected) => {
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

  it('keeps a numeric value that only looks like the default', () => {
    for (const source of ['<input size="20.0">', '<input size=" 20">', '<canvas width="0300"></canvas>']) expect(transformHtml(source).output).toBe(source);
  });
});

describe('dynamic bindings and interpolations', () => {
  it.each(['<input type="{{ inputType }}">', '<input type="{% if x %}text{% endif %}">', '<form method="<%= method %>"></form>', '<input type="\u0024{type}">'])(
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

const fullDocument = (body: string, head = '') => `<!doctype html>\n<html><head>${head}</head><body>${body}</body></html>`;

describe('target and <base target> (real condition, not a flat default)', () => {
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

  it('does not trim: a padded value is no default for html-default, but an invalid value meaning the default for invalid-value', () => {
    const source = '<input type=" text ">';
    expect(transformHtml(source, { rules: ['html-default'] }).output).toBe(source);
    expect(transformHtml(source).findings).toMatchObject([{ type: 'removed', rule: 'invalid-value' }]);
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

describe('framework templates', () => {
  it.each(['<input type={kind} disabled={off} aria-hidden={hidden}>', '<input type="text{suffix}">', '<input hidden={x} />', 'export const A = () => <input disabled={false} />;'])(
    'treats the expressions of Svelte, Astro and JSX in %s as dynamic',
    source => {
      expect(transformHtml(source).output).toBe(source);
    },
  );

  it.each(['<MyButton disabled="disabled" aria-hidden="false" />', '<Button type="submit" role="button">a</Button>', '<Card role="button" aria-hidden="false" />'])(
    'never touches the PascalCase component in %s',
    source => {
      expect(transformHtml(source).output).toBe(source);
      expect(transformHtml(source).findings).toEqual([]);
    },
  );

  it('still treats an uppercase HTML tag as HTML', () => {
    expect(transformHtml('<INPUT TYPE="TEXT">').output).toBe('<INPUT>');
  });

  it('cleans the static attributes of native elements in a Vue single-file component, leaving bindings alone', () => {
    const source = '<template>\n  <input type="text" :disabled="off" v-model="q" @input="x" aria-hidden="false">\n</template>\n<script setup>\nconst q = ref("")\n</script>\n';
    expect(transformHtml(source).output).toBe('<template>\n  <input :disabled="off" v-model="q" @input="x">\n</template>\n<script setup>\nconst q = ref("")\n</script>\n');
  });

  it('leaves Angular bindings alone', () => {
    const source = '<input type="text" [disabled]="off" [attr.aria-hidden]="h" (input)="x()">';
    expect(transformHtml(source).output).toBe('<input [disabled]="off" [attr.aria-hidden]="h" (input)="x()">');
  });
});

describe('text that only looks like markup', () => {
  it('never touches a tag written in front matter, here JSON in a Handlebars page', () => {
    const source = '---\n{\n  "description": "Emulates <input type=\\"range\\"> and <input type=\\"text\\">"\n}\n---\n<input type="text">\n';
    expect(transformHtml(source).output).toBe('---\n{\n  "description": "Emulates <input type=\\"range\\"> and <input type=\\"text\\">"\n}\n---\n<input>\n');
    expect(transformHtml(source).findings).toHaveLength(1);
  });

  it('never touches YAML or TOML front matter', () => {
    for (const source of ['---\ntitle: <input type="text">\n---\n', '+++\ntitle = "<nav role=\'navigation\'>"\n+++\n']) {
      expect(transformHtml(source).output).toBe(source);
    }
  });

  it('never touches an attribute written inside a template tag', () => {
    const source = '<a href="/"{{ " aria-current=\\"page\\"" | safe if active }}>a</a><input{{ " type=\\"txt\\"" }}>';
    expect(transformHtml(source).output).toBe(source);
    expect(transformHtml(source).findings).toEqual([]);
  });

  it.each([
    '<input type="<?php echo $type; ?>">',
    '<div aria-hidden="<?= $hidden ?>">a</div>',
    '<input type="@Model.Type" role="@(role)">',
    '<input type="<?php echo $a->type; ?>">',
  ])('treats the PHP or Razor value of %s as dynamic', source => {
    expect(transformHtml(source).output).toBe(source);
    expect(transformHtml(source).findings.every(finding => finding.type === 'skipped')).toBe(true);
  });

  it('never touches markup echoed by PHP, and still cleans the markup around it', () => {
    const source = '<?php echo \'<input type="txt">\'; ?><input type="text"><?php if ($a->b) { ?><input type="text"><?php } ?>';
    expect(transformHtml(source).output).toBe('<?php echo \'<input type="txt">\'; ?><input><?php if ($a->b) { ?><input><?php } ?>');
  });

  it('never touches the HTML in the strings of a PHP file left unclosed', () => {
    const source = '<?php\n$post->id();\nreturn \'<input type="\' . $t . \'" size="20"><nav role="navigation">\';\n';
    expect(transformHtml(source).output).toBe(source);
    expect(transformHtml(source).findings).toEqual([]);
  });

  it('keeps an e-mail address or a decorator-like value that is not Razor', () => {
    expect(transformHtml('<a href="mailto:a@b.fr" target="_self">a</a>').findings).toMatchObject([{ type: 'skipped', reason: expect.stringContaining('base target') }]);
  });

  it('treats a value with an escaped quote as a string of another language', () => {
    const source = '<div data-x="1"><input type=\\"txt\\"></div>';
    expect(transformHtml(source).output).toBe(source);
  });

  it('still cleans the attributes next to a template tag', () => {
    expect(transformHtml('<input type="text" value="{{ v }}" {% if x %}required{% endif %}>').output).toBe('<input value="{{ v }}" {% if x %}required{% endif %}>');
  });
});
