import metadata from './metadata.js';
import cv from './cv.js';

/**
 * The author as a schema.org Person, for the structured data (JSON-LD): the same on the home page, the CV and as the
 * articles' author. From the site's metadata and the CV: the current position's company, the schools, the languages.
 */
const { author } = metadata;
// The site is in French: the CV's French version
const { work, languages, education } = cv.fr;
const employer = work.find(company => company.positions.some(position => !position.end));

export default {
  '@type': 'Person',
  'name': author.name,
  'url': author.url,
  'jobTitle': author.jobTitle,
  ...(employer && { worksFor: { '@type': 'Organization', 'name': employer.name } }),
  'knowsAbout': author.knowsAbout,
  'knowsLanguage': languages.map(({ language }) => language),
  'alumniOf': education.map(({ institution }) => ({ '@type': 'EducationalOrganization', 'name': institution })),
  'sameAs': metadata.social.map(link => link.url),
};
