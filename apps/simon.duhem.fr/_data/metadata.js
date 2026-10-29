// The site and its author: the one source for the name, links and job title, on every page and in every format
const name = 'Simon Duhem';
const url = 'https://simon.duhem.fr/';
const email = 'simon@duhem.fr';
const social = [
  { name: 'GitHub', url: 'https://github.com/smndhm' },
  { name: 'LinkedIn', url: 'https://www.linkedin.com/in/simonduhem/' },
];

// A URL as written in a text: no protocol, no www, no trailing slash (simon.duhem.fr, github.com/smndhm)
const displayUrl = link => link.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

export default {
  title: name,
  url,
  // The site's address as written in a text: simon.duhem.fr
  host: displayUrl(url),
  language: 'fr',
  // Présentation affichée sur la page d'accueil
  intro:
    "Architecte front-end spécialisé en accessibilité et en Web Components, je conçois un design system. Je m'appuie sur les standards du web pour construire des interfaces réutilisables et utilisables par tous.",
  // Description du site (balise meta, partage, données structurées) : 160 caractères au plus
  description: 'Architecte front-end spécialisé en accessibilité et en Web Components, je conçois un design system fondé sur les standards du web.',
  author: {
    name,
    email,
    url,
    jobTitle: 'Architecte front-end',
    // Données structurées (JSON-LD) et llms.txt : les grands domaines, les compétences détaillées sont dans le CV
    knowsAbout: ['Accessibilité numérique', 'Web Components', 'Design system', 'Standards du web'],
    // The ways to reach the author, their URLs written out, as on the CV
    contacts: [
      { name: 'E-mail', url: `mailto:${email}`, text: email },
      { name: 'Site', url, text: displayUrl(url) },
      ...social.map(link => ({ ...link, text: displayUrl(link.url) })),
    ],
  },
  social,
};
