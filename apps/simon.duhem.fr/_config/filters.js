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

  // Displayable topics of a page, from its `tags` (internal collection tags are ignored)
  eleventyConfig.addFilter('topics', (tags = []) => tags.filter(tag => tag in topics).map(tag => topics[tag]));
}
