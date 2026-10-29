---
'simon.duhem.fr': minor
---

A CV page, `/cv/`, only in the sitemap and llms.txt for now (no link on the site), from `_data/cv.js` and the home page's introduction: profile, skills, languages, positions with their dates and places, talks and articles published elsewhere, education. Its PDF, `/cv/simon-duhem-cv.pdf`, is the page printed by Chromium at deploy time (`scripts/cv-pdf.js`): one column of selectable text with plain section headings, for applicant tracking systems (ATS), tagged and with an outline, on two pages. No phone number nor postal address. Its structured data (JSON-LD) is the home page's person, with the CV's current employer, schools and languages.
