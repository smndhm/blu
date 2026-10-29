/**
 * The CV, rendered by content/cv/index.njk as the /cv/ page, then printed as /cv/simon-duhem-cv.pdf at deploy time
 * (scripts/cv-pdf.js). Written for applicant tracking systems (ATS): plain sections, dates on every position,
 * keywords spelled out. Dates are `YYYY-MM`; `end` left out means "aujourd'hui".
 * Public: no phone number nor postal address.
 */
export default {
  title: 'Architecte front-end',
  summary:
    "Architecte front-end spécialisé en accessibilité et en Web Components. Je conçois et fais évoluer le design system de MGDIS, utilisé par une équipe de 50 développeurs, en m'appuyant sur les standards du web pour construire des interfaces réutilisables et utilisables par tous.",
  skills: [
    { name: 'Accessibilité', keywords: ['RGAA', 'WCAG 2.2', 'ARIA', 'audit', 'tests automatisés (axe-core)'] },
    { name: 'Front-end', keywords: ['HTML', 'CSS', 'JavaScript', 'TypeScript', 'Web Components', 'Shadow DOM', 'Stencil'] },
    { name: 'Design system', keywords: ['architecture de composants', 'design tokens', 'Storybook', 'Figma'] },
    { name: 'Outillage', keywords: ['Node.js', 'Vite', 'Playwright', 'ESLint', 'Stylelint', 'GitHub Actions', 'monorepo pnpm'] },
  ],
  work: [
    {
      name: 'MGDIS',
      location: 'Vannes',
      positions: [
        {
          position: 'Architecte front-end',
          location: 'Vannes (télétravail)',
          start: '2021-05',
          highlights: [
            'Conception et évolution du design system de MGDIS, une bibliothèque de Web Components, pour une expérience utilisateur cohérente et accessible.',
            "Définition des bonnes pratiques de développement front-end et d'accessibilité pour une équipe de 50 développeurs.",
          ],
          keywords: ['Web Components', 'Stencil', 'TypeScript', 'Storybook', 'RGAA'],
        },
        {
          position: 'Lead Développeur Full Stack',
          start: '2021-01',
          end: '2021-08',
          highlights: ["Encadrement d'une équipe sur des projets de développement full stack."],
        },
        {
          position: 'Développeur Full Stack',
          start: '2019-03',
          end: '2021-01',
          highlights: ["Développement et maintenance d'applications full stack."],
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
          highlights: [
            'Intégration de Deezer dans IFTTT, à mon initiative : toutes les phases, du premier contact avec IFTTT au lancement, en passant par les spécifications et le développement.',
            'Plateforme de candidatures et de votes des Victoires de la Musique (variétés, classique et jazz).',
            "Applications utilisant l'API Deezer : sites partenaires, bots Twitter, applications Facebook, widgets.",
          ],
          keywords: ['JavaScript', 'Node.js', 'HTML', 'CSS', 'Responsive'],
        },
        {
          position: 'Web Developer (Régie)',
          start: '2012-05',
          end: '2012-09',
          highlights: ["Espaces dédiés pour des annonceurs : Alfa Romeo, CNOSF, McDonald's, Renault, Roxy, Volkswagen..."],
        },
      ],
    },
    {
      name: 'Marine nationale',
      positions: [
        {
          position: 'Analyste développeur, antenne EMM/SIAG - GERHICO',
          start: '2007-11',
          end: '2012-04',
          highlights: [
            "Analyse, développement, déploiement et maintenance d'une solution mobile pour le système RH de la Marine nationale (RH@psodie), destinée aux officiers.",
            'Applications pour les services RH : notations, avancements, entretiens de carrière, plans de mutation des officiers.',
          ],
        },
        {
          position: 'Analyste développeur, DCSSF',
          start: '2005-07',
          end: '2007-09',
          highlights: [
            "Applications web pour l'intranet : trombinoscope, réservation de ressources (salles de réunion, ordinateurs portables, véhicules), gestion des stocks d'un magasin de fournitures.",
          ],
          keywords: ['HTML', 'CSS'],
        },
      ],
    },
  ],
  education: [
    {
      studyType: "Certificat de conception, d'analyse et de programmation de systèmes d'information",
      institution: "École supérieure et d'application des transmissions (ESAT), Rennes",
      start: '2007-09',
      end: '2007-11',
    },
    {
      studyType: "Brevet d'aptitude technique (BAT), systèmes d'information et télécommunications",
      institution: 'École de Maistrance',
      start: '2004',
      end: '2005',
    },
    {
      studyType: "BTS Informatique et réseaux pour l'industrie et les services techniques",
      institution: 'Lycée Saint-Joseph, Lorient',
      start: '2002',
      end: '2004',
    },
  ],
  languages: [
    { language: 'Français', fluency: 'langue maternelle' },
    { language: 'Anglais', fluency: 'professionnel' },
  ],
};
