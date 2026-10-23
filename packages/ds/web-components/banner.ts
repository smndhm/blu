/**
 * <ds-banner>: a message at the top of a page that is not ours, such as Music Bridge's on a music platform's page. It
 * sits in a shadow root, so the page's styles neither change it nor are changed by it, and it is a status region, so
 * screen readers announce it. Light or dark as the system.
 *
 * `showBanner` creates it, without the custom elements registry, which an extension's content script does not have.
 * `lang` is the language of the text, not always the page's: screen readers read it with the right voice. The button,
 * or Escape while the focus is in the message, closes it.
 */
import tokens from '../css/tokens.css?inline';
import own from './banner.css?inline';

export interface Banner {
  text: string;
  lang: string;
  closeLabel: string;
  /** A logo, as a data URL: a page cannot load an extension's files */
  iconUrl?: string;
  /** After the text, such as a search for the music on the chosen platform */
  link?: { text: string; href: string };
}

/** The time between adding the status region and its text, for screen readers to notice it first */
export const ANNOUNCE_DELAY = 100;

// The tokens on its host and its own styles, sizes in px (16px a rem): the page's root font size is not ours
const inPx = (css: string): string => css.replaceAll(/(\d*\.?\d+)rem\b/g, (_, rem: string) => `${Number.parseFloat(rem) * 16}px`);
const styles = inPx(tokens.replace(':root', ':host')) + inPx(own);

/** Shows a `<ds-banner>` at the top of the page and returns it */
export function showBanner(doc: Document, { text, lang, closeLabel, iconUrl = '', link }: Banner): HTMLElement {
  const host = doc.createElement('ds-banner');
  const shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = '<style></style><div><img alt=""><p><span role="status"></span> <a></a></p><button type="button">×</button></div>';
  shadow.querySelector('style')!.textContent = styles;
  const message = shadow.querySelector('div')!;
  message.lang = lang;
  if (iconUrl) shadow.querySelector('img')!.src = iconUrl;
  if (link) {
    const anchor = shadow.querySelector('a')!;
    anchor.href = link.href;
    anchor.textContent = link.text;
  }
  const button = shadow.querySelector('button')!;
  button.setAttribute('aria-label', closeLabel);
  button.addEventListener('click', () => host.remove());
  message.addEventListener('keydown', event => {
    if (event.key === 'Escape') host.remove();
  });
  doc.documentElement.append(host);
  // Screen readers announce the changes of a status region already there, not always one added with its text
  const status = shadow.querySelector('span')!;
  setTimeout(() => {
    status.textContent = text;
  }, ANNOUNCE_DELAY);
  return host;
}
