// @vitest-environment jsdom
import assert from 'node:assert/strict';
import { beforeEach, test } from 'vite-plus/test';
import { DsFileField } from '../web-components/file-field.ts';

const pdf = new File(['%PDF'], 'report.PDF', { type: 'application/pdf' });
const png = new File(['png'], 'photo.png', { type: 'image/png' });

/** A field in the page, its input's files settable, which jsdom only lets a FileList be */
function field({ accept = '.pdf', attributes = '', input: inputAttributes = '' } = {}) {
  document.body.innerHTML = `
    <ds-file-field ${attributes}>
      <label class="ds-c-field__label" for="file">Document</label>
      <input class="ds-c-field__control" id="file" type="file" accept="${accept}" aria-describedby="message" ${inputAttributes} />
      <p class="ds-c-field__message" id="message">PDF only</p>
    </ds-file-field>`;
  const host = document.querySelector('ds-file-field');
  const input = host.querySelector('input');
  let files = [];
  Object.defineProperty(input, 'files', {
    get: () => files,
    set: value => {
      files = value;
    },
  });
  return { host, input, message: host.querySelector('p'), select: chosen => (files = chosen) };
}

/** A drag event as the browser's, which jsdom does not have */
function drag(type, files, types = ['Files'], relatedTarget = null) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.assign(event, { dataTransfer: { types, files, dropEffect: 'copy' }, relatedTarget });
  return event;
}

beforeEach(() => {
  document.body.innerHTML = '';
});

test('keeps its label, input and message in the page, in its slot', () => {
  const { host, input } = field();
  assert.ok(host instanceof DsFileField);
  assert.equal(input.parentElement, host);
  assert.equal(input.labels[0].textContent, 'Document');
  assert.ok(host.shadowRoot.querySelector('slot'));
  assert.ok(host.shadowRoot.querySelector('style'));
});

test('makes its message a status region before any refusal, for screen readers to announce it', () => {
  const { message } = field();
  assert.equal(message.getAttribute('role'), 'status');
});

test('shows a file is over it, and not when it goes from a child to another', () => {
  const { host, input } = field();
  const over = drag('dragover', []);
  input.dispatchEvent(over);
  assert.equal(over.defaultPrevented, true);
  assert.equal(host.hasAttribute('dragging'), true);
  input.dispatchEvent(drag('dragleave', [], ['Files'], host.querySelector('label')));
  assert.equal(host.hasAttribute('dragging'), true);
  input.dispatchEvent(drag('dragleave', []));
  assert.equal(host.hasAttribute('dragging'), false);
});

test('ignores what is dragged other than files', () => {
  const { host, input } = field();
  const over = drag('dragover', [], ['text/plain']);
  input.dispatchEvent(over);
  assert.equal(over.defaultPrevented, false);
  assert.equal(host.hasAttribute('dragging'), false);
});

test('takes a dropped file, and tells the page', () => {
  const { host, input } = field();
  const heard = [];
  input.addEventListener('input', () => heard.push('input'));
  input.addEventListener('change', () => heard.push('change'));
  host.toggleAttribute('dragging', true);
  const drop = drag('drop', [pdf]);
  input.dispatchEvent(drop);
  assert.equal(drop.defaultPrevented, true);
  assert.deepEqual(input.files, [pdf]);
  assert.deepEqual(heard, ['input', 'change']);
  assert.equal(host.hasAttribute('dragging'), false);
});

test('refuses a dropped file of another type, saying why, not by color alone', () => {
  const { input, message } = field({ attributes: 'invalid-type-message="Un PDF est attendu."' });
  let heard = false;
  input.addEventListener('change', () => (heard = true));
  input.dispatchEvent(drag('drop', [png]));
  assert.deepEqual(input.files, []);
  assert.equal(heard, false);
  assert.equal(input.getAttribute('aria-invalid'), 'true');
  assert.equal(message.textContent, 'Un PDF est attendu.');
  assert.ok(message.classList.contains('ds-c-field__message--danger'));
});

test('refuses several dropped files unless its input is multiple', () => {
  const refused = field({ attributes: 'too-many-message="Un seul fichier."' });
  refused.input.dispatchEvent(drag('drop', [pdf, pdf]));
  assert.equal(refused.message.textContent, 'Un seul fichier.');
  const taken = field({ input: 'multiple' });
  taken.input.dispatchEvent(drag('drop', [pdf, pdf]));
  assert.equal(taken.input.hasAttribute('aria-invalid'), false);
  assert.deepEqual(taken.input.files, [pdf, pdf]);
});

test('refuses a file chosen in the dialog that its input does not accept, before the page hears of it', () => {
  const { input, message, select } = field();
  let heard = false;
  input.addEventListener('change', () => (heard = true));
  select([png]);
  input.dispatchEvent(new Event('change', { bubbles: true }));
  assert.equal(heard, false);
  assert.equal(input.getAttribute('aria-invalid'), 'true');
  assert.equal(message.textContent, 'This type of file is not accepted.');
});

test('shows its message again once an accepted file follows a refused one', () => {
  const { input, message, select } = field();
  input.dispatchEvent(drag('drop', [png]));
  select([pdf]);
  input.dispatchEvent(new Event('change', { bubbles: true }));
  assert.equal(input.hasAttribute('aria-invalid'), false);
  assert.equal(message.textContent, 'PDF only');
  assert.equal(message.classList.contains('ds-c-field__message--danger'), false);
});

test('takes a media type and a family in accept, and any file without accept', () => {
  for (const accept of ['image/png', 'image/*', '.pdf, .png', '']) {
    const { input } = field({ accept });
    input.dispatchEvent(drag('drop', [png]));
    assert.equal(input.hasAttribute('aria-invalid'), false, accept);
  }
});

test('takes nothing while its input is disabled, without leaving the page for the file', () => {
  const { host, input } = field({ input: 'disabled' });
  const over = drag('dragover', [pdf]);
  host.dispatchEvent(over);
  assert.equal(over.defaultPrevented, true);
  assert.equal(over.dataTransfer.dropEffect, 'none');
  assert.equal(host.hasAttribute('dragging'), false);
  const drop = drag('drop', [pdf]);
  host.dispatchEvent(drop);
  assert.equal(drop.defaultPrevented, true);
  assert.deepEqual(input.files, []);
});
