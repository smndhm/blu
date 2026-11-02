/**
 * The social sharing card of each page without an image of its own (`ogCard`, _data/eleventyComputed.js): a page with
 * the page's title, the author and the page's address, in @dume/ds's dark theme and with its classes alone. A short
 * title is in a hero, a longer one would not fit; a long address gives way to the site's. Its size comes from its
 * screenshot: scripts/og-images.js takes it, /og/<slug>.png, then removes the page.
 */
const escape = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

const HERO_TITLE_LENGTH = 32;
const ADDRESS_LENGTH = 48;

export default class {
  data() {
    return {
      pagination: {
        data: 'collections.all',
        size: 1,
        alias: 'source',
        before: items => items.filter(item => item.data.ogCard),
      },
      permalink: ({ source }) => `/og/${source.data.ogCard.slug}.html`,
      eleventyExcludeFromCollections: true,
    };
  }

  render({ source, metadata, assets }) {
    const { lang, title, byline } = source.data.ogCard;
    const pageAddress = `${metadata.host}${source.url}`.replace(/\/$/, '');
    const address = pageAddress.length > ADDRESS_LENGTH ? metadata.host : pageAddress;
    return `<!doctype html>
<html lang="${lang}" data-theme="dark">
<head>
<meta charset="utf-8">
<title>${escape(title)}</title>
<link rel="stylesheet" href="${assets['/ds/styles.css']}">
<style>
  /* The design system's printed font: a screenshot should not depend on the fonts of the computer that takes it */
  :root { --ds-b-font-family: 'Instrument Sans', system-ui, sans-serif; }
</style>
</head>
<body class="ds-l-page ds-l-page--centered ds-l-page--tinted">
<main class="ds-l-page__main">
<div${title.length > HERO_TITLE_LENGTH ? '' : ' class="ds-c-hero"'}>
<hgroup>
<h1>${escape(title)}</h1>
<p>${escape(byline)}</p>
</hgroup>
<p><a href="https://${escape(address)}">${escape(address)}</a></p>
</div>
</main>
</body>
</html>`;
  }
}
