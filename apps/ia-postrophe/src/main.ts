import { analyzeText, formatSummary } from './analyze';
import { IApostrophe } from './bookmarklet';
import { config } from './config';
import { findHighlightRanges } from './highlight';

const bookmarkletLink = document.querySelector<HTMLAnchorElement>('#bookmarklet');
if (bookmarkletLink) {
  bookmarkletLink.href = `javascript:${encodeURIComponent(`(${IApostrophe.toString()})(${JSON.stringify(config)})`)};`;
}

// Text tester
const testerInput = document.querySelector<HTMLElement>('#tester-input');
const testerSummary = document.querySelector<HTMLElement>('#tester-summary');

if (testerInput && testerSummary) {
  const update = () => {
    const text = testerInput.textContent ?? '';

    // Keep the placeholder visible once the text is cleared
    if (!text && testerInput.childNodes.length) {
      testerInput.replaceChildren();
    }

    testerSummary.textContent = text.trim() ? formatSummary(analyzeText(text, config)) : '';

    // CSS Custom Highlight API: highlights text without touching the DOM, so the caret stays in place
    if ('highlights' in CSS) {
      const { ia, human } = findHighlightRanges(testerInput, config);
      CSS.highlights.set('iapostrophe-tester-ia', new Highlight(...ia));
      CSS.highlights.set('iapostrophe-tester-human', new Highlight(...human));
    }
  };

  testerInput.addEventListener('input', update);
  update();
}
