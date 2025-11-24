/**
 * DeepQuerySelector Library
 *
 * @packageDocumentation
 * This library provides deep DOM and Shadow DOM selectors for Web Components.
 * Use it to test, debug, or manipulate custom elements and shadow roots in modern web applications.
 *
 * Features:
 * - Query any element, even inside open shadow roots, using standard CSS selectors
 * - Detect custom elements in any DOM tree
 * - Designed for testing, automation, and advanced DOM traversal
 */

/**
 * Detects Custom Elements in a given root.
 * Custom Elements always have a dash in their tag name (standard Web Components).
 *
 * @param root The root node to search (default: document)
 * @returns Array of custom elements found
 *
 * @example
 * // Finds all custom elements in the document
 * const customEls = findCustomElements();
 *
 * @remarks
 * Useful for debugging, testing, or tooling around Web Components.
 */
export function findCustomElements(root: ParentNode = document): Element[] {
  return Array.from(root.querySelectorAll('*')).filter(elm => elm.tagName.includes('-'));
}

/**
 * Deep selector: querySelectorAll for the DOM and all accessible Shadow DOMs.
 * Recursively finds all elements matching the selector, including inside open shadow roots.
 *
 * @param selector CSS selector to match
 * @param root The root node to search (default: document)
 * @returns Array of matching elements
 *
 * @example
 * // Finds all <input> elements in DOM and shadow roots
 * const allInputs = deepQuerySelectorAll('input');
 *
 * @remarks
 * Only open shadow roots are traversed. Useful for tests and automation.
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
 * Deep selector: querySelector for the DOM and all accessible Shadow DOMs.
 * Returns the first matching element found, or null if none.
 *
 * @param selector CSS selector to match
 * @param root The root node to search (default: document)
 * @returns The first matching element, or null
 *
 * @example
 * // Finds the first <input> element anywhere
 * const firstInput = deepQuerySelector('input');
 *
 * @remarks
 * Returns null if nothing is found. Traverses open shadow roots recursively.
 */
export function deepQuerySelector(selector: string, root: ParentNode = document): Element | null {
  const all = deepQuerySelectorAll(selector, root);
  return all.length ? all[0] : null;
}
