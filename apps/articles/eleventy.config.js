import { feedPlugin } from '@11ty/eleventy-plugin-rss';
import { eleventyImageTransformPlugin } from '@11ty/eleventy-img';
import syntaxHighlight from '@11ty/eleventy-plugin-syntaxhighlight';

export default function (eleventyConfig) {
  // Set src as input directory
  eleventyConfig.setInputDirectory('src');

  // Set base layout (layout file is in ../layout/base.njk relative to input)
  eleventyConfig.addGlobalData('layout', 'base.njk');

  // Enable syntax highlighting
  eleventyConfig.addPlugin(syntaxHighlight);

  // French date formatting filter
  eleventyConfig.addFilter('formatDateFR', function (date) {
    if (!date) return '';
    try {
      const d = date instanceof Date ? date : new Date(date);
      return new Intl.DateTimeFormat('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' }).format(d);
    } catch {
      return String(date);
    }
  });

  // ISO date filter for datetime attribute
  eleventyConfig.addFilter('toISO', function (date) {
    if (!date) return '';
    try {
      const d = date instanceof Date ? date : new Date(date);
      return d.toISOString();
    } catch {
      return String(date);
    }
  });

  // import images
  eleventyConfig.addPassthroughCopy('**/*.{png,jpg,jpeg,gif,svg,webp}');

  // image transform plugin
  eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
    // output image formats
    formats: ['webp'],
    // output image widths
    widths: ['auto'],
    // optional, attributes assigned on <img> nodes override these values
    htmlOptions: {
      imgAttributes: {
        loading: 'lazy',
        decoding: 'async',
      },
      pictureAttributes: {},
    },
  });

  // RSS feed
  eleventyConfig.addPlugin(feedPlugin, {
    type: 'atom', // or "rss", "json"
    outputPath: '/feed.xml',
    collection: {
      name: 'articles',
      // limit: 10,
    },
    metadata: {
      language: 'fr',
      title: 'Articles de Simon Duhem',
      subtitle: '',
      base: 'https://simon.duhem.fr/articles/',
      author: {
        name: 'Simon Duhem',
        // email: '',
      },
    },
  });
  // Ensure Eleventy knows where includes are located (layout folder next to this config)
  return {
    dir: {
      input: 'src',
      includes: '../layout',
      data: '_data',
      output: '_site',
    },
  };
}
