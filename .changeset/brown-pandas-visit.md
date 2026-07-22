---
'@dume/codemod-html-defaults': major
---

Initial release: codemod removing native HTML attributes whose literal value is already the WHATWG spec default (`<input type="text">`, `<form method="get">`, `<script type="text/javascript">`, …). Dry-run by default with a per-attribute report, `--write` to apply, idempotent, byte-preserving outside removals. Defaults sourced from `html-enumerated-attributes` plus a spec-linked supplementary table; contextual defaults (`button[type]`, `target` vs `<base target>`, `link[type]` vs `rel`) are guarded by their real condition or reported for manual review, and dynamic bindings, boolean attributes, custom elements and foreign content are never touched.
