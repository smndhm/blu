---
'@dume/ds': minor
---

Every interactive element has all its states, accessible: a principle of the design system, in its README. Hovered, pressed, disabled (`disabled` or `aria-disabled="true"`) for the buttons, their pointer cursor, `not-allowed` when disabled; a thicker underline for a hovered link, darker when pressed; a hover border, an invalid state (`aria-invalid`, `.ds-c-field__message--danger`) and a disabled one for the controls; the current page's header link in bold. Windows' contrast themes show a disabled element in `GrayText`. New tokens: `--ds-b-color-primary-hover`, `-active`, `--ds-b-color-background-hover`, `-active`, `--ds-b-color-text-disabled`, `--ds-b-color-background-disabled` and `--ds-b-color-danger`, a red of the primary color's chroma. The tests check every color's contrast as people see them and as the three kinds of color blindness do.
