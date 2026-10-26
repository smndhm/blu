# @dume/codemod-drop-useless-attributes

Codemod that removes the HTML attributes that have no effect:

- native attributes set to the value used when they are missing: `<input type="text">` -> `<input>`, `<form method="get">` -> `<form>`, `<textarea rows="2">` -> `<textarea>`;
- values written on boolean attributes: `<input disabled="disabled">` -> `<input disabled>`;
- ARIA states and properties set to their default: `<div aria-hidden="false">` -> `<div>`;
- roles the element already has: `<nav role="navigation">` -> `<nav>`;
- ARIA repeating a native attribute: `<input required aria-required="true">` -> `<input required>`;
- invalid values the browser ignores: `<input type="txt">` -> `<input>`, while invalid values that still do something (`hidden="no"` hides) are reported.

Every change is a no-op for browsers and assistive technologies, each one sourced to the [WHATWG HTML Living Standard](https://html.spec.whatwg.org/multipage/), [WAI-ARIA 1.3](https://w3c.github.io/aria/) or [ARIA in HTML](https://www.w3.org/TR/html-aria/). Everything outside the edited attributes is kept byte for byte, so the tool also runs on HTML-like templates (Nunjucks, Jinja...).

## Usage

```sh
# Dry-run (default): report what would change, write nothing
npx @dume/codemod-drop-useless-attributes src/

# Apply
npx @dume/codemod-drop-useless-attributes --write src/

# Include template files when walking directories (explicit file paths are always processed)
npx @dume/codemod-drop-useless-attributes --ext html,njk --write .

# Only some rules
npx @dume/codemod-drop-useless-attributes --rules aria-default,redundant-role src/

# Stylesheets and scripts living elsewhere
npx @dume/codemod-drop-useless-attributes --references src/styles --references src/scripts src/pages/
```

Options:

| Option               | Effect                                                                                              |
| -------------------- | --------------------------------------------------------------------------------------------------- |
| `--write`            | Apply the changes (dry-run otherwise).                                                              |
| `--ext <list>`       | Extensions handled when walking directories (default `html,htm`).                                   |
| `--rules <list>`     | Rules to apply, comma-separated (default: all). See [Rules](#rules).                                |
| `--references <dir>` | Also read the stylesheets and scripts of this path for attribute selectors (repeatable).            |
| `--no-references`    | Do not read stylesheets and scripts at all: an attribute a selector depends on may then be removed. |

The report gives, for each attribute, the action (`remove`, `rewrite`, `skip`, `warning`), the rule and the reason. A second run reports no change.

Programmatic API:

```js
import { transformHtml } from '@dume/codemod-drop-useless-attributes';

const { output, findings, changed } = transformHtml('<nav role="navigation" aria-hidden="false"></nav>');
// output === '<nav></nav>'

transformHtml(source, { rules: ['aria-default'] });
```

### Codemod CLI workflow entry

For rollouts driven by the [Codemod CLI](https://docs.codemod.com/), the package exposes a step with the usual `transform(root) -> string | null` contract:

```js
// workflow script
import transform from '@dume/codemod-drop-useless-attributes/codemod';

export default transform;
```

It returns `null` when the file is untouched, logs one line per changed file, and logs what was kept or needs a person as `info` lines. It works one file at a time, so only the inline `<style>` and `<script>` of the file are read for selectors.

## Rules

### `html-default`: native attributes at their default

| Example                                                                                                 | Source                                                                                                                                                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<input type="text">`                                                                                   | [missing value default: Text](https://html.spec.whatwg.org/multipage/input.html#attr-input-type)                                                                                                                                                                                                                    |
| `<form method="get">`, `enctype="application/x-www-form-urlencoded"`, `autocomplete="on"`               | [method](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#attr-fs-method), [enctype](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#attr-fs-enctype), [autocomplete](https://html.spec.whatwg.org/multipage/forms.html#attr-form-autocomplete)                      |
| `<img decoding="auto">`, `<img loading="eager">`, `<iframe loading="eager">`                            | [decoding](https://html.spec.whatwg.org/multipage/images.html#attr-img-decoding), [loading](https://html.spec.whatwg.org/multipage/urls-and-fetching.html#lazy-loading-attributes)                                                                                                                                  |
| `<area shape="rect">`, `<textarea wrap="soft">`, `<ol type="1">`                                        | [shape](https://html.spec.whatwg.org/multipage/image-maps.html#attr-area-shape), [wrap](https://html.spec.whatwg.org/multipage/form-elements.html#attr-textarea-wrap), ol type (case-sensitive)                                                                                                                     |
| `<script type="text/javascript">`, `<style type="text/css">`, `<link rel="stylesheet" type="text/css">` | [script type](https://html.spec.whatwg.org/multipage/scripting.html#attr-script-type) (`module`, `importmap` and data blocks never touched), [style type](https://html.spec.whatwg.org/multipage/semantics.html#attr-style-type), [link type](https://html.spec.whatwg.org/multipage/semantics.html#attr-link-type) |
| `<canvas width="300" height="150">`                                                                     | [canvas](https://html.spec.whatwg.org/multipage/canvas.html#attr-canvas-width)                                                                                                                                                                                                                                      |
| `<input size="20">`, `<textarea rows="2" cols="20">`                                                    | [size](https://html.spec.whatwg.org/multipage/input.html#attr-input-size), [rows, cols](https://html.spec.whatwg.org/multipage/form-elements.html#attr-textarea-cols)                                                                                                                                               |
| `<col span="1">`, `<colgroup span="1">`, `<td colspan="1" rowspan="1">`, same on `<th>`                 | [span](https://html.spec.whatwg.org/multipage/tables.html#attr-col-span), [colspan, rowspan](https://html.spec.whatwg.org/multipage/tables.html#attr-tdth-colspan)                                                                                                                                                  |
| `<progress max="1">`, `<meter min="0" max="1">`                                                         | [progress](https://html.spec.whatwg.org/multipage/form-elements.html#attr-progress-max), [meter](https://html.spec.whatwg.org/multipage/form-elements.html#attr-meter-min)                                                                                                                                          |

Enumerated attributes come from [`html-enumerated-attributes`](https://github.com/wooorm/html-enumerated-attributes), which encodes the WHATWG missing value default of each of them: a value is removed only when it is in the same state as that default (ASCII case-insensitive unless the spec says otherwise, never trimmed). Numbers are removed only in their canonical spelling (`20`, never `20.0` or ` 20`). The tests check every number against jsdom's implementation of the reflection rules.

Conditions checked, never applied blindly:

- `target="_self"` on `<a>`, `<area>`, `<form>`: removed only in a full document without `<base target>` ([the missing target falls back to it](https://html.spec.whatwg.org/multipage/semantics.html#the-base-element)); a partial may be included under one, so it is kept. `<base target>` itself is never removed.
- `<link type="text/css">`: only with a static `rel` containing `stylesheet`.
- `<button type="submit">`: kept and reported. It is the spec default, but `html-validate` asks for an explicit button type, and many teams write it on purpose.

### `boolean-value`: boolean attributes written with a value

A boolean attribute is true when present, whatever its value ([spec](https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#boolean-attributes)). `disabled=""` and `disabled="disabled"` become `disabled`. Any other value (`disabled="false"`, `checked="true"`) is left and reported as a warning: `disabled="false"` disables, which is rarely what was meant. The list of boolean attributes comes from [`property-information`](https://github.com/wooorm/property-information). `hidden` and `download`, which also take other values, and the `true`/`false` attributes (`contenteditable`, `spellcheck`, `draggable`) are not boolean attributes and never touched.

### `aria-default`: ARIA states and properties at their default

| Removed                                                                                                                                                   | Source                                                                                                                                      |
| --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `aria-hidden="false"`, `aria-hidden="undefined"`                                                                                                          | [aria-hidden](https://w3c.github.io/aria/#aria-hidden): as of ARIA 1.3, `false` is the same as `undefined`, the default                     |
| `aria-checked`, `aria-expanded`, `aria-pressed`, `aria-selected` set to `"undefined"`                                                                     | their default ([aria-checked](https://w3c.github.io/aria/#aria-checked)...); `false` is a state of its own and kept                         |
| `aria-busy`, `aria-current`, `aria-disabled`, `aria-invalid`, `aria-multiline`, `aria-multiselectable`, `aria-readonly`, `aria-required` set to `"false"` | their default, whatever the role                                                                                                            |
| `aria-autocomplete="none"`, `aria-sort="none"`                                                                                                            | their default                                                                                                                               |
| any of the above with an empty value                                                                                                                      | [an empty value is treated as if the attribute were missing](https://w3c.github.io/aria/#document-handling_author-errors_states-properties) |

Values are compared exactly. `aria-hidden="False"`, `"false "`, `"no"` or `"0"` are unknown values, which browsers may treat as `true` and hide the content: they are never touched. Attributes whose default depends on the role are never touched either: `aria-live`, `aria-atomic`, `aria-relevant`, `aria-haspopup`, `aria-orientation`.

### `redundant-role`: roles the element already has

Removed when the role is the element's implicit role per the [ARIA in HTML conformance table](https://www.w3.org/TR/html-aria/#docconformance), for instance `<nav role="navigation">`, `<main role="main">`, `<button role="button">`, `<a href="..." role="link">`, `<img alt="A" role="img">`, `<input type="checkbox" role="checkbox">`, `<input role="textbox">` (without `list`), `<select role="combobox">`, `<table role="table">`, `<li role="listitem">` in a list.

Only a single lowercase role is compared: a list of roles is a fallback chain. Left out because the implicit role depends on context or changes something: headings (an explicit `heading` role loses the level), `header`, `footer`, `aside`, `section`, `img alt=""`, `td`, `th`, `option`, `li` in a list that has another role.

An empty role (`role=""`) is removed too: it is as if there were none, and the element keeps its implicit role.

Kept and reported: `role="list"` on `<ul>`, `<ol>` and `<menu>`. WebKit (Safari with VoiceOver) drops the list semantics of a list styled with `list-style: none`, and `role="list"` brings them back.

### `aria-native`: ARIA repeating a native attribute

ARIA in HTML says authors [should not set an ARIA attribute that repeats a native one](https://www.w3.org/TR/html-aria/#docconformance-attr). Removed:

- `aria-required="true"` with `required` on `input`, `select`, `textarea`;
- `aria-disabled="true"` with `disabled` on the elements that can be disabled;
- `aria-readonly="true"` with `readonly` on `input`, `textarea`;
- `aria-hidden="true"` with `hidden` (never with `hidden="until-found"`, which the page search can reveal);
- `aria-checked` matching the `checked` attribute of a native checkbox or radio button.

`aria-checked` contradicting a native checkbox or radio button (`aria-checked="true"` without `checked`, `aria-checked="mixed"`) is left and reported as a warning: use `checked` or `indeterminate`.

### `invalid-value`: values the spec does not define

Each keyword attribute has an _invalid value default_: the state a value outside its keywords maps to. When it is the same as the _missing value default_, an invalid value does exactly what no attribute does, and is removed:

| Removed when invalid                                                                          | Invalid and missing both mean           |
| --------------------------------------------------------------------------------------------- | --------------------------------------- |
| `input type`                                                                                  | Text                                    |
| `button type`                                                                                 | the default button behavior             |
| `form method`, `enctype`, `autocomplete`                                                      | GET, urlencoded, on                     |
| `img decoding`, `loading`, `fetchpriority` (and on `iframe`, `link`, `script`)                | auto, eager, auto                       |
| `textarea wrap`, `area shape`, `th scope`, `ol type`                                          | soft, rectangle, auto, decimal          |
| `referrerpolicy`, `preload`                                                                   | the default policy, the default preload |
| `dir`, `inputmode`, `enterkeyhint`, `spellcheck`, `draggable`, `translate`, `contenteditable` | no state, default, inherit              |

When the two differ, the invalid value does something, so it is reported and left:

| Reported                    | What an invalid value does                                   |
| --------------------------- | ------------------------------------------------------------ |
| `hidden="no"`               | hides the element, like `hidden`                             |
| `crossorigin="true"`        | anonymous CORS request, while no attribute means no CORS     |
| `track kind="subtitle"`     | metadata: the track is never shown                           |
| `formmethod`, `formenctype` | get or urlencoded, while no attribute means the form's value |
| `popover="yes"`             | a manual popover, while no attribute means no popover        |

A value that becomes valid once trimmed or lowercased (`type=" email "`) is reported with the probable intent, never removed: the author meant something else than what the browser does. When what it meant is the default anyway (`<input type=" text ">`), nothing meant is lost and it is removed. `<button type=" submit ">` is written `type="submit"`, the explicit type kept on a button; with a `commandfor` or `command` attribute, where an invalid type means Auto and not submit, it is only reported. The keywords are listed from the current spec (`src/invalid.ts`, one source link per attribute), not from `html-enumerated-attributes`, which lacks recent keywords (`contenteditable="plaintext-only"`, `hidden="until-found"`) and lists `target`, which takes any window name. jsdom checks that the browser sees the same states before and after for the attributes it implements.

Boolean attributes are handled by `boolean-value`: whatever their value, they are true, so `disabled="false"` is reported, never removed. Invalid values of ARIA states and properties (`aria-hidden="no"`, `aria-invalid="yes"`) are reported, never removed: browsers differ on them, and Chrome hides content with `aria-hidden="no"`. So are attributes ARIA does not define, with the probable intent: `aria-role="button"` (did you mean `role`?), `aria-labeledby` (did you mean `aria-labelledby`?). They do nothing, but removing them would lose what the author meant.

## Stylesheets and scripts

Removing `type="text"` changes nothing for the browser, but `input[type="text"]` no longer matches it and `input:not([type])` starts to. Before removing an attribute, the codemod reads the stylesheets (`css`, `scss`, `sass`, `less`, `styl`), the scripts (`js`, `ts`, `jsx`, `tsx` and their module variants) and the components (`vue`, `svelte`, `astro`) under the given paths and `--references`, plus the inline `<style>` and `<script>` of each file. An attribute is kept, and reported with the file and line, when:

- a selector or a script depends on its presence: `[type]`, `:not([type])`, `[role^="nav"]`, `getAttribute('type')`, `hasAttribute('type')`, `toggleAttribute('hidden')`;
- a selector or a script compares it to the value being removed: `[type="text"]`, `[aria-hidden="false"]`, `getAttribute('role') === 'dialog'` for `role="dialog"` only.

`removeAttribute()` and `setAttribute()` write without reading, so they keep nothing.

A selector on another value (`input[type="email"]`) does not block anything, nor does a selector on another element: `select[size]` keeps `size` on `<select>` only, and `input:not([type])` does not keep `type` on `<script>`. A selector without an element (`[type]`, `.field[type]`), or whose element is unsure, counts for every element. For a boolean attribute written bare, only a selector on its value blocks the rewrite: `[disabled]` still matches `disabled`. In scripts, selectors are read from string literals only, so `items[index]` is not taken for one.

## Frameworks

The codemod reads files as HTML, and edits only static attributes of native elements:

| Syntax                                                                | Support                                                                                                                                                             |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HTML, Nunjucks, Jinja, Django, Twig, Liquid, Handlebars, Go templates | Yes. Template tags (`{{ }}`, `{% %}`, `{# #}`) are left alone.                                                                                                      |
| EJS, ERB, JSP, PHP, Razor                                             | Yes, with `--ext` (`erb`, `php`, `cshtml`...). Their code (`<%= %>`, `<?php ?>`, `@Model.Type`) is left alone, and so is a PHP file left unclosed, from `<?php` on. |
| Thymeleaf                                                             | Yes: `th:` attributes have other names. A `type="text"` next to `th:type` goes, `th:type` sets it anyway.                                                           |
| Vue single-file components, Angular templates                         | Yes, with `--ext html,vue`. Bindings (`:type`, `v-bind:`, `@click`, `[disabled]`, `[attr.aria-hidden]`, `(input)`) have other names and are never touched.          |
| Svelte, Astro                                                         | Yes, with `--ext html,svelte,astro`. Expressions (`type={kind}`, `{...props}`) are left alone.                                                                      |
| JSX, TSX                                                              | No: a script is not HTML, and comparisons or generics could be read as tags.                                                                                        |

HTML e-mails are out of scope: e-mail clients do not render HTML as browsers do, and some keep relying on attributes the spec makes useless (`<style type="text/css">`).

In every syntax, components are skipped: tags with a dash (`<my-button>`) and tags written in PascalCase (`<MyButton>`, `<Button>`), whose attributes are props, not HTML attributes.

## What is never touched

- Dynamic values: any value with a brace (`{{ x }}`, `{% if %}`, `${x}`, `{kind}`) or `<%`, and framework binding attribute names (`:type`, `v-bind:`, `ng-*`...). Dynamic values of attributes a rule handles are reported as skipped.
- Front matter (YAML, TOML, JSON, Astro's script between `---`) and what is written inside a template tag (`{{ " aria-current=\"page\"" }}`): it may look like markup, but it is a string of another language. A value with an escaped quote (`\"`) is taken for one too.
- Custom elements (tag names containing `-`) and PascalCase components: they define their own semantics.
- Foreign content (SVG, MathML), even when attribute names collide with HTML ones.
- Start tags with duplicate attributes: locations are unreliable there, the whole tag is left alone.

## Compared with linters and minifiers

| Tool                                                                   | What it covers                                                                                                                                                                                                                                                                 |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [markuplint](https://markuplint.dev/) `--fix`                          | Fixes a few numeric defaults (`input size`, `textarea rows/cols`, `canvas width/height`) and boolean values. Reports redundant roles, default ARIA values and `aria-required` next to `required` without fixing them. Does not know that `aria-hidden="false"` is the default. |
| [html-validate](https://html-validate.org/)                            | Reports, never fixes. Its recommended preset asks for an explicit `<input type>` and `<button type>`, which this codemod respects for buttons.                                                                                                                                 |
| [html-minifier-terser](https://github.com/terser/html-minifier-terser) | Removes some defaults (`input type="text"`, `form method="get"`, `script type`) from build output, not from source, and knows nothing about ARIA.                                                                                                                              |

This codemod fixes source files, covers ARIA, and keeps what stylesheets and scripts depend on.

## Tests

Golden fixtures follow the usual codemod convention: each `tests/fixtures/<name>.input.<ext>` is transformed and compared byte for byte to `<name>.expected.<ext>`, and transforming an expected file must change nothing. Unit specs cover each rule, the reference check, the command line and the Codemod CLI entry; jsdom checks the defaults and that the browser sees the same values before and after.
