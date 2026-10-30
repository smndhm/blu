// @vitest-environment jsdom
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, test, vi } from 'vite-plus/test';
import { ANNOUNCE_DELAY, showBanner } from '../web-components/banner.ts';

beforeEach(() => {
  vi.useFakeTimers();
  document.querySelectorAll('ds-banner').forEach(banner => banner.remove());
});
afterEach(() => vi.useRealTimers());

test('shows the message in a status region, apart from the page styles', () => {
  const host = showBanner(document, { text: 'Music Bridge could not find this music on Deezer.', lang: 'en', closeLabel: 'Close' });
  assert.equal(host.localName, 'ds-banner');
  assert.equal(host.isConnected, true);
  assert.ok(host.shadowRoot.querySelector('style'));
  vi.advanceTimersByTime(ANNOUNCE_DELAY);
  assert.equal(host.shadowRoot.querySelector('[role="status"]').textContent, 'Music Bridge could not find this music on Deezer.');
});

test('adds the status region before its text, for screen readers to announce it', () => {
  const host = showBanner(document, { text: 'Message', lang: 'en', closeLabel: 'Close' });
  const text = host.shadowRoot.querySelector('span');
  assert.equal(text.textContent, '');
  vi.advanceTimersByTime(ANNOUNCE_DELAY);
  assert.equal(text.textContent, 'Message');
});

test('says the language of its text', () => {
  const host = showBanner(document, { text: 'Message', lang: 'fr', closeLabel: 'Fermer' });
  assert.equal(host.shadowRoot.querySelector('[role="status"]').closest('[lang]').getAttribute('lang'), 'fr');
});

test('closes with its button, which has a label', () => {
  const host = showBanner(document, { text: 'Message', lang: 'en', closeLabel: 'Close' });
  const button = host.shadowRoot.querySelector('button');
  assert.equal(button.getAttribute('aria-label'), 'Close');
  button.click();
  assert.equal(host.isConnected, false);
});

test('closes with Escape while the focus is in it', () => {
  const host = showBanner(document, { text: 'Message', lang: 'en', closeLabel: 'Close' });
  document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(host.isConnected, true);
  host.shadowRoot.querySelector('button').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(host.isConnected, false);
});

test('shows the logo, hidden from screen readers', () => {
  const host = showBanner(document, { text: 'Message', lang: 'en', closeLabel: 'Close', iconUrl: 'data:image/png;base64,iVBORw0KGgo=' });
  const icon = host.shadowRoot.querySelector('img');
  assert.equal(icon.getAttribute('src'), 'data:image/png;base64,iVBORw0KGgo=');
  assert.equal(icon.alt, '');
});

test('shows the text as text, not HTML', () => {
  const host = showBanner(document, { text: '<b>bold</b>', lang: 'en', closeLabel: 'Close' });
  vi.advanceTimersByTime(ANNOUNCE_DELAY);
  const text = host.shadowRoot.querySelector('span');
  assert.equal(text.children.length, 0);
  assert.equal(text.textContent, '<b>bold</b>');
});

test('shows a link after the text, in the keyboard order before the close button', () => {
  const href = 'https://www.deezer.com/search/Ella%20Langley%20Be%20Her';
  const host = showBanner(document, { text: 'Message', lang: 'en', closeLabel: 'Close', link: { text: 'Search Deezer for "<b>Be Her</b>"', href } });
  const link = host.shadowRoot.querySelector('a');
  assert.equal(link.href, href);
  assert.equal(link.textContent, 'Search Deezer for "<b>Be Her</b>"');
  assert.ok(link.compareDocumentPosition(host.shadowRoot.querySelector('button')) & Node.DOCUMENT_POSITION_FOLLOWING);
});

test('has no link without one', () => {
  const host = showBanner(document, { text: 'Message', lang: 'en', closeLabel: 'Close' });
  assert.equal(host.shadowRoot.querySelector('a').hasAttribute('href'), false);
});

test('is the banner component, .ds-c-banner, in its shadow root', () => {
  const host = showBanner(document, { text: 'Message', lang: 'en', closeLabel: 'Close' });
  const banner = host.shadowRoot.querySelector('.ds-c-banner');
  assert.ok(banner.querySelector('img.ds-c-banner__icon'));
  assert.ok(banner.querySelector('p.ds-c-banner__text [role="status"]'));
  assert.ok(banner.querySelector('button.ds-c-button.ds-c-button--ghost.ds-c-banner__close'));
});

test('its sizes in rem on the base 4, from the tokens or its own, no px: the build turns them into px', () => {
  for (const file of ['web-components/banner.css', 'css/components/banner.css']) {
    const css = readFileSync(`${import.meta.dirname}/../${file}`, 'utf8').replaceAll(/\/\*[\s\S]*?\*\//g, '');
    assert.doesNotMatch(css, /\dpx\b/, file);
    for (const [, rem] of css.matchAll(/(\d*\.?\d+)rem\b/g)) assert.equal((Number.parseFloat(rem) * 4) % 1, 0, `${file}: ${rem}rem`);
  }
});
