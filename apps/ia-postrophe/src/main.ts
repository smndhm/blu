import '@picocss/pico/css/pico.min.css';

const IApostrophe = () => {
  const IAcharacters = {
    color: 'yellow',
    characters: ['’', '‘', '—', '«', '»', '…'],
  };
  const humanCharacters = {
    color: 'limegreen',
    characters: ["'", '-', '"', '...'],
  };

  const allChars = [...IAcharacters.characters, ...humanCharacters.characters];

  // Fonction d'échappement des caractères spéciaux pour les regex
  const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp('(' + allChars.map(escapeRegExp).join('|') + ')', 'g');

  // Si déjà actif → désactive en retirant les surlignages
  if (document.querySelector('[data-iapostrophe]')) {
    document.querySelectorAll('[data-iapostrophe]').forEach(elm => {
      elm.replaceWith(document.createTextNode(elm.textContent || ''));
    });
    return;
  }

  // Balises à ignorer (code, script, style, pre)
  const forbidden = ['SCRIPT', 'STYLE', 'CODE', 'PRE'];

  // Parcourt tous les nœuds texte du body
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

  // Pour chaque nœud texte, on insère les spans
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

// Génère le lien du bookmarklet automatiquement
const bookmarkletLink = document.querySelector('a[href=""]') as HTMLAnchorElement | null;
if (bookmarkletLink) {
  bookmarkletLink.href = `javascript:${encodeURIComponent(`(${IApostrophe.toString()})()`)};`;
}
