/**
 * The design system's stylesheet with its interactive states always on, for the board of states (states/index.html): a
 * page cannot hover, focus or press an element itself, so `:hover`, `:focus-visible` and `:active` become
 * `[data-state~='hover']`, `[data-state~='focus-visible']` and `[data-state~='active']`. Only selectors change, never an
 * at-rule (`@media (hover: hover)`) nor a declaration: the board shows the very rules of the design system.
 *
 * Usage: node scripts/forced-states.js, after the build: writes states/forced.css from dist/styles.css
 */
import { readFileSync, writeFileSync } from 'node:fs';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

export const STATES = ['hover', 'focus-visible', 'active'];
const PSEUDO_CLASS = new RegExp(`:(${STATES.join('|')})(?![\\w-])`, 'g');

/** `css` with the pseudo-classes of the states, in its selectors only, made attribute selectors */
export function forceStates(css) {
  let output = '';
  // The text since the last `{`, `}` or `;`: a selector or an at-rule's prelude when a `{` ends it
  let prelude = '';
  for (let index = 0; index < css.length; index += 1) {
    const char = css[index];
    // Comments and strings are copied as they are
    if (char === '/' && css[index + 1] === '*') {
      const end = css.indexOf('*/', index + 2);
      const stop = end === -1 ? css.length : end + 2;
      prelude += css.slice(index, stop);
      index = stop - 1;
    } else if (char === '"' || char === "'") {
      let end = index + 1;
      while (end < css.length && css[end] !== char) end += css[end] === '\\' ? 2 : 1;
      prelude += css.slice(index, end + 1);
      index = end;
    } else if (char === '{') {
      output += (prelude.trimStart().startsWith('@') ? prelude : prelude.replace(PSEUDO_CLASS, "[data-state~='$1']")) + char;
      prelude = '';
    } else if (char === '}' || char === ';') {
      output += prelude + char;
      prelude = '';
    } else {
      prelude += char;
    }
  }
  return output + prelude;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const css = readFileSync(new URL('../dist/styles.css', import.meta.url), 'utf8');
  writeFileSync(new URL('../states/forced.css', import.meta.url), forceStates(css));
}
