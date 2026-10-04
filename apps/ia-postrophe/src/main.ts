import '@picocss/pico/css/pico.min.css';
import { analyzeText, formatSummary } from './analyze';
import { IApostrophe } from './bookmarklet';
import { config } from './config';

const bookmarkletLink = document.querySelector('a[href=""]') as HTMLAnchorElement | null;
if (bookmarkletLink) {
  bookmarkletLink.href = `javascript:${encodeURIComponent(`(${IApostrophe.toString()})(${JSON.stringify(config)})`)};`;
}

// Text tester
const testerInput = document.querySelector<HTMLTextAreaElement>('#tester-input');
const testerSummary = document.querySelector<HTMLElement>('#tester-summary');
const testerOutput = document.querySelector<HTMLElement>('#tester-output');

if (testerInput && testerSummary && testerOutput) {
  const createMark = (text: string, color: string) => {
    const mark = document.createElement('mark');
    mark.textContent = text;
    mark.style.background = color;
    mark.style.color = 'black';
    mark.style.borderRadius = '2px';
    mark.style.padding = '0 1px';
    return mark;
  };

  const update = () => {
    const text = testerInput.value;
    const isEmpty = !text.trim();
    const analysis = analyzeText(text, config);

    testerOutput.replaceChildren(
      ...analysis.parts.map(({ text, group }) =>
        group ? createMark(text, group === 'ia' ? config.IAcharacters.color : config.humanCharacters.color) : document.createTextNode(text),
      ),
    );
    testerOutput.hidden = isEmpty;
    testerSummary.textContent = isEmpty ? '' : formatSummary(analysis);
  };

  testerInput.addEventListener('input', update);
  update();
}
