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

  // Month and year, "mai 2021", of a date or of a CV's `YYYY-MM`; a CV's `YYYY` as is
  eleventyConfig.addFilter('monthYear', value => {
    if (!(value instanceof Date) && !/^\d{4}-\d{2}$/.test(value)) return value;
    const date = value instanceof Date ? value : new Date(`${value}-01T00:00:00Z`);
    return new Intl.DateTimeFormat('fr-FR', { year: 'numeric', month: 'long', timeZone: 'UTC' }).format(date);
  });

  // `datetime` attribute value, e.g. 2025-09-26
  eleventyConfig.addFilter('isoDate', date => date.toISOString().slice(0, 10));

  // First `n` items of an array
  eleventyConfig.addFilter('head', (array, n) => array.slice(0, n));

  // Articles and talks in a single list, most recent first
  eleventyConfig.addFilter('withTalks', (posts, talks) =>
    [
      ...posts.map(post => ({ url: post.url, title: post.data.title, description: post.data.description, date: post.date, topics: post.data.tags, post })),
      ...talks.map(talk => ({ ...talk, isTalk: true })),
    ].toSorted((a, b) => (b.date ?? 0) - (a.date ?? 0)),
  );

  // schema.org organizations of a type from their names, e.g. a CV's schools
  eleventyConfig.addFilter('organizations', (names, type) => names.map(name => ({ '@type': type, name })));

  // Values of `key` in an array of objects
  eleventyConfig.addFilter('pluck', (array, key) => array.map(item => item[key]));

  // JSON-LD script content: drops empty values (`x if y` without `else` gives '') and escapes `<`
  eleventyConfig.addFilter('jsonLd', data =>
    JSON.stringify(data, (key, value) => (value === '' || value === null || (Array.isArray(value) && !value.length) ? undefined : value)).replaceAll('<', '\\u003c'),
  );

  // Displayable topics of a page, from its `tags` (internal collection tags are ignored)
  eleventyConfig.addFilter('topics', (tags = []) => tags.filter(tag => tag in topics).map(tag => topics[tag]));
}
