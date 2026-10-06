import { analyzeText } from './analyze';
import type { Config } from './config';

export type HighlightRanges = {
  ia: Range[];
  human: Range[];
};

// Find the ranges of AI and human characters in the text nodes of an element
export const findHighlightRanges = (root: Node, config: Config): HighlightRanges => {
  const ranges: HighlightRanges = { ia: [], human: [] };
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);

  let node: Node | null;
  while ((node = walker.nextNode())) {
    let offset = 0;
    for (const { text, group } of analyzeText(node.textContent ?? '', config).parts) {
      if (group) {
        const range = document.createRange();
        range.setStart(node, offset);
        range.setEnd(node, offset + text.length);
        ranges[group].push(range);
      }
      offset += text.length;
    }
  }

  return ranges;
};
