import metadata from './metadata.js';
import cv from './cv.js';

/**
 * The author as a schema.org Person, for the structured data (JSON-LD): the same on the home page, the CV and as the
 * articles' author. From the site's metadata and the CV: the current position's company, the schools, the languages.
 */
const { author } = metadata;
const employer = cv.work.find(company => company.positions.some(position => !position.end));

export default {
  '@type': 'Person',
  'name': author.name,
  'url': author.url,
  'jobTitle': author.jobTitle,
  ...(employer && { worksFor: { '@type': 'Organization', 'name': employer.name } }),
  'knowsAbout': author.knowsAbout,
  'knowsLanguage': cv.languages.map(({ language }) => language),
  'alumniOf': cv.education.map(({ institution }) => ({ '@type': 'EducationalOrganization', 'name': institution })),
  'sameAs': metadata.social.map(link => link.url),
};
