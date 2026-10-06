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

  const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(groups.flatMap(({ characters }) => characters.map(escapeRegExp)).join('|'), 'g');
  const ignored = 'script, style, noscript, code, pre, textarea, svg';

  // Text nodes of the document and of every open shadow root (closed ones are not reachable)
  const roots: (Document | ShadowRoot)[] = [document];
  const texts: Text[] = [];
  for (const root of roots) {
    const walker = document.createTreeWalker(root === document ? document.body : root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode: node => {
        if (node.nodeType === Node.TEXT_NODE) {
          return NodeFilter.FILTER_ACCEPT;
        }
        // Skip the whole subtree of ignored elements
        if ((node as Element).matches(ignored)) {
          return NodeFilter.FILTER_REJECT;
        }
        // Nested shadow roots are walked by a later iteration of the loop
        const { shadowRoot } = node as Element;
        if (shadowRoot) {
          roots.push(shadowRoot);
        }
        return NodeFilter.FILTER_SKIP;
      },
    });
    let node: Node | null;
    while ((node = walker.nextNode())) {
      texts.push(node as Text);
    }
  }

  // Second click: remove the highlight
  if (useHighlights && CSS.highlights.has(groups[0].name)) {
    groups.forEach(({ name }) => CSS.highlights.delete(name));
    roots.forEach(root => {
      root.adoptedStyleSheets = root.adoptedStyleSheets.filter(sheet => !isOwnSheet(sheet));
    });
    return;
  }
  const spans = roots.flatMap(root => [...root.querySelectorAll('[data-iapostrophe]')]);
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

  const matches: { node: Text; index: number; text: string; group: (typeof groups)[number] }[] = [];
  texts.forEach(node => {
    for (const { 0: text, index } of node.data.matchAll(regex)) {
      matches.push({ node, index, text, group: IAcharacters.characters.includes(text) ? groups[0] : groups[1] });
    }
  });

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
    // Style rules are scoped to each tree: the same sheet is also adopted by shadow roots
    roots.forEach(root => {
      root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
    });
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
