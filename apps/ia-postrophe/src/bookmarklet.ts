import type { Config } from './config';

// Must stay self-contained: it is serialized into the bookmarklet with toString()
export const IApostrophe = ({ IAcharacters, humanCharacters }: Config) => {
  const groups = [
    { name: 'iapostrophe-ia', ...IAcharacters },
    { name: 'iapostrophe-human', ...humanCharacters },
  ];
  // CSS Custom Highlight API: highlights text without touching the DOM
  const useHighlights = typeof CSS !== 'undefined' && 'highlights' in CSS;
  const isOwnSheet = (sheet: CSSStyleSheet) => [...sheet.cssRules].some(rule => rule.cssText.includes(groups[0].name));

  // Second click: remove the highlight
  if (useHighlights && CSS.highlights.has(groups[0].name)) {
    groups.forEach(({ name }) => CSS.highlights.delete(name));
    document.adoptedStyleSheets = document.adoptedStyleSheets.filter(sheet => !isOwnSheet(sheet));
    return;
  }
  const spans = document.querySelectorAll('[data-iapostrophe]');
  if (spans.length) {
    const parents = new Set<Node>();
    spans.forEach(span => {
      if (span.parentNode) {
        parents.add(span.parentNode);
      }
      span.replaceWith(span.textContent ?? '');
    });
    parents.forEach(parent => parent.normalize());
    return;
  }

  const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(groups.flatMap(({ characters }) => characters.map(escapeRegExp)).join('|'), 'g');
  const ignored = 'script, style, noscript, code, pre, textarea, svg';

  // Skip the whole subtree of ignored elements
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode: node => (node.nodeType === Node.TEXT_NODE ? NodeFilter.FILTER_ACCEPT : (node as Element).matches(ignored) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_SKIP),
  });

  const matches: { node: Text; index: number; text: string; group: (typeof groups)[number] }[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) {
    for (const { 0: text, index } of (node as Text).data.matchAll(regex)) {
      matches.push({ node: node as Text, index, text, group: IAcharacters.characters.includes(text) ? groups[0] : groups[1] });
    }
  }

  if (useHighlights) {
    const sheet = new CSSStyleSheet();
    groups.forEach(group => {
      sheet.insertRule(`::highlight(${group.name}) { background-color: ${group.color}; color: black; }`);
      const ranges = matches
        .filter(match => match.group === group)
        .map(({ node, index, text }) => {
          const range = new Range();
          range.setStart(node, index);
          range.setEnd(node, index + text.length);
          return range;
        });
      CSS.highlights.set(group.name, new Highlight(...ranges));
    });
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
    return;
  }

  // Fallback: wrap each character in a span, starting from the end so that earlier indexes stay valid
  matches.reverse().forEach(({ node, index, text, group }) => {
    const target = node.splitText(index);
    target.splitText(text.length);

    const span = document.createElement('span');
    span.dataset.iapostrophe = '';
    span.style.cssText = `background-color: ${group.color}; color: black; border-radius: 2px; padding: 0 1px;`;
    target.replaceWith(span);
    span.append(target);
  });
};
