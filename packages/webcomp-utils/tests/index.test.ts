import { deepQuerySelector, deepQuerySelectorAll, findCustomElements } from '../src/index';
import { describe, it, expect } from 'vitest';

// Define and register custom elements once for all tests
class MyComp extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });
    const input = document.createElement('input');
    input.id = 'shadow-input';
    shadow.appendChild(input);
  }
}
class YourWidget extends HTMLElement {}
if (!customElements.get('my-comp')) {
  customElements.define('my-comp', MyComp);
}
if (!customElements.get('your-widget')) {
  customElements.define('your-widget', YourWidget);
}

describe('webcomp-utils', () => {
  it('should return empty array if no custom elements', () => {
    document.body.innerHTML = `<div></div><span></span>`;
    const found = findCustomElements(document);
    expect(found.length).toBe(0);
  });

  it('should handle custom element without shadowRoot', () => {
    document.body.innerHTML = `<no-shadow></no-shadow>`;
    class NoShadow extends HTMLElement {}
    if (!customElements.get('no-shadow')) {
      customElements.define('no-shadow', NoShadow);
    }
    const el = document.createElement('no-shadow');
    document.body.appendChild(el);
    customElements.upgrade(el);
    // Should not throw or add anything extra
    const results = deepQuerySelectorAll('input');
    expect(Array.isArray(results)).toBe(true);
  });

  it('should return null if selector not found', () => {
    document.body.innerHTML = `<div></div>`;
    const result = deepQuerySelector('.not-found');
    expect(result).toBeNull();
  });
  it('should find custom elements in the DOM', () => {
    document.body.innerHTML = `<div></div><my-comp></my-comp><your-widget></your-widget>`;
    const found = findCustomElements(document);
    expect(found.length).toBe(2);
    expect(found.some((e: Element) => e.tagName.toLowerCase() === 'my-comp')).toBe(true);
    expect(found.some((e: Element) => e.tagName.toLowerCase() === 'your-widget')).toBe(true);
  });
  it('should find elements in the main DOM', () => {
    document.body.innerHTML = `<input id="main" />`;
    const input = deepQuerySelector('#main');
    expect(input).not.toBeNull();
    expect(input?.id).toBe('main');
  });

  it('should find elements in shadow DOM', async () => {
    document.body.innerHTML = '';
    class MyComp extends HTMLElement {
      constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        const input = document.createElement('input');
        input.id = 'shadow-input';
        shadow.appendChild(input);
      }
    }
    if (!customElements.get('my-comp')) {
      customElements.define('my-comp', MyComp);
    }
    // Manually create and append custom element using document.createElement
    const el = document.createElement('my-comp');
    document.body.appendChild(el);
    customElements.upgrade(el);
    // Ensure shadowRoot is present
    const input = deepQuerySelector('#shadow-input');
    expect(input).not.toBeNull();
    expect(input?.id).toBe('shadow-input');
  });

  it('should find all elements deeply', async () => {
    document.body.innerHTML = '';
    class MyComp extends HTMLElement {
      constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        const input = document.createElement('input');
        input.id = 'shadow-input';
        shadow.appendChild(input);
      }
    }
    if (!customElements.get('my-comp')) {
      customElements.define('my-comp', MyComp);
    }
    document.body.innerHTML = `<input id="main" />`;
    const el = document.createElement('my-comp');
    document.body.appendChild(el);
    customElements.upgrade(el);
    // Ensure shadowRoot is present
    const inputs = deepQuerySelectorAll('input');
    expect(inputs.length).toBe(2);
    expect(inputs.some(i => i.id === 'main')).toBe(true);
    expect(inputs.some(i => i.id === 'shadow-input')).toBe(true);
  });
});
