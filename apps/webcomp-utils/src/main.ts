import * as webcompUtils from '@dume/webcomp-utils';

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  <h1>Demo @dume/webcomp-utils (ESM)</h1>
  <div id="classic-dom">
    <input id="main-input" type="text" value="DOM classique" />
  </div>
  <my-comp></my-comp>
  <div id="result"></div>
`;

// Web Component avec shadow DOM
class MyComp extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });
    const input = document.createElement('input');
    input.id = 'shadow-input';
    input.value = 'Shadow DOM';
    shadow.appendChild(input);
  }
}
if (!customElements.get('my-comp')) {
  customElements.define('my-comp', MyComp);
}

window.addEventListener('DOMContentLoaded', () => {
  const result = document.getElementById('result');
  // Utilisation des fonctions utilitaires
  const customEls = webcompUtils.findCustomElements(document);
  const allInputs = webcompUtils.deepQuerySelectorAll('input');
  const firstInput = webcompUtils.deepQuerySelector('input');

  result!.innerHTML = `
    <b>findCustomElements :</b> ${customEls.map((e: Element) => `<code>${e.tagName.toLowerCase()}</code>`).join(' | ')}<br><br>
    <b>deepQuerySelectorAll('input') :</b> ${allInputs.map((i: Element) => `<code>${i.id} (${i instanceof HTMLInputElement ? i.value : ''})</code>`).join(' | ')}<br><br>
    <b>deepQuerySelector('input') :</b> <code>${firstInput?.id} ${firstInput instanceof HTMLInputElement ? `(${firstInput.value})` : ''}</code>
  `;

  console.log('findCustomElements', customEls);
  console.log('deepQuerySelectorAll', allInputs);
  console.log('deepQuerySelector', firstInput);
});
