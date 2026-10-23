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
export const ANNOUNCE_DELAY: number;

/** Shows a `<ds-banner>` at the top of the page and returns it */
export function showBanner(doc: Document, banner: Banner): HTMLElement;
