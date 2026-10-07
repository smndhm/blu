const topics = {
  'a11y': 'Accessibilité',
  'web-components': 'Web Components',
  'design-system': 'Design system',
  'side-project': 'Projet perso',
};

export default function (eleventyConfig) {
  eleventyConfig.addFilter('readableDate', date => {
    return new Intl.DateTimeFormat('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }).format(date);
  });

  // `datetime` attribute value, e.g. 2025-09-26
  eleventyConfig.addFilter('isoDate', date => date.toISOString().slice(0, 10));

  // First `n` items of an array
  eleventyConfig.addFilter('head', (array, n) => array.slice(0, n));

  // Articles and talks in a single list, most recent first
  eleventyConfig.addFilter('withTalks', (posts, talks) =>
    [...posts.map(post => ({ url: post.url, title: post.data.title, date: post.date, topics: post.data.tags, post })), ...talks.map(talk => ({ ...talk, isTalk: true }))].sort(
      (a, b) => (b.date ?? 0) - (a.date ?? 0),
    ),
  );

  // Values of `key` in an array of objects
  eleventyConfig.addFilter('pluck', (array, key) => array.map(item => item[key]));

  // JSON-LD script content: drops empty values (`x if y` without `else` gives '') and escapes `<`
  eleventyConfig.addFilter('jsonLd', data =>
    JSON.stringify(data, (key, value) => (value === '' || value === null || (Array.isArray(value) && !value.length) ? undefined : value)).replaceAll('<', '\\u003c'),
  );

  // Displayable topics of a page, from its `tags` (internal collection tags are ignored)
  eleventyConfig.addFilter('topics', (tags = []) => tags.filter(tag => tag in topics).map(tag => topics[tag]));
}
