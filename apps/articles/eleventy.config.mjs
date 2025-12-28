import { feedPlugin } from '@11ty/eleventy-plugin-rss';
import syntaxHighlight from '@11ty/eleventy-plugin-syntaxhighlight';

const BASE = 'https://simon.duhem.fr/articles/';
const AUTHOR = 'Simon Duhem';
const TITLE = `Articles de ${AUTHOR}`;

export default function (eleventyConfig) {
  eleventyConfig.setInputDirectory('src');
  eleventyConfig.addGlobalData('layout', 'base.njk');
  eleventyConfig.addPlugin(syntaxHighlight);

  eleventyConfig.addFilter('formatDateFR', function (date) {
    if (!date) return '';
    try {
      const d = date instanceof Date ? date : new Date(date);
      return new Intl.DateTimeFormat('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' }).format(d);
    } catch {
      return String(date);
    }
  });

  eleventyConfig.addFilter('toISO', function (date) {
    if (!date) return '';
    try {
      const d = date instanceof Date ? date : new Date(date);
      return d.toISOString();
    } catch {
      return String(date);
    }
  });

  eleventyConfig.addPassthroughCopy('**/*.{png,jpg,jpeg,gif,svg,webp}');

  eleventyConfig.addPlugin(feedPlugin, {
    type: 'atom',
    outputPath: '/feed.xml',
    collection: { name: 'articles' },
    metadata: {
      language: 'fr',
      title: TITLE,
      subtitle: '',
      base: BASE,
      author: { name: AUTHOR },
    },
  });

  eleventyConfig.addGlobalData('site', {
    base: BASE,
    title: TITLE,
  });

  eleventyConfig.addFilter('absUrl', function (base, path) {
    if (!path) return base;
    try {
      if (/^https?:\/\//i.test(path)) return path;
      const b = String(base || '').replace(/\/+$/g, '');
      const p = String(path || '').replace(/^\/+/, '');
      return b + '/' + p;
    } catch {
      return String(base) + String(path);
    }
  });

  return {
    dir: { input: 'src', includes: '../layout', data: '_data', output: '_site' },
  };
}
