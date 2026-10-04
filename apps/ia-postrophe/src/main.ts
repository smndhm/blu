import '@picocss/pico/css/pico.min.css';

type CharacterGroup = {
  color: string;
  characters: string[];
};

type Config = {
  IAcharacters: CharacterGroup;
  humanCharacters: CharacterGroup;
};

const config: Config = {
  IAcharacters: {
    color: 'yellow',
    characters: ['’', '‘', '—', '«', '»', '“', '”', '…'],
  },
  humanCharacters: {
    color: 'limegreen',
    characters: ["'", '"', '...'],
  },
};

// Must stay self-contained: it is serialized into the bookmarklet with toString()
const IApostrophe = ({ IAcharacters, humanCharacters }: Config) => {
  const allChars = [...IAcharacters.characters, ...humanCharacters.characters];

  const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp('(' + allChars.map(escapeRegExp).join('|') + ')', 'g');

  if (document.querySelector('[data-iapostrophe]')) {
    document.querySelectorAll('[data-iapostrophe]').forEach(elm => {
      elm.replaceWith(document.createTextNode(elm.textContent || ''));
    });
    return;
  }

  const forbidden = ['SCRIPT', 'STYLE', 'CODE', 'PRE', 'TEXTAREA'];

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];

  let node: Node | null;
  while ((node = walker.nextNode())) {
    const parent = node.parentNode as HTMLElement | null;
    if (!parent || forbidden.includes(parent.tagName) || !node.textContent?.trim()) {
      continue;
    }
    nodes.push(node as Text);
  }

  nodes.forEach(textNode => {
    const text = textNode.textContent ?? '';
    const parts: (Text | HTMLElement)[] = [];
    let lastIndex = 0;

    text.replace(regex, (match, _, index) => {
      if (index > lastIndex) {
        parts.push(document.createTextNode(text.slice(lastIndex, index)));
      }

      const span = document.createElement('span');
      span.dataset.iapostrophe = '';
      span.textContent = match;
      span.style.background = IAcharacters.characters.includes(match) ? IAcharacters.color : humanCharacters.color;
      span.style.borderRadius = '2px';
      span.style.padding = '0 1px';
      span.style.color = 'black';

      parts.push(span);
      lastIndex = index + match.length;
      return match;
    });

    if (lastIndex < text.length) {
      parts.push(document.createTextNode(text.slice(lastIndex)));
    }

    if (parts.length > 0) {
      textNode.replaceWith(...parts);
    }
  });
};

const bookmarkletLink = document.querySelector('a[href=""]') as HTMLAnchorElement | null;
if (bookmarkletLink) {
  bookmarkletLink.href = `javascript:${encodeURIComponent(`(${IApostrophe.toString()})(${JSON.stringify(config)})`)};`;
}

// Text tester
const testerInput = document.querySelector<HTMLTextAreaElement>('#tester-input');
const testerSummary = document.querySelector<HTMLElement>('#tester-summary');
const testerOutput = document.querySelector<HTMLElement>('#tester-output');

if (testerInput && testerSummary && testerOutput) {
  const { IAcharacters, humanCharacters } = config;
  const allChars = [...IAcharacters.characters, ...humanCharacters.characters];
  const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp('(' + allChars.map(escapeRegExp).join('|') + ')', 'g');

  const createMark = (match: string, group: CharacterGroup) => {
    const mark = document.createElement('mark');
    mark.textContent = match;
    mark.style.background = group.color;
    mark.style.color = 'black';
    mark.style.borderRadius = '2px';
    mark.style.padding = '0 1px';
    return mark;
  };

  const formatCounts = (counts: Map<string, number>) => [...counts.entries()].map(([char, count]) => `${char} × ${count}`).join(', ');

  const update = () => {
    const text = testerInput.value;
    const iaCounts = new Map<string, number>();
    const humanCounts = new Map<string, number>();
    const parts: (Text | HTMLElement)[] = [];
    let lastIndex = 0;

    for (const { 0: match, index } of text.matchAll(regex)) {
      if (index > lastIndex) {
        parts.push(document.createTextNode(text.slice(lastIndex, index)));
      }
      const isIA = IAcharacters.characters.includes(match);
      const counts = isIA ? iaCounts : humanCounts;
      counts.set(match, (counts.get(match) ?? 0) + 1);
      parts.push(createMark(match, isIA ? IAcharacters : humanCharacters));
      lastIndex = index + match.length;
    }
    if (lastIndex < text.length) {
      parts.push(document.createTextNode(text.slice(lastIndex)));
    }

    testerOutput.replaceChildren(...parts);
    testerOutput.hidden = !text.trim();

    const iaTotal = [...iaCounts.values()].reduce((sum, count) => sum + count, 0);
    const humanTotal = [...humanCounts.values()].reduce((sum, count) => sum + count, 0);

    if (!text.trim()) {
      testerSummary.textContent = '';
    } else if (iaTotal === 0) {
      testerSummary.textContent =
        humanTotal > 0 ? `Aucun caractère typographique IA trouvé. Caractères saisis au clavier : ${formatCounts(humanCounts)}.` : 'Aucun caractère typographique IA trouvé.';
    } else {
      testerSummary.textContent =
        `${iaTotal} caractère${iaTotal > 1 ? 's' : ''} typographique${iaTotal > 1 ? 's' : ''} IA trouvé${iaTotal > 1 ? 's' : ''} : ${formatCounts(iaCounts)}.` +
        (humanTotal > 0 ? ` Caractères saisis au clavier : ${formatCounts(humanCounts)}.` : '');
    }
  };

  testerInput.addEventListener('input', update);
  update();
}
