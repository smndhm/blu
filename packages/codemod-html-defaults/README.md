# @dume/codemod-html-defaults

Codemod that removes native HTML attributes whose literal value is already the default defined by the [WHATWG HTML Living Standard](https://html.spec.whatwg.org/multipage/) — e.g. `<input type="text">` → `<input>`, `<script type="text/javascript">` → `<script>`, `<form method="get">` → `<form>`.

Lighter markup, less noise, fewer accidentally copy-pasted no-op attributes. Removals are guaranteed spec-level no-ops: everything outside the removed attribute ranges is preserved byte for byte, so the tool is safe on HTML-ish template files (Nunjucks, Jinja…) too.

## Usage

```sh
# Dry-run (default): report what would be removed, write nothing
npx codemod-html-defaults src/

# Apply
npx codemod-html-defaults --write src/

# Include template files when walking directories (explicit file paths are always processed)
npx codemod-html-defaults --ext html,njk --write .
```

The run is idempotent: a second pass reports zero removals.

Programmatic API:

```js
import { transformHtml } from '@dume/codemod-html-defaults';

const { output, findings, changed } = transformHtml('<input type="text">');
// output === '<input>'
```

### Codemod CLI workflow entry

For rollouts driven by the [Codemod CLI](https://docs.codemod.com/) (`codemod:ast-grep`-style workflow scripts), the package also exposes a ready-made step with the usual `transform(root) → string | null` contract — drop it into a workflow alongside other transforms:

```js
// workflow script
import transform from '@dume/codemod-html-defaults/codemod';

export default transform;
```

It returns `null` when the file is untouched, logs one `file - Removing N …` line per changed file, and reports conditional skips (`button[type]`, `target` with `<base>`, dynamic values) as `ℹ️` lines so they surface in the rollout output.

## Where the defaults come from (never from memory)

- **Primary source**: the [`html-enumerated-attributes`](https://github.com/wooorm/html-enumerated-attributes) package (MIT, unified collective), which encodes the WHATWG _missing value default_ of every enumerated attribute as equivalence classes of states. An attribute is removable only when its case-folded value belongs to the same state group as the missing value default.
- **Supplementary table** (`src/defaults.ts`): the few non-enumerated attributes with a spec-defined default (`script[type]`, `style[type]`, `link[type]`), each entry carrying a link to its normative definition and cross-checked with `html-minifier-terser`'s redundant-attribute handling.
- **Empirical verification**: the test suite asserts the defaults against jsdom's implementation of the WHATWG reflection rules (`input.type === 'text'`, `form.method === 'get'`, …), and proves on a real form that submission-related behavior is identical before and after the transform.

## Tests

Following the usual codemod convention, the main coverage lives in golden fixtures: each `tests/fixtures/<name>.input.<ext>` file is transformed and compared byte for byte to its `<name>.expected.<ext>` sibling (plus an idempotence check: transforming an expected file must change nothing). To add a case, drop a new input/expected pair in that directory — the harness picks it up automatically. Finer-grained unit specs cover the report contract (findings, skip reasons, line/column) and the assumptions made about the upstream defaults data.

## What gets removed (unconditionally)

| Example                                                                      | Why it is a no-op                                                                                                                                                                  |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<input type="text">`                                                        | [missing value default: Text](https://html.spec.whatwg.org/multipage/input.html#attr-input-type)                                                                                   |
| `<form method="get">`                                                        | [missing value default: GET](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#attr-fs-method)                                                               |
| `<form enctype="application/x-www-form-urlencoded">`                         | [missing value default](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#attr-fs-enctype)                                                                   |
| `<form autocomplete="on">`                                                   | [missing value default: on](https://html.spec.whatwg.org/multipage/forms.html#attr-form-autocomplete)                                                                              |
| `<img decoding="auto">`, `<img loading="eager">`, `<iframe loading="eager">` | [decoding](https://html.spec.whatwg.org/multipage/images.html#attr-img-decoding), [loading](https://html.spec.whatwg.org/multipage/urls-and-fetching.html#lazy-loading-attributes) |
| `<area shape="rect">`                                                        | [missing value default: rectangle](https://html.spec.whatwg.org/multipage/image-maps.html#attr-area-shape)                                                                         |
| `<textarea wrap="soft">`                                                     | [missing value default: soft](https://html.spec.whatwg.org/multipage/form-elements.html#attr-textarea-wrap)                                                                        |
| `<script type="text/javascript">`                                            | [omitted attribute means classic script](https://html.spec.whatwg.org/multipage/scripting.html#attr-script-type) — `module`, `importmap` and data blocks are never touched         |
| `<style type="text/css">`                                                    | [attr-style-type](https://html.spec.whatwg.org/multipage/semantics.html#attr-style-type)                                                                                           |
| `<ol type="1">`                                                              | missing value default: decimal (case-sensitive comparison)                                                                                                                         |

…plus every other enumerated attribute the data source marks as matching its missing value default (`marquee`, obsolete elements, …). The comparison is exact (no whitespace trimming) and ASCII case-insensitive unless the spec marks the attribute case-sensitive.

## Conditional defaults (the real condition is checked — never a flat default)

| Case                                                   | Handling                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<a target="_self">`, `<area target>`, `<form target>` | Removed **only** in a full document (doctype/`<html>` present) containing **no `<base target>`** — [the missing target falls back to the base element's target](https://html.spec.whatwg.org/multipage/semantics.html#the-base-element). Fragments/partials are always skipped: they may be included under a layout that declares a `<base>`.                                                                                      |
| `<base target>` itself                                 | Never removed: it sets the document-wide default, removal is not a local no-op.                                                                                                                                                                                                                                                                                                                                                    |
| `<link type="text/css">`                               | Removed only when the same element has a static `rel` containing the `stylesheet` token — [the default type depends on rel](https://html.spec.whatwg.org/multipage/semantics.html#attr-link-type).                                                                                                                                                                                                                                 |
| `<button type="submit">`                               | **Never removed in v1**, only reported. The spec's missing value default is the Submit Button state ([attr-button-type](https://html.spec.whatwg.org/multipage/form-elements.html#attr-button-type)), but the effective behavior depends on form association and historically diverged between browsers outside a form — and explicit `type="submit"`/`type="button"` is often kept deliberately for readability. Left to a human. |

## What is never touched

- **Dynamic values**: template interpolations (`{{ x }}`, `{% if %}`, `<%= %>`, `${x}`) and framework binding attribute names (`:type`, `v-bind:`, `ng-*`…).
- **Boolean attributes** (`disabled`, `required`, `checked`, `defer`, …): presence is meaning; an attribute with an empty value is never removed either, even when the empty string is the missing value default.
- **Custom elements** (tag names containing `-`): native defaults do not apply to them.
- **Foreign content** (SVG/MathML), even when attribute names collide with HTML ones.
- **Start tags with duplicate attributes**: locations are unreliable there, the whole tag is left alone.

## Scope and relationship to other codemods

This is a **standalone** tool: this repository contains no other markup codemod to share parser infrastructure with, so v1 deliberately targets HTML and HTML-shaped template files only (parse5-based, byte-preserving). JSX/TSX and Vue SFC syntaxes are out of scope for v1 — the dynamic-value and binding guards already refuse to touch such constructs if the tool is pointed at them. If a JSX/Vue-aware codemod appears later, this package's defaults tables and condition layer are reusable as-is; only the per-syntax parsing/edit layer would need to be added.

Documented non-goals of v1, kept as candidates: `td/th[colspan="1"]`/`[rowspan="1"]` (IDL default verified to 1 in tests, but low value), invalid-value canonicalization (e.g. `method="foo"` → GET — a codemod should not rewrite invalid markup silently), `select[size]` (default display size depends on `multiple`).
