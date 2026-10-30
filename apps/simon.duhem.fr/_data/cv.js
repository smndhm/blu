import metadata from './metadata.js';

/**
 * The CV, in French and English: content/cv/index.njk renders a page per version (`url`), then scripts/cv-pdf.js prints
 * each as its `pdf` at deploy time. Written for applicant tracking systems (ATS): plain sections, dates on every
 * position, keywords spelled out; technologies on the current position only. Dates are `YYYY-MM`; `end` left out means
 * "aujourd'hui" / "present".
 *
 * A text that differs from a language to the other is written `{ fr, en }`, anything else is shared. The French name,
 * job title, contact links and summary come from _data/metadata.js, as on the rest of the site.
 * Public: no phone number nor postal address.
 */
const { author } = metadata;
const jobTitle = { fr: author.jobTitle, en: 'Front-end Architect' };

// Positions grouped by company, the most recent first; a position's location only when it differs from its company's
const work = [
  {
    name: 'MGDIS',
    location: 'Vannes',
    positions: [
      {
        position: jobTitle,
        location: { fr: 'Vannes (télétravail)', en: 'Vannes (remote)' },
        start: '2021-05',
        highlights: {
          fr: [
            'Conception et évolution du design system de MGDIS, une bibliothèque de Web Components, pour une expérience utilisateur cohérente et accessible.',
            "Définition des bonnes pratiques de développement front-end et d'accessibilité pour une équipe de 50 développeurs.",
          ],
          en: [
            "Designing and evolving MGDIS's design system, a Web Components library, for a consistent and accessible user experience.",
            'Defining front-end development and accessibility best practices for a team of 50 developers.',
          ],
        },
        keywords: ['Web Components', 'Stencil', 'TypeScript', 'Storybook', 'RGAA'],
      },
      {
        position: { fr: 'Lead Développeur Full Stack', en: 'Full Stack Lead Developer' },
        start: '2021-01',
        end: '2021-08',
        highlights: {
          fr: ["Encadrement d'une équipe sur des projets de développement full stack."],
          en: ['Led a team on full stack development projects.'],
        },
      },
      {
        position: { fr: 'Développeur Full Stack', en: 'Full Stack Developer' },
        start: '2019-03',
        end: '2021-01',
        highlights: {
          fr: ["Développement et maintenance d'applications full stack."],
          en: ['Developed and maintained full stack applications.'],
        },
      },
    ],
  },
  {
    name: 'Deezer',
    location: 'Paris',
    positions: [
      {
        position: 'Web Engineer (Studio)',
        start: '2012-09',
        end: '2019-03',
        highlights: {
          fr: [
            'Intégration de Deezer dans IFTTT, à mon initiative : toutes les phases, du premier contact avec IFTTT au lancement, en passant par les spécifications et le développement.',
            'Plateforme de candidatures et de votes des Victoires de la Musique (variétés, classique et jazz).',
            "Applications utilisant l'API Deezer : sites partenaires, bots Twitter, applications Facebook, widgets.",
          ],
          en: [
            'Integrated Deezer into IFTTT, on my own initiative: every phase, from the first contact with IFTTT to the launch, through the specifications and the development.',
            'Application and voting platform for the Victoires de la Musique, the French music awards (pop, classical and jazz).',
            'Applications using the Deezer API: partner websites, Twitter bots, Facebook apps, widgets.',
          ],
        },
      },
      {
        position: { fr: 'Web Developer (Régie)', en: 'Web Developer (Advertising)' },
        start: '2012-05',
        end: '2012-09',
        highlights: {
          fr: ["Espaces dédiés pour des annonceurs : Alfa Romeo, CNOSF, McDonald's, Renault, Roxy, Volkswagen..."],
          en: ["Dedicated spaces for advertisers: Alfa Romeo, CNOSF, McDonald's, Renault, Roxy, Volkswagen..."],
        },
      },
    ],
  },
  {
    name: { fr: 'Marine nationale', en: 'French Navy' },
    positions: [
      {
        position: { fr: 'Analyste développeur, antenne EMM/SIAG - GERHICO', en: 'Analyst Developer, EMM/SIAG - GERHICO' },
        start: '2007-11',
        end: '2012-04',
        highlights: {
          fr: [
            "Analyse, développement, déploiement et maintenance d'une solution mobile pour le système RH de la Marine nationale (RH@psodie), destinée aux officiers.",
            'Applications pour les services RH : notations, avancements, entretiens de carrière, plans de mutation des officiers.',
          ],
          en: [
            "Analysis, development, deployment and maintenance of a mobile app for the French Navy's HR system (RH@psodie), for its officers.",
            "Applications for the HR departments: ratings, promotions, career reviews, officers' transfer plans.",
          ],
        },
      },
      {
        position: { fr: 'Analyste développeur, DCSSF', en: 'Analyst Developer, DCSSF' },
        start: '2005-07',
        end: '2007-09',
        highlights: {
          fr: [
            "Applications web pour l'intranet : trombinoscope, réservation de ressources (salles de réunion, ordinateurs portables, véhicules), gestion des stocks d'un magasin de fournitures.",
          ],
          en: ['Intranet web applications: staff directory, resource booking (meeting rooms, laptops, vehicles), stock management for a supply store.'],
        },
      },
    ],
  },
];

const cv = {
  // The page's path (its permalink, llms.txt; no link on the site yet, only the sitemap) and the PDF's, which scripts/cv-pdf.js writes
  url: { fr: '/cv/', en: '/en/cv/' },
  pdf: { fr: '/cv/simon-duhem-cv.pdf', en: '/en/cv/simon-duhem-cv-en.pdf' },
  jobTitle,
  // The page's title (and the PDF's), and its meta description: 160 characters at most
  title: { fr: `CV de ${author.name}, ${jobTitle.fr.toLowerCase()}`, en: `CV of ${author.name}, ${jobTitle.en.toLowerCase()}` },
  description: {
    fr: `CV de ${author.name}, ${jobTitle.fr.toLowerCase()} spécialisé en accessibilité (RGAA, WCAG) et en Web Components, qui conçoit un design system.`,
    en: `CV of ${author.name}, ${jobTitle.en.toLowerCase()} specialized in accessibility (RGAA, WCAG) and Web Components, who builds a design system.`,
  },
  // The French one is the home page's introduction
  summary: {
    fr: metadata.intro,
    en: 'Front-end architect specialized in accessibility and Web Components, I build a design system. I rely on web standards to create reusable interfaces that everyone can use.',
  },
  skills: [
    { name: 'Front-end', keywords: ['HTML', 'CSS', 'Sass', 'BEM', 'JavaScript', 'TypeScript', 'Vue.js'] },
    {
      name: 'Design system',
      keywords: [{ fr: 'architecture de composants', en: 'component architecture' }, 'Web Components', 'Shadow DOM', 'Stencil', 'design tokens', 'Storybook', 'Figma'],
    },
    { name: { fr: 'Accessibilité', en: 'Accessibility' }, keywords: ['RGAA', 'WCAG 2.2', 'ARIA', 'audit'] },
    { name: { fr: 'Tests', en: 'Testing' }, keywords: ['Vitest', 'Jest', 'Playwright', 'axe-core'] },
    {
      name: { fr: 'Outillage', en: 'Tooling' },
      keywords: ['Node.js', 'Vite', 'ESLint', 'Stylelint', 'Prettier', { fr: 'monorepo pnpm', en: 'pnpm monorepo' }, 'Changesets', 'Renovate', 'GitHub Actions', 'GitLab CI'],
    },
  ],
  work,
  education: [
    {
      studyType: {
        fr: "Certificat de conception, d'analyse et de programmation de systèmes d'information",
        en: 'Certificate in information systems design, analysis and programming',
      },
      institution: "École supérieure et d'application des transmissions (ESAT), Rennes",
      start: '2007-09',
      end: '2007-11',
    },
    {
      studyType: {
        fr: "Brevet d'aptitude technique (BAT), systèmes d'information et télécommunications",
        en: 'Technical aptitude certificate (BAT), information systems and telecommunications',
      },
      institution: 'École de Maistrance',
      start: '2004',
      end: '2005',
    },
    {
      studyType: {
        fr: "BTS Informatique et réseaux pour l'industrie et les services techniques",
        en: 'Two-year technical degree (BTS) in computing and networks for industry and technical services',
      },
      institution: 'Lycée Saint-Joseph, Lorient',
      start: '2002',
      end: '2004',
    },
  ],
  languages: [
    { language: { fr: 'Français', en: 'French' }, fluency: { fr: 'langue maternelle', en: 'native' } },
    { language: { fr: 'Anglais', en: 'English' }, fluency: { fr: 'professionnel', en: 'professional' } },
  ],
  // The page's fixed texts
  labels: {
    summary: { fr: 'Profil', en: 'Profile' },
    skills: { fr: 'Compétences', en: 'Skills' },
    work: { fr: 'Expérience professionnelle', en: 'Professional experience' },
    education: { fr: 'Formation', en: 'Education' },
    languages: { fr: 'Langues', en: 'Languages' },
    publications: { fr: 'Conférences et articles', en: 'Talks and articles' },
    talk: { fr: 'Conférence', en: 'Talk' },
    article: { fr: 'Article', en: 'Article' },
    // On the English version only, under the talks and articles, all in French
    inFrench: { fr: '', en: 'All in French.' },
    technologies: { fr: 'Technologies', en: 'Technologies' },
    // Before a list: a space before the colon in French, none in English
    colon: { fr: ' : ', en: ': ' },
    present: { fr: "aujourd'hui", en: 'present' },
    pdf: { fr: 'Voir le CV (PDF)', en: 'View the CV (PDF)' },
    // The link to this version from the other one, in this version's language
    otherVersion: { fr: 'Version française', en: 'English version' },
  },
};

const languages = ['fr', 'en'];

/** A value in one language: `{ fr, en }` gives its `lang` text, arrays and objects are read through */
const localize = (value, lang) => {
  if (Array.isArray(value)) return value.map(item => localize(item, lang));
  if (value && typeof value === 'object') {
    const keys = Object.keys(value);
    if (keys.length === languages.length && languages.every(key => keys.includes(key))) return localize(value[lang], lang);
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, localize(item, lang)]));
  }
  return value;
};

// One complete version per language, each with the versions' addresses (hreflang) and the link to the other one
const versions = languages.map(lang => ({ lang, ...localize(cv, lang) }));
for (const version of versions) {
  version.alternates = versions.map(({ lang, url, labels }) => ({ lang, url, label: labels.otherVersion }));
  version.other = version.alternates.find(alternate => alternate.lang !== version.lang);
}

export default { versions, ...Object.fromEntries(versions.map(version => [version.lang, version])) };
