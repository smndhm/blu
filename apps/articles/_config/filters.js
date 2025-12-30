export default function (eleventyConfig) {
  eleventyConfig.addFilter('readableDate', date => {
    return new Intl.DateTimeFormat('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
  });
}
