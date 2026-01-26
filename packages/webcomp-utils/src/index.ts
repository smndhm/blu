/**
 * @packageDocumentation
 *
 * Utilities for deep DOM and Web Components manipulation.
 * Allows selecting elements in both regular DOM and all open shadow roots.
 *
 * Main features:
 * - Select elements with CSS selectors, including inside shadow DOMs
 * - Detect custom elements (Web Components) in any DOM tree
 * - Designed for testing, automation, and debugging Web Components
 *
 * You can import the library in any ESM-compatible environment (Node.js, Vite, Webpack, etc.):
 *
 * ```ts
 * import { deepQuerySelector, deepQuerySelectorAll, findCustomElements } from '@dume/webcomp-utils';
 * ```
 *
 * You can also import the library in any HTML page using jsdelivr CDN.
 *
 * ```html
 * <script src="https://cdn.jsdelivr.net/npm/@dume/webcomp-utils/dist/webcomp-utils.umd.min.js"></script>
 *
 * <script>
 *   const inputs = window.webcompUtils.deepQuerySelectorAll('input');
 * </script>
 * ```
 *
 */

/**
 * Finds all custom elements (Web Components) in a given DOM tree.
 * Custom elements are identified by a dash in their tag name.
 *
 * @param root The root node to search (default: document)
 * @returns Array of found custom elements
 *
 * @example
 * // Find all custom elements in the page
 * const customEls = findCustomElements();
 *
 * @remarks
 * Useful for debugging, testing, or analyzing Web Components.
 */
export function findCustomElements(root: ParentNode = document): Element[] {
  return Array.from(root.querySelectorAll('*')).filter(elm => elm.tagName.includes('-'));
}

/**
 * Selects all elements matching the CSS selector in the DOM and all open shadow roots.
 * Recursively traverses Web Components to find elements, even in nested shadow DOMs.
 *
 * @param selector CSS selector to match
 * @param root The root node to search (default: document)
 * @returns Array of found elements
 *
 * @example
 * // Find all <input> elements in DOM and shadow roots
 * const allInputs = deepQuerySelectorAll('input');
 *
 * @remarks
 * Only open shadow roots are traversed. Ideal for tests and automation.
 */
export function deepQuerySelectorAll(selector: string, root: ParentNode = document): Element[] {
  const results = Array.from(root.querySelectorAll(selector));
  const customElements = findCustomElements(root);
  for (const el of customElements) {
    if ('shadowRoot' in el && el.shadowRoot) {
      results.push(...deepQuerySelectorAll(selector, el.shadowRoot));
    }
  }
  return results;
}

/**
 * Selects the first element matching the CSS selector in the DOM and all open shadow roots.
 * Returns the first found element or null if none matches.
 *
 * @param selector CSS selector to match
 * @param root The root node to search (default: document)
 * @returns The first found element, or null
 *
 * @example
 * // Find the first <input> element in DOM or shadow roots
 * const firstInput = deepQuerySelector('input');
 *
 * @remarks
 * Returns null if no element matches. Recursively explores open shadow roots.
 */
export function deepQuerySelector(selector: string, root: ParentNode = document): Element | null {
  const all = deepQuerySelectorAll(selector, root);
  return all.length ? all[0] : null;
}
