import { IApostrophe } from '../src/bookmarklet';
import { config } from '../src/config';
import { describe, it, expect, beforeEach } from 'vitest';

const highlighted = () => [...document.querySelectorAll<HTMLElement>('[data-iapostrophe]')];

describe('IApostrophe bookmarklet', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should highlight AI and human characters with their colors', () => {
    document.body.innerHTML = `<p>C’est c'est</p>`;
    IApostrophe(config);

    const spans = highlighted();
    expect(spans.map(span => span.textContent)).toEqual(['’', "'"]);
    expect(spans[0].style.background).toBe(config.IAcharacters.color);
    expect(spans[1].style.background).toBe(config.humanCharacters.color);
    expect(document.body.textContent).toBe("C’est c'est");
  });

  it('should remove the highlight when run a second time', () => {
    document.body.innerHTML = `<p>« Bonjour » — vraiment…</p>`;
    IApostrophe(config);
    expect(highlighted()).toHaveLength(4);

    IApostrophe(config);
    expect(highlighted()).toHaveLength(0);
    expect(document.body.textContent).toBe('« Bonjour » — vraiment…');
  });

  it('should ignore script, style, code, pre and textarea elements', () => {
    document.body.innerHTML = `
      <script>const a = '’';</script>
      <style>p::before { content: '’'; }</style>
      <code>c’est</code>
      <pre>c’est</pre>
      <textarea>c’est</textarea>
    `;
    IApostrophe(config);
    expect(highlighted()).toHaveLength(0);
  });

  it('should work once serialized as a bookmarklet', () => {
    document.body.innerHTML = `<p>c’est</p>`;
    new Function(`(${IApostrophe.toString()})(${JSON.stringify(config)})`)();
    expect(highlighted().map(span => span.textContent)).toEqual(['’']);
  });
});
