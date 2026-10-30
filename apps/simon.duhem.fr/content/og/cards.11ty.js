/**
 * The social sharing card of each page without an image of its own (`ogCard`, _data/eleventyComputed.js): a 1200 x 630
 * page with the page's title, the author and the site, in @dume/ds's light theme and fonts. scripts/og-images.js takes
 * its screenshot, /og/<slug>.png, then removes the page.
 */
const escape = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

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
    return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<title>${escape(title)}</title>
<link rel="stylesheet" href="${assets['/ds/styles.css']}">
<style>
  :root { color-scheme: light; }
  body {
    background: var(--ds-b-color-background);
    block-size: 630px;
    border-block-start: 24px solid var(--ds-b-color-primary);
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    inline-size: 1200px;
    justify-content: space-between;
    margin: 0;
    padding: 72px 88px 64px;
  }
  h1 { font-size: 104px; line-height: 1.05; margin: 0 0 24px; text-wrap: balance; }
  p { font-family: 'Instrument Sans', var(--ds-b-font-family); font-size: 40px; margin: 0; }
  footer p { color: var(--ds-b-color-primary); font-weight: 700; }
</style>
</head>
<body>
<main>
<h1>${escape(title)}</h1>
<p>${escape(byline)}</p>
</main>
<footer><p>${escape(metadata.host)}</p></footer>
</body>
</html>`;
  }
}
