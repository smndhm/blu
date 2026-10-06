import { config } from '../src/config';
import { findHighlightRanges } from '../src/highlight';
import { describe, it, expect } from 'vitest';

describe('findHighlightRanges', () => {
  it('should return no range for an empty element', () => {
    const root = document.createElement('div');
    expect(findHighlightRanges(root, config)).toEqual({ ia: [], human: [] });
  });

  it('should return the ranges of AI and human characters', () => {
    const root = document.createElement('div');
    root.textContent = "C’est c'est — vraiment...";

    const { ia, human } = findHighlightRanges(root, config);
    expect(ia.map(range => range.toString())).toEqual(['’', '—']);
    expect(human.map(range => range.toString())).toEqual(["'", '...']);
    expect(ia[0].startOffset).toBe(1);
    expect(ia[0].endOffset).toBe(2);
  });

  it('should find ranges across several text nodes', () => {
    const root = document.createElement('div');
    root.innerHTML = 'c’est<br>« ok »';

    const { ia } = findHighlightRanges(root, config);
    expect(ia.map(range => range.toString())).toEqual(['’', '«', '»']);
    expect(ia[0].startContainer).toBe(root.firstChild);
    expect(ia[1].startContainer).toBe(root.lastChild);
  });
});
