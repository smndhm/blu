import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import eleventyImage from '@11ty/eleventy-img';

/**
 * A page's social sharing image, its URL and alternative text: the `ogImage` front matter (relative to the page, its
 * text `ogImageAlt` or the title), else the first image of an article, local or remote, resized to 1200px wide at most,
 * its text its own; else a card with the page's title, generated after the build (content/og/cards.11ty.js,
 * scripts/og-images.js), for each page of the site but the 404 one. Eleventy-img caches its work: computing it for each
 * key below costs little.
 */
const ogImage = async data => {
  if (data.ogImage) return { url: data.page.url + data.ogImage, alt: data.ogImageAlt ?? data.title };
  if (data.layout === 'layouts/post.njk') {
    const content = await readFile(data.page.inputPath, 'utf8');
    const [, alt, src] = content.match(/!\[([^\]]*)\]\((\.\/[^)\s]+|https:\/\/[^)\s]+)\)/) ?? [];
    if (src) {
      const resized = await eleventyImage(src.startsWith('https://') ? src : join(dirname(data.page.inputPath), src), {
        widths: [1200],
        formats: ['auto'],
        outputDir: join(data.eleventy.directories.output, data.page.url),
        urlPath: data.page.url,
      });
      return { url: Object.values(resized)[0][0].url, alt };
    }
  }
  if (!data.layout || data.eleventyExcludeFromCollections || !data.page.url?.endsWith('/')) return {};

  // The card: the page's title, then the author and their job title, in the page's language
  const lang = data.lang ?? data.metadata.language;
  const { name } = data.metadata.author;
  const title = data.title ?? name;
  const jobTitle = data.cv[lang]?.jobTitle ?? data.metadata.author.jobTitle;
  const byline = title === name ? jobTitle : `${name}, ${jobTitle.toLowerCase()}`;
  const slug = data.page.url.replaceAll('/', '-').replace(/^-|-$/g, '') || 'index';
  return {
    url: `/og/${slug}.png`,
    alt: `${title}, ${byline}, ${data.metadata.host}`,
    card: { slug, lang, title, byline },
  };
};

export default {
  ogImageUrl: async data => (await ogImage(data)).url,
  // Not `ogImageAlt`, the front matter it reads
  ogImageAltText: async data => (await ogImage(data)).alt,
  ogCard: async data => (await ogImage(data)).card,
};
