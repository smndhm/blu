import { IApostrophe } from '../src/bookmarklet';
import { config } from '../src/config';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const ignoredHTML = `
  <script>const a = '’';</script>
  <style>p::before { content: '’'; }</style>
  <noscript>c’est</noscript>
  <code>c’est</code>
  <pre><span class="token">'c’est'</span></pre>
  <textarea>c’est</textarea>
  <svg><text>c’est</text></svg>
`;

class FakeHighlight extends Set<Range> {
  constructor(...ranges: Range[]) {
    super(ranges);
  }
}

describe('IApostrophe bookmarklet with the CSS Custom Highlight API', () => {
  const highlights = new Map<string, Set<Range>>();
  const rangesOf = (name: string) => [...(highlights.get(name) ?? [])].map(range => range.toString());

  beforeEach(() => {
    highlights.clear();
    vi.stubGlobal('CSS', { highlights });
    vi.stubGlobal('Highlight', FakeHighlight);
    Object.defineProperty(document, 'adoptedStyleSheets', { value: [], writable: true, configurable: true });
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should highlight AI and human characters without touching the DOM', () => {
    document.body.innerHTML = `<p>C’est c'est — vraiment...</p>`;
    const html = document.body.innerHTML;
    IApostrophe(config);

    expect(rangesOf('iapostrophe-ia')).toEqual(['’', '—']);
    expect(rangesOf('iapostrophe-human')).toEqual(["'", '...']);
    expect(document.body.innerHTML).toBe(html);
  });

  it('should add a style sheet with the colors', () => {
    IApostrophe(config);

    expect(document.adoptedStyleSheets).toHaveLength(1);
    const css = [...document.adoptedStyleSheets[0].cssRules].map(rule => rule.cssText).join(' ');
    expect(css).toContain('iapostrophe-ia');
    expect(css).toContain(config.IAcharacters.color);
    expect(css).toContain(config.humanCharacters.color);
  });

  it('should remove the highlight and the style sheet when run a second time', () => {
    const otherSheet = new CSSStyleSheet();
    document.adoptedStyleSheets = [otherSheet];
    document.body.innerHTML = `<p>c’est</p>`;

    IApostrophe(config);
    expect(highlights.size).toBe(2);
    expect(document.adoptedStyleSheets).toHaveLength(2);

    IApostrophe(config);
    expect(highlights.size).toBe(0);
    expect(document.adoptedStyleSheets).toEqual([otherSheet]);
  });

  it('should highlight characters in editable areas', () => {
    document.body.innerHTML = `<div contenteditable>c’est</div>`;
    IApostrophe(config);
    expect(rangesOf('iapostrophe-ia')).toEqual(['’']);
  });

  it('should ignore script, style, noscript, code, pre, textarea and svg elements, even nested', () => {
    document.body.innerHTML = ignoredHTML;
    IApostrophe(config);
    expect(rangesOf('iapostrophe-ia')).toEqual([]);
    expect(rangesOf('iapostrophe-human')).toEqual([]);
  });
});

describe('IApostrophe bookmarklet fallback without the CSS Custom Highlight API', () => {
  const highlighted = () => [...document.querySelectorAll<HTMLElement>('[data-iapostrophe]')];

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should highlight AI and human characters with their colors', () => {
    document.body.innerHTML = `<p>C’est c'est</p>`;
    IApostrophe(config);

    const spans = highlighted();
    expect(spans.map(span => span.textContent)).toEqual(['’', "'"]);
    expect(spans[0].style.backgroundColor).toBe(config.IAcharacters.color);
    expect(spans[1].style.backgroundColor).toBe(config.humanCharacters.color);
    expect(document.body.textContent).toBe("C’est c'est");
  });

  it('should highlight several characters in the same text node', () => {
    document.body.innerHTML = `<p>« Bonjour » — vraiment…</p>`;
    IApostrophe(config);

    expect(highlighted().map(span => span.textContent)).toEqual(['«', '»', '—', '…']);
    expect(document.body.textContent).toBe('« Bonjour » — vraiment…');
  });

  it('should not replace text nodes without characters to highlight', () => {
    document.body.innerHTML = `<p>Bonjour</p><p>c’est</p>`;
    const untouched = document.querySelector('p')?.firstChild;
    IApostrophe(config);

    expect(document.querySelector('p')?.firstChild).toBe(untouched);
  });

  it('should restore the original text nodes when run a second time', () => {
    document.body.innerHTML = `<p>« Bonjour » — vraiment…</p>`;
    IApostrophe(config);
    IApostrophe(config);

    const paragraph = document.querySelector('p');
    expect(highlighted()).toHaveLength(0);
    expect(paragraph?.childNodes).toHaveLength(1);
    expect(paragraph?.textContent).toBe('« Bonjour » — vraiment…');
  });

  it('should ignore script, style, noscript, code, pre, textarea and svg elements, even nested', () => {
    document.body.innerHTML = ignoredHTML;
    IApostrophe(config);
    expect(highlighted()).toHaveLength(0);
  });

  it('should work once serialized as a bookmarklet', () => {
    document.body.innerHTML = `<p>c’est</p>`;
    new Function(`(${IApostrophe.toString()})(${JSON.stringify(config)})`)();
    expect(highlighted().map(span => span.textContent)).toEqual(['’']);
  });
});
